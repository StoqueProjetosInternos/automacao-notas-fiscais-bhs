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

    const pdfDestPath = path.join(outputDir, `${folderName}.pdf`);
    const jsonPath = path.join(outputDir, `${folderName}.json`);
    const secondaryPdfPath = path.join(outputDir, `${folderName}_Nota.pdf`);

    let mergedContent = { ...parsedContent };

    // Se o lote/JSON já existir, realizamos a mesclagem inteligente
    if (fs.existsSync(jsonPath)) {
      try {
        const existingContent = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
        const isExistingBoleto = existingContent.documentType === "BOLETO" || 
                                 (existingContent.barcode && existingContent.barcode.trim().length > 0);
        const isNewBoleto = parsedContent.documentType === "BOLETO" || 
                            (parsedContent.barcode && parsedContent.barcode.trim().length > 0);

        if (isExistingBoleto && !isNewBoleto) {
          // O existente é Boleto, o novo é Nota Fiscal
          mergedContent = { ...existingContent };
          // Mescla informações de rateio e tributos da nova Nota Fiscal
          if (parsedContent.apportionment && parsedContent.apportionment.length > 0) {
            mergedContent.apportionment = parsedContent.apportionment;
          }
          if (parsedContent.financial?.taxes) {
            if (mergedContent.financial) {
              mergedContent.financial.taxes = parsedContent.financial.taxes;
            }
          }
          // Salva o PDF da Nota Fiscal como anexo secundário sem apagar o Boleto principal
          fs.copyFileSync(pdfPath, secondaryPdfPath);
        } else if (!isExistingBoleto && isNewBoleto) {
          // O existente é Nota Fiscal, o novo é Boleto
          mergedContent = { ...parsedContent };
          // Preserva o rateio e tributação existentes da Nota Fiscal
          if (existingContent.apportionment && existingContent.apportionment.length > 0) {
            mergedContent.apportionment = existingContent.apportionment;
          }
          if (existingContent.financial?.taxes) {
            if (mergedContent.financial) {
              mergedContent.financial.taxes = existingContent.financial.taxes;
            }
          }
          // Renomeia o PDF da Nota Fiscal existente para o secundário
          if (fs.existsSync(pdfDestPath)) {
            fs.renameSync(pdfDestPath, secondaryPdfPath);
          }
          // Grava o novo PDF (Boleto) como o PDF principal
          fs.copyFileSync(pdfPath, pdfDestPath);
        } else {
          // Casos idênticos, substituição simples
          fs.copyFileSync(pdfPath, pdfDestPath);
        }
      } catch (err) {
        console.error("[AVISO] Falha ao mesclar dados do lote existente:", err);
        fs.copyFileSync(pdfPath, pdfDestPath);
      }
    } else {
      // Primeiro documento do lote
      fs.copyFileSync(pdfPath, pdfDestPath);
    }

    // Salvamos o JSON mesclado final
    fs.writeFileSync(jsonPath, JSON.stringify(mergedContent, null, 2), "utf8");

    // Mantemos o TXT apenas como um log rápido/visual
    const txtPath = path.join(outputDir, `${folderName}.txt`);
    const additionalLog = mergedContent.additionalInfo ? `\nInformações Extras: ${JSON.stringify(mergedContent.additionalInfo)}` : "";
    const logContent = `Extração realizada via Gemini IA\nFornecedor: ${mergedContent.supplier?.name}\nCNPJ Fornecedor: ${mergedContent.supplier?.cnpjCpf}\nValor: ${mergedContent.financial?.chargedValue}\nVencimento: ${mergedContent.financial?.dueDate}\nTipo: ${mergedContent.documentType}${additionalLog}`;
    fs.writeFileSync(txtPath, logContent, "utf8");

    return {
      fileName: `${folderName}.json`,
      outputPath: jsonPath,
      outputDir: outputDir,
      textContent: logContent,
      parsedContent: mergedContent,
    };
  } catch (error) {
    console.error(`Erro ao processar o arquivo ${pdfPath} com IA:`, error);
    throw error;
  }
}

export { extractDataFromPDF };
