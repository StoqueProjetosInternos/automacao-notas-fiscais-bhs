import React, { useState } from 'react';
import { Search, Trash2, Archive, Upload, Mail, CheckCircle2, AlertCircle, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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

const renderStatusBadge = (status?: string) => {
  const st = (status || 'pendente').toLowerCase();
  if (st === 'validado') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.66rem',
        fontWeight: 700,
        color: '#047857',
        backgroundColor: '#ecfdf5',
        border: '1px solid #a7f3d0',
        padding: '2px 8px',
        borderRadius: '12px'
      }}>
        <CheckCircle2 size={11} color="#059669" />
        Validado
      </span>
    );
  }
  if (st === 'erro' || st === 'error') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.66rem',
        fontWeight: 700,
        color: '#b91c1c',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        padding: '2px 8px',
        borderRadius: '12px'
      }}>
        <AlertCircle size={11} color="#dc2626" />
        Erro
      </span>
    );
  }
  if (st === 'arquivado') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.66rem',
        fontWeight: 600,
        color: '#475569',
        backgroundColor: '#f1f5f9',
        border: '1px solid #cbd5e1',
        padding: '2px 8px',
        borderRadius: '12px'
      }}>
        <Archive size={11} color="#64748b" />
        Arquivado
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '0.66rem',
      fontWeight: 700,
      color: '#b45309',
      backgroundColor: '#fef3c7',
      border: '1px solid #fde68a',
      padding: '2px 8px',
      borderRadius: '12px'
    }}>
      <Clock size={11} color="#b45309" />
      Pendente
    </span>
  );
};

