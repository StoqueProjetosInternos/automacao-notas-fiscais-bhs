import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

import { extractDataFromPDF } from "../features/pdf/extractDataFromPDF.js";
import fs from "fs";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Uso: npx tsx src/scripts/test_pdf.ts <caminho_do_pdf>");
    console.log("Exemplo: npx tsx src/scripts/test_pdf.ts test_2.pdf");
    return;
  }

  const pdfPath = args[0];

  if (!fs.existsSync(pdfPath)) {
    console.error(`Erro: Arquivo '${pdfPath}' não encontrado.`);
    return;
  }

  console.log(`=== Processando: ${path.basename(pdfPath)} ===\n`);

  try {
    const result = await extractDataFromPDF(pdfPath);
    
    console.log("\n--- JSON ESTRUTURADO ---");
    console.log(JSON.stringify(result.parsedContent, null, 2));
    console.log("\n------------------------");
    
    console.log(`\nSucesso! Texto organizado salvo em: ${result.outputPath}`);
  } catch (err) {
    console.error("\nFalha na extração:");
    console.error(err instanceof Error ? err.message : err);
  }
}

main();
