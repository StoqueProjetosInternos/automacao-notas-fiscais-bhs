import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument } from "pdf-lib";
import { BoletoData } from "./types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Interface para a resposta da IA (Mais rica para futura indexação)
 */
interface AIResponse {
  supplier: {
    name: string;
    cnpj?: string;
  };
  payer: {
    name: string;
    cnpj?: string;
  };
  financial: {
    originalValue: number;
    chargedValue: number;
    dueDate?: string;
    issueDate?: string;
    competenceDate?: string;
    taxes?: {
      iss?: number;
      irrf?: number;
      pis?: number;
      cofins?: number;
      csll?: number;
    };
  };
  document: {
    number?: string;
    barcode?: string;
    clientAccount?: string; 
    type: "BOLETO" | "NFSE" | "DANFE" | "OUTRO";
  };
  additionalInfo?: Record<string, any>; // Campo flexível para a IA decidir o que é importante
  apportionment?: Array<{
    description: string;
    quantity: number;
    unitValue: number;
    value: number;
  }>;
  zeevValidation: {
    isWithinIdealDeadline: boolean;
    isIssuedAfterDay25: boolean;
    suggestedPaymentRule: "IDEAL" | "ALTERNATIVE";
    isInstallmentPay: boolean;
    installmentsCount?: number;
  };
}

/**
 * Função que utiliza o Gemini 2.5 Flash para extrair dados com precisão humana.
 */
