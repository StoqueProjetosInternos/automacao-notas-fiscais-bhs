import fs from 'fs';
import path from 'path';
import { FILES_DIR } from '../config/paths.js';
import { ZeevClient } from '../../infra/zeev/zeevClient.js';
import { generateRateioExcel } from '../../features/excel/generateRateioExcel.js';

/**
 * Converte qualquer formato de data para o padrão DD/MM/YYYY exigido pelos formulários do Zeev.
 */
function formatZeevDate(dateVal?: string): string {
  if (!dateVal || typeof dateVal !== 'string') {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  const clean = dateVal.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const [yyyy, mm, dd] = clean.slice(0, 10).split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return clean;
}

/**
 * Aplica máscara padrão de CNPJ/CPF exigida pelos validadores do Zeev.
 */
function formatCnpj(raw?: string): string {
  if (!raw) return '00.000.000/0000-00';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  return raw;
}

const ZEEV_FIELD_IDS: Record<string, number> = {
  possuiContrato: 34765,
  tipoDeContrato: 34766,
  possuiPedidoDeCompra: 34778,
  numeroDoPedidoDeCompra: 34783,
  esteGastoEstaOrcado: 34776,
  codigoDoOrcamento: 34777,
  possuiRateio: 34784,
  cRPrincipal: 34749,
  diretorHead: 34788,
  confimacaoDeExtensaoCorretaDoArquivoDeRateio: 34752,
  rateio: 34744,
  anexarArquivo: 34774,
  anexarBoleto: 34773,
  validarRateio: 34759,
  naturezaDaRequisicao: 34760,
  finalidadeDoServico: 34761,
  localOndeOServicoFoiRealizado: 34762,
  tipoDeDocumento: 34740,
  numeroUnicoDaNF: 34779,
  dataDeEmissaoDaNF: 34746,
  nomeDaEmpresa: 34763,
  cnpj: 34764,
  tomadorDoServico: 34750,
  dataDeVencimento: 34767,
  urgenciaDePagamento: 34768,
  dataLimiteDePagamentoEmCasoDeUrgencia: 34747,
  formaDePagamento: 34769,
  chavePix: 34753,
  nomeDoBanco: 34770,
  agencia: 34771,
  numeroDaConta: 34772,
  valorTotal: 34775,
  possuiParcelamento: 34754,
  valorDaPrimeiraParcela: 34745,
  parcela: 34755,
  vencimentoDaParcela: 34785,
  controleDeExibicaoDosCamposDaNF: 34741,
  aprovadorDoCR: 34739,
  pessoaResponsavel: 34789,
  origem: 34790
};

export class ZeevService {
  /**
   * Executa a simulação de integração com o Zeev no modo Dry-Run.
   * Mapeia os dados da nota fiscal, lê os arquivos em disco e gera o JSON de payload na pasta local.
   */
  public static async generateDryRunPayload(id: string, noteData: any): Promise<any> {
    const folderPath = path.join(FILES_DIR, id);
    console.log(`[ZeevService] Iniciando estruturação do payload Zeev para fatura: ${id}`);

    try {
      // 1. Leitura do PDF da nota
      const pdfPath = path.join(folderPath, `${id}.pdf`);
      if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF original da fatura não encontrado no servidor em: ${pdfPath}`);
      }
      const pdfBase64 = fs.readFileSync(pdfPath).toString('base64');

      // 1.1. Leitura de boleto específico ou fallback para o PDF principal
      const boletoPath = path.join(folderPath, `${id}_boleto.pdf`);
      const boletoBase64 = fs.existsSync(boletoPath)
        ? fs.readFileSync(boletoPath).toString('base64')
        : pdfBase64;

      // 1.2. Regeração dinâmica da planilha de rateio com os dados consolidados atuais
      await generateRateioExcel(noteData, folderPath);

      // 2. Leitura da planilha Excel de rateio
      const excelPath = path.join(folderPath, `${id}.xlsx`);
      if (!fs.existsSync(excelPath)) {
        throw new Error(`Planilha de rateio (.xlsx) não encontrada no servidor em: ${excelPath}`);
      }
      const excelBase64 = fs.readFileSync(excelPath).toString('base64');

      // 3. Mapeamento estrito do tipo de documento conforme atributos do Zeev
      const documentTypeMap: Record<string, string> = {
        'nota_fiscal': 'Nota Fiscal',
        'notafiscal': 'Nota Fiscal',
        'nf': 'Nota Fiscal',
        'nfse': 'Nota Fiscal',
        'nfe': 'Nota Fiscal',
        'boleto': 'Boleto',
        'recibo': 'Recibo',
        'invoice': 'Invoice'
      };
      const rawDocType = String(noteData.documentType || 'nota_fiscal').toLowerCase().trim();
      const zeevDocType = documentTypeMap[rawDocType] || 'Nota Fiscal';

      // 4. Formatação de valores monetários e resolução segura de dados
      const totalRaw = 
        noteData.financial?.originalValue || 
        noteData.financial?.chargedValue || 
        noteData.financial?.totalValue || 
        noteData.financial?.value || 
        noteData.valorTotal || 
        0;
      const formattedTotal = Number(totalRaw).toFixed(2);

      // Resolução dos identificadores de documento e fornecedor no modelo BoletoData
      const rawDocNumber = 
        noteData.documentIdentifiers?.documentNumber || 
        noteData.documentIdentifiers?.ourNumber || 
        noteData.invoiceNumber || 
        noteData.documentNumber || 
        noteData.numeroDocumento || 
        '0';
      const cleanDocNumber = String(rawDocNumber).replace(/\D/g, '') || '0';

      const rawCnpj = 
        noteData.supplier?.cnpjCpf || 
        noteData.supplier?.cnpj || 
        noteData.beneficiary?.cnpjCpf || 
        noteData.issuer?.cnpj || 
        noteData.cnpj || 
        '00000000000000';
      const formattedCnpj = formatCnpj(rawCnpj);

      const supplierName = (
        noteData.supplier?.name || 
        noteData.beneficiary?.name || 
        noteData.issuer?.name || 
        'Fornecedor Desconhecido'
      ).trim();

      const tomadorName = (
        noteData.payer?.name || 
        noteData.recipient?.name || 
        'STOQUE SOLUCOES TECNOLOGICAS SA'
      ).trim();

      const issueDateRaw = 
        noteData.financial?.issueDate || 
        noteData.documentIdentifiers?.issueDate || 
        noteData.issueDate || 
        noteData.financial?.dueDate;
      const formattedIssueDate = formatZeevDate(issueDateRaw);
      const formattedDueDate = formatZeevDate(noteData.financial?.dueDate);

      const rawNatureCode = noteData.accountingFields?.naturezaCode || '141401013';
      const rawNatureDesc = noteData.accountingFields?.naturezaDescription || 'Energia Elétrica';
      const natureFormatted = rawNatureCode.includes('-') 
        ? rawNatureCode 
        : `${rawNatureCode} - ${rawNatureDesc}`;

      // 5. Mensagem descritiva da IA para auditoria
      const aiSummaryMessage = [
        `[SFI - Automação IA Google Gemini]`,
        `Processado automaticamente em: ${new Date().toLocaleString('pt-BR')}`,
        `Fornecedor: ${supplierName} (CNPJ: ${formattedCnpj})`,
        `Documento Fiscal: Nº ${cleanDocNumber} | Tipo: ${zeevDocType}`,
        `Valor Total: R$ ${formattedTotal} | Vencimento: ${formattedDueDate}`,
        `Classificação Contábil: CR ${noteData.accountingFields?.cr || '1103'} | Natureza: ${natureFormatted}`,
        noteData.additionalInfo?.description ? `Observações: ${noteData.additionalInfo.description}` : null
      ].filter(Boolean).join('\n');

      const rateioFileName = `rateio_${cleanDocNumber || id}.xlsx`;
      const docFiscalFileName = `${id}.pdf`;
      const boletoFileName = `${id}_boleto.pdf`;
      const requesterEmail = process.env.ZEEV_REQUESTER || process.env.ZEEV_REQUESTER_EMAIL || 'hugo.bhs@stoque.com.br';

      // 6. Montagem dos campos de formulário com id e name simultâneos
      const formFields = [
        // Identificação do pedido / contrato
        { id: ZEEV_FIELD_IDS.possuiContrato, name: 'possuiContrato', value: 'Não' },
        { id: ZEEV_FIELD_IDS.tipoDeContrato, name: 'tipoDeContrato', value: 'Fixo' },
        { id: ZEEV_FIELD_IDS.possuiPedidoDeCompra, name: 'possuiPedidoDeCompra', value: 'Não' },
        { id: ZEEV_FIELD_IDS.numeroDoPedidoDeCompra, name: 'numeroDoPedidoDeCompra', value: '-' },
        { id: ZEEV_FIELD_IDS.esteGastoEstaOrcado, name: 'esteGastoEstaOrcado', value: 'Não' },
        { id: ZEEV_FIELD_IDS.codigoDoOrcamento, name: 'codigoDoOrcamento', value: '-' },
        { id: ZEEV_FIELD_IDS.possuiRateio, name: 'possuiRateio', value: 'Sim' },
        { id: ZEEV_FIELD_IDS.cRPrincipal, name: 'cRPrincipal', value: noteData.accountingFields?.cr || '1103' },

        // Aprovação
        { id: ZEEV_FIELD_IDS.diretorHead, name: 'diretorHead', value: 'Helder Venancio Marques' },

        // Rateio (opção do catálogo do Zeev)
        {
          id: ZEEV_FIELD_IDS.confimacaoDeExtensaoCorretaDoArquivoDeRateio,
          name: 'confimacaoDeExtensaoCorretaDoArquivoDeRateio',
          value: 'Confirmo que baixei o modelo disponível no link acima'
        },

        // Dados do serviço realizado
        { id: ZEEV_FIELD_IDS.naturezaDaRequisicao, name: 'naturezaDaRequisicao', value: natureFormatted },
        {
          id: ZEEV_FIELD_IDS.finalidadeDoServico,
          name: 'finalidadeDoServico',
          value: noteData.additionalInfo?.description || `Faturamento de serviços - ${supplierName}`
        },
        { id: ZEEV_FIELD_IDS.localOndeOServicoFoiRealizado, name: 'localOndeOServicoFoiRealizado', value: 'Stoque BH' },

        // Dados do documento fiscal
        { id: ZEEV_FIELD_IDS.tipoDeDocumento, name: 'tipoDeDocumento', value: zeevDocType },
        { id: ZEEV_FIELD_IDS.numeroUnicoDaNF, name: 'numeroUnicoDaNF', value: cleanDocNumber },
        { id: ZEEV_FIELD_IDS.dataDeEmissaoDaNF, name: 'dataDeEmissaoDaNF', value: formattedIssueDate },

        // Dados do fornecedor / tomador
        { id: ZEEV_FIELD_IDS.nomeDaEmpresa, name: 'nomeDaEmpresa', value: supplierName },
        { id: ZEEV_FIELD_IDS.cnpj, name: 'cnpj', value: formattedCnpj },
        { id: ZEEV_FIELD_IDS.tomadorDoServico, name: 'tomadorDoServico', value: tomadorName },

        // Dados do pagamento
        { id: ZEEV_FIELD_IDS.dataDeVencimento, name: 'dataDeVencimento', value: formattedDueDate },
        { id: ZEEV_FIELD_IDS.urgenciaDePagamento, name: 'urgenciaDePagamento', value: 'Normal' },
        { id: ZEEV_FIELD_IDS.dataLimiteDePagamentoEmCasoDeUrgencia, name: 'dataLimiteDePagamentoEmCasoDeUrgencia', value: formattedDueDate },
        { id: ZEEV_FIELD_IDS.formaDePagamento, name: 'formaDePagamento', value: 'Boleto/Fatura' },
        { id: ZEEV_FIELD_IDS.chavePix, name: 'chavePix', value: '-' },
        { id: ZEEV_FIELD_IDS.nomeDoBanco, name: 'nomeDoBanco', value: '-' },
        { id: ZEEV_FIELD_IDS.agencia, name: 'agencia', value: '0' },
        { id: ZEEV_FIELD_IDS.numeroDaConta, name: 'numeroDaConta', value: '0' },

        // Valores e parcelamento
        { id: ZEEV_FIELD_IDS.valorTotal, name: 'valorTotal', value: formattedTotal },
        { id: ZEEV_FIELD_IDS.possuiParcelamento, name: 'possuiParcelamento', value: 'Não' },
        { id: ZEEV_FIELD_IDS.valorDaPrimeiraParcela, name: 'valorDaPrimeiraParcela', value: formattedTotal },

        // Parcelas
        { id: ZEEV_FIELD_IDS.parcela, name: 'parcela', value: '2' },
        { id: ZEEV_FIELD_IDS.vencimentoDaParcela, name: 'vencimentoDaParcela', value: formattedDueDate },

        // Campos auxiliares
        {
          id: ZEEV_FIELD_IDS.controleDeExibicaoDosCamposDaNF,
          name: 'controleDeExibicaoDosCamposDaNF',
          value: 'Sim'
        },
        {
          id: ZEEV_FIELD_IDS.pessoaResponsavel,
          name: 'pessoaResponsavel',
          value: requesterEmail
        },
        { id: ZEEV_FIELD_IDS.origem, name: 'origem', value: 'IA' }
      ];

      // 7. Montagem dos arquivos Base64 mapeados aos anexos da instância no Zeev
      const files = [
        {
          filename: docFiscalFileName,
          resume: `Documento Fiscal / Comprovante - ${supplierName} (NF ${cleanDocNumber})`,
          requesterCanSee: true,
          docType: '34774',
          base64Content: pdfBase64
        },
        {
          filename: boletoFileName,
          resume: `Boleto / Fatura - ${supplierName} - Valor R$ ${formattedTotal}`,
          requesterCanSee: true,
          docType: '34773',
          base64Content: boletoBase64
        },
        {
          filename: rateioFileName,
          resume: `Rateio - Planilha consolidada SFI - CR ${noteData.accountingFields?.cr || '1103'}`,
          requesterCanSee: true,
          docType: '34744',
          base64Content: excelBase64
        }
      ];

      const flowId = parseInt(process.env.ZEEV_FLOW_ID || '2149', 10);
      const payload: any = {
        flowId,
        isSimulation: false,
        formFields,
        files
      };

      const requester = process.env.ZEEV_REQUESTER || process.env.ZEEV_REQUESTER_EMAIL || process.env.ZEEV_REQUESTER_LOGIN;
      if (requester) {
        payload.requester = requester.trim();
        payload.requesterUser = requester.trim();
        payload.requesterEmail = requester.trim();
      }

      if (process.env.ZEEV_TEAM_ID) {
        payload.teamId = parseInt(process.env.ZEEV_TEAM_ID, 10);
      }
      if (process.env.ZEEV_POSITION_ID) {
        payload.positionId = parseInt(process.env.ZEEV_POSITION_ID, 10);
      }

      // 8. Gravação do JSON de payload em disco para auditoria
      const outputPath = path.join(folderPath, 'zeev_payload_dryrun.json');
      fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
      console.log(`[ZeevService] Payload Zeev gerado com sucesso em: ${outputPath}`);

      // 9. Envio da requisição para a API do Zeev
      console.log(`[ZeevService] Disparando requisição para a API do Zeev...`);
      const apiResult = await ZeevClient.createInstance(payload);
      console.log(`[ZeevService] Resposta da criação da instância:`, apiResult);
      
      const resultPath = path.join(folderPath, 'zeev_response_simulation.json');
      fs.writeFileSync(resultPath, JSON.stringify(apiResult, null, 2), 'utf-8');

      // 10. Vinculação da mensagem de histórico na instância
      const createdInstanceId = apiResult?.instanceId || apiResult?.id || apiResult?.code || apiResult?.instanceCode;
      if (createdInstanceId) {
        try {
          const msgResult = await ZeevClient.postInstanceMessage(createdInstanceId, aiSummaryMessage);
          const msgLogPath = path.join(folderPath, 'zeev_message_response.json');
          fs.writeFileSync(msgLogPath, JSON.stringify(msgResult, null, 2), 'utf-8');
        } catch (msgError: any) {
          console.warn(`[ZeevService] Instância criada (${createdInstanceId}), falha no envio do histórico:`, msgError.response?.data || msgError.message);
        }
      }

      // 11. Retorna o resultado da criação para persistência no controller
      return apiResult;
    } catch (error: any) {
      const apiErrorData = error.response?.data;
      const detailedMessage = apiErrorData ? JSON.stringify(apiErrorData) : error.message;
      console.error(`[ZeevService] Falha na integração com Zeev para nota ${id}:`, detailedMessage);
      
      try {
        const errorPath = path.join(folderPath, 'zeev_response_error.json');
        fs.writeFileSync(errorPath, JSON.stringify({
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: apiErrorData
        }, null, 2), 'utf-8');
      } catch (err) {
        console.error('[ZeevService] Falha ao salvar log de erro do Zeev em disco:', err);
      }

      const errorMsg = apiErrorData?.error?.message || apiErrorData?.message || error.message;
      throw new Error(`[Zeev] ${errorMsg}`);
    }
  }
}

