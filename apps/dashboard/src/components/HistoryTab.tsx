import { useState, useEffect } from 'react';
import { ArrowLeft, FileSpreadsheet, FileText, UserCheck, DollarSign, Clock, Loader2 } from 'lucide-react';
import type { Note } from '../types';
import { type UsageLog, getFileUrl } from '../services/api';
import { RateioPreviewModal } from './RateioPreviewModal';

interface HistoryTabProps {
  notes: Note[];
  usageLogs: UsageLog[];
  loadingLogs: boolean;
  isSlowLoadingHistory: boolean;
  onArchiveNote: (id: string) => Promise<void> | void;
  onUnarchiveNote: (id: string) => Promise<void> | void;
  onBack: () => void;
  user: {
    name: string;
    email: string;
    role: string;
  };
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const HistoryTab = ({
  notes,
  usageLogs,
  loadingLogs,
  isSlowLoadingHistory,
  onArchiveNote,
  onUnarchiveNote,
  onBack,
  user,
  showToast
}: HistoryTabProps) => {
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyModelFilter, setHistoryModelFilter] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [historyFileStatusFilter, setHistoryFileStatusFilter] = useState('');
  const [historyUserFilter, setHistoryUserFilter] = useState('');
  const [historyOriginFilter, setHistoryOriginFilter] = useState('');
  const [historyAiStatusFilter, setHistoryAiStatusFilter] = useState('');
  const [historySortField, setHistorySortField] = useState<string>('dataHora');
  const [historySortOrder, setHistorySortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [historyPreviewPdfUrl, setHistoryPreviewPdfUrl] = useState<string | null>(null);
  const [historyPreviewTitle, setHistoryPreviewTitle] = useState<string>('');
  const [historyPreviewRateioNote, setHistoryPreviewRateioNote] = useState<Note | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [historySearchTerm, historyModelFilter, historyDateFilter, historyFileStatusFilter, historyAiStatusFilter, historyUserFilter, historyOriginFilter, historySortField, historySortOrder]);

  const handleSortHistory = (field: string) => {
    if (historySortField === field) {
      setHistorySortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setHistorySortField(field);
      setHistorySortOrder('asc');
    }
  };

  const availableModels = Array.from(new Set(usageLogs.map(log => log.modeloIa).filter(Boolean)));
  const availableUsers = Array.from(new Set(usageLogs.map(log => log.usuarioEmail).filter(Boolean)));
  const availableOrigins = Array.from(new Set(usageLogs.map(log => log.origem).filter(Boolean)));

  const filteredUsageLogs = usageLogs.filter((log) => {
    const searchLower = historySearchTerm.toLowerCase();
    const matchesSearch = 
      log.arquivo.toLowerCase().includes(searchLower) ||
      log.fornecedor.toLowerCase().includes(searchLower) ||
      (log.numeroDocumento && log.numeroDocumento.toLowerCase().includes(searchLower)) ||
      (log.usuarioEmail && log.usuarioEmail.toLowerCase().includes(searchLower)) ||
      (log.usuarioNome && log.usuarioNome.toLowerCase().includes(searchLower));
    
    const matchesModel = !historyModelFilter || log.modeloIa === historyModelFilter;
    const matchesUser = !historyUserFilter || log.usuarioEmail === historyUserFilter;
    const matchesOrigin = !historyOriginFilter || log.origem === historyOriginFilter;
    
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
    
    return matchesSearch && matchesModel && matchesUser && matchesOrigin && matchesDate && matchesFileStatus && matchesAiStatus;
  });