export async function extractWithAI(pdfBuffer: Buffer, fileName: string = "unknown", userInfo?: { email?: string; name?: string }): Promise<BoletoData> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("A variável de ambiente GEMINI_API_KEY não foi configurada.");
  }

  // Função interna para obter data e hora em formato amigável (DD/MM/AAAA HH:mm:ss) no fuso local
  function getFormattedDateTime(): string {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  // Salvaguarda contra cota zero (limit: 0) para modelos Pro em contas Free Tier
  if (primaryModel.toLowerCase().includes("pro")) {
    console.warn(`[IA] Modelo configurado '${primaryModel}' requer faturamento e possui cota zero no Free Tier. Comutando para 'gemini-3.6-flash'.`);
    primaryModel = "gemini-3.6-flash";
  }
  // Modelos ativos suportados na API v1beta compatíveis com Free Tier
  const fallbackModels = [primaryModel, "gemini-3.6-flash", "gemini-2.5-flash"].filter(
    (value, index, self) => self.indexOf(value) === index
  );
  const todayStr = new Date().toLocaleDateString("pt-BR"); // ex: 08/06/2026

  let pageCount = 1;
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    pageCount = pdfDoc.getPageCount();
  } catch (pdfErr) {
    console.warn("[IA] Não foi possível contar páginas via pdf-lib, assumindo fluxo padrão:", pdfErr);
  }

  const prompt = `
    Você é um especialista em documentos fiscais brasileiros (Boletos, DANFE, DANFSe) e auditor de processos corporativos.
    Analise o documento PDF fornecido e extraia todos os dados relevantes para indexação financeira.

    Considere que a data de hoje (recebimento do documento) é: ${todayStr} (Formato DD/MM/AAAA).

    Instruções Críticas de Identificação:
    1. FORNECEDOR (Supplier): Empresa que prestou o serviço ou vendeu o produto.
    2. PAGADOR (Payer): Empresa que está pagando (Geralmente STOQUE SOLUÇÕES TECNOLÓGICAS, CNPJ 05.388.674/0001-29).
    3. VALORES: 
       - Valor Original (originalValue): O valor total bruto do serviço ou nota fiscal antes de retenções.
       - Valor Cobrado (chargedValue): O valor líquido final cobrado para pagamento (descontando impostos retidos, se aplicável).
       - Impostos Retidos: Identifique taxas de impostos retidos na fonte (ISS, IRRF, PIS, COFINS, CSLL) dentro do objeto "taxes".
    4. DATAS: Vencimento, Emissão e Competência.
    5. IDENTIFICADORES: Número do documento (Fatura/Nota) e Código do Cliente/Número da Conta (especialmente importante para empresas de Telecom/Utilities).
       - Para BOLETOS: Extraia a linha digitável completa (47 ou 48 dígitos numéricos) sem pontos ou espaços no campo 'barcode'.
       - Para DANFE: Se houver chave de acesso de 44 dígitos, extraia no campo 'chaveAcesso' em 'additionalInfo'.
    6. TABELA DE ITENS / RATEIO EXTENSO MULTI-PÁGINAS (apportionment):
       - ATENÇÃO CRÍTICA: Este arquivo PDF contém EXATAMENTE ${pageCount} PÁGINA(S).
       - Se o documento possuir itens cobrados (equipamentos ou serviços), a tabela NÃO para na página 1 ou 2. Ela continua por TODAS as ${pageCount} páginas até a última página onde constam os últimos itens e o total geral.
       - Você DEVE percorrer página por página e extrair TODAS as linhas da tabela de cada uma das páginas (inclusive páginas intermediárias como 3 e final como 4), sem omitir nenhuma linha.
       - Preencha o array "apportionment" com todos os itens, onde cada objeto tem: "description" (formato: "NOME DO EQUIPAMENTO (Item CÓDIGO)"), "quantity" (quantidade), "unitValue" (valor unitário) e "value" (valor total da linha).
       - ATENÇÃO: NUNCA use aspas duplas desescapadas dentro de descrições (use 'POL' para polegadas ou aspas simples).
       - REGRA DE INTEGRIDADE CONTÁBIL: A soma de todos os campos 'value' dos objetos no array 'apportionment' DEVE ser igual ao 'chargedValue' da fatura. Não pare a extração na página 2; continue pelas páginas subsequentes até fechar 100% do valor da fatura.

    Validação de Regras do Processo de Pagamento Zeev:
    - Se a data de emissão for após o dia 25 do mês corrente: Defina "isIssuedAfterDay25": true. Sugira a regra "ALTERNATIVE" (vencimento em 60 dias da emissão ou próximo dia 10 útil após os 60 dias).
    - Se o vencimento for igual ou superior a 30 dias da data de emissão: Defina "isWithinIdealDeadline": true. Sugira "IDEAL".
    - Se o vencimento for menor que 30 dias da emissão: Defina "isWithinIdealDeadline": false. Sugira "ALTERNATIVE" (vencimento ajustado para 30 dias da data de emissão).
    - IMPORTANTE: Retorne APENAS o JSON válido. Não inclua marcações extras de texto, explicações ou comentários de código.

    Retorne EXATAMENTE este formato JSON:
    {
      "supplier": { "name": "Razão Social", "cnpj": "00.000.000/0000-00" },
      "payer": { "name": "Razão Social", "cnpj": "00.000.000/0000-00" },
      "financial": {
        "originalValue": 0.00,
        "chargedValue": 0.00,
        "dueDate": "DD/MM/AAAA",
        "issueDate": "DD/MM/AAAA",
        "competenceDate": "MM/AAAA",
        "taxes": { "iss": 0, "irrf": 0, "pis": 0, "cofins": 0, "csll": 0 }
      },
      "document": {
        "number": "123",
        "barcode": "000...",
        "clientAccount": "432892312",
        "type": "NFSE"
      },
      "zeevValidation": {
        "isWithinIdealDeadline": true,
        "isIssuedAfterDay25": false,
        "suggestedPaymentRule": "IDEAL",
        "isInstallmentPay": false,
        "installmentsCount": 1
      },
      "additionalInfo": {
        "chavePix": "...",
        "banco": "...",
        "observacao": "..."
      },
      "apportionment": [
        {
          "description": "MONITOR 24 POL (Item 018812)",
          "quantity": 1,
          "unitValue": 54.25,
          "value": 54.25
        }
      ]
    }
  `;

  const MAX_RETRIES = 5;
  let lastError: any;

  // Sequência de modelos ativos por tentativa com tolerância a oscilações transitórias (100% compatível com Free Tier)
  const attemptModelSequence = [
    primaryModel,
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash",
  ];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const currentModelName = attemptModelSequence[attempt - 1] || primaryModel;
    const model = genAI.getGenerativeModel({ 
      model: currentModelName,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 32768
      }
    });

    try {
      console.log(`[IA] Tentativa ${attempt}/${MAX_RETRIES} utilizando modelo: ${currentModelName}`);
      const apiStartTime = Date.now();
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: pdfBuffer.toString("base64"),
            mimeType: "application/pdf",
          },
        },
      ]);
      const latencyMs = Date.now() - apiStartTime;

      const responseText = result.response.text();
      
      function robustJsonParse(jsonString: string): AIResponse {
        let cleaned = jsonString.trim();
        cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
        
        try {
          return JSON.parse(cleaned);
        } catch (err1: any) {
          try {
            // Corrige aspas não escapadas de polegadas tipo 24" ou 14"
            let fixed = cleaned.replace(/(\d+)"/g, "$1 pol");
            // Remove trailing commas antes de fechamento de array/objeto
            fixed = fixed.replace(/,\s*([\]}])/g, "$1");
            return JSON.parse(fixed);
          } catch (err2) {
            // Recupera JSON caso truncado no final do array de rateio
            const lastItemIndex = cleaned.lastIndexOf("},");
            if (lastItemIndex !== -1) {
              const recovered = cleaned.substring(0, lastItemIndex + 1) + "]}";
              return JSON.parse(recovered);
            }
            throw err1;
          }
        }
      }

      const aiData: AIResponse = robustJsonParse(responseText);

      // Validação de Integridade Contábil: detecta truncamento de itens multi-páginas
      if (aiData.apportionment && aiData.apportionment.length > 1 && aiData.financial?.chargedValue > 0) {
        const sumApportionment = aiData.apportionment.reduce((acc, it) => acc + (Number(it.value) || 0), 0);
        const chargedVal = Number(aiData.financial.chargedValue);
        const difference = Math.abs(chargedVal - sumApportionment);
        if (difference > 2.00 && (sumApportionment / chargedVal) < 0.95) {
          throw new Error(`Extração incompleta de itens de rateio: soma dos itens (R$ ${sumApportionment.toFixed(2)}) diverge do valor cobrado (R$ ${chargedVal.toFixed(2)}). Total de itens capturados: ${aiData.apportionment.length}. Comutando modelo...`);
        }
      }

      // Monitoramento de Uso e Custos (Registrado após o parse para enriquecer com dados do fornecedor)
      const usage = result.response.usageMetadata;
      if (usage) {
        const promptTokens = usage.promptTokenCount || 0;
        const responseTokens = usage.candidatesTokenCount || 0;
        
        // Preços Gemini (estimativa referencial USD)
        const costInput = (promptTokens / 1_000_000) * 0.30;
        const costOutput = (responseTokens / 1_000_000) * 2.50;
        const totalCost = costInput + costOutput;

        console.log(`[IA Metrics] Modelo: ${currentModelName} | Tokens -> Entrada: ${promptTokens} | Saída: ${responseTokens}`);
        console.log(`[IA Metrics] Custo Estimado: $${totalCost.toFixed(6)} USD`);

        // Registro Persistente em CSV
        try {
          const logPath = path.resolve(__dirname, "../../../../../data/usage_log.csv");
          const logDir = path.dirname(logPath);

          if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
          }

          // Lógica de Migração Automática para o novo cabeçalho se o CSV for antigo
          if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, "utf8");
            const lines = content.split("\n");
            if (lines[0] && !lines[0].includes("usuario_email")) {
              const migratedLines = lines.map((line, idx) => {
                if (idx === 0) {
                  return "data_hora,arquivo,modelo_ia,fornecedor,tokens_entrada,tokens_saida,custo_usd,tempo_processamento_ms,zeev_id,cnpj_fornecedor,numero_documento,valor_fatura,status,usuario_email,usuario_nome,origem";
                }
                const trimmed = line.trim();
                if (!trimmed) return "";
                const cols = trimmed.split(",");
                if (cols.length < 16) {
                  const defaultUser = cols[1]?.startsWith("manual_") ? "Upload Manual" : "SISTEMA (E-mail)";
                  const defaultOrigem = cols[1]?.startsWith("manual_") ? "Upload Manual" : "E-mail Sync";
                  return `${trimmed},${defaultUser},${defaultUser},${defaultOrigem}`;
                }
                return line;
              });
              fs.writeFileSync(logPath, migratedLines.filter(l => l.trim() !== "").join("\n") + "\n", "utf8");
            }
          } else {
            fs.writeFileSync(logPath, "data_hora,arquivo,modelo_ia,fornecedor,tokens_entrada,tokens_saida,custo_usd,tempo_processamento_ms,zeev_id,cnpj_fornecedor,numero_documento,valor_fatura,status,usuario_email,usuario_nome,origem\n", "utf8");
          }

          const formattedDate = getFormattedDateTime();
          const supplierName = aiData.supplier?.name || "DESCONHECIDO";
          const escapedSupplier = `"${supplierName.replace(/"/g, '""')}"`;
          const cnpj = aiData.supplier?.cnpj || "";
          const docNum = aiData.document?.number || "";
          const fatValue = aiData.financial?.originalValue || 0;

          const userEmail = userInfo?.email || (fileName.startsWith("manual_") ? "Upload Manual" : "SISTEMA (E-mail)");
          const userName = userInfo?.name || (fileName.startsWith("manual_") ? "Upload Manual" : "Microsoft Graph");
          const origem = fileName.startsWith("manual_") ? "Upload Manual" : "E-mail Sync";

          const logLine = `${formattedDate},${fileName},${currentModelName},${escapedSupplier},${promptTokens},${responseTokens},${totalCost.toFixed(6)},${latencyMs},,${cnpj},${docNum},${fatValue},Sucesso,${userEmail},${userName},${origem}\n`;
          fs.appendFileSync(logPath, logLine, "utf8");
        } catch (logError) {
          console.error("[AVISO] Falha ao gravar log de uso:", logError);
        }
      }

      // Converte o retorno da IA para a interface BoletoData do projeto, preservando a estrutura rica
      return {
        documentType: aiData.document.type,
        supplier: { 
          name: aiData.supplier.name,
          cnpjCpf: aiData.supplier.cnpj
        },
        payer: {
          name: aiData.payer.name,
          cnpjCpf: aiData.payer.cnpj
        },
        financial: {
          originalValue: aiData.financial.originalValue,
          chargedValue: aiData.financial.chargedValue,
          dueDate: aiData.financial.dueDate,
          issueDate: aiData.financial.issueDate,
          competenceDate: aiData.financial.competenceDate,
          taxes: aiData.financial.taxes
        },
        documentIdentifiers: {
          documentNumber: aiData.document.number,
          clientAccount: aiData.document.clientAccount,
          issueDate: aiData.financial.issueDate
        },
        barcode: aiData.document.barcode,
        additionalInfo: aiData.additionalInfo, // Liberdade criativa da IA para incluir o que achar relevante
        apportionment: aiData.apportionment?.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitValue: item.unitValue,
          value: item.value
        })),
        zeevValidation: aiData.zeevValidation,
        rawText: JSON.stringify(aiData)
      };
    } catch (error) {
      lastError = error;
      console.warn(`[IA] Tentativa ${attempt} (${currentModelName}) falhou: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      
      if (attempt < MAX_RETRIES) {
        const delays = [4000, 8000, 15000, 20000];
        const waitTime = delays[attempt - 1] || 15000;
        console.log(`[IA] Retentando em ${waitTime / 1000}s (comutando de modelo se persistir instabilidade)...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error("Erro na extração via Gemini após todas as tentativas:", lastError);
  throw new Error("Falha ao processar documento com IA após múltiplas tentativas.");
}
