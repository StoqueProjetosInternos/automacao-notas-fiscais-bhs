import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import { extractDataFromPDF } from "./features/pdf/extractDataFromPDF.js";
import { generateRateioExcel } from "./features/excel/generateRateioExcel.js";
import { GraphEmailPdfProcessor } from "./features/email/searchDataFromEmail.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Busca o .env na raiz do projeto - subindo 3 níveis a partir de apps/automacao/src/main.ts
// Estrutura: apps/automacao/src/main.ts -> src (1) -> automacao (2) -> apps (3) -> RAIZ
const envPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: envPath });

async function main() {
  try {
    console.log("--- Iniciando Stoque Fiscal Intelligence (SFI) ---");

    // 1. Tentar processar e-mail (Fluxo Real)
    console.log("\n[1/2] Verificando novos e-mails via Microsoft Graph...");

    // Para evitar erros de autenticação durante o desenvolvimento local, o processamento de e-mails está comentado.

    // const processor = new GraphEmailPdfProcessor({
    //   tenantId: process.env.TENANT_ID || "",
    //   clientId: process.env.CLIENT_ID || "",
    //   clientSecret: process.env.CLIENT_SECRET || "",
    //   userEmail: process.env.USER_EMAIL || "",
    //   tempDir: path.join("..", "..", ".tmp"),
    //   outputDir: path.join("..", "..", "data", "extracted"),
    //   markAsReadAfterSuccess: false, // Mude para true em produção
    // });

    // const emailResult = await processor.processOneLatestUnread();
    const emailResult: any = null; // Simulando ausência de e-mails para teste local

    if (emailResult) {
      console.log(`E-mail "${emailResult.subject}" e seus anexos processados com sucesso.`);
    } else {
      console.log("Nenhum e-mail novo não lido com PDF encontrado.");

      // 2. Fallback para Teste Local (Se não houver e-mail)
      console.log("\n[2/2] Executando processamento local de teste...");
      
      const possiblePaths = [
        "../../test_31.pdf",  // Se rodando de apps/automacao
        "test_31.pdf"         // Se rodando da raiz
      ];
      
      let localPdf = "";
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          localPdf = p;
          break;
        }
      }

      if (localPdf) {
        console.log(`Processando arquivo local: ${localPdf}`);
        const { parsedContent, outputDir } = await extractDataFromPDF(localPdf);
        const excelPath = await generateRateioExcel(parsedContent, outputDir);
        console.log(`\nProcessamento local concluído.`);
        console.log(`Pasta: ${outputDir}`);
        console.log(`Excel gerado: ${excelPath}`);
      } else {
        console.warn("Arquivo de teste local não encontrado.");
      }
    }

    console.log("\n--- Fluxo Finalizado ---");

  } catch (error) {
    console.error("Erro no fluxo principal:", error);
  }
}

main();
