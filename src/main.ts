import "dotenv/config";
import { extractDataFromPDF } from "./features/pdf/extractDataFromPDF.js";
import { generateRateioExcel } from "./features/excel/generateRateioExcel.js";
import { GraphEmailPdfProcessor } from "./features/email/searchDataFromEmail.js";
import fs from "fs";
import path from "path";

async function main() {
  try {
    console.log("--- Iniciando Automação de Notas Fiscais ---");

    // 1. Tentar processar e-mail (Fluxo Real)
    console.log("\n[1/2] Verificando novos e-mails via Microsoft Graph...");

    // const processor = new GraphEmailPdfProcessor({
    //   tenantId: process.env.TENANT_ID || "",
    //   clientId: process.env.CLIENT_ID || "",
    //   clientSecret: process.env.CLIENT_SECRET || "",
    //   userEmail: process.env.USER_EMAIL || "",
    //   tempDir: path.join("src", "tmp"),
    //   outputDir: path.join("src", "filesExtracted"),
    //   markAsReadAfterSuccess: false, // Mude para true em produção
    // });

    // const emailResult = await processor.processOneLatestUnread();
    const emailResult = null; // Simulando ausência de e-mails para teste local

    if (emailResult) {
      console.log(`E-mail "${emailResult.subject}" e seus anexos processados com sucesso.`);
    } else {
      console.log("Nenhum e-mail novo não lido com PDF encontrado.");

      // 2. Fallback para Teste Local (Se não houver e-mail)
      console.log("\n[2/2] Executando processamento local de teste (test_5.pdf)...");
      const localPdf = "./test_11.pdf";

      if (fs.existsSync(localPdf)) {
        const { parsedContent, outputDir } = await extractDataFromPDF(localPdf);
        const excelPath = await generateRateioExcel(parsedContent, outputDir);
        console.log(`\nProcessamento local concluído.`);
        console.log(`Pasta: ${outputDir}`);
        console.log(`Excel gerado: ${excelPath}`);
      } else {
        console.warn("Arquivo test_5.pdf não encontrado para o fallback local.");
      }
    }

    console.log("\n--- Fluxo Finalizado ---");

  } catch (error) {
    console.error("Erro no fluxo principal:", error);
  }
}

main();