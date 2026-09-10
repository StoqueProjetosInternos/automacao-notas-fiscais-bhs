import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Note } from '../types';
import { sendDeadlineAlerts, updateNote } from '../services/api';
import baseFornecedores from '@data/base_fornecedores_faturas.json';

const NUMERIC_FIELDS = [
  'originalValue', 'chargedValue', 'iss', 'irrf', 'pis', 'cofins', 'csll', 'quantity', 'unitValue', 'value'
];

const parseBrazilianNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return 0;
  let clean = val.replace(/\s/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');
    if (lastComma > lastDot) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const sanitizeNumericFields = (obj: any) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== null && typeof value === 'object') {
      sanitizeNumericFields(value);
    } else if (NUMERIC_FIELDS.includes(key)) {
      obj[key] = parseBrazilianNumber(value);
    }
  }
};

const parseBrazilianDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const getDaysRemaining = (dueDateStr?: string): number => {
  const dueDate = parseBrazilianDate(dueDateStr);
  if (!dueDate) return 999;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDynamicDueDate = (originalDateStr: string): string => {
  const parsedOriginal = parseBrazilianDate(originalDateStr);
  if (!parsedOriginal) return originalDateStr;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diaOriginal = parsedOriginal.getDate();

  let candidateDate = new Date(hoje.getFullYear(), hoje.getMonth(), diaOriginal);

  if (candidateDate.getMonth() !== hoje.getMonth()) {
    candidateDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  }

  if (candidateDate.getTime() < hoje.getTime()) {
    let nextMonth = hoje.getMonth() + 1;
    let nextYear = hoje.getFullYear();
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    candidateDate = new Date(nextYear, nextMonth, diaOriginal);

    if (candidateDate.getMonth() !== nextMonth) {
      candidateDate = new Date(nextYear, nextMonth + 1, 0);
    }
  }

  const dd = String(candidateDate.getDate()).padStart(2, '0');
  const mm = String(candidateDate.getMonth() + 1).padStart(2, '0');
  const yyyy = candidateDate.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

interface DeadlinesTabProps {
  notes: Note[];
  onBack: () => void;
  onRefreshNotes?: () => void | Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const DeadlinesTab = ({
  notes,
  onBack,
  onRefreshNotes,
  showToast
}: DeadlinesTabProps) => {
  const [deadlinesCurrentPage, setDeadlinesCurrentPage] = useState(1);
  const deadlinesRecordsPerPage = 10;

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');
  const [mockOverrides, setMockOverrides] = useState<Record<string, string>>({});

  const [deadlineStatusFilter, setDeadlineStatusFilter] = useState<'all' | 'critical' | 'alert' | 'normal'>('all');
  const [deadlineSortField, setDeadlineSortField] = useState<'fornecedor' | 'valor' | 'vencimento' | 'diasRestantes'>('diasRestantes');
  const [deadlineSortOrder, setDeadlineSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deadlineSearchSupplier, setDeadlineSearchSupplier] = useState('');
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);

  useEffect(() => {
    setDeadlinesCurrentPage(1);
  }, [notes]);

  useEffect(() => {
    setDeadlinesCurrentPage(1);
  }, [deadlineStatusFilter, deadlineSortField, deadlineSortOrder, deadlineSearchSupplier]);

  const handleSortDeadlines = (field: 'fornecedor' | 'valor' | 'vencimento' | 'diasRestantes') => {
    if (deadlineSortField === field) {
      setDeadlineSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setDeadlineSortField(field);
      setDeadlineSortOrder('asc');
    }
  };

  const triggerEmailAlertsSimulation = async (items: any[]) => {
    const criticalItems = items.filter(item => item.diasRestantes <= 10);
    if (criticalItems.length === 0) {
      showToast('Nenhum fornecedor com prazo crítico (<= 10 dias) para envio de alertas.', 'info');
      return;
    }

    setIsSendingAlerts(true);
    try {
      const result = await sendDeadlineAlerts(items);
      showToast(result.message, 'success');
    } catch (error: any) {
      console.error('Erro ao enviar alertas de e-mail:', error);
      const errMsg = error.response?.data?.error || 'Erro ao enviar alertas por e-mail.';
      showToast(errMsg, 'error');
    } finally {
      setIsSendingAlerts(false);
    }
  };

  const handleSaveDueDate = async (itemId: string, originalItem: any) => {
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(editingDateValue)) {
      showToast('Formato de data inválido. Use o padrão DD/MM/AAAA.', 'error');
      setEditingItemId(null);
      return;
    }

    if (originalItem.vencimento === editingDateValue) {
      setEditingItemId(null);
      return;
    }

    if (itemId.startsWith('m')) {
      setMockOverrides(prev => ({ ...prev, [itemId]: editingDateValue }));
      showToast(`Simulação: Vencimento de ${originalItem.fornecedor} atualizado para ${editingDateValue}.`, 'success');
    } else {
      const note = notes.find(n => n.id === itemId);
      if (!note) return;

      const copy = JSON.parse(JSON.stringify(note.data));
      if (!copy.financial) {
        copy.financial = {};
      }
      copy.financial.dueDate = editingDateValue;
      sanitizeNumericFields(copy);

      try {
        await updateNote(note.id, copy);
        showToast(`Vencimento de ${originalItem.fornecedor} atualizado para ${editingDateValue}.`, 'success');
        if (onRefreshNotes) {
          await onRefreshNotes();
        }
      } catch (error) {
        console.error('Erro ao atualizar vencimento da nota:', error);
        showToast('Falha ao atualizar a data de vencimento no servidor.', 'error');
      }
    }
    setEditingItemId(null);
  };

  const mockDeadlinesList = baseFornecedores.map((item) => {
    const dynamicVencimento = getDynamicDueDate(item.vencimento);
    const finalVencimento = mockOverrides[item.id] || dynamicVencimento;
    return {
      id: item.id,
      fornecedor: item.fornecedor,
      documento: item.documento,
      valor: item.valor,
      vencimento: finalVencimento,
      diasRestantes: getDaysRemaining(finalVencimento)
    };
  });

  const realDeadlinesList = notes
    .filter(note => note.data?.supplier?.name && note.data?.financial?.dueDate)
    .map(note => {
      const dias = getDaysRemaining(note.data.financial?.dueDate);
      return {
        id: note.id,
        fornecedor: note.data.supplier?.name || '',
        documento: note.data.documentIdentifiers?.documentNumber || note.fileName,
        valor: note.data.financial?.chargedValue || note.data.financial?.originalValue || 0,
        vencimento: note.data.financial?.dueDate || '',
        diasRestantes: dias
      };
    });

  const combinedDeadlinesList = [...realDeadlinesList, ...mockDeadlinesList];

  const filteredDeadlines = combinedDeadlinesList.filter(item => {
    if (deadlineStatusFilter !== 'all') {
      if (deadlineStatusFilter === 'critical' && item.diasRestantes > 7) return false;
      if (deadlineStatusFilter === 'alert' && (item.diasRestantes <= 7 || item.diasRestantes > 10)) return false;
      if (deadlineStatusFilter === 'normal' && item.diasRestantes <= 10) return false;
    }

    if (deadlineSearchSupplier) {
      const search = deadlineSearchSupplier.toLowerCase().trim();
      const name = item.fornecedor ? item.fornecedor.toLowerCase() : '';
      if (!name.includes(search)) return false;
    }

    return true;
  });

  filteredDeadlines.sort((a, b) => {
    let comparison = 0;
    if (deadlineSortField === 'fornecedor') {
      comparison = a.fornecedor.localeCompare(b.fornecedor);
    } else if (deadlineSortField === 'valor') {
      comparison = a.valor - b.valor;
    } else if (deadlineSortField === 'diasRestantes') {
      comparison = a.diasRestantes - b.diasRestantes;
    } else if (deadlineSortField === 'vencimento') {
      const dateA = parseBrazilianDate(a.vencimento)?.getTime() || 0;
      const dateB = parseBrazilianDate(b.vencimento)?.getTime() || 0;
      comparison = dateA - dateB;
    }
    return deadlineSortOrder === 'asc' ? comparison : -comparison;
  });

  const totalDeadlinesRecords = filteredDeadlines.length;
  const totalDeadlinesPages = Math.ceil(totalDeadlinesRecords / deadlinesRecordsPerPage) || 1;
  const deadlinesStartIndex = (deadlinesCurrentPage - 1) * deadlinesRecordsPerPage;
  const paginatedDeadlines = filteredDeadlines.slice(deadlinesStartIndex, deadlinesStartIndex + deadlinesRecordsPerPage);

  return (
    <div className="fade-in" key="deadlines" style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              background: 'white',
              color: '#4b5563',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#4b5563';
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Monitoramento de Prazos de Vencimento
          </h2>
        </div>

        <div style={{ marginBottom: '20px', fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.5' }}>
          Painel para visualização preventiva de vencimentos. Fornecedores destacados em vermelho representam prazos críticos de até 7 dias; amarelo sinaliza prazos de 8 a 10 dias; verde indica prazos superiores a 10 dias.
        </div>

        {/* Barra de Ações */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '20px', 
          background: 'white', 
          padding: '16px', 
          borderRadius: '8px', 
          border: '1px solid #e5e7eb',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            className="btn"
            onClick={() => {
              triggerEmailAlertsSimulation(filteredDeadlines);
            }}
            disabled={isSendingAlerts}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              background: isSendingAlerts ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSendingAlerts ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'background 0.2s',
              outline: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!isSendingAlerts) e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseOut={(e) => {
              if (!isSendingAlerts) e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            {isSendingAlerts ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Enviando...
              </>
            ) : (
              'Enviar Alertas de Vencimento'
            )}
          </button>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', flex: 1 }}>
            Dispara notificações preventivas por e-mail para o gestor com faturas críticas e em alerta (vencimentos de até 10 dias).
          </span>
          
          {/* Filtro Rápido por Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '180px' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Filtrar Status</label>
            <select
              className="filter-select"
              value={deadlineStatusFilter}
              onChange={(e) => setDeadlineStatusFilter(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="critical">Crítico (≤ 7 dias)</option>
              <option value="alert">Alerta (8 a 10 dias)</option>
              <option value="normal">Normal (&gt; 10 dias)</option>
            </select>
          </div>

          {/* Busca por Fornecedor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '220px', position: 'relative' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Buscar Fornecedor</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="filter-input-text"
                placeholder="Pesquisar fornecedor..."
                value={deadlineSearchSupplier}
                onChange={(e) => setDeadlineSearchSupplier(e.target.value)}
              />
              {deadlineSearchSupplier && (
                <button
                  type="button"
                  onClick={() => setDeadlineSearchSupplier('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none'
                  }}
                  title="Limpar busca"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="custom-scrollbar" style={{ overflowX: 'auto', width: '100%', paddingBottom: '6px' }}>
          <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6', background: '#f9fafb' }}>
                <th 
                  onClick={() => handleSortDeadlines('fornecedor')}
                  className="table-header-clickable"
                  style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', width: '250px' }}
                >
                  Fornecedor {deadlineSortField === 'fornecedor' ? (deadlineSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', width: '150px' }}>Documento</th>
                <th 
                  onClick={() => handleSortDeadlines('valor')}
                  className="table-header-clickable"
                  style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'right', width: '130px' }}
                >
                  Valor {deadlineSortField === 'valor' ? (deadlineSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th 
                  onClick={() => handleSortDeadlines('vencimento')}
                  className="table-header-clickable"
                  style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '130px' }}
                >
                  Vencimento {deadlineSortField === 'vencimento' ? (deadlineSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th 
                  onClick={() => handleSortDeadlines('diasRestantes')}
                  className="table-header-clickable"
                  style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '120px' }}
                >
                  Dias Restantes {deadlineSortField === 'diasRestantes' ? (deadlineSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '120px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDeadlines.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#6b7280' }}>
                    Nenhum registro de prazos encontrado.
                  </td>
                </tr>
              ) : (
                paginatedDeadlines.map((item) => {
                  const isCritical = item.diasRestantes <= 7;
                  const isAlert = item.diasRestantes > 7 && item.diasRestantes <= 10;
                  const rowClass = isCritical ? 'table-row-critical' : (isAlert ? 'table-row-alert' : '');
                  const badgeClass = `badge-status ${isCritical ? 'badge-status-critical' : (isAlert ? 'badge-status-alert' : 'badge-status-normal')}`;
                  const statusText = isCritical ? 'Crítico' : (isAlert ? 'Alerta' : 'Normal');

                  return (
                    <tr 
                      key={item.id} 
                      className={rowClass}
                      style={{ 
                        borderBottom: '1px solid #e5e7eb',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: '#111827', fontWeight: 500 }}>
                        {item.fornecedor}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4b5563' }}>
                        {item.documento}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#111827', textAlign: 'right', fontWeight: 500 }}>
                        {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td 
                        style={{ padding: '12px 16px', textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => {
                          if (editingItemId !== item.id) {
                            setEditingItemId(item.id);
                            setEditingDateValue(item.vencimento);
                          }
                        }}
                        title="Clique para editar a data de vencimento"
                      >
                        {editingItemId === item.id ? (
                          <input
                            type="text"
                            value={editingDateValue}
                            onChange={(e) => setEditingDateValue(e.target.value)}
                            onBlur={() => handleSaveDueDate(item.id, item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveDueDate(item.id, item);
                              } else if (e.key === 'Escape') {
                                setEditingItemId(null);
                              }
                            }}
                            autoFocus
                            style={{
                              width: '90px',
                              padding: '4px 6px',
                              fontSize: '0.8rem',
                              border: '1px solid #2563eb',
                              borderRadius: '4px',
                              textAlign: 'center',
                              outline: 'none',
                              color: '#111827',
                              backgroundColor: '#ffffff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          />
                        ) : (
                          <span 
                            style={{ 
                              color: '#1f2937', 
                              fontWeight: 500,
                              textDecoration: 'underline', 
                              textDecorationStyle: 'dotted',
                              textUnderlineOffset: '3px',
                              textDecorationColor: '#9ca3af',
                              transition: 'color 0.15s, text-decoration-color 0.15s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = '#2563eb';
                              e.currentTarget.style.textDecorationColor = '#2563eb';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = '#1f2937';
                              e.currentTarget.style.textDecorationColor = '#9ca3af';
                            }}
                          >
                            {item.vencimento}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#111827', textAlign: 'center', fontWeight: 'bold' }}>
                        {item.diasRestantes <= 0 ? 'Expirado' : `${item.diasRestantes} ${item.diasRestantes === 1 ? 'dia' : 'dias'}`}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span className={badgeClass}>{statusText}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação de Prazos */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Exibindo {deadlinesStartIndex + 1} a {Math.min(deadlinesStartIndex + deadlinesRecordsPerPage, totalDeadlinesRecords)} de {totalDeadlinesRecords} registros
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={deadlinesCurrentPage === 1}
              onClick={() => setDeadlinesCurrentPage(prev => prev - 1)}
              className="pagination-btn"
            >
              Anterior
            </button>
            <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: '#4b5563' }}>
              Página {deadlinesCurrentPage} de {totalDeadlinesPages}
            </span>
            <button
              disabled={deadlinesCurrentPage === totalDeadlinesPages}
              onClick={() => setDeadlinesCurrentPage(prev => prev + 1)}
              className="pagination-btn"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
