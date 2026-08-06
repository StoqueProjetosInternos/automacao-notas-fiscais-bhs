import React from 'react';
import { FileSpreadsheet, Download, X, FileText, CheckCircle2, Building2, Tag, Hash } from 'lucide-react';
import type { Note } from '../types';

interface RateioPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNote: Note | null;
  onDownload: () => void;
}

export const RateioPreviewModal: React.FC<RateioPreviewModalProps> = ({
  isOpen,
  onClose,
  selectedNote,
  onDownload
}) => {
  if (!isOpen || !selectedNote) return null;

  const data = selectedNote.data;
  const accounting = data.accountingFields || {};
  const items = data.apportionment || [];
  const supplierName = data.supplier?.name || 'Fornecedor não identificado';
  const docNumber = data.documentIdentifiers?.documentNumber || selectedNote.id;
  const totalValue = data.financial?.originalValue || data.valorTotal || 0;

  return (
    <div 
      className="modal-overlay fade-in" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem'
      }}
    >
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Cabeçalho do Modal */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to right, #f8fafc, #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={22} color="#059669" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Pré-visualização do Rateio Contábil
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Fatura <strong style={{ color: '#334155' }}>{selectedNote.id}</strong> — Confira as alocações e séries antes de realizar o download.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
              title="Fechar visualização"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Corpo do Modal - Conteúdo Rolável */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
          
          {/* Cards de Resumo Executivo */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: '#ffffff',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <Building2 size={13} color="#2563eb" />
                Fornecedor
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={supplierName}>
                {supplierName}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <FileText size={13} color="#0284c7" />
                Nº Documento / Nota
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                {docNumber}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <Tag size={13} color="#16a34a" />
                Valor Total da Fatura
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <Hash size={13} color="#9333ea" />
                Classificação Padrão
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginTop: '4px' }}>
                CR: {accounting.cr || '-'} | Nat: {accounting.naturezaCode || '-'}
              </div>
            </div>
          </div>

          {/* Tabela de Itens e Alocação */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f1f5f9',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Itens de Rateio ({items.length})
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Planilha Excel
              </span>
            </div>

            {items.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 700, width: '40px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Descrição do Item</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, width: '50px', textAlign: 'center' }}>Qtd</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, width: '100px', textAlign: 'right' }}>Valor Unit.</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, width: '100px', textAlign: 'right' }}>Valor Total</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, width: '90px' }}>CR</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, width: '90px' }}>Natureza</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, width: '100px' }}>Contrato</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, width: '120px' }}>Nº de Série</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, index: number) => (
                      <tr 
                        key={index} 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#1e293b', fontWeight: 500, maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>
                          {item.description || 'Item sem descrição'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#334155' }}>
                          {item.quantity || 1}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#334155' }}>
                          {item.unitValue ? item.unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f766e', fontWeight: 600 }}>
                          {item.value ? item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#334155', fontWeight: 600 }}>
                          <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {item.cr || accounting.cr || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#334155', fontWeight: 600 }}>
                          <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {item.naturezaCode || accounting.naturezaCode || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>
                          {(item.contract && item.contract !== '-') ? item.contract : ((accounting.contract && accounting.contract !== '-') ? accounting.contract : '0')}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#1d4ed8', fontWeight: 500, fontFamily: 'monospace', fontSize: '0.72rem' }}>
                          {item.serialNumber || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Nenhum item detalhado encontrado nesta fatura.</p>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#059669' }}>
            <CheckCircle2 size={15} />
            <span>Processado via IA com regras de rateio</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
            <button
              onClick={onDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#10b981'; }}
            >
              <Download size={15} />
              Baixar Planilha (.xlsx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
