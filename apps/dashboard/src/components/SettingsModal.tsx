import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Cpu, 
  Workflow, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  Lock, 
  ShieldCheck 
} from 'lucide-react';
import { fetchSettings, saveSettings, type MaskedSettings, type User } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'zeev' | 'email' | 'smtp'>('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [settings, setSettings] = useState<MaskedSettings | null>(null);
  
  // Form edit states (apenas valores preenchidos serão enviados)
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [zeevApiUrl, setZeevApiUrl] = useState('');
  const [zeevApiToken, setZeevApiToken] = useState('');
  const [zeevFlowId, setZeevFlowId] = useState('');
  const [zeevRequester, setZeevRequester] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number | ''>(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpTo, setSmtpTo] = useState('');

  // Show/hide passwords
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showZeevToken, setShowZeevToken] = useState(false);
  const [showTenantId, setShowTenantId] = useState(false);
  const [showClientId, setShowClientId] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadSettings();
    }
    if (isOpen) {
      setFeedback(null);
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchSettings();
      setSettings(data);
      setZeevApiUrl(data.zeevApiUrl || '');
      setZeevFlowId(data.zeevFlowId || '2044');
      setZeevRequester(data.zeevRequester || '');
      setUserEmail(data.userEmail || '');
      setSmtpHost(data.smtpHost || '');
      setSmtpPort(data.smtpPort || 587);
      setSmtpSecure(Boolean(data.smtpSecure));
      setSmtpUser(data.smtpUser || '');
      setSmtpFrom(data.smtpFrom || '');
      setSmtpTo(data.smtpTo || '');
      
      // Limpa os campos de senha/token/credenciais
      setGeminiApiKey('');
      setZeevApiToken('');
      setTenantId('');
      setClientId('');
      setClientSecret('');
      setSmtpPass('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Erro ao carregar configurações do sistema: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setFeedback(null);

    const payload: Record<string, any> = {
      zeevApiUrl,
      zeevFlowId,
      zeevRequester,
      userEmail,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpFrom,
      smtpTo
    };

    // Só anexa credenciais e chaves se o usuário tiver digitado um novo valor
    if (geminiApiKey.trim()) payload.geminiApiKey = geminiApiKey;
    if (zeevApiToken.trim()) payload.zeevApiToken = zeevApiToken;
    if (tenantId.trim()) payload.tenantId = tenantId;
    if (clientId.trim()) payload.clientId = clientId;
    if (clientSecret.trim()) payload.clientSecret = clientSecret;
    if (smtpPass.trim()) payload.smtpPass = smtpPass;

    try {
      const res = await saveSettings(payload);
      setSettings(res.settings);
      setGeminiApiKey('');
      setZeevApiToken('');
      setTenantId('');
      setClientId('');
      setClientSecret('');
      setSmtpPass('');
      setFeedback({ type: 'success', message: 'Configurações e credenciais salvas com sucesso no servidor!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Erro ao salvar configurações: ' + (err.response?.data?.error || err.message) });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Cabeçalho do Modal */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Perfil & Configurações do Sistema
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Gerenciamento de credenciais, integrações de IA e serviços corporativos
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback visual de sucesso ou erro */}
        {feedback && (
          <div style={{
            margin: '16px 24px 0 24px',
            padding: '10px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            fontWeight: 500,
            backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: feedback.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Navegação por Abas */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '12px 24px 0 24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              borderBottom: activeTab === 'profile' ? '2px solid #0284c7' : '2px solid transparent',
              background: 'none',
              color: activeTab === 'profile' ? '#0284c7' : '#64748b',
              cursor: 'pointer'
            }}
          >
            <UserIcon size={14} />
            Meu Perfil
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: activeTab === 'ai' ? '2px solid #0284c7' : '2px solid transparent',
                  background: 'none',
                  color: activeTab === 'ai' ? '#0284c7' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                <Cpu size={14} />
                Inteligência Artificial (Gemini)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('zeev')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: activeTab === 'zeev' ? '2px solid #0284c7' : '2px solid transparent',
                  background: 'none',
                  color: activeTab === 'zeev' ? '#0284c7' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                <Workflow size={14} />
                Integração Zeev
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('email')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: activeTab === 'email' ? '2px solid #0284c7' : '2px solid transparent',
                  background: 'none',
                  color: activeTab === 'email' ? '#0284c7' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                <Mail size={14} />
                Monitoramento E-mail
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('smtp')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: activeTab === 'smtp' ? '2px solid #0284c7' : '2px solid transparent',
                  background: 'none',
                  color: activeTab === 'smtp' ? '#0284c7' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                <Send size={14} />
                Servidor SMTP
              </button>
            </>
          )}
        </div>

        {/* Conteúdo das Abas */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: currentUser?.role === 'ADMIN' ? '#0284c7' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1.25rem',
                  fontWeight: 700
                }}>
                  {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                    {currentUser?.name || 'Usuário'}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                    {currentUser?.email || ''}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: currentUser?.role === 'ADMIN' ? '#1d4ed8' : '#047857',
                    background: currentUser?.role === 'ADMIN' ? '#eff6ff' : '#ecfdf5',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${currentUser?.role === 'ADMIN' ? '#dbeafe' : '#a7f3d0'}`,
                    letterSpacing: '0.05em'
                  }}>
                    PERFIL: {currentUser?.role || 'USER'}
                  </span>
                </div>
              </div>

              {!isAdmin && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Lock size={16} />
                  <span>A gestão das chaves corporativas (IA, Zeev, E-mail e SMTP) é restrita a usuários com perfil de Administrador.</span>
                </div>
              )}
            </div>
          )}

          {isAdmin && activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Chave de API do Google Gemini (GEMINI_API_KEY)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder={settings?.geminiApiKey.isConfigured ? `Chave gravada: ${settings.geminiApiKey.masked}` : 'Cole sua chave de API do Gemini'}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  {settings?.geminiApiKey.isConfigured 
                    ? 'Uma chave já está configurada. Digite uma nova apenas se desejar substituí-la.' 
                    : 'Nenhuma chave configurada. É necessária para a extração automática de notas e rateios por IA.'}
                </span>
              </div>
            </div>
          )}

          {isAdmin && activeTab === 'zeev' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  URL Base da API do Zeev (ZEEV_API_URL)
                </label>
                <input
                  type="text"
                  value={zeevApiUrl}
                  onChange={(e) => setZeevApiUrl(e.target.value)}
                  placeholder="https://suaempresa.zeev.it"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Token de Autenticação da API Zeev (ZEEV_API_TOKEN)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showZeevToken ? 'text' : 'password'}
                    value={zeevApiToken}
                    onChange={(e) => setZeevApiToken(e.target.value)}
                    placeholder={settings?.zeevApiToken.isConfigured ? `Token gravado: ${settings.zeevApiToken.masked}` : 'Cole o token de API do Zeev'}
                    style={{
                      width: '100%',
                      padding: '8px 40px 8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowZeevToken(!showZeevToken)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showZeevToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    ID do Fluxo de Pagamento (ZEEV_FLOW_ID)
                  </label>
                  <input
                    type="text"
                    value={zeevFlowId}
                    onChange={(e) => setZeevFlowId(e.target.value)}
                    placeholder="2044"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    E-mail do Requisitante Padrão (ZEEV_REQUESTER)
                  </label>
                  <input
                    type="text"
                    value={zeevRequester}
                    onChange={(e) => setZeevRequester(e.target.value)}
                    placeholder="hugo.bhs@stoque.com.br"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {isAdmin && activeTab === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  E-mail Monitorado para Importação de Faturas (USER_EMAIL)
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="fiscal.automacao@stoque.com.br"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Azure / Microsoft Tenant ID (TENANT_ID)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showTenantId ? 'text' : 'password'}
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      placeholder={settings?.tenantId?.isConfigured ? `ID gravado: ${settings.tenantId.masked}` : 'Cole o Tenant ID do Azure'}
                      style={{
                        width: '100%',
                        padding: '8px 40px 8px 12px',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTenantId(!showTenantId)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8'
                      }}
                    >
                      {showTenantId ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Azure Client / App ID (CLIENT_ID)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showClientId ? 'text' : 'password'}
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder={settings?.clientId?.isConfigured ? `ID gravado: ${settings.clientId.masked}` : 'Cole o Client ID do Azure'}
                      style={{
                        width: '100%',
                        padding: '8px 40px 8px 12px',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowClientId(!showClientId)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8'
                      }}
                    >
                      {showClientId ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Azure Client Secret (CLIENT_SECRET)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showClientSecret ? 'text' : 'password'}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder={settings?.clientSecret.isConfigured ? `Segredo gravado: ${settings.clientSecret.masked}` : 'Cole o segredo de cliente do Azure'}
                    style={{
                      width: '100%',
                      padding: '8px 40px 8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowClientSecret(!showClientSecret)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showClientSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAdmin && activeTab === 'smtp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Servidor SMTP (SMTP_HOST)
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.office365.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Porta (SMTP_PORT)
                  </label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value ? Number(e.target.value) : '')}
                    placeholder="587"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ paddingBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    SSL/TLS (Secure)
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Usuário SMTP (SMTP_USER)
                  </label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="notificacoes@stoque.com.br"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Senha SMTP (SMTP_PASS)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSmtpPass ? 'text' : 'password'}
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder={settings?.smtpPass.isConfigured ? `Senha gravada: ${settings.smtpPass.masked}` : 'Digite a senha do SMTP'}
                      style={{
                        width: '100%',
                        padding: '8px 40px 8px 12px',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8'
                      }}
                    >
                      {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Remetente De (SMTP_FROM)
                  </label>
                  <input
                    type="text"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    placeholder="Stoque Fiscal Intelligence <alerta@stoque.com.br>"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Destinatário dos Alertas (SMTP_TO)
                  </label>
                  <input
                    type="text"
                    value={smtpTo}
                    onChange={(e) => setSmtpTo(e.target.value)}
                    placeholder="time.fiscal@stoque.com.br"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com botões de ação */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {isAdmin ? 'As alterações são sincronizadas em tempo de execução no arquivo .env.' : 'Somente leitura.'}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#e2e8f0',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
            {isAdmin && activeTab !== 'profile' && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: saving ? '#94a3b8' : '#0284c7',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                <Save size={14} />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
