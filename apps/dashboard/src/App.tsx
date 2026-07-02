import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { checkAuthSession, logoutUser, getCookie } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getCookie('stoque_auth_token');
      if (token) {
        try {
          const session = await checkAuthSession();
          setUser(session.user);
        } catch (err) {
          console.warn('[App] Sessão inválida ou expirada na inicialização.', err);
          logoutUser();
          setUser(null);
        }
      }
      setCheckingAuth(false);
    };

    initAuth();
  }, []);

  if (checkingAuth) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: '#0a0f1e',
        color: '#9ca3af',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.85rem'
      }}>
        Verificando credenciais corporativas...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rota de Login */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={setUser} />
          } 
        />
        
        {/* Rota do Dashboard (Protegida) */}
        <Route 
          path="/dashboard" 
          element={
            user ? <Dashboard onLogout={handleLogout} user={user} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Redirecionamento Padrão */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
