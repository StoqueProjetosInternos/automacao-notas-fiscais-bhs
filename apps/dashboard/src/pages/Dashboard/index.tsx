import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { DocumentViewer } from '../../components/DocumentViewer';
import { DataEditor } from '../../components/DataEditor';
import { RateioPreviewModal } from '../../components/RateioPreviewModal';
import { ExecutiveAnalytics } from '../../components/ExecutiveAnalytics';
import { DeadlinesTab } from '../../components/DeadlinesTab';
import { LogsTab } from '../../components/LogsTab';
import { HistoryTab } from '../../components/HistoryTab';
import { fetchNotes, updateNote, reprocessNotes, fetchUsageLog, deleteNote, syncEmails, getFileUrl, uploadManualPdf, type UsageLog } from '../../services/api';
import type { Note, NoteData } from '../../types';
import { RefreshCcw, Loader2, Upload } from 'lucide-react';
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'history' | 'logs' | 'deadlines' | 'analytics'>('notes');
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isSlowLoadingHistory, setIsSlowLoadingHistory] = useState(false);

  const [isRateioPreviewOpen, setIsRateioPreviewOpen] = useState(false);




  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  // Monitor de Inatividade de 15 Minutos (se inativo, notifica e chama logout)
  const handleInactivityLogout = () => {
    try {
      sessionStorage.setItem('stoque_session_toast', JSON.stringify({
        message: 'Sua sessão foi encerrada por inatividade (15 minutos). Por favor, acesse novamente.',
        type: 'info'
      }));
    } catch {}
    onLogout();
  };

  useActivityTimeout(handleInactivityLogout, 15 * 60 * 1000);

  // Trava de segurança: Apenas ADMIN pode acessar Histórico e Logs
  useEffect(() => {
    if (user.role !== 'ADMIN' && (activeTab === 'history' || activeTab === 'logs')) {
      setActiveTab('notes');
    }
  }, [user.role, activeTab]);



  const loadUsageLogs = async () => {
    setLoadingLogs(true);
    setIsSlowLoadingHistory(false);
    const slowTimer = setTimeout(() => {
      setIsSlowLoadingHistory(true);
    }, 3000);

    try {
      const logs = await fetchUsageLog();
      logs.sort((a: UsageLog, b: UsageLog) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
      setUsageLogs(logs);
    } catch (error: any) {
      console.error('Erro ao carregar logs de uso:', error);
      showToast('Erro ao carregar o histórico de uso.', 'error');
    } finally {
      clearTimeout(slowTimer);
      setLoadingLogs(false);
      setIsSlowLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'analytics') {
      loadUsageLogs();
    } else if (activeTab === 'logs') {
      if (user.role !== 'ADMIN') {
        setActiveTab('notes');
        showToast('Acesso negado. A aba de logs é restrita para administradores.', 'error');
      }
    }
  }, [activeTab, user]);



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

  // Estados para o painel redimensionável com proporções equilibradas (PDF levemente maior)
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [editorWidth, setEditorWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.min(480, Math.max(420, Math.floor(window.innerWidth * 0.30)));
    }
    return 440;
  });
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

  const handleSelectNote = (note: Note | null) => {
    setSelectedNote(note);
    if (note) {
      setFormData(JSON.parse(JSON.stringify(note.data)));
    } else {
      setFormData(null);
    }
  };

  const handleDownloadSelectedNoteRateio = () => {
    if (!selectedNote) return;
    const excelFile = selectedNote.files?.excel || `${selectedNote.id}/${selectedNote.id}.xlsx`;
    const downloadUrl = getFileUrl(excelFile);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${selectedNote.id}_rateio.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportPdfClick = () => {
    handleSelectNote(null);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
    }, 50);
  };

  const handleUploadFile = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Apenas arquivos PDF são permitidos.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    showToast('Fazendo upload e processando OCR via Gemini...', 'info');

    try {
      const result = await uploadManualPdf(file);
      
      showToast('Fatura manual processada com sucesso!', 'success');
      
      const updatedNotes = await fetchNotes();
      setNotes(updatedNotes);

      const folderName = result.folder ? result.folder.replace(/\\/g, '/').split('/').pop() : null;
      if (folderName) {
        const newNote = updatedNotes.find(n => n.id === folderName);
        if (newNote) {
          handleSelectNote(newNote);
        }
      } else {
        const sortedByCreated = [...updatedNotes].sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        if (sortedByCreated.length > 0) {
          handleSelectNote(sortedByCreated[0]);
        }
      }
    } catch (err: any) {
      console.error('[Upload] Falha no processamento:', err);
      const errMsg = err.response?.data?.error || err.message || 'Erro ao processar fatura manual.';
      setUploadError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsUploading(false);
    }
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
      if (newWidth < 400) newWidth = 400;
      if (newWidth > window.innerWidth * 0.60) newWidth = window.innerWidth * 0.60;
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
      if (newWidth < 260) newWidth = 260;
      if (newWidth > 500) newWidth = 500;
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
      if (statusOverride === 'validado') {
        showToast('O processo foi criado no Zeev com sucesso.', 'success');
      } else if (statusOverride === 'pendente') {
        showToast('Fatura reaberta com sucesso. O status retornou para Pendente de Validação.', 'info');
      } else {
        showToast('Dados contábeis e planilha de rateio salvos.', 'success');
      }
      
      const refreshedNotes = await fetchNotes();
      setNotes(refreshedNotes);
      const updated = refreshedNotes.find((n: Note) => n.id === selectedNote.id);
      if (updated) {
        setSelectedNote(updated);
        setFormData(JSON.parse(JSON.stringify(updated.data)));
      }
    } catch (error: any) {
      console.error('Erro ao salvar dados contábeis:', error);
      const backendError = error.response?.data?.error;
      let defaultError = 'Erro ao salvar os dados contábeis.';
      if (statusOverride === 'validado') {
        defaultError = 'Erro ao criar o processo no Zeev.';
      } else if (statusOverride === 'pendente') {
        defaultError = 'Erro ao reabrir a fatura.';
      }
      const msg = backendError || defaultError;
      showToast(msg, 'error');
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

  const handleArchiveNote = async (id: string) => {
    try {
      const noteToArchive = notes.find(n => n.id === id);
      if (!noteToArchive) return;

      const updatedData = { ...noteToArchive.data, status: 'arquivado' };
      await updateNote(id, updatedData);
      
      const refreshedNotes = await fetchNotes();
      setNotes(refreshedNotes);
      
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setFormData(null);
      }
      
      showToast('Fatura arquivada com sucesso.', 'success');
      loadUsageLogs();
    } catch (error) {
      console.error('Erro ao arquivar nota:', error);
      showToast('Erro ao arquivar a fatura.', 'error');
    }
  };

  const handleUnarchiveNote = async (id: string) => {
    try {
      const noteToUnarchive = notes.find(n => n.id === id);
      if (!noteToUnarchive) return;

      const updatedData = { ...noteToUnarchive.data, status: 'pendente' };
      await updateNote(id, updatedData);
      
      const refreshedNotes = await fetchNotes();
      setNotes(refreshedNotes);
      
      showToast('Fatura restaurada com sucesso.', 'success');
      loadUsageLogs();
    } catch (error) {
      console.error('Erro ao desarquivar nota:', error);
      showToast('Erro ao desarquivar a fatura.', 'error');
    }
  };

  const handleExitDashboard = async (target: string) => {
    if (target === 'logout') {
      handleLogoutWithToast();
      return;
    }
    setIsExiting(true);
    await new Promise(resolve => setTimeout(resolve, 350));
    navigate(target);
  };



  const handleLogoutWithToast = () => {
    setShowLogoutModal(true);
  };

  const confirmLogoutAction = async () => {
    setShowLogoutModal(false);
    showToast('Obrigado por utilizar o Fiscal Intelligence (SFI). Até logo!', 'success');
    // Aguarda 1.1s mostrando o toast, depois inicia o fade-out por 400ms (total 1.5s)
    await new Promise(resolve => setTimeout(resolve, 1100));
    setIsExiting(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    onLogout();
  };



  return (
    <div className={`layout fade-in ${isExiting ? 'fade-out' : ''}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".pdf"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadFile(e.target.files[0]);
          }
        }}
      />
      <Header 
        onSync={refreshNotesList} 
        isApiOnline={isApiOnline} 
        isSyncing={isSyncing} 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
        onExit={handleExitDashboard}
        user={user}
        onDownloadRateio={() => setIsRateioPreviewOpen(true)}
        hasSelectedNote={!!selectedNote}
      />

      <div className="content-area">
        {activeTab === 'notes' ? (
          <div className="fade-in" key="notes" style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%' }}>
            <Sidebar 
              notes={notes} 
              selectedNoteId={selectedNote?.id} 
              onSelectNote={handleSelectNote} 
              onDeleteNote={handleDeleteNote}
              onArchiveNote={handleArchiveNote}
              onUnarchiveNote={handleUnarchiveNote}
              searchTerm={searchTerm} 
              onSearchChange={setSearchTerm} 
              userRole={user.role}
              onImportClick={handleImportPdfClick}
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
                        userRole={user.role}
                      />
                    )}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', boxSizing: 'border-box' }}>
                  
                  {isUploading ? (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '1rem',
                      background: '#f8fafc',
                      border: '2px dashed #bfdbfe',
                      borderRadius: '16px',
                      padding: '3rem 2rem',
                      width: '100%',
                      maxWidth: '500px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                      <Loader2 className="animate-spin" size={48} color="#2563eb" />
                      <div style={{ textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Processando OCR</h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Extraindo rateios via IA...</p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="manual-upload-dropzone"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('drag-active');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('drag-active');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('drag-active');
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          handleUploadFile(e.dataTransfer.files[0]);
                        }
                      }}
                    >
                      <Upload size={48} color="#3b82f6" style={{ marginBottom: '1.25rem', opacity: 0.8 }} />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>Importar Fatura PDF</h3>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px', maxWidth: '300px' }}>
                        Arraste e solte o arquivo PDF aqui ou clique para selecionar do computador
                      </p>
                      {uploadError && (
                        <div style={{ fontSize: '0.75rem', color: '#ef4444', background: '#fef2f2', padding: '6px 12px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                          Erro: {uploadError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <HistoryTab
            notes={notes}
            usageLogs={usageLogs}
            loadingLogs={loadingLogs}
            isSlowLoadingHistory={isSlowLoadingHistory}
            onArchiveNote={handleArchiveNote}
            onUnarchiveNote={handleUnarchiveNote}
            onBack={() => setActiveTab('notes')}
            user={user}
            showToast={showToast}
          />
        ) : activeTab === 'deadlines' ? (
          <DeadlinesTab
            notes={notes}
            onBack={() => setActiveTab('notes')}
            onRefreshNotes={refreshNotesList}
            showToast={showToast}
          />
        ) : activeTab === 'analytics' ? (
          <ExecutiveAnalytics
            notes={notes}
            usageLogs={usageLogs}
            onBackToNotes={() => setActiveTab('notes')}
          />
        ) : (
          <LogsTab
            onBack={() => setActiveTab('notes')}
            showToast={showToast}
          />
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



      {/* Modal de Pré-visualização do Rateio Excel */}
      <RateioPreviewModal 
        isOpen={isRateioPreviewOpen} 
        onClose={() => setIsRateioPreviewOpen(false)} 
        selectedNote={selectedNote} 
        onDownload={handleDownloadSelectedNoteRateio} 
      />
    </div>
  );
};
export default Dashboard;
