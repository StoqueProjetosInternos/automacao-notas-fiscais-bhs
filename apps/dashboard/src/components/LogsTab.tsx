import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCcw, Trash2 } from 'lucide-react';
import { fetchApiLogs, clearApiLogs } from '../services/api';

interface LogsTabProps {
  onBack: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const LogsTab = ({ onBack, showToast }: LogsTabProps) => {
  const [apiLogs, setApiLogs] = useState<string>('');
  const [loadingApiLogs, setLoadingApiLogs] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);

  const loadApiLogs = async () => {
    setLoadingApiLogs(true);
    try {
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

  const confirmClearLogsAction = async () => {
    setShowClearLogsModal(false);
    setClearingLogs(true);
    try {
      await clearApiLogs();
      setApiLogs('');
      showToast('Logs de execução limpos com sucesso.', 'success');
    } catch (error) {
      console.error('Erro ao limpar logs da API:', error);
      showToast('Falha ao limpar logs do servidor.', 'error');
    } finally {
      setClearingLogs(false);
    }
  };

  useEffect(() => {
    loadApiLogs();
  }, []);

  return (
    <div className="fade-in" key="logs" style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              Logs de Execução
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowClearLogsModal(true)}
              disabled={loadingApiLogs || clearingLogs}
              style={{ 
                padding: '6px 12px',
                opacity: (loadingApiLogs || clearingLogs) ? 0.7 : 1,
                cursor: (loadingApiLogs || clearingLogs) ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: '#ef4444',
                color: '#ef4444'
              }}
              onMouseOver={(e) => {
                if (!loadingApiLogs && !clearingLogs) {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Trash2 size={14} />
              {clearingLogs ? 'Limpando...' : 'Limpar Logs'}
            </button>
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

      {showClearLogsModal && (
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
        }} onClick={() => setShowClearLogsModal(false)}>
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
              Confirmar Limpeza de Logs
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '0.875rem',
              color: '#475569',
              lineHeight: '1.5'
            }}>
              Deseja realmente limpar todos os logs de execução do servidor? Esta ação não pode ser desfeita.
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
                onClick={() => setShowClearLogsModal(false)}
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
                onClick={confirmClearLogsAction}
              >
                Confirmar e Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
