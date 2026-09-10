import React, { useMemo } from 'react';
import { 
  DollarSign, 
  Cpu, 
  Clock, 
  FileText, 
  Layers, 
  ArrowLeft,
  Building2,
  PieChart
} from 'lucide-react';
import type { Note } from '../types';
import type { UsageLog } from '../services/api';

interface ExecutiveAnalyticsProps {
  notes: Note[];
  usageLogs: UsageLog[];
  onBackToNotes: () => void;
}

export const ExecutiveAnalytics: React.FC<ExecutiveAnalyticsProps> = ({
  notes,
  usageLogs,
  onBackToNotes
}) => {
  const metrics = useMemo(() => {
    const totalInvoices = notes.length;
    const validatedInvoices = notes.filter(n => n.data.status === 'validado').length;
    const pendingInvoices = notes.filter(n => n.data.status !== 'validado' && n.data.status !== 'arquivado').length;
    const approvalRate = totalInvoices > 0 ? ((validatedInvoices / totalInvoices) * 100).toFixed(1) : '0';

    const totalValue = notes.reduce((acc, n) => {
      const val = Number(n.data.financial?.chargedValue || n.data.financial?.originalValue || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const validatedValue = notes
      .filter(n => n.data.status === 'validado')
      .reduce((acc, n) => {
        const val = Number(n.data.financial?.chargedValue || n.data.financial?.originalValue || 0);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

    const totalCostUsd = usageLogs.reduce((acc, l) => acc + (Number(l.custoUsd) || 0), 0);
    const avgCostPerInvoiceUsd = usageLogs.length > 0 ? (totalCostUsd / usageLogs.length).toFixed(4) : '0.0000';
    const totalCostBrl = totalCostUsd * 5.65;

    const latencies = usageLogs
      .map(l => parseInt(String(l.tempoProcessamentoMs), 10))
      .filter(ms => !isNaN(ms) && ms > 0);
    const avgLatencySec = latencies.length > 0 
      ? (latencies.reduce((a, b) => a + b, 0) / latencies.length / 1000).toFixed(1)
      : '0.0';

    const supplierMap: Record<string, { value: number; count: number }> = {};
    notes.forEach(n => {
      const name = n.data.supplier?.name || 'DESCONHECIDO';
      const val = Number(n.data.financial?.chargedValue || n.data.financial?.originalValue || 0);
      if (!supplierMap[name]) supplierMap[name] = { value: 0, count: 0 };
      supplierMap[name].value += isNaN(val) ? 0 : val;
      supplierMap[name].count += 1;
    });

    const topSuppliers = Object.entries(supplierMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const modelMap: Record<string, { count: number; cost: number; tokens: number; latencySum: number }> = {};
    usageLogs.forEach(l => {
      const model = l.modeloIa || 'gemini-2.5-flash';
      if (!modelMap[model]) modelMap[model] = { count: 0, cost: 0, tokens: 0, latencySum: 0 };
      modelMap[model].count += 1;
      modelMap[model].cost += Number(l.custoUsd) || 0;
      modelMap[model].tokens += (l.tokensEntrada || 0) + (l.tokensSaida || 0);
      const lat = parseInt(String(l.tempoProcessamentoMs), 10);
      if (!isNaN(lat)) modelMap[model].latencySum += lat;
    });

    const modelsSummary = Object.entries(modelMap).map(([name, d]) => ({
      name,
      count: d.count,
      cost: d.cost,
      tokens: d.tokens,
      avgLatencySec: d.count > 0 ? (d.latencySum / d.count / 1000).toFixed(1) : '0.0'
    }));

    const crMap: Record<string, number> = {};
    notes.forEach(n => {
      if (n.data.apportionment && n.data.apportionment.length > 0) {
        n.data.apportionment.forEach((item: any) => {
          const crLabel = item.cr ? `${item.cr} - ${item.crDescription || 'Geral'}` : (n.data.accountingFields?.cr ? `${n.data.accountingFields.cr} - ${n.data.accountingFields.crDescription || 'Geral'}` : '1103 - Sistemas');
          crMap[crLabel] = (crMap[crLabel] || 0) + Number(item.value || 0);
        });
      } else {
        const crLabel = n.data.accountingFields?.cr ? `${n.data.accountingFields.cr} - ${n.data.accountingFields.crDescription || 'Geral'}` : '1103 - Sistemas';
        const val = Number(n.data.financial?.chargedValue || n.data.financial?.originalValue || 0);
        crMap[crLabel] = (crMap[crLabel] || 0) + val;
      }
    });

    const topCRs = Object.entries(crMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalInvoices,
      validatedInvoices,
      pendingInvoices,
      approvalRate,
      totalValue,
      validatedValue,
      totalCostUsd,
      totalCostBrl,
      avgCostPerInvoiceUsd,
      avgLatencySec,
      topSuppliers,
      modelsSummary,
      topCRs
    };
  }, [notes, usageLogs]);

  return (
    <div className="fade-in" style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Cabeçalho Executivo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onBackToNotes}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: 'white',
                color: '#334155',
                cursor: 'pointer'
              }}
              title="Voltar para faturas"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Painel Executivo e Indicadores
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Visão consolidada de volume financeiro, funil de aprovação e eficiência operacional da IA
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e2e8f0', padding: '4px 12px', borderRadius: '20px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Dados Atualizados em Tempo Real</span>
          </div>
        </div>

        {/* Linha de 4 Cartões de KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          
          {/* Card 1: Volume Financeiro */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>VOLUME TOTAL PROCESSADO</span>
              <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              R$ {metrics.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <span>Validado Zeev: <b style={{ color: '#16a34a' }}>R$ {metrics.validatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
            </div>
          </div>

          {/* Card 2: Faturas & Conversão */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL DE DOCUMENTOS</span>
              <div style={{ padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '8px', color: '#16a34a' }}>
                <FileText size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              {metrics.totalInvoices} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>faturas</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <span>Taxa de Aprovação: <b style={{ color: '#2563eb' }}>{metrics.approvalRate}%</b></span>
              <span>Pendentes: <b>{metrics.pendingInvoices}</b></span>
            </div>
          </div>

          {/* Card 3: Investimento em IA */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>CUSTO ACUMULADO IA</span>
              <div style={{ padding: '8px', backgroundColor: '#faf5ff', borderRadius: '8px', color: '#9333ea' }}>
                <Cpu size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              ${metrics.totalCostUsd.toFixed(4)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>USD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <span>Méd/Fatura: <b style={{ color: '#9333ea' }}>${metrics.avgCostPerInvoiceUsd}</b></span>
              <span>Equiv: <b>~R$ {metrics.totalCostBrl.toFixed(2)}</b></span>
            </div>
          </div>

          {/* Card 4: Tempo Médio de Processamento */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TEMPO MÉDIO DE EXTRAÇÃO</span>
              <div style={{ padding: '8px', backgroundColor: '#fff7ed', borderRadius: '8px', color: '#ea580c' }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              {metrics.avgLatencySec}s <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>por fatura</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <span>Operação: <b style={{ color: '#16a34a' }}>100% Automatizada</b></span>
              <span>Economia: <b>~95% de tempo</b></span>
            </div>
          </div>

        </div>

        {/* Grade 2x2 de Gráficos e Visões Detalhadas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
          
          {/* Gráfico 1: Top Fornecedores em R$ */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Building2 size={18} color="#2563eb" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Top Fornecedores por Volume Financeiro
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {metrics.topSuppliers.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Nenhum fornecedor registrado.</span>
              ) : (
                metrics.topSuppliers.map((sup, idx) => {
                  const pct = metrics.totalValue > 0 ? (sup.value / metrics.totalValue) * 100 : 0;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{sup.name}</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          R$ {sup.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Gráfico 2: Alocação por Centro de Resultado (CR) */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Layers size={18} color="#16a34a" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Distribuição Contábil por Centro de Resultado (CR)
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {metrics.topCRs.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Nenhum rateio registrado.</span>
              ) : (
                metrics.topCRs.map((cr, idx) => {
                  const pct = metrics.totalValue > 0 ? (cr.value / metrics.totalValue) * 100 : 0;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{cr.label}</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          R$ {cr.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#16a34a', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Gráfico 3: Funil de Status Operacional */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <PieChart size={18} color="#9333ea" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Status do Funil Operacional
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden', width: '100%' }}>
                <div 
                  style={{ 
                    width: `${metrics.totalInvoices > 0 ? (metrics.validatedInvoices / metrics.totalInvoices) * 100 : 0}%`, 
                    backgroundColor: '#16a34a' 
                  }} 
                  title={`Validadas: ${metrics.validatedInvoices}`} 
                />
                <div 
                  style={{ 
                    width: `${metrics.totalInvoices > 0 ? (metrics.pendingInvoices / metrics.totalInvoices) * 100 : 0}%`, 
                    backgroundColor: '#eab308' 
                  }} 
                  title={`Pendentes: ${metrics.pendingInvoices}`} 
                />
                <div 
                  style={{ 
                    width: `${metrics.totalInvoices > 0 ? ((metrics.totalInvoices - metrics.validatedInvoices - metrics.pendingInvoices) / metrics.totalInvoices) * 100 : 0}%`, 
                    backgroundColor: '#94a3b8' 
                  }} 
                  title="Arquivadas / Outras" 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16a34a' }}></div>
                  <span style={{ fontSize: '0.8rem', color: '#334155' }}>Validadas Zeev: <b>{metrics.validatedInvoices}</b></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
                  <span style={{ fontSize: '0.8rem', color: '#334155' }}>Pendentes: <b>{metrics.pendingInvoices}</b></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '0.8rem', color: '#334155' }}>Outras: <b>{metrics.totalInvoices - metrics.validatedInvoices - metrics.pendingInvoices}</b></span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico 4: Performance e Custo por Modelo de IA */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Cpu size={18} color="#ea580c" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Auditoria de Modelos de IA
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '8px 4px' }}>Modelo</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Requisições</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Tempo Médio</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Custo Total</th>
                </tr>
              </thead>
              <tbody>
                {metrics.modelsSummary.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '12px 4px', textAlign: 'center', color: '#94a3b8' }}>Nenhum log de modelo registrado.</td>
                  </tr>
                ) : (
                  metrics.modelsSummary.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 4px', fontWeight: 600, color: '#1e293b' }}>{m.name}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>{m.count}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>{m.avgLatencySec}s</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>${m.cost.toFixed(4)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};
