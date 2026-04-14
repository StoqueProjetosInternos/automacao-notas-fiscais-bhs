import { extractDataFromPDF } from "./features/pdf/extractDataFromPDF.js";
import { parseBoletoData } from "./features/pdf/parseBoletoData.js";
import { processEmails } from './features/email/searchDataFromEmail.js'
import { generateRateioExcel } from "./features/excel/generateRateioExcel.js";

import fs from "fs";
import path from "path";

async function main() {
  try {

    /*
    //  TODO: Adicionar lógica para processar múltiplos arquivos PDF de uma pasta, ao invés de um arquivo específico
        TODO: Reestrurar o código para realizar o processamento dos e-mails antes de gerar o OCR.
    */  
    const { textContent, fileName, outputPath } = await extractDataFromPDF("./test_3.pdf");
    console.log("Extração de texto concluída:", fileName);

    const parsedData = parseBoletoData(textContent);
    console.log("Dados parseados:", parsedData);

    const outputDir = path.join("src", "filesExtracted");
    const jsonFileName = path.basename(fileName, ".txt") + ".json";
    const jsonOutputPath = path.join(outputDir, jsonFileName);
    fs.writeFileSync(jsonOutputPath, JSON.stringify(parsedData, null, 2), "utf8");
    
    console.log(`Dados estruturados salvos em: ${jsonOutputPath}`);

    const excelPath = generateRateioExcel(parsedData);
    console.log(`Excel de rateio gerado em: ${excelPath}`);

    // await processEmails();
  } catch (error) {
    console.error("Erro no main:", error);
  }
}

main()