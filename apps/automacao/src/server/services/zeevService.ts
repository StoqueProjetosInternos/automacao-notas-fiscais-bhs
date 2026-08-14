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
      const cleanCnpj = String(rawCnpj).replace(/\D/g, '') || '00000000000000';

      const supplierName = 
        noteData.supplier?.name || 
        noteData.beneficiary?.name || 
        noteData.issuer?.name || 
        'Fornecedor Desconhecido';

      const issueDate = 
        noteData.financial?.issueDate || 
        noteData.documentIdentifiers?.issueDate || 
        noteData.issueDate || 
        noteData.financial?.dueDate;

      // 5. Configuração da natureza de despesa e mensagem formatada da IA
      const natureCode = noteData.accountingFields?.naturezaCode || '141401013 - Energia Elétrica';

      const aiSummaryMessage = [
        `[SFI - Automação IA Google Gemini 2.5 Flash]`,
        `Processado automaticamente em: ${new Date().toLocaleString('pt-BR')}`,
        `Fornecedor: ${supplierName} (CNPJ: ${cleanCnpj})`,
        `Documento Fiscal: Nº ${cleanDocNumber} | Tipo: ${zeevDocType}`,
        `Valor Total: R$ ${formattedTotal} | Vencimento: ${noteData.financial?.dueDate || 'N/A'}`,
        `Classificação Contábil: CR ${noteData.accountingFields?.cr || '1103'} | Natureza: ${natureCode}`,
        noteData.additionalInfo?.description ? `Observações Adicionais: ${noteData.additionalInfo.description}` : null
      ].filter(Boolean).join('\n');

      const finalidadeValue = noteData.additionalInfo?.description 
        ? `${noteData.additionalInfo.description}\n\n${aiSummaryMessage}`
        : aiSummaryMessage;

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
        { name: 'naturezaDaRequisicao', value: natureCode },
        {
          name: 'finalidadeDoServico',
          value: noteData.additionalInfo?.description || `Faturamento de serviços - ${supplierName}`
        },
        { name: 'localOndeOServicoFoiRealizado', value: 'Stoque BH' },
        { name: 'tipoDeDocumento', value: zeevDocType },
        { name: 'numeroUnicoDaNF', value: cleanDocNumber },
        { name: 'dataDeEmissaoDaNF', value: issueDate },
        { name: 'nomeDaEmpresa', value: supplierName },
        { name: 'cnpj', value: cleanCnpj },
        { name: 'tomadorDoServico', value: noteData.payer?.name || noteData.recipient?.name || 'Stoque' },
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
        { name: 'vencimentoDaParcela', value: noteData.financial?.dueDate },
        {
          name: 'pessoaResponsavel',
          value: process.env.ZEEV_REQUESTER || process.env.ZEEV_REQUESTER_EMAIL || 'hugo.bhs@stoque.com.br'
        },
        { name: 'origem', value: 'IA' }
      ];

      // 7. Montagem dos arquivos Base64 mapeados aos campos técnicos de arquivos no Zeev
      const files = [
        {
          filename: `${id}.pdf`,
          resume: `PDF original da fatura - ${supplierName} (NF ${cleanDocNumber}) - Processado via IA SFI`,
          requesterCanSee: true,
          docType: 'anexarArquivo',
          base64Content: pdfBase64
        },
        {
          filename: `${id}_boleto.pdf`,
          resume: `Boleto bancário de cobrança - ${supplierName} - Valor R$ ${formattedTotal}`,
          requesterCanSee: true,
          docType: 'anexarBoleto',
          base64Content: pdfBase64
        },
        {
          filename: `${id}_rateio.xlsx`,
          resume: `Planilha de rateio contábil consolidada SFI - CR ${noteData.accountingFields?.cr || '1103'}`,
          requesterCanSee: true,
          docType: 'rateio',
          base64Content: excelBase64
        }
      ];

      const flowId = parseInt(process.env.ZEEV_FLOW_ID || '2044', 10);
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

      // 8. Grava o JSON gerado em disco na pasta da nota correspondente (Backup de Auditoria)
      const outputPath = path.join(folderPath, 'zeev_payload_dryrun.json');
      fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
      console.log(`[ZeevService] Payload Dry-Run gerado com sucesso em: ${outputPath}`);

      // 9. Dispara a chamada HTTP real para validação (Simulação no Zeev)
      console.log(`[ZeevService] Disparando requisição real de simulação para a API do Zeev...`);
      const apiResult = await ZeevClient.createInstance(payload);
      console.log(`Resultado da API:`, apiResult);
      
      // Grava o resultado da resposta da API em disco para auditoria
      const resultPath = path.join(folderPath, 'zeev_response_simulation.json');
      fs.writeFileSync(resultPath, JSON.stringify(apiResult, null, 2), 'utf-8');
      console.log(`[ZeevService] Resposta da simulação salva com sucesso em: ${resultPath}`);

      // 10. Disparo da API de Mensagens do Zeev (vincula o comentário da IA no histórico da instância)
      const createdInstanceId = apiResult?.instanceId || apiResult?.id || apiResult?.code || apiResult?.instanceCode;
      if (createdInstanceId) {
        try {
          console.log(`[ZeevService] Vinculando mensagem da IA à instância ${createdInstanceId}...`);
          const msgResult = await ZeevClient.postInstanceMessage(createdInstanceId, aiSummaryMessage);
          console.log(`[ZeevService] Mensagem de IA vinculada com sucesso à instância ${createdInstanceId}:`, msgResult);
          
          const msgLogPath = path.join(folderPath, 'zeev_message_response.json');
          fs.writeFileSync(msgLogPath, JSON.stringify(msgResult, null, 2), 'utf-8');
        } catch (msgError: any) {
          console.warn(`[ZeevService] Instância criada (${createdInstanceId}), mas houve falha ao enviar mensagem de IA:`, msgError.response?.data || msgError.message);
        }
      }
    } catch (error: any) {
      const apiErrorData = error.response?.data;
      const detailedMessage = apiErrorData ? JSON.stringify(apiErrorData) : error.message;
      console.error(`[ZeevService] Falha na simulação de API para nota ${id}:`, detailedMessage);
      
      try {
        const errorPath = path.join(folderPath, 'zeev_response_error.json');
        fs.writeFileSync(errorPath, JSON.stringify({
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: apiErrorData
        }, null, 2), 'utf-8');
      } catch (err) {
        console.error('[ZeevService] Não foi possível salvar o JSON de erro em disco:', err);
      }

      // Relança o erro com detalhes apropriados para que o controlador capture a falha
      const errorMsg = apiErrorData?.error?.message || apiErrorData?.message || error.message;
      throw new Error(`[Zeev] ${errorMsg}`);
    }
  }
}
