import { RefreshCcw, LogOut } from 'lucide-react';

interface HeaderProps {
  onSync: () => void;
  isApiOnline: boolean;
  isSyncing: boolean;
  activeTab: 'notes' | 'history';
  onChangeTab: (tab: 'notes' | 'history') => void;
  onLogout: () => void;
}

export const Header = ({ onSync, isApiOnline, isSyncing, activeTab, onChangeTab, onLogout }: HeaderProps) => {
  return (
    <header className="header">
      <div className="logo">
        <img 
          src="https://stoque.com.br/wp-content/uploads/2025/12/Sotque-Lockup-Principal.svg" 
          alt="Stoque" 
          width="120" 
          height="34"
          style={{ display: 'block' }}
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
      </nav>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          className="btn btn-outline" 
          style={{ 
            padding: '6px 12px', 
            opacity: isSyncing ? 0.7 : 1, 
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }} 
          onClick={onSync}
          disabled={isSyncing}
        >
          <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
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
        <button 
          className="btn btn-outline" 
          style={{ 
            padding: '6px 12px', 
            borderColor: '#ef4444', 
            color: '#ef4444',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }} 
          onClick={onLogout}
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </header>
  );
};
