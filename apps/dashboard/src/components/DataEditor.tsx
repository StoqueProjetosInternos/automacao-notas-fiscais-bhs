import React, { useState } from 'react';
import { FileText, Save, Check, AlertCircle, RefreshCcw, Trash2 } from 'lucide-react';
import type { Note, NoteData } from '../types';

interface DataEditorProps {
  formData: NoteData | null;
  selectedNote: Note | null;
  loading: boolean;
  onInputChange: (path: string[], value: string) => void;
  onSave: (statusOverride?: string, silent?: boolean) => void;
  onReprocess: () => void;
  onDeleteApportionmentRow: (index: number) => void;
  userRole: string;
}

const labelMap: Record<string, string> = {
  supplier: 'Fornecedor',
  payer: 'Pagador',
  name: 'Nome / Razão Social',
  cnpjCpf: 'CNPJ/CPF',
  financial: 'Dados Financeiros',
  totalValue: 'Valor Total',
  originalValue: 'Valor Original',
  chargedValue: 'Valor Cobrado',
  dueDate: 'Vencimento',
  issueDate: 'Data de Emissão',
  competenceDate: 'Competência',
  taxes: 'Impostos Retidos',
  iss: 'ISS',
  irrf: 'IRRF',
  pis: 'PIS',
  cofins: 'COFINS',
  csll: 'CSLL',
  document: 'Documento',
  number: 'Número',
  barcode: 'Código de Barras / Linha Digitável',
  type: 'Tipo de Documento',
  additionalInfo: 'Informações Adicionais',
  documentIdentifiers: 'Identificadores',
  documentType: 'Tipo do Documento',
  documentNumber: 'Número do Documento',
  documentSeries: 'Série do Documento',
  supplierAddress: 'Endereço do Fornecedor',
  payerAddress: 'Endereço do Pagador',
  deliveryAddress: 'Endereço de Entrega',
  operationNature: 'Natureza da Operação',
  authorizationProtocol: 'Protocolo de Autorização',
  products: 'Produtos / Serviços',
  observations: 'Observações',
  street: 'Rua / Logradouro',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'Estado',
  cep: 'CEP',
  phone: 'Telefone',
  email: 'E-mail',
  code: 'Código',
  description: 'Descrição',
  ncmSh: 'NCM/SH',
  cst: 'CST',
  cfop: 'CFOP',
  unit: 'Unidade',
  quantity: 'Quantidade',
  unitValue: 'Valor Unitário',
  bcIcms: 'Base de Cálculo ICMS',
  vIcms: 'Valor ICMS',
  vIpi: 'Valor IPI',
  aliquotaIcms: 'Alíquota ICMS',
  aliquotaIpi: 'Alíquota IPI',
  time: 'Hora',
  date: 'Data',
  danfeType: 'Tipo de DANFE'
};

const NUMERIC_FIELDS = [
  'originalValue',
  'chargedValue',
  'iss',
  'irrf',
  'pis',
  'cofins',
  'csll',
  'valorTotal',
  'value',
  'unitValue',
  'quantity'
];

