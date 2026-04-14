import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

interface PDFResult {
  text: string;
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
  version: string;
}

interface ExtractedData {
  fileName: string;
  outputPath: string;
  textContent: string;
}

async function extractDataFromPDF(pdfPath: string): Promise<ExtractedData> {
  console.log("Inicializando extração de dados...");

  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const uint8Array = new Uint8Array(dataBuffer);
    const parser = new PDFParse(uint8Array);

    const result: any = await parser.getText();
    const textContent = result.text || result.toString();

    // 1. Pega apenas o nome do arquivo original (ex: "nota.pdf")
    const fileName = path.basename(pdfPath, ".pdf") + ".txt";

    // 2. Define o caminho da pasta de destino
    const outputDir = path.join("src", "filesExtracted");

    // 3. Verifica se a pasta existe, se não, cria ela
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 4. Junta o caminho da pasta com o nome do arquivo
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, textContent, "utf8");

    console.log(`Dados salvos com sucesso em: ${outputPath}`);

    return {
      fileName,
      outputPath,
      textContent
    };
  } catch (error) {
    console.error("Erro ao extrair ou salvar os dados:", error);
    throw error;
  }
}

export { extractDataFromPDF };