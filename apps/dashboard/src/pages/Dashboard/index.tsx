import { useState, useEffect, useRef } from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { DocumentViewer } from '../../components/DocumentViewer';
import { DataEditor } from '../../components/DataEditor';
import { fetchNotes, updateNote, reprocessNotes, fetchUsageLog, deleteNote, syncEmails, fetchApiLogs, type UsageLog } from '../../services/api';
import type { Note, NoteData } from '../../types';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { useActivityTimeout } from '../../hooks/useActivityTimeout';

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
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
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

const isDeepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!isDeepEqual(obj1[key], obj2[key])) return false;
  }
  return true;
};

interface DashboardProps {
  onLogout: () => void;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const Dashboard = ({ onLogout, user }: DashboardProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeTab, setActiveTab] = useState<'notes' | 'history' | 'logs'>('notes');
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [apiLogs, setApiLogs] = useState<string>('');
  const [loadingApiLogs, setLoadingApiLogs] = useState(false);

  // Estados para Filtros e Paginação do Histórico
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyModelFilter, setHistoryModelFilter] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Monitor de Inatividade de 15 Minutos (se inativo, chama logout)
  useActivityTimeout(onLogout, 15 * 60 * 1000);

  useEffect(() => {
    setCurrentPage(1);
  }, [historySearchTerm, historyModelFilter, historyDateFilter]);

  const availableModels = Array.from(new Set(usageLogs.map(log => log.modeloIa).filter(Boolean)));

  const filteredUsageLogs = usageLogs.filter((log) => {
    const matchesSearch = 
      log.arquivo.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      log.fornecedor.toLowerCase().includes(historySearchTerm.toLowerCase());
    
    const matchesModel = !historyModelFilter || log.modeloIa === historyModelFilter;
    
    let matchesDate = true;
    if (historyDateFilter) {
      const logDateStr = new Date(log.dataHora).toISOString().split('T')[0];
      matchesDate = logDateStr === historyDateFilter;
    }
    
    return matchesSearch && matchesModel && matchesDate;
  });

  const totalRecords = filteredUsageLogs.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage) || 1;
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedUsageLogs = filteredUsageLogs.slice(startIndex, startIndex + recordsPerPage);

  const loadUsageLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await fetchUsageLog();
      logs.sort((a: UsageLog, b: UsageLog) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
      setUsageLogs(logs);
    } catch (error: any) {
      console.error('Erro ao carregar logs de uso:', error);
      showToast('Erro ao carregar o histórico de uso.', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadApiLogs = async () => {
    setLoadingApiLogs(true);
    try {
      const logs = await fetchApiLogs();
      setApiLogs(logs);
    } catch (error) {
      console.error('Erro ao carregar logs da API:', error);
      showToast('Falha ao carregar logs do servidor.', 'error');
    } finally {
      setLoadingApiLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadUsageLogs();
    } else if (activeTab === 'logs') {
      loadApiLogs();
    }
  }, [activeTab]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para o painel redimensionável
  const [editorWidth, setEditorWidth] = useState(400);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingEditor, setIsDraggingEditor] = useState(false);

  const [isApiOnline, setIsApiOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const selectedNoteRef = useRef<Note | null>(null);
  useEffect(() => {
    selectedNoteRef.current = selectedNote;
  }, [selectedNote]);

  useEffect(() => {
    console.log('[Dashboard] Painel de Curadoria ativo para:', user.email);
    fetchNotes()
      .then((data: Note[]) => {
        setNotes(data);
        setIsApiOnline(true);
        if (data.length > 0 && !selectedNoteRef.current) {
          const firstNote = data[0];
          setSelectedNote(firstNote);
          setFormData(JSON.parse(JSON.stringify(firstNote.data)));
        }
      })
      .catch((error: any) => {
        console.error('Erro ao carregar notas no mount:', error);
        setIsApiOnline(false);
      });
  }, []);

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setFormData(JSON.parse(JSON.stringify(note.data)));
  };

  const refreshNotesList = async () => {
    setIsSyncing(true);
    const startTime = Date.now();
    try {
      // 1. Aciona a sincronização real no backend de e-mails
      const syncResult = await syncEmails();
      showToast(syncResult.message, syncResult.imported ? 'success' : 'info');

      // 2. Atualiza a listagem de faturas na tela
      const data = await fetchNotes();
      setNotes(data);
      setIsApiOnline(true);
    } catch (error) {
      console.error('Erro ao atualizar lista de notas:', error);
      showToast('Falha na sincronização com o servidor de e-mails.', 'error');
      setIsApiOnline(false);
    } finally {
      const duration = Date.now() - startTime;
      const delay = Math.max(600 - duration, 0);
      setTimeout(() => {
        setIsSyncing(false);
      }, delay);
    }
  };

  const handleEditorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingEditor(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      let newWidth = window.innerWidth - moveEvent.clientX;
      if (newWidth < 350) newWidth = 350;
      if (newWidth > window.innerWidth * 0.55) newWidth = window.innerWidth * 0.55;
      setEditorWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingEditor(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSidebar(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      let newWidth = moveEvent.clientX;
      if (newWidth < 220) newWidth = 220;
      if (newWidth > 450) newWidth = 450;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleInputChange = (path: string[], value: string) => {
    if (!formData) return;
    const newFormData = { ...formData };
    let current: any = newFormData;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = value;
    setFormData(newFormData);
  };

  const handleSave = async (statusOverride?: string, silent?: boolean) => {
    if (!selectedNote || !formData) return;

    const copy = JSON.parse(JSON.stringify(formData));
    sanitizeNumericFields(copy);
    if (statusOverride) {
      copy.status = statusOverride;
    }

    const originalCopy = JSON.parse(JSON.stringify(selectedNote.data));
    sanitizeNumericFields(originalCopy);

    if (isDeepEqual(copy, originalCopy)) {
      if (!silent) {
        showToast('Nenhuma alteração detectada.', 'info');
      }
      return;
    }

    setLoading(true);
    try {
      await updateNote(selectedNote.id, copy);
      showToast('Dados contábeis e planilha de rateio salvos.', 'success');
      
      const refreshedNotes = await fetchNotes();
      setNotes(refreshedNotes);
      const updated = refreshedNotes.find((n: Note) => n.id === selectedNote.id);
      if (updated) {
        setSelectedNote(updated);
        setFormData(JSON.parse(JSON.stringify(updated.data)));
      }
    } catch (error) {
      console.error('Erro ao salvar dados contábeis:', error);
      showToast('Erro ao salvar os dados contábeis.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async () => {
    if (!selectedNote) return;
    setLoading(true);
    try {
      await reprocessNotes(selectedNote.id);
      showToast('Processamento executado com sucesso.', 'success');
      
      const refreshedNotes = await fetchNotes();
      setNotes(refreshedNotes);
      const updated = refreshedNotes.find((n: Note) => n.id === selectedNote.id);
      if (updated) {
        setSelectedNote(updated);
        setFormData(JSON.parse(JSON.stringify(updated.data)));
      }
    } catch (error) {
      console.error('Erro ao reprocessar faturas:', error);
      showToast('Erro ao processar o documento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setFormData(null);
      }
      await new Promise(resolve => setTimeout(resolve, 250));
      await deleteNote(id);
      
      showToast('Fatura e rateios excluídos com sucesso.', 'success');
      const refreshedNotes = await fetchNotes();
      setNotes(refreshedNotes);
    } catch (error) {
      console.error('Erro ao excluir nota:', error);
      showToast('Erro ao excluir a fatura.', 'error');
    }
  };

  const handleLogoutWithToast = () => {
    showToast('Obrigado por utilizar o Fiscal Intelligence (SFI). Até logo!', 'success');
    setTimeout(() => {
      onLogout();
    }, 1500);
  };

  return (
    <div className="layout">
      <Header 
        onSync={refreshNotesList} 
        isApiOnline={isApiOnline} 
        isSyncing={isSyncing} 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
        onLogout={handleLogoutWithToast}
      />

      <div className="content-area">
        {activeTab === 'notes' ? (
          <>
            <Sidebar 
              notes={notes} 
              selectedNoteId={selectedNote?.id} 
              onSelectNote={handleSelectNote} 
              onDeleteNote={handleDeleteNote}
              searchTerm={searchTerm} 
              onSearchChange={setSearchTerm} 
              style={{ '--sidebar-width-dynamic': `${sidebarWidth}px` } as React.CSSProperties}
            />

            <div 
              className={`resizer ${isDraggingSidebar ? 'dragging' : ''}`}
              onMouseDown={handleSidebarMouseDown}
              title="Arraste para redimensionar a barra lateral"
            />

            <div className="main">
              {selectedNote ? (
                <>
                  <DocumentViewer selectedNote={selectedNote} isDragging={isDraggingSidebar || isDraggingEditor} />

                  <div 
                    className={`resizer ${isDraggingEditor ? 'dragging' : ''}`}
                    onMouseDown={handleEditorMouseDown}
                    title="Arraste para redimensionar o painel de dados"
                  />

                  <div 
                    className="editor"
                    style={{ width: `${editorWidth}px` }}
                  >
                    {formData && (
                      <DataEditor 
                        formData={formData}
                        selectedNote={selectedNote}
                        loading={loading}
                        onInputChange={handleInputChange}
                        onSave={handleSave}
                        onReprocess={handleReprocess}
                      />
                    )}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                  Selecione uma fatura para auditar os lançamentos.
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'history' ? (
          <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
            <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={() => setActiveTab('notes')}
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
                  Histórico de Processamento
                </h2>
              </div>

              {/* Filtros de Busca */}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 250px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Pesquisa Rápida</label>
                  <input
                    type="text"
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    placeholder="Filtrar por nome do arquivo ou fornecedor..."
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#1f2937'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '180px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Modelo de IA</label>
                  <select
                    value={historyModelFilter}
                    onChange={(e) => setHistoryModelFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#1f2937',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Todos os modelos</option>
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '180px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Data de Execução</label>
                  <input
                    type="date"
                    value={historyDateFilter}
                    onChange={(e) => setHistoryDateFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#1f2937'
                    }}
                  />
                </div>

                {(historySearchTerm || historyModelFilter || historyDateFilter) && (
                  <button
                    onClick={() => {
                      setHistorySearchTerm('');
                      setHistoryModelFilter('');
                      setHistoryDateFilter('');
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.75rem',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      color: '#4b5563',
                      cursor: 'pointer',
                      fontWeight: 500,
                      alignSelf: 'flex-end'
                    }}
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>

              {/* Tabela com Scroll Customizado */}
              <div className="custom-scrollbar" style={{ overflowX: 'auto', width: '100%', paddingBottom: '6px' }}>
                <table style={{ width: '100%', minWidth: '1880px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6', background: '#f9fafb' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', width: '60px' }}>ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', width: '150px' }}>Data/Hora</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', width: '200px' }}>Arquivo</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', width: '120px' }}>Modelo</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', width: '250px' }}>Fornecedor</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', width: '140px' }}>CNPJ</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '130px' }}>Status do Arquivo</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', width: '130px' }}>Doc. Fiscal</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'right', width: '120px' }}>Vlr. Fatura</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '100px' }}>Tokens Ent.</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '100px' }}>Tokens Saí.</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '110px' }}>Custo (USD)</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '100px' }}>Tempo (ms)</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '110px' }}>Status IA</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '120px' }}>ID Zeev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={15} style={{ padding: '40px 16px', textAlign: 'center', color: '#6b7280' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            <div className="animate-spin" style={{
                              width: '24px',
                              height: '24px',
                              border: '3px solid #e5e7eb',
                              borderTopColor: '#2563eb',
                              borderRadius: '50%'
                            }} />
                            <span>Carregando histórico...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedUsageLogs.length === 0 ? (
                      <tr>
                        <td colSpan={15} style={{ padding: '40px 16px', textAlign: 'center', color: '#6b7280' }}>
                          Nenhum registro de processamento encontrado.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsageLogs.map((log) => (
                        <tr 
                          key={log.id} 
                          className="history-row"
                        >
                          <td style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 'bold' }}>
                            #{log.id}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#111827' }}>
                            {new Date(log.dataHora).toLocaleString('pt-BR')}
                          </td>
                          <td 
                            style={{ 
                              padding: '12px 16px', 
                              color: '#4b5563', 
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={log.arquivo}
                          >
                            {log.arquivo}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                            <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                              {log.modeloIa}
                            </span>
                          </td>
                          <td 
                            style={{ 
                              padding: '12px 16px', 
                              color: '#111827', 
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={log.fornecedor}
                          >
                            {log.fornecedor}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#4b5563' }}>
                            {log.cnpjFornecedor || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>N/D</span>}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ 
                              background: log.statusArquivo === 'Excluído' ? '#fee2e2' : log.statusArquivo === 'Validado' ? '#d1fae5' : '#eff6ff', 
                              color: log.statusArquivo === 'Excluído' ? '#b91c1c' : log.statusArquivo === 'Validado' ? '#065f46' : '#1d4ed8', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.7rem', 
                              fontWeight: 600 
                            }}>
                              {log.statusArquivo || 'Pendente'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#4b5563' }}>
                            {log.numeroDocumento || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>N/D</span>}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#111827', fontWeight: 600, textAlign: 'right' }}>
                            {log.valorFatura !== undefined && log.valorFatura !== null ? (
                              `R$ ${log.valorFatura.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            ) : (
                              <span style={{ color: '#9ca3af', fontStyle: 'italic', fontWeight: 'normal' }}>N/D</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span className="token-badge">{log.tokensEntrada.toLocaleString()}</span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span className="token-badge">{log.tokensSaida.toLocaleString()}</span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span className="cost-badge">${log.custoUsd.toFixed(6)}</span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#4b5563', textAlign: 'center' }}>{log.tempoProcessamentoMs}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ 
                              background: log.status === 'Falha' ? '#fee2e2' : '#eff6ff', 
                              color: log.status === 'Falha' ? '#b91c1c' : '#1d4ed8', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.7rem', 
                              fontWeight: 600 
                            }}>
                              {log.status || 'Sucesso'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: '#4b5563' }}>
                            {log.zeevId ? (
                              <span style={{ 
                                background: '#eff6ff', 
                                color: '#1d4ed8', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.7rem', 
                                fontWeight: 600 
                              }}>
                                #{log.zeevId}
                              </span>
                            ) : (
                              <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Pendente</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Exibindo {startIndex + 1} a {Math.min(startIndex + recordsPerPage, totalRecords)} de {totalRecords} registros
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={currentPage === 1 || loadingLogs}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      color: currentPage === 1 ? '#d1d5db' : '#4b5563',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Anterior
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: '#4b5563' }}>
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages || loadingLogs}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      color: currentPage === totalPages ? '#d1d5db' : '#4b5563',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setActiveTab('notes')}
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
                    Logs de Execução da API
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-outline"
                    onClick={loadApiLogs}
                    disabled={loadingApiLogs}
                    style={{ 
                      padding: '6px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCcw size={14} className={loadingApiLogs ? 'animate-spin' : ''} />
                    Atualizar
                  </button>
                </div>
              </div>

              <div style={{
                flex: 1,
                minHeight: '400px',
                background: '#1e1e1e',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #333',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>
                    Visualização das últimas 200 linhas de console (console.log / console.error)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(apiLogs);
                      showToast('Logs copiados para a área de transferência.', 'success');
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      color: '#ccc',
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#333';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#ccc';
                    }}
                  >
                    Copiar Logs
                  </button>
                </div>

                <div 
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    fontFamily: 'Consolas, Monaco, "Courier New", Courier, monospace',
                    fontSize: '0.75rem',
                    color: '#f1f1f1',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    padding: '8px',
                    backgroundColor: '#121212',
                    borderRadius: '4px'
                  }}
                >
                  {loadingApiLogs ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
                      Carregando logs...
                    </div>
                  ) : apiLogs.trim() === '' ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
                      Nenhum registro de log encontrado.
                    </div>
                  ) : (
                    apiLogs
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toasts de Notificação */}
      <div className="toast-container">
        {isSyncing && (
          <div className="toast toast-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCcw size={14} className="animate-spin" style={{ color: '#2563eb' }} />
              <span>Sincronizando e-mails e importando faturas...</span>
            </div>
            <div style={{
              height: '4px',
              background: '#dbeafe',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative',
              width: '100%'
            }}>
              <div className="progress-bar-loading" />
            </div>
          </div>
        )}
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Dashboard;
