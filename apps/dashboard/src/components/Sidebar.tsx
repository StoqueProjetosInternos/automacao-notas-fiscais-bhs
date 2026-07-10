import { useState } from 'react';
import { Search, Trash2, Archive, Upload } from 'lucide-react';
import type { Note } from '../types';

interface SidebarProps {
  notes: Note[];
  selectedNoteId?: string;
  onSelectNote: (note: Note | null) => void;
  onDeleteNote: (id: string) => Promise<void>;
  onArchiveNote: (id: string) => Promise<void>;
  onUnarchiveNote: (id: string) => Promise<void>;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  userRole: string;
  onImportClick: () => void;
  style?: React.CSSProperties;
}

type SortOption = 'name-asc' | 'name-desc' | 'val-asc' | 'val-desc' | 'date-asc' | 'recent';

const formatValue = (val: any): string => {
  if (val === undefined || val === null || val === '') return '0,00';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (isoStr?: string): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
};

export const Sidebar = ({ 
  notes, 
  selectedNoteId, 
  onSelectNote, 
  onDeleteNote,
  onArchiveNote,
  onUnarchiveNote,
  searchTerm, 
  onSearchChange,
  userRole,
  onImportClick,
  style
}: SidebarProps) => {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [noteIdDeleting, setNoteIdDeleting] = useState<string | null>(null);
  const [noteIdArchiving, setNoteIdArchiving] = useState<string | null>(null);
  const itemsPerPage = 10;
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Gerenciamento síncrono de reset de página quando a busca ou ordenação mudam
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);
  const [prevSortBy, setPrevSortBy] = useState(sortBy);

  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm);
    setCurrentPage(1);
  }
  if (sortBy !== prevSortBy) {
    setPrevSortBy(sortBy);
    setCurrentPage(1);
  }
  
  const filteredNotes = notes.filter(n => {
    const isNoteArchived = n.data.status === 'arquivado';
    if (showArchived !== isNoteArchived) return false;

    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const idMatches = n.id.toLowerCase().includes(term);
    const fileNameMatches = n.fileName ? n.fileName.toLowerCase().includes(term) : false;
    
    const supplierNameMatches = n.data.supplier?.name ? n.data.supplier.name.toLowerCase().includes(term) : false;
    const supplierCnpjMatches = n.data.supplier?.cnpjCpf ? n.data.supplier.cnpjCpf.toLowerCase().includes(term) : false;
    
    const payerNameMatches = n.data.payer?.name ? n.data.payer.name.toLowerCase().includes(term) : false;
    const payerCnpjMatches = n.data.payer?.cnpjCpf ? n.data.payer.cnpjCpf.toLowerCase().includes(term) : false;
    
    const beneficiaryNameMatches = n.data.beneficiary?.name ? n.data.beneficiary.name.toLowerCase().includes(term) : false;
    
    const dueDateMatches = n.data.financial?.dueDate ? n.data.financial.dueDate.toLowerCase().includes(term) : false;
    const issueDateMatches = n.data.financial?.issueDate ? n.data.financial.issueDate.toLowerCase().includes(term) : false;
    const competenceDateMatches = n.data.financial?.competenceDate ? n.data.financial.competenceDate.toLowerCase().includes(term) : false;
    
    const docNumMatches = n.data.documentIdentifiers?.documentNumber ? n.data.documentIdentifiers.documentNumber.toLowerCase().includes(term) : false;
    const ourNumMatches = n.data.documentIdentifiers?.ourNumber ? n.data.documentIdentifiers.ourNumber.toLowerCase().includes(term) : false;

    return (
      idMatches ||
      fileNameMatches ||
      supplierNameMatches ||
      supplierCnpjMatches ||
      payerNameMatches ||
      payerCnpjMatches ||
      beneficiaryNameMatches ||
      dueDateMatches ||
      issueDateMatches ||
      competenceDateMatches ||
      docNumMatches ||
      ourNumMatches
    );
  });

  // Função utilitária para converter data brasileira (DD/MM/AAAA) para milissegundos
  const parseDate = (dateStr?: string): number => {
    if (!dateStr) return Infinity; // Notas sem vencimento vão para o final
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? Infinity : d.getTime();
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? Infinity : d.getTime();
  };

  // Ordena a lista com base no critério selecionado
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'recent') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    }
    if (sortBy === 'name-asc') {
      return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (sortBy === 'name-desc') {
      return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (sortBy === 'val-asc') {
      const valA = Number(a.data.financial?.originalValue || a.data.valorTotal || 0);
      const valB = Number(b.data.financial?.originalValue || b.data.valorTotal || 0);
      return valA - valB;
    }
    if (sortBy === 'val-desc') {
      const valA = Number(a.data.financial?.originalValue || a.data.valorTotal || 0);
      const valB = Number(b.data.financial?.originalValue || b.data.valorTotal || 0);
      return valB - valA;
    }
    if (sortBy === 'date-asc') {
      const dateA = parseDate(a.data.financial?.dueDate);
      const dateB = parseDate(b.data.financial?.dueDate);
      return dateA - dateB;
    }
    return 0;
  });

  // Cálculos de paginação
  const totalItems = sortedNotes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentPageSafe = Math.min(currentPage, totalPages);
  const indexOfLastItem = currentPageSafe * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotes = sortedNotes.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <aside className="sidebar" style={style}>
      <div className="sidebar-header">
        <button 
          onClick={onImportClick}
          className="btn"
          style={{ 
            width: '100%', 
            marginBottom: '0.75rem',
            padding: '8px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)',
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
          title="Importar fatura PDF manualmente"
        >
          <Upload size={13} />
          Importar Fatura PDF
        </button>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
          <button 
            onClick={() => {
              setShowArchived(false);
              onSelectNote(null);
            }} 
            style={{ 
              flex: 1, 
              padding: '8px', 
              background: !showArchived ? '#f3f4f6' : 'transparent',
              border: 'none',
              fontWeight: !showArchived ? 700 : 500,
              color: !showArchived ? '#2563eb' : '#6b7280',
              borderBottom: !showArchived ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            Ativas
          </button>
          <button 
            onClick={() => {
              setShowArchived(true);
              onSelectNote(null);
            }} 
            style={{ 
              flex: 1, 
              padding: '8px', 
              background: showArchived ? '#f3f4f6' : 'transparent',
              border: 'none',
              fontWeight: showArchived ? 700 : 500,
              color: showArchived ? '#2563eb' : '#6b7280',
              borderBottom: showArchived ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            Arquivadas
          </button>
        </div>
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: '#9ca3af' }} />
          <input 
            className="search-box" 
            placeholder="Pesquisar arquivos..." 
            style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Ordenar:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="sort-select"
            style={{ 
              flex: 1, 
              minWidth: 0,
              width: '100%',
              padding: '0.25rem 0.5rem', 
              fontSize: '0.75rem', 
              borderRadius: '0.375rem', 
              border: '1px solid #d1d5db', 
              backgroundColor: '#fff',
              color: '#374151',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="recent">Mais Recentes</option>
            <option value="name-asc">Nome do Arquivo (A-Z)</option>
            <option value="name-desc">Nome do Arquivo (Z-A)</option>
            <option value="val-desc">Valor (Maior primeiro)</option>
            <option value="val-asc">Valor (Menor primeiro)</option>
            <option value="date-asc">Vencimento (Mais próximo)</option>
          </select>
        </div>

        {/* Contador de Documentos */}
        <div style={{ 
          marginTop: '0.75rem',
          padding: '0.375rem 0.5rem', 
          fontSize: '0.7rem', 
          color: '#4b5563', 
          backgroundColor: '#f3f4f6',
          borderRadius: '0.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 500
        }}>
          <span>Total: {notes.filter(n => showArchived ? n.data.status === 'arquivado' : n.data.status !== 'arquivado').length}</span>
          <span>
            {totalItems === 0 
              ? "Nenhum encontrado" 
              : `Filtrados: ${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, totalItems)} de ${totalItems}`
            }
          </span>
        </div>
      </div>

      <div className="note-list">
        {currentNotes.map((note, idx) => {
          const absoluteIndex = indexOfFirstItem + idx + 1;
          const isConfirmingDelete = noteIdDeleting === note.id;
          const isConfirmingArchive = noteIdArchiving === note.id;

          return (
            <div 
              key={note.id} 
              className={`note-item ${selectedNoteId === note.id ? 'active' : ''}`}
              onClick={() => !isConfirmingDelete && !isConfirmingArchive && onSelectNote(note)}
            >
              {isConfirmingDelete ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 600 }}>Excluir esta fatura permanentemente?</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={async () => {
                        await onDeleteNote(note.id);
                        setNoteIdDeleting(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        fontSize: '0.65rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => setNoteIdDeleting(null)}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        fontSize: '0.65rem',
                        background: '#e5e7eb',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : isConfirmingArchive ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: '0.7rem', color: note.data.status === 'arquivado' ? '#059669' : '#1e40af', fontWeight: 600 }}>
                    {note.data.status === 'arquivado' ? 'Desarquivar esta fatura?' : 'Arquivar esta fatura?'}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={async () => {
                        if (note.data.status === 'arquivado') {
                          await onUnarchiveNote(note.id);
                        } else {
                          await onArchiveNote(note.id);
                        }
                        setNoteIdArchiving(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        fontSize: '0.65rem',
                        background: note.data.status === 'arquivado' ? '#10b981' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {note.data.status === 'arquivado' ? 'Desarquivar' : 'Arquivar'}
                    </button>
                    <button
                      onClick={() => setNoteIdArchiving(null)}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        fontSize: '0.65rem',
                        background: '#e5e7eb',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Nome do Fornecedor em Destaque + Lixeira */}
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '3px'
                  }}>
                    <div style={{ 
                       fontSize: '0.75rem', 
                       fontWeight: 700,
                       color: selectedNoteId === note.id ? '#1e40af' : '#111827', 
                       whiteSpace: 'nowrap',
                       overflow: 'hidden',
                       textOverflow: 'ellipsis',
                       flex: 1
                    }} title={note.data.supplier?.name || 'Fornecedor não identificado'}>
                      {absoluteIndex} - {note.data.supplier?.name || 'Fornecedor Não Identificado'}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        className="archive-btn-container"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteIdArchiving(note.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          outline: 'none'
                        }}
                        data-tooltip={note.data.status === 'arquivado' ? "Desarquivar fatura" : "Arquivar fatura"}
                      >
                        <Archive size={13} color={note.data.status === 'arquivado' ? "#10b981" : "#2563eb"} />
                      </button>
                      {userRole === 'ADMIN' && (
                        <button
                          className="delete-btn-container"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteIdDeleting(note.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            outline: 'none'
                          }}
                          data-tooltip="Excluir fatura"
                        >
                          <Trash2 size={13} color="#ef4444" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Nome do Arquivo como tag secundária */}
                  <div style={{ 
                    fontSize: '0.65rem', 
                    color: selectedNoteId === note.id ? '#2563eb' : '#6b7280', 
                    background: selectedNoteId === note.id ? '#eff6ff' : '#f9fafb', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    display: 'inline-block',
                    maxWidth: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '6px',
                    border: `1px solid ${selectedNoteId === note.id ? '#bfdbfe' : '#e5e7eb'}`
                  }} title={note.id}>
                    {note.id}
                  </div>

                  {note.createdAt && (
                    <div style={{ 
                      fontSize: '0.65rem', 
                      color: '#6b7280', 
                      marginBottom: '6px'
                    }}>
                      <span style={{ fontWeight: 500 }}>Importado em:</span> {formatDate(note.createdAt)}
                    </div>
                  )}

                  <div className="note-item-meta">
                    <span>
                      <span className={`status-dot status-${note.data.status || 'pendente'}`} />
                      {note.data.status || 'pendente'}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      R$ {formatValue(note.data.financial?.originalValue || note.data.valorTotal)}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Navegação de Paginação */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0.75rem 1rem', 
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          flexShrink: 0
        }}>
          <button 
            disabled={currentPageSafe === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: currentPageSafe === 1 ? '#f3f4f6' : '#fff',
              color: currentPageSafe === 1 ? '#9ca3af' : '#374151',
              cursor: currentPageSafe === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
          >
            Anterior
          </button>
          <span style={{ fontSize: '0.7rem', color: '#4b5563', fontWeight: 500 }}>
            Pág. {currentPageSafe} de {totalPages}
          </span>
          <button 
            disabled={currentPageSafe === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: currentPageSafe === totalPages ? '#f3f4f6' : '#fff',
              color: currentPageSafe === totalPages ? '#9ca3af' : '#374151',
              cursor: currentPageSafe === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
          >
            Próximo
          </button>
        </div>
      )}
    </aside>
  );
};
