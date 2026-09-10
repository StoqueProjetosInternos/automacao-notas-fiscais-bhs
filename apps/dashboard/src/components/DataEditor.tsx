import React, { useState, useEffect } from 'react';
import { FileText, Save, Check, AlertCircle, RefreshCcw, Trash2, Copy, CheckCircle2, Loader2, ChevronDown, ChevronRight, ChevronsDown, ChevronsUp } from 'lucide-react';
import type { Note, NoteData } from '../types';
import crList from '@data/cr.json';
import naturezasList from '@data/naturezas.json';

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
  const [activeAction, setActiveAction] = useState<'save' | 'approve' | 'reopen' | 'reprocess' | null>(null);

  useEffect(() => {
    if (!loading) {
      setActiveAction(null);
    }
  }, [loading]);

  const [copiedBarcode, setCopiedBarcode] = useState(false);

  const handleCopyBarcode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onSave('validado');
      }
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, isModalOpen]);

  // Validação Automática de Saldo de Rateio
  const invoiceTotalValue = parseBrazilianNumber(
    formData?.financial?.originalValue || 
    formData?.financial?.chargedValue || 
    (formData?.financial as any)?.totalValue || 
    (formData as any)?.valorTotal || 0
  );

  const apportionmentTotalValue = formData?.apportionment && Array.isArray(formData.apportionment)
    ? formData.apportionment.reduce((acc: number, item: any) => {
        const v = parseBrazilianNumber(item.value || item.unitValue || 0);
        return acc + v;
      }, 0)
    : 0;

  const hasApportionment = Boolean(formData?.apportionment && Array.isArray(formData.apportionment) && formData.apportionment.length > 0);
  const balanceDiff = invoiceTotalValue - apportionmentTotalValue;
  const isApportionmentBalanced = Math.abs(balanceDiff) < 0.05;

  const isManualCapture = selectedNote?.data?.origin === 'Upload Manual' || selectedNote?.fileName.startsWith('manual_') || selectedNote?.fileName.startsWith('upload_');

  const steps = [
    { key: 'capture', label: 'Captura', desc: isManualCapture ? 'Upload' : 'E-mail' },
    { key: 'ocr', label: 'Leitura IA', desc: 'Gemini' },
    { key: 'enrich', label: 'Rateio', desc: 'Concluído' },
    { key: 'curation', label: 'Curadoria', desc: formData?.status === 'validado' ? 'Aprovada' : 'Revisão' },
    { key: 'integration', label: 'Integração', desc: formData?.status === 'validado' ? 'Disponível' : 'Aguardando' }
  ];

  const currentStepIndex = formData?.status === 'validado' ? 5 : 3;

  // Estado para controle de minimização de blocos
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExpandAll = () => {
    setCollapsedSections({});
  };

  const handleCollapseAll = () => {
    const allKeys: Record<string, boolean> = {
      accounting: true,
      apportionment: true,
      audit: true,
    };
    if (formData) {
      Object.keys(formData).forEach(k => {
        if (k !== 'rawText' && k !== 'status' && k !== 'accountingFields') {
          allKeys[k] = true;
        }
      });
    }
    setCollapsedSections(allKeys);
  };

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
      const sectionKey = currentPath.join('.');
      const isCollapsed = Boolean(collapsedSections[sectionKey]);
      const value = obj[key];

      // Oculta a renderização em cascata do array de rateio para evitar poluição e lentidão
      if (key === 'apportionment') return null;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        return (
          <div key={sectionKey} className="section-card">
            <div 
              onClick={() => toggleSection(sectionKey)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
              title="Clique para alternar o tamanho deste bloco"
            >
              {isCollapsed ? <ChevronRight size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
              <span className="section-title" style={{ marginBottom: 0, fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{getLabel(key)}</span>
            </div>
            {!isCollapsed && (
              <div style={{ marginTop: '0.6rem' }}>
                {renderRecursiveFields(value, currentPath)}
              </div>
            )}
          </div>
        );
      }

      if (Array.isArray(value)) {
        return (
          <div key={sectionKey} className="section-card array-section">
            <div 
              onClick={() => toggleSection(sectionKey)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
              title="Clique para alternar o tamanho deste bloco"
            >
              {isCollapsed ? <ChevronRight size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
              <span className="section-title" style={{ marginBottom: 0, fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{getLabel(key)}</span>
            </div>
            {!isCollapsed && (
              <div style={{ marginTop: '0.6rem' }}>
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
            )}
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

      const isBarcodeField = key === 'barcode' || key === 'linhaDigitavel' || key === 'codigoBarras';

      return (
        <div key={currentPath.join('.')} className="field-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <label className="field-label" style={{ marginBottom: 0 }}>{getLabel(key)}</label>
            {isBarcodeField && displayValue && (
              <button
                type="button"
                onClick={() => handleCopyBarcode(displayValue)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10.5px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: copiedBarcode ? '#ecfdf5' : '#ffffff',
                  color: copiedBarcode ? '#047857' : '#334155',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
                title="Copiar código de barras / linha digitável"
              >
                {copiedBarcode ? <Check size={10} color="#059669" /> : <Copy size={10} />}
                {copiedBarcode ? 'Copiado!' : 'Copiar'}
              </button>
            )}
          </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 700 }}>
              <FileText size={15} color="#0284c7" />
              Curadoria de Dados
            </h2>
          </div>
          <div>
            {formData?.status === 'validado' ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#047857',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '1px 8px',
                borderRadius: '4px'
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                VALIDADO
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#b45309',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '1px 8px',
                borderRadius: '4px'
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                PENDENTE
              </span>
            )}
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
            {/* Controle Global Dinâmico de Expansão/Minimização de Blocos */}
            {(() => {
              const areAllCollapsed = Boolean(collapsedSections.accounting) && Boolean(collapsedSections.audit);
              return (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-start', 
                  marginBottom: '8px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <button 
                    type="button" 
                    onClick={areAllCollapsed ? handleExpandAll : handleCollapseAll}
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px', 
                      padding: '2px 8px', 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px', 
                      color: '#475569',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    title={areAllCollapsed ? "Expandir todos os blocos de curadoria" : "Esconder todos os blocos de curadoria"}
                  >
                    {areAllCollapsed ? <ChevronsDown size={11} /> : <ChevronsUp size={11} />}
                    {areAllCollapsed ? 'Expandir Todos' : 'Esconder Todos'}
                  </button>
                </div>
              );
            })()}

            {/* Datalists de Autocomplete para CR e Natureza */}
            <datalist id="cr-auto-options">
              {crList.map((item) => (
                <option key={item.codCencus} value={String(item.codCencus)}>
                  {`${item.codCencus} - ${item.descricao}`}
                </option>
              ))}
            </datalist>

            <datalist id="nat-auto-options">
              {naturezasList.map((item) => (
                <option key={item.codNat} value={String(item.codNat)}>
                  {`${item.codNat} - ${item.descricao}`}
                </option>
              ))}
            </datalist>

            {/* Seção Especial de Classificação Contábil no Topo */}
            <div className="section-card">
              <div 
                onClick={() => toggleSection('accounting')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
                title="Clique para alternar o tamanho deste bloco"
              >
                {collapsedSections.accounting ? <ChevronRight size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                <span className="section-title" style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                  Classificação Contábil (Rateio)
                </span>
              </div>
              
              {!collapsedSections.accounting && (
                <div style={{ marginTop: '0.6rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                    <div className="field-group" style={{ marginBottom: 0 }}>
                      <label className="field-label">Código CR</label>
                      <input 
                        className="field-input"
                        type="text" 
                        list="cr-auto-options"
                        placeholder="Digite código ou busque descrição..."
                        value={(formData.accountingFields as any)?.cr || ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          onInputChange(['accountingFields', 'cr'], val);
                          const match = crList.find(c => String(c.codCencus) === val || c.descricao.toLowerCase().includes(val.toLowerCase()));
                          if (match) {
                            onInputChange(['accountingFields', 'crDescription'], match.descricao);
                          }
                        }}
                      />
                      {(formData.accountingFields as any)?.crDescription && (
                        <span style={{ fontSize: '10.5px', color: '#0284c7', display: 'block', marginTop: '3px', fontWeight: 500 }} title={(formData.accountingFields as any).crDescription}>
                          {(formData.accountingFields as any).crDescription}
                        </span>
                      )}
                    </div>

                    <div className="field-group" style={{ marginBottom: 0 }}>
                      <label className="field-label">Código de Natureza</label>
                      <input 
                        className="field-input"
                        type="text" 
                        list="nat-auto-options"
                        placeholder="Digite código ou busque descrição..."
                        value={(formData.accountingFields as any)?.naturezaCode || ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          onInputChange(['accountingFields', 'naturezaCode'], val);
                          const match = naturezasList.find(n => String(n.codNat) === val || n.descricao.toLowerCase().includes(val.toLowerCase()));
                          if (match) {
                            onInputChange(['accountingFields', 'naturezaDescription'], match.descricao);
                          }
                        }}
                      />
                      {(formData.accountingFields as any)?.naturezaDescription && (
                        <span style={{ fontSize: '10.5px', color: '#0284c7', display: 'block', marginTop: '3px', fontWeight: 500 }} title={(formData.accountingFields as any).naturezaDescription}>
                          {(formData.accountingFields as any).naturezaDescription}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-label">Contrato</label>
                    <input 
                      className="field-input"
                      type="text" 
                      value={(formData.accountingFields as any)?.contract === '-' ? '0' : ((formData.accountingFields as any)?.contract || '')} 
                      onChange={(e) => onInputChange(['accountingFields', 'contract'], e.target.value)}
                    />
                  </div>

                  {/* Card de Validação Automática de Saldo do Rateio */}
                  {hasApportionment && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      backgroundColor: isApportionmentBalanced ? '#ecfdf5' : '#fef2f2',
                      border: `1px solid ${isApportionmentBalanced ? '#a7f3d0' : '#fecaca'}`,
                      borderRadius: '6px',
                      marginTop: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: isApportionmentBalanced ? '#047857' : '#b91c1c', fontWeight: 600 }}>
                        {isApportionmentBalanced ? <CheckCircle2 size={13} color="#059669" /> : <AlertCircle size={13} color="#dc2626" />}
                        <span>
                          {isApportionmentBalanced 
                            ? `Rateio: R$ ${apportionmentTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (100% alocado)` 
                            : `Atenção: Total dos Itens (R$ ${apportionmentTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) ≠ Total Fatura (R$ ${invoiceTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                          }
                        </span>
                      </div>
                      {!isApportionmentBalanced && (
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#dc2626', backgroundColor: '#fee2e2', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          Dif: R$ {Math.abs(balanceDiff).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Seção de Rateio Detalhado por Equipamento */}
            {formData.apportionment && Array.isArray(formData.apportionment) && formData.apportionment.length > 0 && (
              <div className="section-card">
                <div 
                  onClick={() => toggleSection('apportionment')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
                  title="Clique para alternar o tamanho deste bloco"
                >
                  {collapsedSections.apportionment ? <ChevronRight size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                  <span className="section-title" style={{ color: '#0f172a', fontWeight: 700, margin: 0, fontSize: '12px' }}>
                    Itens Faturados e Rateio
                  </span>
                </div>

                {!collapsedSections.apportionment && (
                  <div style={{ marginTop: '0.6rem' }}>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Esta fatura contém {formData.apportionment.length} itens detalhados com informações de séries e classificação.
                    </p>
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      style={{ 
                        width: '100%', 
                        fontSize: '11.5px', 
                        padding: '6px 12px',
                        backgroundColor: '#0284c7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        boxShadow: '0 1px 2px rgba(2, 132, 199, 0.2)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
                    >
                      Visualizar e Editar Tabela de Rateio
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Card de Trilha de Auditoria & Ciclo de Vida da Fatura */}
            <div className="section-card" style={{ marginTop: '8px' }}>
              <div 
                onClick={() => toggleSection('audit')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
                title="Clique para alternar o tamanho deste bloco"
              >
                {collapsedSections.audit ? <ChevronRight size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                <span className="section-title" style={{ color: '#0f172a', margin: 0, fontSize: '12px', fontWeight: 700 }}>
                  Auditoria & Ciclo de Vida
                </span>
              </div>

              {!collapsedSections.audit && (
                <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingBottom: '5px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Origem de Entrada:</span>
                    <span style={{ fontWeight: 600, color: isManualCapture ? '#0284c7' : '#059669' }}>
                      {isManualCapture ? 'Upload Manual' : 'Sincronização via E-mail'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingBottom: '5px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Data de Recepção:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      {selectedNote?.createdAt ? new Date(selectedNote.createdAt).toLocaleString('pt-BR') : 'Data registrada'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingBottom: '5px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Motor de IA & OCR:</span>
                    <span style={{ fontWeight: 600, color: '#7c3aed' }}>
                      Google Gemini 2.5 Flash
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Status Atual:</span>
                    <span style={{ 
                      padding: '1px 6px', 
                      borderRadius: '4px', 
                      fontWeight: 600, 
                      fontSize: '11px',
                      backgroundColor: formData?.status === 'validado' ? '#ecfdf5' : '#fffbeb',
                      color: formData?.status === 'validado' ? '#047857' : '#b45309',
                      border: `1px solid ${formData?.status === 'validado' ? '#a7f3d0' : '#fde68a'}`
                    }}>
                      {formData?.status === 'validado' ? 'Validado para Zeev' : 'Pendente'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {renderRecursiveFields(formData)}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '6rem' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>Selecione uma fatura na lista lateral para iniciar a curadoria.</p>
          </div>
        )}
      </div>

      <div className="action-bar" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '10px', 
        padding: '0.85rem 1.25rem', 
        maxWidth: '100%', 
        boxSizing: 'border-box'
      }}>
        {/* Reprocessar (Ação Secundária com Contorno) */}
        <button 
          className="btn btn-outline" 
          onClick={() => {
            setActiveAction('reprocess');
            onReprocess();
          }}
          disabled={loading || !selectedNote || userRole !== 'ADMIN'}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '6px', 
            flex: '0 0 auto',
            padding: '0.6rem 0.85rem',
            fontSize: '0.8rem',
            borderRadius: '6px',
            borderColor: userRole !== 'ADMIN' ? '#e5e7eb' : '#cbd5e1',
            backgroundColor: userRole !== 'ADMIN' ? '#f1f5f9' : '#ffffff',
            color: userRole !== 'ADMIN' ? '#9ca3af' : '#475569',
            cursor: userRole !== 'ADMIN' ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (userRole === 'ADMIN') {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#94a3b8';
            }
          }}
          onMouseOut={(e) => {
            if (userRole === 'ADMIN') {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }
          }}
          title={userRole !== 'ADMIN' ? 'Apenas administradores podem reprocessar OCR' : 'Reprocessar OCR Google Gemini'}
        >
          <RefreshCcw size={14} className={loading && activeAction === 'reprocess' ? 'animate-spin' : ''} />
          {loading && activeAction === 'reprocess' ? 'Reprocessando...' : 'Reprocessar'}
        </button>

        {/* Salvar (Ação Secundária) */}
        <button 
          className="btn btn-outline" 
          onClick={() => {
            setActiveAction('save');
            onSave();
          }}
          disabled={loading || !selectedNote}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '6px', 
            flex: '0 0 auto',
            padding: '0.6rem 1rem',
            fontSize: '0.8rem',
            borderRadius: '6px',
            borderColor: '#cbd5e1',
            backgroundColor: '#ffffff',
            color: '#334155',
            fontWeight: 600
          }}
        >
          {loading && activeAction === 'save' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {loading && activeAction === 'save' ? 'Salvando...' : 'Salvar'}
        </button>

        {/* Aprovar (Ação Primária com Destaque Dourado/Verde) */}
        {formData?.status === 'validado' ? (
          <button 
            className="btn btn-outline" 
            style={{
              borderColor: '#f97316',
              color: '#ea580c',
              backgroundColor: '#fff7ed',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              flex: '0 0 auto',
              padding: '0.6rem 1.15rem',
              fontSize: '0.8rem',
              borderRadius: '6px',
              fontWeight: 600
            }}
            onClick={() => {
              setActiveAction('reopen');
              onSave('pendente');
            }}
            disabled={loading || !selectedNote}
            title="Mudar o status da fatura de volta para Pendente para revisão"
          >
            <RefreshCcw size={14} className={loading && activeAction === 'reopen' ? 'animate-spin' : ''} />
            {loading && activeAction === 'reopen' ? 'Reabrindo...' : 'Reabrir Fatura'}
          </button>
        ) : (
          <button 
            className="btn btn-approve" 
            onClick={() => {
              setActiveAction('approve');
              onSave('validado');
            }}
            disabled={loading || !selectedNote}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px', 
              flex: '0 0 auto',
              padding: '0.6rem 1.25rem',
              fontSize: '0.8rem',
              borderRadius: '6px',
              backgroundColor: '#059669',
              color: 'white',
              fontWeight: 600
            }}
          >
            {loading && activeAction === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {loading && activeAction === 'approve' ? 'Aprovando...' : 'Aprovar'}
          </button>
        )}
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
            Aviso: O processamento de dados e rateios é realizado por inteligência artificial. É indispensável revisar e validar os campos antes de aprovar a fatura.
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
            
            <div className="modal-search-bar" style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)', background: '#f9fafb', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
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

              {hasApportionment && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  backgroundColor: isApportionmentBalanced ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${isApportionmentBalanced ? '#a7f3d0' : '#fecaca'}`,
                  borderRadius: '6px',
                  fontSize: '0.73rem',
                  fontWeight: 600,
                  color: isApportionmentBalanced ? '#047857' : '#b91c1c',
                  whiteSpace: 'nowrap'
                }}>
                  {isApportionmentBalanced ? <CheckCircle2 size={14} color="#059669" /> : <AlertCircle size={14} color="#dc2626" />}
                  <span>
                    {isApportionmentBalanced ? 'Rateio 100% Ok' : `Dif: R$ ${Math.abs(balanceDiff).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              )}
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
                            list="cr-auto-options"
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
                            list="nat-auto-options"
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
                            placeholder={(formData.accountingFields?.contract && formData.accountingFields?.contract !== '-') ? formData.accountingFields?.contract : '0'}
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