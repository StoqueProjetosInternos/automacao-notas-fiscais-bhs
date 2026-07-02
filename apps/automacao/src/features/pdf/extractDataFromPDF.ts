import fs from "fs";
import path from "path";
import { extractWithAI } from "./aiExtract.js";
import { enrichData } from "./dataEnrichment.js";
import { BoletoData } from "./types.js";
import { FILES_DIR } from "../../server/config/paths.js";

interface ExtractedData {
  fileName: string;
  outputPath: string;
  outputDir: string;
  textContent: string;
  parsedContent: BoletoData;
}

/**
 * Função principal de extração utilizando Inteligência Artificial (Google Gemini).
 * Agora com alta precisão humana para qualquer layout de documento.
 */
async function extractDataFromPDF(pdfPath: string): Promise<ExtractedData> {
  console.log(`[IA] Processando PDF: ${path.basename(pdfPath)}`);

  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const baseName = path.basename(pdfPath, ".pdf");
    
    // Extração Inteligente via IA - Passando o nome do arquivo para o log de consumo
    const parsedContentRaw = await extractWithAI(dataBuffer, `${baseName}.pdf`);

    // Enriquecimento de dados contábeis via base de referência
    const parsedContent = await enrichData(parsedContentRaw);

    const cleanSupplierName = (parsedContent.supplier?.name || "Fornecedor_Nao_Identificado")
      .replace(/[\\/:*?"<>|.]/g, "")
      .trim();

    const docNumber = parsedContent.documentIdentifiers?.documentNumber 
      ? parsedContent.documentIdentifiers.documentNumber.replace(/[\\/:*?"<>|.]/g, "").trim()
      : "";

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const folderName = docNumber 
      ? `${cleanSupplierName}_${docNumber}_${dateStr}`
      : `${cleanSupplierName}_${dateStr}`;

    const outputDir = path.join(FILES_DIR, folderName);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 1. Copiar o PDF original para a pasta (Para o Dashboard exibir)
    const pdfDestPath = path.join(outputDir, `${folderName}.pdf`);
    fs.copyFileSync(pdfPath, pdfDestPath);

    // 2. Salvamos o JSON completo
    const jsonPath = path.join(outputDir, `${folderName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(parsedContent, null, 2), "utf8");

    // 3. Mantemos o TXT apenas como um log rápido/visual
    const txtPath = path.join(outputDir, `${folderName}.txt`);
    const additionalLog = parsedContent.additionalInfo ? `\nInformações Extras: ${JSON.stringify(parsedContent.additionalInfo)}` : "";
    const logContent = `Extração realizada via Gemini IA\nFornecedor: ${parsedContent.supplier?.name}\nCNPJ Fornecedor: ${parsedContent.supplier?.cnpjCpf}\nValor: ${parsedContent.financial?.chargedValue}\nVencimento: ${parsedContent.financial?.dueDate}\nTipo: ${parsedContent.documentType}${additionalLog}`;
    fs.writeFileSync(txtPath, logContent, "utf8");

    return {
      fileName: `${folderName}.json`,
      outputPath: jsonPath,
      outputDir: outputDir, // Retornamos o diretório para uso externo (ex: Excel)
      textContent: logContent,
      parsedContent,
    };
  } catch (error) {
    console.error(`Erro ao processar o arquivo ${pdfPath} com IA:`, error);
    throw error;
  }
}

export { extractDataFromPDF };
