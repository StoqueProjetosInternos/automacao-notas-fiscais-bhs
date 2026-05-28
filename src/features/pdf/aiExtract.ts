import { GoogleGenerativeAI } from "@google/generative-ai";
import { BoletoData } from "./parseBoletoData.js";

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
    totalValue: number;
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
    type: "BOLETO" | "NFSE" | "DANFE" | "OUTRO";
  };
  additionalInfo?: Record<string, any>; // Campo flexível para a IA decidir o que é importante
}

/**
 * Função que utiliza o Gemini 1.5 Flash para extrair dados com precisão humana.
 */
export async function extractWithAI(pdfBuffer: Buffer): Promise<BoletoData> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("A variável de ambiente GEMINI_API_KEY não foi configurada.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Você é um especialista em documentos fiscais brasileiros (Boletos, DANFE, DANFSe).
    Analise o documento PDF fornecido e extraia todos os dados relevantes para indexação financeira.

    Instruções Críticas de Identificação:
    1. FORNECEDOR (Supplier): Empresa que prestou o serviço ou vendeu o produto.
    2. PAGADOR (Payer): Empresa que está pagando (Geralmente STOQUE SOLUÇÕES TECNOLÓGICAS, CNPJ 05.388.674/0001-29).
    3. VALORES: Valor líquido a pagar. Identifique também impostos retidos (ISS, IRRF, PIS, COFINS, CSLL).
    4. DATAS: Vencimento, Emissão e Competência.

    Liberdade Criativa (additionalInfo):
    - Além dos campos fixos, extraia QUALQUER outra informação que considerar útil para um gestor financeiro (ex: Chave PIX, Dados Bancários, Endereço do fornecedor, Alíquotas, Observações, Condições de Pagamento, etc).
    - Coloque essas informações extras de forma estruturada dentro do objeto "additionalInfo".

    Regras de Negócio:
    - Formate todas as datas como DD/MM/AAAA.
    - Formate valores numéricos com ponto decimal (ex: 1250.50).
    - Se não encontrar um campo, retorne null.

    Retorne EXATAMENTE este formato JSON:
    {
      "supplier": { "name": "Razão Social", "cnpj": "00.000.000/0000-00" },
      "payer": { "name": "Razão Social", "cnpj": "00.000.000/0000-00" },
      "financial": {
        "totalValue": 0.00,
        "dueDate": "DD/MM/AAAA",
        "issueDate": "DD/MM/AAAA",
        "competenceDate": "MM/AAAA",
        "taxes": { "iss": 0, "irrf": 0, "pis": 0, "cofins": 0, "csll": 0 }
      },
      "document": {
        "number": "123",
        "barcode": "000...",
        "type": "NFSE"
      },
      "additionalInfo": {
        "chavePix": "...",
        "banco": "...",
        "observacao": "..."
      }
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
    ]);

    const responseText = result.response.text();
    
    // Limpeza de Markdown caso a IA retorne no formato ```json ... ```
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const aiData: AIResponse = JSON.parse(cleanedText);

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
        originalValue: aiData.financial.totalValue,
        chargedValue: aiData.financial.totalValue,
        dueDate: aiData.financial.dueDate,
        issueDate: aiData.financial.issueDate,
        competenceDate: aiData.financial.competenceDate,
        taxes: aiData.financial.taxes
      },
      documentIdentifiers: {
        documentNumber: aiData.document.number,
        issueDate: aiData.financial.issueDate
      },
      barcode: aiData.document.barcode,
      additionalInfo: aiData.additionalInfo, // Passamos a liberdade criativa para o objeto final
      rawText: JSON.stringify(aiData)
    };
  } catch (error) {
    console.error("Erro na extração via Gemini:", error);
    throw new Error("Falha ao processar documento com IA.");
  }
}
