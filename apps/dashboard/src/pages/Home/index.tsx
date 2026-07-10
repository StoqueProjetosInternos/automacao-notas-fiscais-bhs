import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Mail, ArrowRight, Zap } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const Home = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ totalProcessed: 0, avgTimeMs: 2.5, successRate: 100 });
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/metrics`);
        setMetrics(response.data);
      } catch (err) {
        console.warn('Falha ao carregar metricas agregadas:', err);
      }
    };
    loadMetrics();
  }, []);

  const handleNavigateToLogin = async () => {
    setIsExiting(true);
    await new Promise(resolve => setTimeout(resolve, 350));
    navigate('/login');
  };

  return (
    <div className={`home-layout fade-in ${isExiting ? 'fade-out' : ''}`}>
      {/* Navbar */}
      <nav className="home-navbar">
        <div className="home-logo">
          <img 
            src="https://stoque.com.br/wp-content/uploads/2025/12/Sotque-Lockup-Principal.svg" 
            alt="Stoque" 
            height="32" 
          />
          <span className="home-logo-text">Fiscal Intelligence (SFI)</span>
        </div>
        <button 
          className="btn-primary-gradient" 
          onClick={handleNavigateToLogin}
        >
          Acessar Plataforma
          <ArrowRight size={14} style={{ marginLeft: '4px' }} />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="home-hero">
        <h1 className="home-title">
          Automação Fiscal e Rateio Financeiro de <span className="text-gradient">Faturas com IA</span>
        </h1>
        <p className="home-subtitle">
          A plataforma da Stoque que realiza OCR inteligente via Google Gemini, enriquecimento contábil imediato e conciliação ágil de despesas corporativas em segundos.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '4rem' }}>
          <button 
            className="btn-primary-gradient big-btn" 
            onClick={handleNavigateToLogin}
          >
            Acessar Meu Painel
          </button>
        </div>

        {/* Grid de Métricas (KPIs) */}
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-value">{metrics.totalProcessed}</span>
            <span className="metric-label">Faturas Processadas</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">{metrics.avgTimeMs}s</span>
            <span className="metric-label">Tempo Médio de OCR</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">{metrics.successRate}%</span>
            <span className="metric-label">Taxa de Sucesso</span>
          </div>
        </div>
      </section>

      {/* Seção de Funcionalidades */}
      <section className="features-section">
        <h2 className="section-title">Tecnologias Integradas na Plataforma</h2>
        <div className="features-grid">
          <div className="feature-card">
            <Zap className="feature-icon" color="#2563eb" />
            <h3>Extração OCR Inteligente</h3>
            <p>Leitura de arquivos faturas e boletos em lote estruturado pelo modelo Google Gemini-2.5-Flash.</p>
          </div>
          <div className="feature-card">
            <FileText className="feature-icon" color="#059669" />
            <h3>Conciliação e Rateios</h3>
            <p>Atribuição automática de centro de custo e natureza de despesa baseados na base de fornecedores.</p>
          </div>
          <div className="feature-card">
            <Mail className="feature-icon" color="#d97706" />
            <h3>Integração com E-mails</h3>
            <p>Importação e varredura inteligente de mensagens não lidas no Outlook do Microsoft Graph.</p>
          </div>
        </div>
      </section>

      {/* Seção de Novidades (Timeline / Changelog) */}
      <section className="changelog-section">
        <h2 className="section-title">O que há de novo no SFI</h2>
        <div className="changelog-timeline">
          <div className="changelog-item">
            <div className="changelog-badge">Novidade</div>
            <div className="changelog-content">
              <h3>Visualização de Faturas Inline</h3>
              <p>Audite suas faturas diretamente do histórico de processamento com o novo visualizador em modal interativo, sem precisar sair do painel.</p>
              <span className="changelog-date">Julho, 2026</span>
            </div>
          </div>
          <div className="changelog-item">
            <div className="changelog-badge" style={{ background: '#ecfdf5', color: '#047857' }}>Segurança</div>
            <div className="changelog-content">
              <h3>Controle de Perfis de Acesso (RBAC)</h3>
              <p>Camada segura de autenticação que diferencia perfis de Administrador e Operador, restringindo ações críticas no banco e no dashboard.</p>
              <span className="changelog-date">Julho, 2026</span>
            </div>
          </div>
          <div className="changelog-item">
            <div className="changelog-badge" style={{ background: '#fffbeb', color: '#b45309' }}>Melhoria</div>
            <div className="changelog-content">
              <h3>Exportação de Logs para Excel & PDF</h3>
              <p>Baixe planilhas de rateios ou relatórios fiscais de histórico em PDF formatado para fins de auditoria com apenas um clique.</p>
              <span className="changelog-date">Julho, 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} Stoque Tecnologia. Todos os direitos reservados. Stoque Fiscal Intelligence (SFI).</p>
      </footer>
    </div>
  );
};
