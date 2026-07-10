import fs from 'fs';
import path from 'path';
import { FILES_DIR } from '../config/paths.js';
import { ZeevClient } from '../../infra/zeev/zeevClient.js';

export class ZeevService {
  /**
   * Executa a simulação de integração com o Zeev no modo Dry-Run.
   * Mapeia os dados da nota fiscal, lê os arquivos em disco e gera o JSON de payload na pasta local.
   */
  public static async generateDryRunPayload(id: string, noteData: any): Promise<void> {
    const folderPath = path.join(FILES_DIR, id);
    console.log(`[ZeevService] Iniciando geração de payload Dry-Run para fatura: ${id}`);

    try {
      // 1. Leitura do PDF da nota
      const pdfPath = path.join(folderPath, `${id}.pdf`);
      if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF original da fatura não encontrado no servidor em: ${pdfPath}`);
      }
      const pdfBase64 = fs.readFileSync(pdfPath).toString('base64');

      // 2. Leitura da planilha Excel de rateio
      const excelPath = path.join(folderPath, `${id}.xlsx`);
      if (!fs.existsSync(excelPath)) {
        throw new Error(`Planilha de rateio (.xlsx) não encontrada no servidor em: ${excelPath}`);
      }
      const excelBase64 = fs.readFileSync(excelPath).toString('base64');

      // 3. Mapeamento de tipo de documento
      const documentTypeMap: Record<string, string> = {
        'nota_fiscal': 'Nota Fiscal',
        'boleto': 'Boleto',
        'recibo': 'Recibo',
        'invoice': 'Invoice'
      };
      const rawDocType = String(noteData.documentType || 'nota_fiscal').toLowerCase().trim();
      const zeevDocType = documentTypeMap[rawDocType] || 'Nota Fiscal';

      // 4. Formatação de valores monetários
      const totalRaw = noteData.financial?.totalValue || noteData.financial?.value || 0;
      const formattedTotal = Number(totalRaw).toFixed(2);

      // 5. Configuração da natureza de despesa
      const natureCode = noteData.accountingFields?.naturezaCode || '141401013 - Energia Elétrica';

      // 6. Montagem dos campos de formulário exigidos no fluxo 2044
      const formFields = [
        { name: 'possuiContrato', value: 'Não' },
        { name: 'tipoDeContrato', value: 'Fixo' },
        { name: 'possuiPedidoDeCompra', value: 'Não' },
        { name: 'numeroDoPedidoDeCompra', value: '-' },
        { name: 'esteGastoEstaOrcado', value: 'Não' },
        { name: 'codigoDoOrcamento', value: '-' },
        { name: 'possuiRateio', value: 'Sim' },
        { name: 'cRPrincipal', value: noteData.accountingFields?.cr || '1103' },
        { name: 'diretorHead', value: 'Helder Venancio Marques' },
        {
          name: 'confimacaoDeExtensaoCorretaDoArquivoDeRateio',
          value: 'Confirmo que baixei o modelo disponível no link acima'
        },
        { name: 'naturezaDaRequisicao', value: natureCode },
        {
          name: 'finalidadeDoServico',
          value: noteData.additionalInfo?.description || `Faturamento de serviços - ${noteData.issuer?.name || 'Fornecedor'}`
        },
        { name: 'localOndeOServicoFoiRealizado', value: 'Stoque BH' },
        { name: 'tipoDeDocumento', value: zeevDocType },
        { name: 'numeroUnicoDaNF', value: String(noteData.invoiceNumber || noteData.documentNumber || 0).replace(/\D/g, '') || '0' },
        { name: 'dataDeEmissaoDaNF', value: noteData.issueDate || noteData.financial?.dueDate },
        { name: 'nomeDaEmpresa', value: noteData.issuer?.name || 'Fornecedor Desconhecido' },
        { name: 'cnpj', value: noteData.issuer?.cnpj || '00000000000000' },
        { name: 'tomadorDoServico', value: noteData.recipient?.name || 'Stoque' },
        { name: 'dataDeVencimento', value: noteData.financial?.dueDate },
        { name: 'urgenciaDePagamento', value: 'Normal' },
        { name: 'dataLimiteDePagamentoEmCasoDeUrgencia', value: noteData.financial?.dueDate },
        { name: 'formaDePagamento', value: 'Boleto/Fatura' },
        { name: 'chavePix', value: '-' },
        { name: 'nomeDoBanco', value: '-' },
        { name: 'agencia', value: '0' },
        { name: 'numeroDaConta', value: '0' },
        { name: 'valorTotal', value: formattedTotal },
        { name: 'possuiParcelamento', value: 'Não' },
        { name: 'valorDaPrimeiraParcela', value: formattedTotal },
        { name: 'parcela', value: '2' },
        { name: 'vencimentoDaParcela', value: noteData.financial?.dueDate }
      ];

      // 7. Montagem dos arquivos Base64 mapeados aos campos técnicos de arquivos no Zeev
      const files = [
        {
          filename: `${id}.pdf`,
          resume: 'Documento fiscal original em PDF',
          requesterCanSee: true,
          docType: 'anexarArquivo',
          base64Content: pdfBase64
        },
        {
          filename: `${id}_boleto.pdf`,
          resume: 'Boleto bancário de cobrança',
          requesterCanSee: true,
          docType: 'anexarBoleto',
          base64Content: pdfBase64
        },
        {
          filename: `${id}_rateio.xlsx`,
          resume: 'Planilha de rateio detalhado de custos',
          requesterCanSee: true,
          docType: 'rateio',
          base64Content: excelBase64
        }
      ];

      const flowId = parseInt(process.env.ZEEV_FLOW_ID || '2044', 10);
      const payload = {
        flowId,
        isSimulation: true,
        formFields,
        files
      };

      // 8. Grava o JSON gerado em disco na pasta da nota correspondente (Backup de Auditoria)
      const outputPath = path.join(folderPath, 'zeev_payload_dryrun.json');
      fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
      console.log(`[ZeevService] Payload Dry-Run gerado com sucesso em: ${outputPath}`);

      // 9. Dispara a chamada HTTP real para validação (Simulação no Zeev)
      console.log(`[ZeevService] Disparando requisição real de simulação para a API do Zeev...`);
      const apiResult = await ZeevClient.createInstance(payload);
      
      // Grava o resultado da resposta da API em disco para auditoria
      const resultPath = path.join(folderPath, 'zeev_response_simulation.json');
      fs.writeFileSync(resultPath, JSON.stringify(apiResult, null, 2), 'utf-8');
      console.log(`[ZeevService] Resposta da simulação salva com sucesso em: ${resultPath}`);
    } catch (error: any) {
      console.error(`[ZeevService] Falha na simulação de API para nota ${id}:`, error.message);
    }
  }
}
