import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login = ({ onLoginSuccess }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await loginUser(email, password);
      setAuthSuccess(true);
      // Aguarda 800ms mostrando sucesso, depois inicia fade-out por 400ms (total 1.2s)
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsExiting(true);
      await new Promise(resolve => setTimeout(resolve, 400));
      onLoginSuccess(response.user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[Login] Falha na autenticação:', err);
      const apiError = err.response?.data?.error || 'Erro de conexão com o servidor de autenticação.';
      setError(apiError);
      setLoading(false);
    }
  };

  return (
    <div 
      className={isExiting ? 'fade-out' : 'fade-in'}
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#f9fafb',
        fontFamily: 'Inter, sans-serif',
        boxSizing: 'border-box'
      }}
    >
      {/* Coluna Esquerda: Banner Institucional Stoque (Cores do SFI) */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        boxSizing: 'border-box'
      }} className="login-banner">
        <div style={{
          background: 'white',
          padding: '2.5rem 3rem',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.05)',
          border: '1px solid #e5e7eb',
          textAlign: 'center',
          maxWidth: '380px'
        }}>
          <img 
            src="https://stoque.com.br/wp-content/uploads/2025/12/Sotque-Lockup-Principal.svg" 
            alt="Stoque Logo" 
            style={{ width: '180px', height: 'auto', marginBottom: '1.5rem', display: 'inline-block' }}
          />
          <div style={{ 
            fontSize: '0.85rem', 
            color: '#4b5563', 
            fontWeight: 500,
            lineHeight: '1.6',
            marginTop: '0.5rem'
          }}>
            Automação inteligente e conciliação ágil para gestão de notas fiscais contábeis.
          </div>
        </div>
      </div>

      {/* Coluna Direita: Formulário de Autenticação */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          maxWidth: '380px',
          width: '100%'
        }}>
          {authSuccess ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #2563eb',
                borderRadius: '50%',
                margin: '0 auto 1.5rem',
                animation: 'spin 1s linear infinite'
              }} />
              <h2 style={{ fontSize: '1.20rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem', letterSpacing: '-0.025em' }}>
                Acesso Autorizado
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
                Carregando suas preferências contábeis...
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '2.25rem' }}>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#111827',
                  margin: '0 0 0.5rem',
                  letterSpacing: '-0.025em'
                }}>
                  Acesse o painel
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                  Insira as credenciais do Fiscal Intelligence (SFI)
                </p>
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fec2c2',
                  color: '#b91c1c',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  marginBottom: '1.25rem',
                  fontWeight: 500,
                  lineHeight: '1.4'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#4b5563',
                    marginBottom: '0.375rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    E-mail corporativo
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@stoque.com.br"
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      fontSize: '0.85rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#4b5563',
                    marginBottom: '0.375rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      fontSize: '0.85rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'white',
                    backgroundColor: loading ? 'rgba(37, 99, 235, 0.6)' : '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '0.5rem',
                    transition: 'background-color 0.2s, transform 0.1s ease',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#1d4ed8';
                  }}
                  onMouseOut={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#2563eb';
                  }}
                  onMouseDown={(e) => {
                    if (!loading) e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    if (!loading) e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.7rem', color: '#9ca3af' }}>
            Stoque Sistemas S.A. Todos os direitos reservados.
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-banner {
            display: none !important;
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
export default Login;