  filteredUsageLogs.sort((a, b) => {
    let comparison = 0;
    switch (historySortField) {
      case 'id':
        comparison = Number(a.id) - Number(b.id);
        break;
      case 'dataHora':
        comparison = new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
        break;
      case 'usuario':
        comparison = (a.usuarioEmail || a.usuarioNome || '').localeCompare(b.usuarioEmail || b.usuarioNome || '');
        break;
      case 'origem':
        comparison = (a.origem || '').localeCompare(b.origem || '');
        break;
      case 'arquivo':
        comparison = (a.arquivo || '').localeCompare(b.arquivo || '');
        break;
      case 'modeloIa':
        comparison = (a.modeloIa || '').localeCompare(b.modeloIa || '');
        break;
      case 'fornecedor':
        comparison = (a.fornecedor || '').localeCompare(b.fornecedor || '');
        break;
      case 'cnpj':
        comparison = (a.cnpjFornecedor || '').localeCompare(b.cnpjFornecedor || '');
        break;
      case 'statusArquivo':
        comparison = (a.statusArquivo || '').localeCompare(b.statusArquivo || '');
        break;
      case 'numeroDocumento':
        comparison = (a.numeroDocumento || '').localeCompare(b.numeroDocumento || '');
        break;
      case 'valorFatura':
        comparison = (a.valorFatura || 0) - (b.valorFatura || 0);
        break;
      case 'tokensEntrada':
        comparison = (a.tokensEntrada || 0) - (b.tokensEntrada || 0);
        break;
      case 'tokensSaida':
        comparison = (a.tokensSaida || 0) - (b.tokensSaida || 0);
        break;
      case 'custoUsd':
        comparison = (a.custoUsd || 0) - (b.custoUsd || 0);
        break;
      case 'tempoMs':
        comparison = (parseInt(String(a.tempoProcessamentoMs)) || 0) - (parseInt(String(b.tempoProcessamentoMs)) || 0);
        break;
      case 'statusIa':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
      case 'zeevId':
        comparison = (parseInt(String(a.zeevId)) || 0) - (parseInt(String(b.zeevId)) || 0);
        break;
      default:
        comparison = 0;
    }
    return historySortOrder === 'asc' ? comparison : -comparison;
  });

