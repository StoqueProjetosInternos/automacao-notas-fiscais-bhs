import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function testZeevWithRN00Fields() {
  const apiUrl = process.env.ZEEV_API_URL;
  let token = process.env.ZEEV_API_TOKEN;
  const flowIdStr = process.env.ZEEV_FLOW_ID || '2149';
  const flowId = parseInt(flowIdStr, 10);
  const rawEmail = process.env.ZEEV_REQUESTER || 'hugo.bhs@stoque.com.br';
  const rawLogin = rawEmail.split('@')[0]; // "hugo.bhs"

  if (!apiUrl || !token) {
    console.error('Configuracoes ausentes no .env');
    return;
  }

  token = token.trim().replace(/^["']|["']$/g, '');
  const url = `${apiUrl.replace(/\/$/, '')}/api/2/instances`;

  const formFieldsBase = [
    { name: 'possuiContrato', value: 'Não' },
    { name: 'tipoDeContrato', value: 'Fixo' },
    { name: 'possuiPedidoDeCompra', value: 'Não' },
    { name: 'numeroDoPedidoDeCompra', value: '-' },
    { name: 'esteGastoEstaOrcado', value: 'Não' },
    { name: 'codigoDoOrcamento', value: '-' },
    { name: 'possuiRateio', value: 'Sim' },
    { name: 'cRPrincipal', value: '1103' },
    { name: 'diretorHead', value: 'Helder Venancio Marques' },
    { name: 'naturezaDaRequisicao', value: '141401011' },
    { name: 'finalidadeDoServico', value: 'Faturamento de serviços - Teste SFI' },
    { name: 'localOndeOServicoFoiRealizado', value: 'Stoque BH' },
    { name: 'tipoDeDocumento', value: 'Nota Fiscal' },
    { name: 'numeroUnicoDaNF', value: '2053026782' },
    { name: 'dataDeEmissaoDaNF', value: '09/07/2026' },
    { name: 'nomeDaEmpresa', value: 'Telefônica Brasil S/A' },
    { name: 'cnpj', value: '02558157000162' },
    { name: 'tomadorDoServico', value: 'Stoque' },
    { name: 'dataDeVencimento', value: '09/07/2026' },
    { name: 'urgenciaDePagamento', value: 'Normal' },
    { name: 'dataLimiteDePagamentoEmCasoDeUrgencia', value: '09/07/2026' },
    { name: 'formaDePagamento', value: 'Boleto/Fatura' },
    { name: 'chavePix', value: '-' },
    { name: 'nomeDoBanco', value: '-' },
    { name: 'agencia', value: '0' },
    { name: 'numeroDaConta', value: '0' },
    { name: 'valorTotal', value: '3853.81' },
    { name: 'possuiParcelamento', value: 'Não' },
    { name: 'valorDaPrimeiraParcela', value: '3853.81' },
    { name: 'parcela', value: '2' },
    { name: 'vencimentoDaParcela', value: '09/07/2026' }
  ];

  const tests = [
    {
      label: 'Teste 1: pessoaResponsavel = login ("hugo.bhs") + origem = "IA"',
      fields: [
        ...formFieldsBase,
        { name: 'pessoaResponsavel', value: rawLogin },
        { name: 'origem', value: 'IA' }
      ]
    },
    {
      label: 'Teste 2: pessoaResponsavel = email ("hugo.bhs@stoque.com.br") + origem = "IA"',
      fields: [
        ...formFieldsBase,
        { name: 'pessoaResponsavel', value: rawEmail },
        { name: 'origem', value: 'IA' }
      ]
    },
    {
      label: 'Teste 3: pessoaResponsavel = login + origem = "Automação"',
      fields: [
        ...formFieldsBase,
        { name: 'pessoaResponsavel', value: rawLogin },
        { name: 'origem', value: 'Automação' }
      ]
    },
    {
      label: 'Teste 4: pessoaResponsavel = email + origem = "Automação"',
      fields: [
        ...formFieldsBase,
        { name: 'pessoaResponsavel', value: rawEmail },
        { name: 'origem', value: 'Automação' }
      ]
    }
  ];

  for (const t of tests) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Executando: ${t.label}...`);
    try {
      const response = await axios.post(url, {
        flowId,
        isSimulation: true,
        formFields: t.fields
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 20000
      });
      console.log(`[SUCESSO] Instância simulada com sucesso! Resposta:`, JSON.stringify(response.data, null, 2));
      return;
    } catch (err: any) {
      console.log(`[FALHA] Status ${err.response?.status}:`, err.response?.data?.error?.message || err.message);
      if (err.response?.data?.error?.details) {
        console.log('Detalhes:', JSON.stringify(err.response.data.error.details, null, 2));
      }
    }
  }
}

testZeevWithRN00Fields();
