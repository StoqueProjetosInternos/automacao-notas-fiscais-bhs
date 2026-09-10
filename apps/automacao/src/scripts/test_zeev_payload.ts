import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs';

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

  if (!apiUrl || !token) {
    console.error('Configuracoes ausentes no .env');
    return;
  }

  token = token.trim().replace(/^["']|["']$/g, '');
  const url = `${apiUrl.replace(/\/$/, '')}/api/2/instances`;

  const folderPath = path.resolve(__dirname, '../../../../data/extracted/JM FIBRA COMUNICACAO MULTIMIDIA LTDA_2970_2026-08-17');
  const pdfPath = path.join(folderPath, 'JM FIBRA COMUNICACAO MULTIMIDIA LTDA_2970_2026-08-17.pdf');
  const excelPath = path.join(folderPath, 'JM FIBRA COMUNICACAO MULTIMIDIA LTDA_2970_2026-08-17.xlsx');

  const pdfBase64 = fs.existsSync(pdfPath) ? fs.readFileSync(pdfPath).toString('base64') : '';
  const excelBase64 = fs.existsSync(excelPath) ? fs.readFileSync(excelPath).toString('base64') : '';

  const formFields = [
    { name: 'possuiContrato', value: 'Não' },
    { name: 'tipoDeContrato', value: 'Fixo' },
    { name: 'possuiPedidoDeCompra', value: 'Não' },
    { name: 'numeroDoPedidoDeCompra', value: '-' },
    { name: 'esteGastoEstaOrcado', value: 'Não' },
    { name: 'codigoDoOrcamento', value: '-' },
    { name: 'possuiRateio', value: 'Sim' },
    { name: 'cRPrincipal', value: '1103' },
    { name: 'diretorHead', value: 'Helder Venancio Marques' },
    { name: 'confimacaoDeExtensaoCorretaDoArquivoDeRateio', value: 'Confirmo que baixei o modelo disponível no link acima' },
    { name: 'naturezaDaRequisicao', value: '141401011' },
    { name: 'finalidadeDoServico', value: 'Faturamento de serviços - JM FIBRA' },
    { name: 'localOndeOServicoFoiRealizado', value: 'Stoque BH' },
    { name: 'tipoDeDocumento', value: 'Nota Fiscal' },
    { name: 'numeroUnicoDaNF', value: '2970' },
    { name: 'dataDeEmissaoDaNF', value: '2026-08-13' },
    { name: 'nomeDaEmpresa', value: 'JM FIBRA COMUNICACAO MULTIMIDIA LTDA' },
    { name: 'cnpj', value: '40955623000132' },
    { name: 'tomadorDoServico', value: 'STOQUE SOLUCOES TECNOLOGICAS SA' },
    { name: 'dataDeVencimento', value: '2026-08-20' },
    { name: 'urgenciaDePagamento', value: 'Normal' },
    { name: 'dataLimiteDePagamentoEmCasoDeUrgencia', value: '2026-08-20' },
    { name: 'formaDePagamento', value: 'Boleto/Fatura' },
    { name: 'chavePix', value: '-' },
    { name: 'nomeDoBanco', value: '-' },
    { name: 'agencia', value: '0' },
    { name: 'numeroDaConta', value: '0' },
    { name: 'valorTotal', value: '109.90' },
    { name: 'possuiParcelamento', value: 'Não' },
    { name: 'valorDaPrimeiraParcela', value: '109.90' },
    { name: 'parcela', value: '2' },
    { name: 'vencimentoDaParcela', value: '2026-08-20' },
    { name: 'pessoaResponsavel', value: rawEmail },
    { name: 'origem', value: 'IA' }
  ];

  const files = [
    {
      filename: 'JM_FIBRA_2970.pdf',
      resume: 'PDF original da fatura - JM FIBRA (NF 2970)',
      requesterCanSee: true,
      docType: 'anexarArquivo',
      base64Content: pdfBase64
    },
    {
      filename: 'JM_FIBRA_2970_boleto.pdf',
      resume: 'Boleto bancário de cobrança - JM FIBRA',
      requesterCanSee: true,
      docType: 'anexarBoleto',
      base64Content: pdfBase64
    },
    {
      filename: 'rateio_2970.xlsx',
      resume: 'Planilha de rateio contábil consolidada SFI - CR 1103',
      requesterCanSee: true,
      docType: 'rateio',
      base64Content: excelBase64
    }
  ];

  console.log('Testando envio com files + formFields...');
  try {
    const response = await axios.post(url, {
      flowId,
      isSimulation: true,
      formFields,
      files
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000
    });
    console.log('[SUCESSO TOTAL] Resposta:', JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    console.log('[ERRO]', err.response?.status, JSON.stringify(err.response?.data || err.message, null, 2));
  }
}

testZeevWithRN00Fields();

