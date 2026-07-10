import { useState, useRef, useEffect } from 'react';
import { RefreshCcw, LogOut, ChevronDown, Home as HomeIcon } from 'lucide-react';

interface HeaderProps {
  onSync: () => void;
  isApiOnline: boolean;
  isSyncing: boolean;
  activeTab: 'notes' | 'history' | 'logs' | 'deadlines';
  onChangeTab: (tab: 'notes' | 'history' | 'logs' | 'deadlines') => void;
  onExit: (target: string) => void;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export const Header = ({ onSync, isApiOnline, isSyncing, activeTab, onChangeTab, onExit, user }: HeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora do elemento
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calcula as iniciais baseadas no nome
  const getInitials = (fullName?: string): string => {
    if (!fullName) return 'S';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <header className="header">
      <div className="logo">
        <img 
          src="https://stoque.com.br/wp-content/uploads/2025/12/Sotque-Lockup-Principal.svg" 
          alt="Stoque" 
          width="120" 
          height="34"
          style={{ display: 'block', cursor: 'pointer' }}
          onClick={() => onExit('/')}
          title="Ver página inicial"
        />
        <span style={{ 
          marginLeft: '8px', 
          fontSize: '0.9rem', 
          color: '#6b7280', 
          fontWeight: 500, 
          borderLeft: '1px solid #e5e7eb', 
          paddingLeft: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          Fiscal Intelligence (SFI)
        </span>
      </div>
      <nav style={{ display: 'flex', gap: '16px', marginLeft: '32px' }}>
        <button 
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'notes' ? 700 : 500,
            color: activeTab === 'notes' ? '#2563eb' : '#6b7280',
            cursor: 'pointer',
            padding: '6px 0',
            borderBottom: `2px solid ${activeTab === 'notes' ? '#2563eb' : 'transparent'}`,
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onClick={() => onChangeTab('notes')}
        >
          Faturas
        </button>
        <button 
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'history' ? 700 : 500,
            color: activeTab === 'history' ? '#2563eb' : '#6b7280',
            cursor: 'pointer',
            padding: '6px 0',
            borderBottom: `2px solid ${activeTab === 'history' ? '#2563eb' : 'transparent'}`,
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onClick={() => onChangeTab('history')}
        >
          Histórico
        </button>
        
        {user.role === 'ADMIN' && (
          <button 
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'logs' ? 700 : 500,
              color: activeTab === 'logs' ? '#2563eb' : '#6b7280',
              cursor: 'pointer',
              padding: '6px 0',
              borderBottom: `2px solid ${activeTab === 'logs' ? '#2563eb' : 'transparent'}`,
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onClick={() => onChangeTab('logs')}
          >
            Logs
          </button>
        )}

        <button 
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'deadlines' ? 700 : 500,
            color: activeTab === 'deadlines' ? '#2563eb' : '#6b7280',
            cursor: 'pointer',
            padding: '6px 0',
            borderBottom: `2px solid ${activeTab === 'deadlines' ? '#2563eb' : 'transparent'}`,
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onClick={() => onChangeTab('deadlines')}
        >
          Prazos
        </button>
      </nav>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          className="btn btn-outline" 
          style={{ 
            padding: '6px 12px', 
            opacity: isSyncing || user.role !== 'ADMIN' ? 0.6 : 1, 
            cursor: isSyncing || user.role !== 'ADMIN' ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }} 
          onClick={onSync}
          disabled={isSyncing || user.role !== 'ADMIN'}
          title={user.role !== 'ADMIN' ? 'Disponível apenas para administradores' : 'Sincronizar faturas do email'}
        >
          <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Sincronizando...' : user.role !== 'ADMIN' ? 'Sincronizar (Admin)' : 'Sincronizar'}
        </button>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '4px 12px', 
          background: isApiOnline ? '#f3f4f6' : '#fef2f2', 
          borderRadius: '20px',
          border: `1px solid ${isApiOnline ? 'transparent' : '#fee2e2'}`,
          transition: 'all 0.3s'
        }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: isApiOnline ? '#10b981' : '#ef4444',
            boxShadow: isApiOnline ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
          }} />
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 600, 
            color: isApiOnline ? '#111827' : '#ef4444' 
          }}>
            {isApiOnline ? 'API Online' : 'API Offline'}
          </span>
        </div>

        {/* Menu de Perfil Interativo */}
        <div className="profile-menu" ref={dropdownRef}>
          <button 
            className="profile-trigger" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
          >
            <div className={`profile-avatar ${user.role !== 'ADMIN' ? 'profile-avatar-user' : ''}`}>
              {getInitials(user.name)}
            </div>
            <ChevronDown size={14} style={{ color: '#4b5563', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {isDropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-user-info">
                <span className="dropdown-user-name" title={user.name}>{user.name}</span>
                <span className="dropdown-user-email" title={user.email}>{user.email}</span>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-user-role-container">
                <span style={{ color: '#4b5563', fontWeight: 500 }}>Perfil de Acesso:</span>
                <span style={{ 
                  fontSize: '0.62rem', 
                  fontWeight: 700, 
                  color: user.role === 'ADMIN' ? '#1d4ed8' : '#047857',
                  background: user.role === 'ADMIN' ? '#eff6ff' : '#ecfdf5',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${user.role === 'ADMIN' ? '#dbeafe' : '#a7f3d0'}`,
                  letterSpacing: '0.05em'
                }}>
                  {user.role}
                </span>
              </div>
              <div className="dropdown-divider"></div>
              
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setIsDropdownOpen(false);
                  onExit('/');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderColor: '#d1d5db',
                  color: '#374151',
                  marginBottom: '4px'
                }}
              >
                <HomeIcon size={14} />
                Página Inicial
              </button>

              <button className="dropdown-logout-btn" onClick={() => onExit('logout')}>
                <LogOut size={14} />
                Sair da Conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
