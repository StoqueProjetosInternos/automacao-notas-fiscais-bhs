import { useState, useEffect, useRef } from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { DocumentViewer } from '../../components/DocumentViewer';
import { DataEditor } from '../../components/DataEditor';
import { fetchNotes, updateNote, reprocessNotes, fetchUsageLog, deleteNote, syncEmails, fetchApiLogs, sendDeadlineAlerts, type UsageLog } from '../../services/api';
import type { Note, NoteData } from '../../types';
import { ArrowLeft, RefreshCcw, Loader2 } from 'lucide-react';
import { useActivityTimeout } from '../../hooks/useActivityTimeout';
import baseFornecedores from '../../assets/base_fornecedores_faturas.json';

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
  const [activeTab, setActiveTab] = useState<'notes' | 'history' | 'logs' | 'deadlines'>('notes');
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [apiLogs, setApiLogs] = useState<string>('');
  const [loadingApiLogs, setLoadingApiLogs] = useState(false);

  // Estados para Filtros e Paginação do Histórico
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyModelFilter, setHistoryModelFilter] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [historyFileStatusFilter, setHistoryFileStatusFilter] = useState('');
  const [historyAiStatusFilter, setHistoryAiStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Estados de Paginação para Aba de Prazos
  const [deadlinesCurrentPage, setDeadlinesCurrentPage] = useState(1);
  const deadlinesRecordsPerPage = 10;

  // Estados de Edição Inline de Vencimentos
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');
  const [mockOverrides, setMockOverrides] = useState<Record<string, string>>({});

  // Estados de Filtro e Ordenação da Aba de Prazos
  const [deadlineStatusFilter, setDeadlineStatusFilter] = useState<'all' | 'critical' | 'alert' | 'normal'>('all');
  const [deadlineSortField, setDeadlineSortField] = useState<'fornecedor' | 'valor' | 'vencimento' | 'diasRestantes'>('diasRestantes');
  const [deadlineSortOrder, setDeadlineSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deadlineSearchSupplier, setDeadlineSearchSupplier] = useState('');
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Monitor de Inatividade de 15 Minutos (se inativo, chama logout)
  useActivityTimeout(onLogout, 15 * 60 * 1000);

  useEffect(() => {
    setCurrentPage(1);
  }, [historySearchTerm, historyModelFilter, historyDateFilter, historyFileStatusFilter, historyAiStatusFilter]);

  useEffect(() => {
    setDeadlinesCurrentPage(1);
  }, [notes]);

  useEffect(() => {
    setDeadlinesCurrentPage(1);
  }, [deadlineStatusFilter, deadlineSortField, deadlineSortOrder, deadlineSearchSupplier]);

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

    let matchesFileStatus = true;
    if (historyFileStatusFilter) {
      const fileStatus = log.statusArquivo || 'Pendente';
      matchesFileStatus = fileStatus === historyFileStatusFilter;
    }

    let matchesAiStatus = true;
    if (historyAiStatusFilter) {
      const aiStatus = log.status || 'Sucesso';
      matchesAiStatus = aiStatus === historyAiStatusFilter;
    }
    
    return matchesSearch && matchesModel && matchesDate && matchesFileStatus && matchesAiStatus;
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
      // Atraso artificial de 800ms para simular o carregamento e dar feedback visual ao usuário
      await new Promise(resolve => setTimeout(resolve, 800));
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

    // Cria a data candidata para o mês e ano vigentes
    let candidateDate = new Date(hoje.getFullYear(), hoje.getMonth(), diaOriginal);

    // Ajusta o dia se estourar o limite de dias do mês (ex: 31 de fevereiro)
    if (candidateDate.getMonth() !== hoje.getMonth()) {
      candidateDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    }

    // Se a data de vencimento deste mês já passou, projeta para o próximo mês
    if (candidateDate.getTime() < hoje.getTime()) {
      let nextMonth = hoje.getMonth() + 1;
      let nextYear = hoje.getFullYear();
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      }
      candidateDate = new Date(nextYear, nextMonth, diaOriginal);
      
      // Ajusta o dia se estourar o limite do próximo mês (ex: 31 de novembro)
      if (candidateDate.getMonth() !== nextMonth) {
        candidateDate = new Date(nextYear, nextMonth + 1, 0);
      }
    }

    const dd = String(candidateDate.getDate()).padStart(2, '0');
    const mm = String(candidateDate.getMonth() + 1).padStart(2, '0');
    const yyyy = candidateDate.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
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

  const handleSortDeadlines = (field: 'fornecedor' | 'valor' | 'vencimento' | 'diasRestantes') => {
    if (deadlineSortField === field) {
      setDeadlineSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setDeadlineSortField(field);
      setDeadlineSortOrder('asc');
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
        const refreshedNotes = await fetchNotes();
        setNotes(refreshedNotes);
      } catch (error) {
        console.error('Erro ao atualizar vencimento da nota:', error);
        showToast('Falha ao atualizar a data de vencimento no servidor.', 'error');
      }
    }
    setEditingItemId(null);
  };

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

  const handleDeleteApportionmentRow = (index: number) => {
    if (!formData || !formData.apportionment) return;
    const newApportionment = [...formData.apportionment];
    newApportionment.splice(index, 1);
    setFormData({
      ...formData,
      apportionment: newApportionment
    });
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
    setShowLogoutModal(true);
  };

  const confirmLogoutAction = () => {
    setShowLogoutModal(false);
    showToast('Obrigado por utilizar o Fiscal Intelligence (SFI). Até logo!', 'success');
    setTimeout(() => {
      onLogout();
    }, 1500);
  };

  // Computação e Paginação da Lista de Prazos combinando reais e mocks


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

  // Filtra por status de severidade e busca por fornecedor
  const filteredDeadlines = combinedDeadlinesList.filter(item => {
    // Filtro por status de severidade
    if (deadlineStatusFilter !== 'all') {
      if (deadlineStatusFilter === 'critical' && item.diasRestantes > 7) return false;
      if (deadlineStatusFilter === 'alert' && (item.diasRestantes <= 7 || item.diasRestantes > 10)) return false;
      if (deadlineStatusFilter === 'normal' && item.diasRestantes <= 10) return false;
    }

    // Filtro por busca de fornecedor
    if (deadlineSearchSupplier) {
      const search = deadlineSearchSupplier.toLowerCase().trim();
      const name = item.fornecedor ? item.fornecedor.toLowerCase() : '';
      if (!name.includes(search)) return false;
    }

    return true;
  });

  // Ordena de forma dinâmica
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
                        onDeleteApportionmentRow={handleDeleteApportionmentRow}
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      placeholder="Filtrar por nome do arquivo ou fornecedor..."
                      style={{
                        width: '100%',
                        padding: '8px 30px 8px 12px',
                        fontSize: '0.8rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        color: '#1f2937',
                        boxSizing: 'border-box'
                      }}
                    />
                    {historySearchTerm && (
                      <button
                        type="button"
                        onClick={() => setHistorySearchTerm('')}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '160px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status do Arquivo</label>
                  <select
                    value={historyFileStatusFilter}
                    onChange={(e) => setHistoryFileStatusFilter(e.target.value)}
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
                    <option value="">Todos os status</option>
                    <option value="Validado">Validado</option>
                    <option value="Excluído">Excluído</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '160px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status IA</label>
                  <select
                    value={historyAiStatusFilter}
                    onChange={(e) => setHistoryAiStatusFilter(e.target.value)}
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
                    <option value="">Todos os status</option>
                    <option value="Sucesso">Sucesso</option>
                    <option value="Falha">Falha</option>
                  </select>
                </div>

                {(historySearchTerm || historyModelFilter || historyDateFilter || historyFileStatusFilter || historyAiStatusFilter) && (
                  <button
                    onClick={() => {
                      setHistorySearchTerm('');
                      setHistoryModelFilter('');
                      setHistoryDateFilter('');
                      setHistoryFileStatusFilter('');
                      setHistoryAiStatusFilter('');
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
        ) : activeTab === 'deadlines' ? (
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
                    value={deadlineStatusFilter}
                    onChange={(e) => setDeadlineStatusFilter(e.target.value as any)}
                    style={{
                      padding: '8px',
                      fontSize: '0.8rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#1f2937',
                      cursor: 'pointer'
                    }}
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
                      placeholder="Pesquisar fornecedor..."
                      value={deadlineSearchSupplier}
                      onChange={(e) => setDeadlineSearchSupplier(e.target.value)}
                      style={{
                        padding: '8px 24px 8px 8px',
                        fontSize: '0.8rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        color: '#1f2937',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
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
                        style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', width: '250px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        Fornecedor {deadlineSortField === 'fornecedor' ? (deadlineSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                      </th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', width: '150px' }}>Documento</th>
                      <th 
                        onClick={() => handleSortDeadlines('valor')}
                        style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'right', width: '130px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        Valor {deadlineSortField === 'valor' ? (deadlineSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortDeadlines('vencimento')}
                        style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '130px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        Vencimento {deadlineSortField === 'vencimento' ? (deadlineSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortDeadlines('diasRestantes')}
                        style={{ padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '120px', cursor: 'pointer', userSelect: 'none' }}
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
                        let rowStyle: React.CSSProperties = {};
                        let badgeStyle: React.CSSProperties = {
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textAlign: 'center'
                        };
                        let statusText = '';

                        if (item.diasRestantes <= 7) {
                          rowStyle = { backgroundColor: '#fef2f2' };
                          badgeStyle = { ...badgeStyle, backgroundColor: '#fee2e2', color: '#991b1b' };
                          statusText = 'Crítico';
                        } else if (item.diasRestantes <= 10) {
                          rowStyle = { backgroundColor: '#fffbeb' };
                          badgeStyle = { ...badgeStyle, backgroundColor: '#fef3c7', color: '#92400e' };
                          statusText = 'Alerta';
                        } else {
                          rowStyle = { backgroundColor: '#f0fdf4' };
                          badgeStyle = { ...badgeStyle, backgroundColor: '#d1fae5', color: '#065f46' };
                          statusText = 'Normal';
                        }

                        return (
                          <tr 
                            key={item.id} 
                            style={{ 
                              borderBottom: '1px solid #e5e7eb',
                              transition: 'background-color 0.15s',
                              ...rowStyle
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
                              <span style={badgeStyle}>{statusText}</span>
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
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      color: deadlinesCurrentPage === 1 ? '#d1d5db' : '#4b5563',
                      cursor: deadlinesCurrentPage === 1 ? 'not-allowed' : 'pointer',
                      outline: 'none'
                    }}
                  >
                    Anterior
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: '#4b5563' }}>
                    Página {deadlinesCurrentPage} de {totalDeadlinesPages}
                  </span>
                  <button
                    disabled={deadlinesCurrentPage === totalDeadlinesPages}
                    onClick={() => setDeadlinesCurrentPage(prev => prev + 1)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      color: deadlinesCurrentPage === totalDeadlinesPages ? '#d1d5db' : '#4b5563',
                      cursor: deadlinesCurrentPage === totalDeadlinesPages ? 'not-allowed' : 'pointer',
                      outline: 'none'
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
                    Logs de Execução
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-outline"
                    onClick={loadApiLogs}
                    disabled={loadingApiLogs}
                    style={{ 
                      padding: '6px 12px',
                      opacity: loadingApiLogs ? 0.7 : 1,
                      cursor: loadingApiLogs ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCcw size={14} className={loadingApiLogs ? 'animate-spin' : ''} />
                    {loadingApiLogs ? 'Carregando...' : 'Atualizar'}
                  </button>
                </div>
              </div>

              <div style={{
                height: 'calc(100vh - 220px)',
                maxHeight: '750px',
                minHeight: '350px',
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

      {/* Modal de Confirmação de Logout */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setShowLogoutModal(false)}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            animation: 'slideUp 0.2s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#0f172a'
            }}>
              Confirmar Saída
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '0.875rem',
              color: '#475569',
              lineHeight: '1.5'
            }}>
              Deseja realmente sair do sistema? Suas alterações salvas não serão perdidas.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancelar
              </button>
              <button
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                onClick={confirmLogoutAction}
              >
                Confirmar Saída
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