const renderSourceBadge = (fileName?: string) => {
  const isManual = fileName?.startsWith('manual_');
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      fontSize: '0.64rem',
      fontWeight: 500,
      color: '#475569',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      padding: '1px 5px',
      borderRadius: '4px'
    }}>
      {isManual ? <Upload size={10} color="#64748b" /> : <Mail size={10} color="#64748b" />}
      {isManual ? 'Manual' : 'E-mail'}
    </span>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ 
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
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [noteIdDeleting, setNoteIdDeleting] = useState<string | null>(null);
  const [noteIdArchiving, setNoteIdArchiving] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Gerenciamento síncrono de reset de página quando a busca, ordenação ou aba mudam
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);
  const [prevSortBy, setPrevSortBy] = useState(sortBy);
  const [prevShowArchived, setPrevShowArchived] = useState(showArchived);

  // Mapeia o ID permanente sequencial de cada nota em ordem cronológica de criação (1, 2, 3...)
  const chronologicalIdMap = React.useMemo(() => {
    const sorted = [...notes].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

    const map = new Map<string, number>();
    sorted.forEach((note, index) => {
      map.set(note.id, index + 1);
    });
    return map;
  }, [notes]);

  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm);
    setCurrentPage(1);
  }
  if (sortBy !== prevSortBy) {
    setPrevSortBy(sortBy);
    setCurrentPage(1);
  }
  if (showArchived !== prevShowArchived) {
    setPrevShowArchived(showArchived);
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

  const parseDate = (dateStr?: string): number => {
    if (!dateStr) return Infinity;
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

  const totalItems = sortedNotes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentPageSafe = Math.min(currentPage, totalPages);
  const indexOfLastItem = currentPageSafe * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotes = sortedNotes.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <aside className="sidebar" style={style}>
      <div className="sidebar-header" style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <button 
          onClick={onImportClick}
          className="btn"
          style={{ 
            width: '100%', 
            marginBottom: '0.85rem',
            padding: '9px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #2FC808 0%, #26a306 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(47, 200, 8, 0.3)',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.08)'}
          onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
          title="Importar fatura PDF manualmente"
        >
          <Upload size={14} />
          Importar Fatura PDF
        </button>

        {/* Abas Pílulas de Navegação */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f1f5f9',
          borderRadius: '8px',
          padding: '3px',
          marginBottom: '0.85rem'
        }}>
          <button 
            onClick={() => {
              setShowArchived(false);
              onSelectNote(null);
            }} 
            style={{ 
              flex: 1, 
              padding: '6px 10px', 
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.73rem',
              fontWeight: !showArchived ? 700 : 500,
              color: !showArchived ? '#1e293b' : '#64748b',
              backgroundColor: !showArchived ? '#ffffff' : 'transparent',
              boxShadow: !showArchived ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Faturas Ativas
          </button>
          <button 
            onClick={() => {
              setShowArchived(true);
              onSelectNote(null);
            }} 
            style={{ 
              flex: 1, 
              padding: '6px 10px', 
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.73rem',
              fontWeight: showArchived ? 700 : 500,
              color: showArchived ? '#1e293b' : '#64748b',
              backgroundColor: showArchived ? '#ffffff' : 'transparent',
              boxShadow: showArchived ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Arquivadas
          </button>
        </div>

        {/* Campo de Pesquisa */}
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
          <input 
            className="search-box" 
            placeholder="Pesquisar por fornecedor, nota ou valor..." 
            style={{ 
              width: '100%',
              paddingLeft: '2.25rem', 
              paddingRight: '2.25rem',
              paddingTop: '0.55rem',
              paddingBottom: '0.55rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.76rem'
            }}
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
                color: '#94a3b8',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '2px'
              }}
              title="Limpar busca"
            >
              &times;
            </button>
          )}
        </div>

        {/* Ordenação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Ordem:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{ 
              flex: 1, 
              minWidth: 0,
              padding: '0.35rem 0.5rem', 
              fontSize: '0.73rem', 
              borderRadius: '6px', 
              border: '1px solid #cbd5e1', 
              backgroundColor: '#fff',
              color: '#334155',
              fontWeight: 500,
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

        {/* Resumo do Contador */}
        <div style={{ 
          marginTop: '0.75rem',
          padding: '0.4rem 0.6rem', 
          fontSize: '0.68rem', 
          color: '#475569', 
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600
        }}>
          <span>Total: {notes.filter(n => showArchived ? n.data.status === 'arquivado' : n.data.status !== 'arquivado').length} faturas</span>
          <span style={{ color: '#0284c7' }}>
            {totalItems === 0 
              ? "Sem resultados" 
              : `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, totalItems)} de ${totalItems}`
            }
          </span>
        </div>
      </div>

      {/* Lista de Cards Compactos de Faturas */}
      <div className="note-list" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto', flex: 1 }}>
        {currentNotes.map((note, idx) => {
          const displaySeqId = chronologicalIdMap.get(note.id) || (indexOfFirstItem + idx + 1);
          const isSelected = selectedNoteId === note.id;
          const isConfirmingDelete = noteIdDeleting === note.id;
          const isConfirmingArchive = noteIdArchiving === note.id;
          const supplierName = note.data.supplier?.name || 'Fornecedor não identificado';
          const value = note.data.financial?.originalValue || note.data.valorTotal;
          const docType = note.data.documentType || (note.data.documentIdentifiers as any)?.documentType || 'Fatura';
          const status = note.data.status || 'pendente';

          // Define a cor da borda de acento lateral com base no estado
          let accentColor = '#3b82f6';
          if (status === 'validado') accentColor = '#10b981';
          else if (status === 'erro' || status === 'error') accentColor = '#ef4444';
          else if (status === 'pendente') accentColor = '#f59e0b';
          if (isSelected) accentColor = '#0284c7';

          return (
            <div 
              key={note.id} 
              onClick={() => !isConfirmingDelete && !isConfirmingArchive && onSelectNote(note)}
              style={{
                backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                border: `1px solid ${isSelected ? '#bae6fd' : '#e2e8f0'}`,
                borderLeft: `3px solid ${accentColor}`,
                borderRadius: '8px',
                padding: '7px 9px',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }
              }}
            >
              {isConfirmingDelete ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 600 }}>Excluir esta fatura permanentemente?</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={async () => {
                        await onDeleteNote(note.id);
                        setNoteIdDeleting(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '3px 6px',
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
                        padding: '3px 6px',
                        fontSize: '0.65rem',
                        background: '#e2e8f0',
                        color: '#334155',
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: '0.7rem', color: status === 'arquivado' ? '#059669' : '#1d4ed8', fontWeight: 600 }}>
                    {status === 'arquivado' ? 'Desarquivar esta fatura?' : 'Arquivar esta fatura?'}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={async () => {
                        if (status === 'arquivado') {
                          await onUnarchiveNote(note.id);
                        } else {
                          await onArchiveNote(note.id);
                        }
                        setNoteIdArchiving(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '3px 6px',
                        fontSize: '0.65rem',
                        background: status === 'arquivado' ? '#10b981' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {status === 'arquivado' ? 'Desarquivar' : 'Arquivar'}
                    </button>
                    <button
                      onClick={() => setNoteIdArchiving(null)}
                      style={{
                        flex: 1,
                        padding: '3px 6px',
                        fontSize: '0.65rem',
                        background: '#e2e8f0',
                        color: '#334155',
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
                  {/* Linha 1: Índice + Fornecedor + Botões de Ação */}
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '3px'
                  }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      color: isSelected ? '#0369a1' : '#0f172a', 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }} title={supplierName}>
                      <span style={{ 
                        fontSize: '0.6rem', 
                        fontWeight: 800, 
                        color: '#64748b',
                        backgroundColor: '#f1f5f9',
                        padding: '1px 4px',
                        borderRadius: '3px'
                      }}>
                        #{displaySeqId}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {supplierName}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteIdArchiving(note.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '1px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: status === 'arquivado' ? "#10b981" : "#94a3b8",
                          transition: 'color 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = status === 'arquivado' ? '#059669' : '#2563eb';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = status === 'arquivado' ? '#10b981' : '#94a3b8';
                        }}
                        title={status === 'arquivado' ? "Desarquivar fatura" : "Arquivar fatura"}
                      >
                        <Archive size={12} />
                      </button>
                      {userRole === 'ADMIN' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteIdDeleting(note.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '1px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: "#94a3b8"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                          title="Excluir fatura"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Linha 2: Tags de Origem (E-mail / Upload) e Tipo de Documento */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    marginBottom: '4px',
                    flexWrap: 'wrap'
                  }}>
                    {renderSourceBadge(note.fileName)}
                    <span style={{ 
                      fontSize: '0.64rem', 
                      fontWeight: 500,
                      color: isSelected ? '#0284c7' : '#475569', 
                      backgroundColor: isSelected ? '#e0f2fe' : '#f8fafc',
                      border: `1px solid ${isSelected ? '#bae6fd' : '#e2e8f0'}`,
                      padding: '1px 5px', 
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '170px'
                    }} title={`Tipo de Documento: ${docType}`}>
                      {docType}
                    </span>
                  </div>

                  {/* Linha 3: Data de Importação */}
                  {note.createdAt && (
                    <div style={{ 
                      fontSize: '0.63rem', 
                      color: '#64748b', 
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 500
                    }}>
                      <Calendar size={10} color="#94a3b8" />
                      <span>{formatDate(note.createdAt)}</span>
                    </div>
                  )}

                  {/* Linha 3 (Rodapé do Card): Badge de Status + Valor Financeiro em Destaque */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '4px',
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    {renderStatusBadge(status)}
                    <div style={{ 
                      fontSize: '0.78rem', 
                      fontWeight: 700, 
                      color: '#334155'
                    }}>
                      R$ {formatValue(value)}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Navegação de Paginação */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        padding: '0.75rem 0.85rem', 
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        boxSizing: 'border-box',
        width: '100%',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ 
            fontSize: '0.72rem', 
            color: '#475569', 
            fontWeight: 600,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '2px 10px',
            borderRadius: '12px'
          }}>
            Página {currentPageSafe} de {totalPages}
          </div>

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              padding: '2px 6px',
              fontSize: '0.7rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              fontWeight: 600,
              outline: 'none'
            }}
            title="Quantidade de faturas por página"
          >
            <option value={5}>5 / pág</option>
            <option value={10}>10 / pág</option>
            <option value={20}>20 / pág</option>
            <option value={50}>50 / pág</option>
          </select>
        </div>

        <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
          <button 
            disabled={currentPageSafe <= 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0.42rem 0.5rem',
              fontSize: '0.74rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: currentPageSafe <= 1 ? '#f8fafc' : '#ffffff',
              color: currentPageSafe <= 1 ? '#94a3b8' : '#334155',
              cursor: currentPageSafe <= 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <ChevronLeft size={14} />
            Anterior
          </button>

          <button 
            disabled={currentPageSafe >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0.42rem 0.5rem',
              fontSize: '0.74rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: currentPageSafe >= totalPages ? '#f8fafc' : '#ffffff',
              color: currentPageSafe >= totalPages ? '#94a3b8' : '#334155',
              cursor: currentPageSafe >= totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            Próximo
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