const parseBrazilianNumber = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  if (str.includes(',')) {
    const cleanVal = str
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.');
    const num = parseFloat(cleanVal);
    return isNaN(num) ? 0 : num;
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const getLabel = (key: string) => {
  if (!isNaN(Number(key))) return `Item ${parseInt(key) + 1}`;
  return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase();
};

export const DataEditor = ({ formData, selectedNote, loading, onInputChange, onSave, onReprocess, onDeleteApportionmentRow, userRole }: DataEditorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);
  const [skipConfirm, setSkipConfirm] = useState(() => localStorage.getItem('skip_apportionment_delete_confirm') === 'true');
  const [showIaDisclaimer, setShowIaDisclaimer] = useState(true);

  const steps = [
    { key: 'capture', label: 'Captura', desc: selectedNote?.fileName.startsWith('manual_') ? 'Upload' : 'E-mail' },
    { key: 'ocr', label: 'Leitura IA', desc: 'Gemini' },
    { key: 'enrich', label: 'Rateio', desc: 'Concluído' },
    { key: 'curation', label: 'Curadoria', desc: formData?.status === 'validado' ? 'Aprovada' : 'Revisão' },
    { key: 'integration', label: 'Integração', desc: formData?.status === 'validado' ? 'Disponível' : 'Aguardando' }
  ];

  const currentStepIndex = formData?.status === 'validado' ? 5 : 3;

  const handleDeleteClick = (index: number) => {
    if (skipConfirm) {
      onDeleteApportionmentRow(index);
    } else {
      setRowToDelete(index);
    }
  };

  const handleConfirmDelete = () => {
    if (rowToDelete !== null) {
      onDeleteApportionmentRow(rowToDelete);
      setRowToDelete(null);
    }
  };
  
  const renderRecursiveFields = (obj: any, path: string[] = []): React.ReactNode => {
    if (!obj) return null;
    
    return Object.keys(obj).map(key => {
      const currentPath = [...path, key];
      const value = obj[key];

      // Oculta a renderização em cascata do array de rateio para evitar poluição e lentidão
      if (key === 'apportionment') return null;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        return (
          <div key={currentPath.join('.')} className="section-card">
            <span className="section-title">{getLabel(key)}</span>
            {renderRecursiveFields(value, currentPath)}
          </div>
        );
      }

      if (Array.isArray(value)) {
        return (
          <div key={currentPath.join('.')} className="section-card array-section">
            <span className="section-title">{getLabel(key)}</span>
            {value.map((item, index) => {
              const itemPath = [...currentPath, index.toString()];
              if (typeof item === 'object') {
                return (
                  <div key={itemPath.join('.')} className="array-item-card">
                    <span className="item-index-label">{getLabel(index.toString())}</span>
                    {renderRecursiveFields(item, itemPath)}
                  </div>
                );
              }
              return (
                <div key={itemPath.join('.')} className="field-group">
                  <input 
                    className="field-input"
                    type="text" 
                    value={item || ''} 
                    onChange={(e) => onInputChange(itemPath, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        );
      }

      if (key === 'rawText' || key === 'status' || key === 'accountingFields') return null;
      if (key === 'apportionment' && Array.isArray(value) && value.length === 1) return null;

      const isNumeric = NUMERIC_FIELDS.includes(key);
      let displayValue = '';
      if (value !== undefined && value !== null) {
        if (isNumeric) {
          if (typeof value === 'number') {
            displayValue = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          } else {
            displayValue = String(value);
          }
        } else {
          displayValue = String(value);
        }
      }

      return (
        <div key={currentPath.join('.')} className="field-group">
          <label className="field-label">{getLabel(key)}</label>
          <input 
            className="field-input"
            type="text" 
            value={displayValue} 
            onChange={(e) => onInputChange(currentPath, e.target.value)}
            onBlur={(e) => {
              if (isNumeric) {
                const parsed = parseBrazilianNumber(e.target.value);
                const formatted = parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                onInputChange(currentPath, formatted);
              }
            }}
          />
        </div>
      );
    });
  }

  return (
    <>
      <div className="editor-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827', fontWeight: 700 }}>
              <FileText size={18} color="#2563eb" />
              Curadoria de Dados
            </h2>
          </div>
          <div className={`status-badge status-${formData?.status || 'pendente'}`} style={{ 
            padding: '4px 10px', 
            borderRadius: '12px', 
            fontSize: '0.65rem', 
            fontWeight: 700, 
            textTransform: 'uppercase',
            background: formData?.status === 'validado' ? '#ecfdf5' : '#fff7ed',
            color: formData?.status === 'validado' ? '#059669' : '#d97706',
            border: `1px solid ${formData?.status === 'validado' ? '#a7f3d0' : '#fed7aa'}`
          }}>
            {formData?.status || 'pendente'}
          </div>
        </div>
      </div>

      {formData && (
        <div className="editor-stepper-container">
          <div className="editor-stepper">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              return (
                <div key={step.key} className={`stepper-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="stepper-node">
                    <div className="stepper-circle">
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    {index < steps.length - 1 && <div className="stepper-line" />}
                  </div>
                  <div className="stepper-text">
                    <div className="stepper-label">{step.label}</div>
                    <div className="stepper-desc">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="editor-content">
        {formData ? (
          <>
            {/* Seção Especial de Classificação Contábil no Topo */}
            <div className="section-card" style={{ borderLeft: '4px solid #10b981', background: '#f9fafb' }}>
              <span className="section-title" style={{ color: '#0f766e', fontWeight: 700, display: 'block', marginBottom: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Classificação Contábil (Rateio)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label className="field-label">Código CR</label>
                  <input 
                    className="field-input"
                    type="text" 
                    value={(formData.accountingFields as any)?.cr || ''} 
                    onChange={(e) => onInputChange(['accountingFields', 'cr'], e.target.value)}
                  />
                  {(formData.accountingFields as any)?.crDescription && (
                    <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginTop: '4px', fontStyle: 'italic' }}>
                      {(formData.accountingFields as any).crDescription}
                    </span>
                  )}
                </div>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label className="field-label">Código de Natureza</label>
                  <input 
                    className="field-input"
                    type="text" 
                    value={(formData.accountingFields as any)?.naturezaCode || ''} 
                    onChange={(e) => onInputChange(['accountingFields', 'naturezaCode'], e.target.value)}
                  />
                  {(formData.accountingFields as any)?.naturezaDescription && (
                    <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginTop: '4px', fontStyle: 'italic' }}>
                      {(formData.accountingFields as any).naturezaDescription}
                    </span>
                  )}
                </div>
              </div>
              <div className="field-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                <label className="field-label">Contrato</label>
                <input 
                  className="field-input"
                  type="text" 
                  value={(formData.accountingFields as any)?.contract || ''} 
                  onChange={(e) => onInputChange(['accountingFields', 'contract'], e.target.value)}
                />
              </div>
            </div>

            {/* Seção de Rateio Detalhado por Equipamento */}
            {formData.apportionment && Array.isArray(formData.apportionment) && formData.apportionment.length > 0 && (
              <div className="section-card" style={{ borderLeft: '4px solid #3b82f6', background: '#f8fafc' }}>
                <span className="section-title" style={{ color: '#1e3a8a', fontWeight: 700, display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Itens Faturados e Rateio
                </span>
                <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: '0 0 1rem 0' }}>
                  Esta fatura contém {formData.apportionment.length} itens detalhados com informações de séries e classificação.
                </p>
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsModalOpen(true)}
                  style={{ width: '100%', fontSize: '0.75rem', padding: '8px 12px' }}
                >
                  Visualizar e Editar Tabela de Rateio
                </button>
              </div>
            )}

            {renderRecursiveFields(formData)}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '6rem' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>Selecione um item.</p>
          </div>
        )}
      </div>

      <div className="action-bar">
        <button 
          className="btn" 
          onClick={onReprocess}
          disabled={loading || !selectedNote || userRole !== 'ADMIN'}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginRight: 'auto',
            backgroundColor: userRole !== 'ADMIN' ? '#d1d5db' : '#10b981',
            color: userRole !== 'ADMIN' ? '#9ca3af' : 'white',
            border: 'none',
            transition: 'background-color 0.2s',
            cursor: userRole !== 'ADMIN' ? 'not-allowed' : 'pointer'
          }}
          onMouseOver={(e) => {
            if (userRole === 'ADMIN') e.currentTarget.style.backgroundColor = '#059669';
          }}
          onMouseOut={(e) => {
            if (userRole === 'ADMIN') e.currentTarget.style.backgroundColor = '#10b981';
          }}
          title={userRole !== 'ADMIN' ? 'Apenas administradores podem reprocessar OCR' : 'Reprocessar OCR Google Gemini'}
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Reprocessar
        </button>
        <button 
          className="btn btn-outline" 
          onClick={() => onSave()}
          disabled={loading || !selectedNote}
        >
          <Save size={14} />
          Salvar
        </button>
        <button 
          className="btn btn-primary" 
          onClick={() => onSave('validado')}
          disabled={loading || !selectedNote || formData?.status === 'validado'}
        >
          <Check size={14} />
          {formData?.status === 'validado' ? 'Validado' : 'Aprovar'}
        </button>
      </div>

      {showIaDisclaimer && (
        <div style={{
          padding: '0.75rem 1.25rem',
          fontSize: '0.7rem',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          lineHeight: '1.4',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          position: 'relative'
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, color: '#9ca3af' }} />
          <span style={{ paddingRight: '20px' }}>
            Aviso: O processamento de dados e rateios contábeis foi realizado por inteligência artificial. É indispensável revisar e validar os campos antes de aprovar a fatura.
          </span>
          <button 
            type="button" 
            onClick={() => setShowIaDisclaimer(false)} 
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none'
            }}
            title="Minimizar aviso"
          >
            &times;
          </button>
        </div>
      )}

      {/* Modal de Edição Detalhada de Rateio */}
      {isModalOpen && formData && formData.apportionment && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                  Tabela de Rateio Detalhado
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                  Edite os códigos de CR, Natureza, Contrato e Série de cada item. As alterações são sincronizadas em tempo real.
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => {
                setIsModalOpen(false);
                onSave(undefined, true);
              }}>
                &times;
              </button>
            </div>
            
            <div className="modal-search-bar" style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)', background: '#f9fafb', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Buscar por descrição, CR, número de série..."
                  className="search-box"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', margin: 0, paddingRight: '2.5rem' }}
                />
                {searchTerm && (
                  <button 
                    type="button"
                    onClick={() => setSearchTerm('')} 
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
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

            <div className="modal-body" style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
              <table className="apportionment-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '10px', fontWeight: 600, width: '45px', textAlign: 'center' }}>ID</th>
                    <th style={{ padding: '10px', fontWeight: 600 }}>Descrição</th>
                    <th style={{ padding: '10px', fontWeight: 600, width: '50px' }}>Qtd</th>
                    <th style={{ padding: '10px', fontWeight: 600, width: '90px' }}>Unitário</th>
                    <th style={{ padding: '10px', fontWeight: 600, width: '90px' }}>Total</th>
                    <th style={{ padding: '10px', fontWeight: 600, width: '110px' }}>CR</th>
                    <th style={{ padding: '10px', fontWeight: 600, width: '120px' }}>Natureza</th>
                    <th style={{ padding: '10px', fontWeight: 600, width: '120px' }}>Contrato</th>
                    <th style={{ padding: '10px', fontWeight: 600, width: '130px' }}>Série</th>
                    <th style={{ padding: '10px', fontWeight: 600, width: '50px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.apportionment
                    .map((item: any, idx: number) => ({ item, originalIndex: idx }))
                    .filter(({ item }: any) => {
                      if (!searchTerm) return true;
                      const search = searchTerm.toLowerCase();
                      return (
                        (item.description && item.description.toLowerCase().includes(search)) ||
                        (item.cr && item.cr.toLowerCase().includes(search)) ||
                        (item.naturezaCode && item.naturezaCode.toLowerCase().includes(search)) ||
                        (item.contract && item.contract.toLowerCase().includes(search)) ||
                        (item.serialNumber && item.serialNumber.toLowerCase().includes(search))
                      );
                    })
                    .map(({ item, originalIndex }: any) => (
                      <tr key={originalIndex} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#4b5563', fontWeight: '600' }}>
                          {originalIndex + 1}
                        </td>
                        <td style={{ padding: '8px 10px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>
                          {item.description}
                        </td>
                        <td style={{ padding: '8px 10px' }}>{item.quantity}</td>
                        <td style={{ padding: '8px 10px' }}>
                          {item.unitValue ? item.unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {item.value ? item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="text"
                            className="field-input"
                            value={item.cr || ''}
                            placeholder={formData.accountingFields?.cr || ''}
                            onChange={(e) => onInputChange(['apportionment', originalIndex.toString(), 'cr'], e.target.value)}
                            style={{ padding: '6px', fontSize: '0.75rem' }}
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="text"
                            className="field-input"
                            value={item.naturezaCode || ''}
                            placeholder={formData.accountingFields?.naturezaCode || ''}
                            onChange={(e) => onInputChange(['apportionment', originalIndex.toString(), 'naturezaCode'], e.target.value)}
                            style={{ padding: '6px', fontSize: '0.75rem' }}
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="text"
                            className="field-input"
                            value={item.contract || ''}
                            placeholder={(formData.accountingFields?.contract && formData.accountingFields?.contract !== '-') ? formData.accountingFields?.contract : ''}
                            onChange={(e) => onInputChange(['apportionment', originalIndex.toString(), 'contract'], e.target.value)}
                            style={{ padding: '6px', fontSize: '0.75rem' }}
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="text"
                            className="field-input"
                            value={item.serialNumber || ''}
                            onChange={(e) => onInputChange(['apportionment', originalIndex.toString(), 'serialNumber'], e.target.value)}
                            style={{ padding: '6px', fontSize: '0.75rem' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="modal-delete-btn"
                            onClick={() => handleDeleteClick(originalIndex)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '4px',
                              outline: 'none'
                            }}
                            title="Excluir item de rateio"
                          >
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => {
                setIsModalOpen(false);
                onSave(undefined, true);
              }} style={{ maxWidth: '120px' }}>
                Concluir
              </button>
            </div>

            {rowToDelete !== null && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  width: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                    Confirmar Exclusão
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.4' }}>
                    Tem certeza que deseja remover este item do rateio? Isso irá recalcular a planilha do Excel correspondente ao salvar.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.75rem', color: '#4b5563' }}>
                    <input
                      type="checkbox"
                      checked={skipConfirm}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSkipConfirm(checked);
                        localStorage.setItem('skip_apportionment_delete_confirm', checked ? 'true' : 'false');
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    Não perguntar novamente
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setRowToDelete(null)}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'transparent', border: '1px solid #d1d5db', cursor: 'pointer', borderRadius: '4px' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};