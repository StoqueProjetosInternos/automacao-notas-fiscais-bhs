import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs';
import { generateRateioExcel } from '../features/excel/generateRateioExcel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function testExactBinding() {
  const apiUrl = process.env.ZEEV_API_URL || 'https://corporativo.orquestrabpm.com.br';
  let token = process.env.ZEEV_API_TOKEN;
  if (!token) return;
  token = token.trim().replace(/^["']|["']$/g, '');

  const folderPath = path.resolve(__dirname, '../../../../data/extracted/JM FIBRA COMUNICACAO MULTIMIDIA LTDA_2970_2026-08-17');
  const jsonPath = path.join(folderPath, 'JM FIBRA COMUNICACAO MULTIMIDIA LTDA_2970_2026-08-17.json');
  const pdfPath = path.join(folderPath, 'JM FIBRA COMUNICACAO MULTIMIDIA LTDA_2970_2026-08-17.pdf');

  const boletoData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // 1. Gera Excel com novo layout (Linha 1 = Cabeçalhos)
  const generatedExcelPath = await generateRateioExcel(boletoData, folderPath);
  const rateioFileName = 'rateio_2970.xlsx';
  const docFiscalFileName = 'JM_FIBRA_2970.pdf';
  const boletoFileName = 'JM_FIBRA_2970_boleto.pdf';

  const pdfBase64 = fs.existsSync(pdfPath) ? fs.readFileSync(pdfPath).toString('base64') : '';
  const excelBase64 = fs.existsSync(generatedExcelPath) ? fs.readFileSync(generatedExcelPath).toString('base64') : '';

  const formFields = [
    { id: 34765, name: 'possuiContrato', value: 'Não' },
    { id: 34766, name: 'tipoDeContrato', value: 'Fixo' },
    { id: 34778, name: 'possuiPedidoDeCompra', value: 'Não' },
    { id: 34783, name: 'numeroDoPedidoDeCompra', value: '-' },
    { id: 34776, name: 'esteGastoEstaOrcado', value: 'Não' },
    { id: 34777, name: 'codigoDoOrcamento', value: '-' },
    { id: 34784, name: 'possuiRateio', value: 'Sim' },
    { id: 34749, name: 'cRPrincipal', value: '1103' },
    { id: 34788, name: 'diretorHead', value: 'Helder Venancio Marques' },
    { id: 34752, name: 'confimacaoDeExtensaoCorretaDoArquivoDeRateio', value: 'Confirmo que baixei o modelo disponível no link acima' },
    { id: 34744, name: 'rateio', value: rateioFileName },
    { id: 34760, name: 'naturezaDaRequisicao', value: '141401011 - Internet' },
    { id: 34761, name: 'finalidadeDoServico', value: 'Faturamento de serviços - JM FIBRA' },
    { id: 34762, name: 'localOndeOServicoFoiRealizado', value: 'Stoque BH' },
    { id: 34740, name: 'tipoDeDocumento', value: 'Nota Fiscal' },
    { id: 34779, name: 'numeroUnicoDaNF', value: '2970' },
    { id: 34746, name: 'dataDeEmissaoDaNF', value: '13/08/2026' },
    { id: 34763, name: 'nomeDaEmpresa', value: 'JM FIBRA COMUNICACAO MULTIMIDIA LTDA' },
    { id: 34764, name: 'cnpj', value: '40.955.623/0001-32' },
    { id: 34750, name: 'tomadorDoServico', value: 'STOQUE SOLUCOES TECNOLOGICAS SA' },
    { id: 34767, name: 'dataDeVencimento', value: '20/08/2026' },
    { id: 34768, name: 'urgenciaDePagamento', value: 'Normal' },
    { id: 34747, name: 'dataLimiteDePagamentoEmCasoDeUrgencia', value: '20/08/2026' },
    { id: 34769, name: 'formaDePagamento', value: 'Boleto/Fatura' },
    { id: 34753, name: 'chavePix', value: '-' },
    { id: 34770, name: 'nomeDoBanco', value: '-' },
    { id: 34771, name: 'agencia', value: '0' },
    { id: 34772, name: 'numeroDaConta', value: '0' },
    { id: 34775, name: 'valorTotal', value: '109.90' },
    { id: 34754, name: 'possuiParcelamento', value: 'Não' },
    { id: 34745, name: 'valorDaPrimeiraParcela', value: '109.90' },
    { id: 34755, name: 'parcela', value: '2' },
    { id: 34785, name: 'vencimentoDaParcela', value: '20/08/2026' },
    { id: 34741, name: 'controleDeExibicaoDosCamposDaNF', value: 'Sim' },
    { id: 34789, name: 'pessoaResponsavel', value: 'hugo.bhs@stoque.com.br' },
    { id: 34790, name: 'origem', value: 'IA' }
  ];

  const files = [
    {
      filename: docFiscalFileName,
      resume: 'Documento Fiscal / Comprovante - JM FIBRA (NF 2970)',
      requesterCanSee: true,
      docType: 'anexarArquivo',
      base64Content: pdfBase64
    },
    {
      filename: boletoFileName,
      resume: 'Boleto / Fatura - JM FIBRA',
      requesterCanSee: true,
      docType: 'anexarBoleto',
      base64Content: pdfBase64
    },
    {
      filename: rateioFileName,
      resume: 'Rateio - Planilha consolidada SFI - CR 1103',
      requesterCanSee: true,
      docType: 'rateio',
      base64Content: excelBase64
    }
  ];

  console.log('Enviando requisição com rateio no formFields + docType: rateio + novo layout Excel...');
  try {
    const res = await axios.post(`${apiUrl.replace(/\/$/, '')}/api/2/instances`, {
      flowId: 2149,
      isSimulation: false,
      formFields,
      files
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('[SUCESSO INSTANCIA CRIADA]', res.data);
  } catch (err: any) {
    console.log('[ERRO]', err.response?.status, err.response?.data || err.message);
  }
}

testExactBinding();












































