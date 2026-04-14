import { unlockPdf } from "../features/pdf/unlockPdf.js";
import { extractDataFromPDF } from "../features/pdf/extractDataFromPDF.js";
import { parseBoletoData } from "../features/pdf/parseBoletoData.js";
import { generateRateioExcel } from "../features/excel/generateRateioExcel.js";

export async function processBoleto(
  pdfPath: string,
  password?: string
) {
  let finalPdfPath = pdfPath;

  if (password) {
    finalPdfPath = await unlockPdf(pdfPath, password);
  }

  const extracted = await extractDataFromPDF(finalPdfPath);
  const boletoData = parseBoletoData(extracted.textContent);
  const excelPath = await generateRateioExcel(boletoData);

  return {
    boletoData,
    excelPath
  };
}