  const totalRecords = filteredUsageLogs.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage) || 1;
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedUsageLogs = filteredUsageLogs.slice(startIndex, startIndex + recordsPerPage);

  const generateAuditMetadata = () => {
    const reportId = 'AUD-' + new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const nowStr = new Date().toLocaleString('pt-BR') + ' (BRT / UTC-3)';
    const userName = user?.name || user?.email?.split('@')[0] || 'Usuário Autenticado';
    const userEmail = user?.email || 'N/D';
    const userRole = user?.role || 'OPERATOR';

    const activeFilters: string[] = [];
    if (historySearchTerm) activeFilters.push(`Busca: "${historySearchTerm}"`);
    if (historyModelFilter) activeFilters.push(`Modelo IA: ${historyModelFilter}`);
    if (historyUserFilter) activeFilters.push(`Usuário: ${historyUserFilter}`);
    if (historyOriginFilter) activeFilters.push(`Origem: ${historyOriginFilter}`);
    if (historyDateFilter) activeFilters.push(`Data: ${historyDateFilter}`);
    if (historyFileStatusFilter) activeFilters.push(`Status Fatura: ${historyFileStatusFilter}`);
    if (historyAiStatusFilter) activeFilters.push(`Status IA: ${historyAiStatusFilter}`);
    const filterStr = activeFilters.length > 0 ? activeFilters.join(' | ') : 'Escopo Total (sem filtros aplicados)';

    const totalFilteredRecords = filteredUsageLogs.length;
    const totalValor = filteredUsageLogs.reduce((acc, log) => acc + (Number(log.valorFatura) || 0), 0);
    const totalTokensEntrada = filteredUsageLogs.reduce((acc, log) => acc + (Number(log.tokensEntrada) || 0), 0);
    const totalTokensSaida = filteredUsageLogs.reduce((acc, log) => acc + (Number(log.tokensSaida) || 0), 0);
    const totalCustoUsd = filteredUsageLogs.reduce((acc, log) => acc + (Number(log.custoUsd) || 0), 0);

    return {
      reportId,
      nowStr,
      userName,
      userEmail,
      userRole,
      filterStr,
      totalRecords: totalFilteredRecords,
      totalValor,
      totalTokensEntrada,
      totalTokensSaida,
      totalCustoUsd
    };
  };

  const exportToExcel = () => {
    try {
      const meta = generateAuditMetadata();
      const headers = ['ID', 'Data/Hora', 'Usuário / Responsável', 'Origem', 'Arquivo', 'Modelo IA', 'Fornecedor', 'CNPJ Fornecedor', 'Status Fatura', 'Numero Documento', 'Valor Fatura', 'Tokens Entrada', 'Tokens Saida', 'Custo USD', 'Tempo Ms', 'Status IA', 'Zeev ID'];
      
      const rows = filteredUsageLogs.map(log => [
        log.id,
        new Date(log.dataHora).toLocaleString('pt-BR'),
        log.usuarioEmail || log.usuarioNome || 'SISTEMA',
        log.origem || 'E-mail Sync',
        log.arquivo,
        log.modeloIa,
        log.fornecedor,
        log.cnpjFornecedor,
        log.statusArquivo,
        log.numeroDocumento,
        log.valorFatura !== undefined ? log.valorFatura : '',
        log.tokensEntrada,
        log.tokensSaida,
        log.custoUsd,
        log.tempoProcessamentoMs,
        log.status,
        log.zeevId
      ]);

      const auditRows = [
        ['RELATÓRIO DE AUDITORIA E HISTÓRICO DE PROCESSAMENTO FISCAL'],
        ['ID do Relatório:', meta.reportId],
        ['Data de Emissão:', meta.nowStr],
        ['Emitido por:', `${meta.userName} (${meta.userEmail})`],
        ['Perfil de Acesso:', meta.userRole],
        ['Filtros Aplicados:', meta.filterStr],
        ['Total de Registros:', meta.totalRecords],
        ['Valor Total Faturado:', `R$ ${meta.totalValor.toFixed(2)}`],
        ['Total Tokens (Entrada / Saída):', `${meta.totalTokensEntrada} / ${meta.totalTokensSaida}`],
        ['Custo Total IA (USD):', `$ ${meta.totalCustoUsd.toFixed(5)}`],
        []
      ];

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + auditRows.map(e => e.join(";")).join("\n") + "\n"
        + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `auditoria_fiscal_${new Date().toISOString().split('T')[0]}_${meta.reportId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Relatório de auditoria ${meta.reportId} exportado com sucesso.`, 'success');
    } catch (err) {
      console.error('Erro ao exportar planilha:', err);
      showToast('Falha ao exportar planilha.', 'error');
    }
  };

  const exportToPDF = () => {
    try {
      const meta = generateAuditMetadata();
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Falha ao abrir janela de impressão. Verifique o bloqueador de pop-ups.', 'error');
        return;
      }

      const rowsHtml = filteredUsageLogs.map(log => {
        const valStr = log.valorFatura !== undefined && log.valorFatura !== null 
          ? 'R$ ' + log.valorFatura.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
          : 'N/D';
        const custoStr = log.custoUsd !== undefined && log.custoUsd !== null ? '$ ' + Number(log.custoUsd).toFixed(5) : 'N/D';
        return '<tr>' +
          '<td>#' + log.id + '</td>' +
          '<td>' + new Date(log.dataHora).toLocaleString('pt-BR') + '</td>' +
          '<td>' + (log.usuarioEmail || log.usuarioNome || 'SISTEMA') + '</td>' +
          '<td>' + (log.origem || 'E-mail Sync') + '</td>' +
          '<td>' + (log.arquivo || '') + '</td>' +
          '<td>' + (log.modeloIa || 'N/D') + '</td>' +
          '<td>' + (log.fornecedor || 'N/D') + '</td>' +
          '<td>' + (log.cnpjFornecedor || 'N/D') + '</td>' +
          '<td>' + (log.statusArquivo || 'Pendente') + '</td>' +
          '<td>' + (log.numeroDocumento || 'N/D') + '</td>' +
          '<td style="text-align: right;">' + valStr + '</td>' +
          '<td style="text-align: right;">' + (log.tokensEntrada || 0) + '</td>' +
          '<td style="text-align: right;">' + (log.tokensSaida || 0) + '</td>' +
          '<td style="text-align: right;">' + custoStr + '</td>' +
          '<td style="text-align: right;">' + (log.tempoProcessamentoMs || 0) + ' ms</td>' +
          '<td style="text-align: center;">' + (log.status || 'Sucesso') + '</td>' +
          '<td>' + (log.zeevId || 'N/D') + '</td>' +
          '</tr>';
      }).join('');

      const htmlContent = [
        '<html>',
        '<head>',
        '<title>Relatório de Auditoria - Stoque Fiscal Intelligence</title>',
        '<style>',
        '@page { size: landscape; margin: 8mm; }',
        'body { font-family: Arial, sans-serif; margin: 10px; color: #333; }',
        'h2 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; margin-bottom: 8px; font-size: 15px; }',
        '.audit-box { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 9px; line-height: 1.45; }',
        '.audit-row { display: flex; justify-content: space-between; margin-bottom: 3px; }',
        '.audit-divider { border-top: 1px solid #e2e8f0; margin: 4px 0; }',
        'table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 8px; table-layout: auto; }',
        'th, td { border: 1px solid #cbd5e1; padding: 4px 5px; text-align: left; word-break: break-word; }',
        'th { background-color: #f1f5f9; color: #1e293b; font-weight: bold; }',
        'tr:nth-child(even) { background-color: #f8fafc; }',
        '.footer { margin-top: 15px; font-size: 8px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 6px; }',
        '</style>',
        '</head>',
        '<body>',
        '<h2>Histórico de Processamento e Auditoria - Stoque Fiscal Intelligence</h2>',
        '<div class="audit-box">',
        '  <div class="audit-row">',
        '    <span><strong>ID do Relatório:</strong> ' + meta.reportId + '</span>',
        '    <span><strong>Sistema:</strong> Stoque Fiscal Intelligence v2.0 | <strong>Ambiente:</strong> Produção</span>',
        '  </div>',
        '  <div class="audit-row">',
        '    <span><strong>Solicitante:</strong> ' + meta.userName + ' (' + meta.userEmail + ') | <strong>Perfil:</strong> ' + meta.userRole + '</span>',
        '    <span><strong>Data de Emissão:</strong> ' + meta.nowStr + '</span>',
        '  </div>',
        '  <div class="audit-row">',
        '    <span><strong>Filtros Aplicados:</strong> ' + meta.filterStr + '</span>',
        '  </div>',
        '  <div class="audit-divider"></div>',
        '  <div class="audit-row" style="font-weight: bold; color: #1e3a8a;">',
        '    <span>Registros Exibidos: ' + meta.totalRecords + '</span>',
        '    <span>Total Faturado: R$ ' + meta.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span>',
        '    <span>Tokens Entr/Saí: ' + meta.totalTokensEntrada.toLocaleString('pt-BR') + ' / ' + meta.totalTokensSaida.toLocaleString('pt-BR') + '</span>',
        '    <span>Custo IA Total: $ ' + meta.totalCustoUsd.toFixed(5) + '</span>',
        '  </div>',
        '</div>',
        '<table>',
        '<thead>',
        '<tr>',
        '<th>ID</th>',
        '<th>Data/Hora</th>',
        '<th>Usuário</th>',
        '<th>Origem</th>',
        '<th>Arquivo</th>',
        '<th>Modelo IA</th>',
        '<th>Fornecedor</th>',
        '<th>CNPJ</th>',
        '<th>Status Fatura</th>',
        '<th>Nº Doc</th>',
        '<th style="text-align: right;">Valor</th>',
        '<th style="text-align: right;">Tk Entrada</th>',
        '<th style="text-align: right;">Tk Saída</th>',
        '<th style="text-align: right;">Custo ($)</th>',
        '<th style="text-align: right;">Tempo</th>',
        '<th style="text-align: center;">Status IA</th>',
        '<th>Zeev ID</th>',
        '</tr>',
        '</thead>',
        '<tbody>',
        rowsHtml,
        '</tbody>',
        '</table>',
        '<div class="footer">',
        'Este relatório foi gerado automaticamente pelo sistema Stoque Fiscal Intelligence. ID de Validação: ' + meta.reportId,
        '</div>',
        '<script>',
        'window.onload = function() {',
        'window.print();',
        'setTimeout(function() { window.close(); }, 500);',
        '};',
        '</script>',
        '</body>',
        '</html>'
      ].join('\n');

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      showToast('Falha ao exportar PDF.', 'error');
    }
  };

  return (
    <div className="fade-in" key="history" style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
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
              Histórico de Processamento
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={exportToExcel}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <FileSpreadsheet size={14} />
              Exportar Planilha
            </button>
            <button
              onClick={exportToPDF}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <FileText size={14} />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Painel de Indicadores Executivos e Auditoria */}
        {(() => {
          const totalCostUsd = filteredUsageLogs.reduce((acc, l) => acc + (l.custoUsd || 0), 0);
          const totalCostBrl = totalCostUsd * 5.65;
          const totalLatencyMs = filteredUsageLogs.reduce((acc, l) => acc + (parseInt(String(l.tempoProcessamentoMs)) || 0), 0);
          const avgLatencySec = filteredUsageLogs.length > 0 ? (totalLatencyMs / filteredUsageLogs.length / 1000).toFixed(2) : '0.00';

          const userCounts: Record<string, number> = {};
          filteredUsageLogs.forEach(l => {
            const key = l.usuarioEmail || l.usuarioNome || 'SISTEMA (E-mail)';
            userCounts[key] = (userCounts[key] || 0) + 1;
          });
          let topUser = 'Nenhum';
          let topUserCount = 0;
          Object.entries(userCounts).forEach(([u, count]) => {
            if (count > topUserCount) {
              topUserCount = count;
              topUser = u;
            }
          });

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div className="section-card" style={{ padding: '14px 18px', background: 'white', borderLeft: '4px solid #2563eb', margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Faturas no Filtro</span>
                  <FileText size={16} color="#2563eb" />
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', marginTop: '4px' }}>
                  {filteredUsageLogs.length} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280' }}>registros</span>
                </div>
              </div>

              <div className="section-card" style={{ padding: '14px 18px', background: 'white', borderLeft: '4px solid #10b981', margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Usuário Mais Ativo</span>
                  <UserCheck size={16} color="#10b981" />
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={topUser}>
                  {topUser}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>{topUserCount} ações registradas</span>
              </div>

              <div className="section-card" style={{ padding: '14px 18px', background: 'white', borderLeft: '4px solid #8b5cf6', margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Custo IA (Gemini)</span>
                  <DollarSign size={16} color="#8b5cf6" />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: '4px' }}>
                  ${totalCostUsd.toFixed(4)} USD
                </div>
                <span style={{ fontSize: '0.7rem', color: '#6d28d9', fontWeight: 600 }}>~ R$ {totalCostBrl.toFixed(2)} BRL</span>
              </div>

              <div className="section-card" style={{ padding: '14px 18px', background: 'white', borderLeft: '4px solid #f59e0b', margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Tempo Média IA</span>
                  <Clock size={16} color="#f59e0b" />
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', marginTop: '4px' }}>
                  {avgLatencySec} s
                </div>
                <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600 }}>Latência Média / Fatura</span>
              </div>
            </div>
          );
        })()}

        {/* Filtros de Busca */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '20px', 
          background: 'white', 
          padding: '16px', 
          borderRadius: '8px', 
          border: '1px solid #e5e7eb',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            className="filter-input-text"
            placeholder="Pesquisar por arquivo, fornecedor, doc ou usuário..."
            value={historySearchTerm}
            onChange={(e) => setHistorySearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '220px' }}
          />

          <select
            className="filter-select"
            value={historyModelFilter}
            onChange={(e) => setHistoryModelFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="">Todos os Modelos</option>
            {availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={historyUserFilter}
            onChange={(e) => setHistoryUserFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="">Todos os Usuários</option>
            {availableUsers.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={historyOriginFilter}
            onChange={(e) => setHistoryOriginFilter(e.target.value)}
            style={{ width: '140px' }}
          >
            <option value="">Todas as Origens</option>
            {availableOrigins.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <input
            type="date"
            className="filter-select"
            value={historyDateFilter}
            onChange={(e) => setHistoryDateFilter(e.target.value)}
            style={{ width: '140px' }}
            title="Filtrar por data exata de processamento"
          />

          <select
            className="filter-select"
            value={historyFileStatusFilter}
            onChange={(e) => setHistoryFileStatusFilter(e.target.value)}
            style={{ width: '140px' }}
          >
            <option value="">Status Fatura (Todos)</option>
            <option value="Pendente">Pendente</option>
            <option value="Validado">Validado</option>
            <option value="Arquivado">Arquivado</option>
            <option value="Excluído">Excluído</option>
          </select>

          <select
            className="filter-select"
            value={historyAiStatusFilter}
            onChange={(e) => setHistoryAiStatusFilter(e.target.value)}
            style={{ width: '130px' }}
          >
            <option value="">Status IA (Todos)</option>
            <option value="Sucesso">Sucesso</option>
            <option value="Falha">Falha</option>
          </select>

          {(historySearchTerm || historyModelFilter || historyUserFilter || historyOriginFilter || historyDateFilter || historyFileStatusFilter || historyAiStatusFilter) && (
            <button
              onClick={() => {
                setHistorySearchTerm('');
                setHistoryModelFilter('');
                setHistoryUserFilter('');
                setHistoryOriginFilter('');
                setHistoryDateFilter('');
                setHistoryFileStatusFilter('');
                setHistoryAiStatusFilter('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Tabela de Histórico */}
        <div 
                className="custom-scrollbar" 
                style={{ 
                  overflow: 'auto', 
                  maxHeight: 'calc(100vh - 270px)', 
                  width: '100%', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <table style={{ width: '100%', minWidth: '2150px', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '0.8rem', tableLayout: 'fixed' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr style={{ background: '#f9fafb' }}>
                      <th 
                        onClick={() => handleSortHistory('id')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'id' ? '#2563eb' : '#4b5563', width: '70px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por ID"
                      >
                        ID {historySortField === 'id' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('dataHora')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'dataHora' ? '#2563eb' : '#4b5563', width: '150px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Data/Hora"
                      >
                        Data/Hora {historySortField === 'dataHora' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('usuario')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'usuario' ? '#2563eb' : '#4b5563', width: '180px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Usuário Responsável"
                      >
                        Usuário Responsável {historySortField === 'usuario' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('origem')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'origem' ? '#2563eb' : '#4b5563', width: '130px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Origem"
                      >
                        Origem {historySortField === 'origem' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('arquivo')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'arquivo' ? '#2563eb' : '#4b5563', width: '200px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Nome do Arquivo"
                      >
                        Arquivo {historySortField === 'arquivo' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('modeloIa')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'modeloIa' ? '#2563eb' : '#4b5563', width: '120px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Modelo de IA"
                      >
                        Modelo {historySortField === 'modeloIa' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('fornecedor')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'fornecedor' ? '#2563eb' : '#4b5563', width: '250px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Fornecedor"
                      >
                        Fornecedor {historySortField === 'fornecedor' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('cnpj')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'cnpj' ? '#2563eb' : '#4b5563', width: '140px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por CNPJ do Fornecedor"
                      >
                        CNPJ {historySortField === 'cnpj' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('statusArquivo')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'statusArquivo' ? '#2563eb' : '#4b5563', textAlign: 'center', width: '140px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Status do Arquivo"
                      >
                        Status do Arquivo {historySortField === 'statusArquivo' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('numeroDocumento')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'numeroDocumento' ? '#2563eb' : '#4b5563', width: '130px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Número do Documento Fiscal"
                      >
                        Doc. Fiscal {historySortField === 'numeroDocumento' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('valorFatura')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'valorFatura' ? '#2563eb' : '#4b5563', textAlign: 'right', width: '130px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Valor da Fatura"
                      >
                        Vlr. Fatura {historySortField === 'valorFatura' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('tokensEntrada')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'tokensEntrada' ? '#2563eb' : '#4b5563', textAlign: 'center', width: '110px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Tokens de Entrada"
                      >
                        Tokens Ent. {historySortField === 'tokensEntrada' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('tokensSaida')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'tokensSaida' ? '#2563eb' : '#4b5563', textAlign: 'center', width: '110px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Tokens de Saída"
                      >
                        Tokens Saí. {historySortField === 'tokensSaida' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('custoUsd')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'custoUsd' ? '#2563eb' : '#4b5563', textAlign: 'center', width: '120px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Custo em USD"
                      >
                        Custo (USD) {historySortField === 'custoUsd' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('tempoMs')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'tempoMs' ? '#2563eb' : '#4b5563', textAlign: 'center', width: '110px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Tempo de Processamento"
                      >
                        Tempo (ms) {historySortField === 'tempoMs' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('statusIa')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'statusIa' ? '#2563eb' : '#4b5563', textAlign: 'center', width: '110px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Status da IA"
                      >
                        Status IA {historySortField === 'statusIa' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSortHistory('zeevId')}
                        style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: historySortField === 'zeevId' ? '#2563eb' : '#4b5563', textAlign: 'center', width: '120px', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por ID Zeev"
                      >
                        ID Zeev {historySortField === 'zeevId' ? (historySortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10, borderBottom: '2px solid #e5e7eb', padding: '12px 16px', fontWeight: 600, color: '#4b5563', textAlign: 'center', width: '150px' }}>
                        Visualização
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={18} style={{ padding: '48px 16px', textAlign: 'center', color: '#4b5563' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            <Loader2 size={28} className="animate-spin" style={{ color: '#2563eb' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Carregando histórico de auditoria...</span>
                            {isSlowLoadingHistory && (
                              <span style={{ fontSize: '0.75rem', color: '#b45309', backgroundColor: '#fef3c7', padding: '4px 12px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                                O carregamento está levando mais tempo que o usual. Aguarde a consolidação dos registros...
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : paginatedUsageLogs.length === 0 ? (
                      <tr>
                        <td colSpan={18} style={{ padding: '40px 16px', textAlign: 'center', color: '#6b7280' }}>
                          Nenhum registro de processamento encontrado.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsageLogs.map((log, index) => (
                        <tr 
                          key={log.id} 
                          className="history-row"
                          onClick={() => {
                            if (log.statusArquivo !== 'Excluído' && log.noteId) {
                              const foundNote = notes.find(n => n.id === log.noteId);
                              if (foundNote && foundNote.files.pdf) {
                                setHistoryPreviewPdfUrl(getFileUrl(foundNote.files.pdf));
                                setHistoryPreviewTitle(log.arquivo);
                              } else {
                                showToast('Arquivo físico PDF da fatura não foi localizado.', 'info');
                              }
                            }
                          }}
                          style={{ 
                            cursor: log.statusArquivo !== 'Excluído' ? 'pointer' : 'default',
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                          }}
                        >
                          <td style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 'bold' }}>
                            #{log.id}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#111827' }}>
                            {new Date(log.dataHora).toLocaleString('pt-BR')}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#1f2937', fontWeight: 500 }} title={log.usuarioEmail || log.usuarioNome}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <UserCheck size={13} color="#2563eb" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.usuarioEmail || log.usuarioNome || 'SISTEMA'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.7rem', 
                              fontWeight: 600, 
                              backgroundColor: log.origem === 'Upload Manual' ? '#eff6ff' : '#f0fdf4', 
                              color: log.origem === 'Upload Manual' ? '#1d4ed8' : '#15803d' 
                            }}>
                              {log.origem || 'E-mail Sync'}
                            </span>
                          </td>
                           <td 
                            className={log.statusArquivo !== 'Excluído' ? 'history-file-link' : ''}
                            style={{ 
                              padding: '12px 16px', 
                              color: log.statusArquivo !== 'Excluído' ? '#2563eb' : '#4b5563', 
                              textDecoration: log.statusArquivo !== 'Excluído' ? 'underline' : 'none',
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
                              background: log.statusArquivo === 'Excluído' ? '#fee2e2' : log.statusArquivo === 'Validado' ? '#d1fae5' : log.statusArquivo === 'Arquivado' ? '#f3f4f6' : '#fef3c7', 
                              color: log.statusArquivo === 'Excluído' ? '#b91c1c' : log.statusArquivo === 'Validado' ? '#065f46' : log.statusArquivo === 'Arquivado' ? '#4b5563' : '#b45309', 
                              border: `1px solid ${log.statusArquivo === 'Excluído' ? '#fecaca' : log.statusArquivo === 'Validado' ? '#a7f3d0' : log.statusArquivo === 'Arquivado' ? '#cbd5e1' : '#fde68a'}`,
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              fontSize: '0.72rem', 
                              fontWeight: 700 
                            }}>
                              {log.statusArquivo === 'Pendente' || !log.statusArquivo ? 'Pendente' : log.statusArquivo}
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
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  const foundNote = notes.find(n => n.id === log.noteId);
                                  if (foundNote && foundNote.files.pdf) {
                                    setHistoryPreviewPdfUrl(getFileUrl(foundNote.files.pdf));
                                    setHistoryPreviewTitle(log.arquivo);
                                  } else {
                                    showToast('Arquivo físico PDF da fatura não foi localizado.', 'info');
                                  }
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  color: '#1d4ed8',
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #dbeafe',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                                title="Visualizar PDF da fatura"
                              >
                                <FileText size={12} />
                                PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const foundNote = notes.find(n => n.id === log.noteId);
                                  if (foundNote) {
                                    setHistoryPreviewRateioNote(foundNote);
                                  } else {
                                    showToast('Dados de rateio contábil da fatura não foram localizados.', 'info');
                                  }
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  color: '#047857',
                                  backgroundColor: '#ecfdf5',
                                  border: '1px solid #a7f3d0',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                                title="Visualizar planilha de rateio contábil (.xlsx)"
                              >
                                <FileSpreadsheet size={12} />
                                Rateio
                              </button>
                              {log.statusArquivo === 'Arquivado' ? (
                                <button
                                  type="button"
                                  onClick={() => { if (log.noteId) onUnarchiveNote(log.noteId); }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: '#4b5563',
                                    backgroundColor: '#f3f4f6',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                  title="Desarquivar fatura para reabrir curadoria"
                                >
                                  Restaurar
                                </button>
                              ) : log.statusArquivo !== 'Excluído' && (
                                <button
                                  type="button"
                                  onClick={() => { if (log.noteId) onArchiveNote(log.noteId); }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: '#6b7280',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                  title="Arquivar fatura"
                                >
                                  Arquivar
                                </button>
                              )}
                            </div>
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

        {/* Modal de Pré-visualização do PDF no Histórico */}
        {historyPreviewPdfUrl && (
          <div 
            className="modal-overlay" 
            onClick={() => setHistoryPreviewPdfUrl(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999
            }}
          >
            <div 
              className="modal-container" 
              onClick={(e) => e.stopPropagation()}
              style={{ 
                width: '80%', 
                height: '85%', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden'
              }}
            >
              <div 
                className="modal-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                  Visualização do Arquivo: {historyPreviewTitle}
                </h3>
                <button 
                  className="modal-close-btn" 
                  onClick={() => setHistoryPreviewPdfUrl(null)}
                  style={{ 
                    fontSize: '1.5rem', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: '0 8px',
                    color: '#9ca3af',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#111827'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
                <iframe 
                  src={historyPreviewPdfUrl} 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Visualizador de PDF no Histórico"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal de Pré-visualização do Rateio Excel a partir do Histórico */}
        <RateioPreviewModal 
          isOpen={!!historyPreviewRateioNote} 
          onClose={() => setHistoryPreviewRateioNote(null)} 
          selectedNote={historyPreviewRateioNote} 
          onDownload={() => {
            if (historyPreviewRateioNote) {
              const excelFile = historyPreviewRateioNote.files?.excel || `${historyPreviewRateioNote.id}/${historyPreviewRateioNote.id}.xlsx`;
              const downloadUrl = getFileUrl(excelFile);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = `${historyPreviewRateioNote.id}_rateio.xlsx`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }} 
        />
      </div>
    </div>
  );
};
