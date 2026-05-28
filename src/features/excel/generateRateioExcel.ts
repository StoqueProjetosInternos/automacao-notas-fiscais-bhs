import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { BoletoData } from "../pdf/parseBoletoData.js";

export async function generateRateioExcel(
  boleto: BoletoData,
  outputDir = "src/filesExtracted"
): Promise<string> {

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Rateio");

  /* =========================
   * Título (merge A1:G1)
   * ========================= */
  worksheet.mergeCells("A1:G1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Rateio de Despesas - Boleto";
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E2EFDA" } // verde claro
  };

  worksheet.getRow(1).height = 28;

  /* =========================
   * Cabeçalhos (linha 2)
   * ========================= */
  const headers = [
    "Código CR",
    "Cód. Natureza",
    "Contrato",
    "Valor",
    "Desc. CR",
    "Desc. Natureza",
    "Desc. Contrato"
  ];

  worksheet.addRow(headers);

  const headerRow = worksheet.getRow(2);
  headerRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D9D9D9" } // cinza
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  /* =========================
   * Dados (linha 3)
   * ========================= */
  const value = boleto.financial?.chargedValue ?? 0;
  console.log(boleto, 'Resultado vindo do boleto')

  // TODO: Remover dados hardcoded e preencher com informações extraídas do boleto
  const dataRow = worksheet.addRow([
    101,
    141401011,
    0,
    value,
    "Outsourcing de Impressão",
    "Internet",
    "-"
  ]);

  dataRow.eachCell(cell => {
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  // Formatação monetária
  worksheet.getCell("D3").numFmt = '"R$" #,##0.00';

  /* =========================
   * Largura das colunas
   * ========================= */
  worksheet.columns = [
    { width: 14 },
    { width: 18 },
    { width: 12 },
    { width: 14 },
    { width: 32 },
    { width: 20 },
    { width: 18 }
  ];

  const fileName = `Rateio.xlsx`;
  const filePath = path.join(outputDir, fileName);

  await workbook.xlsx.writeFile(filePath);

  return filePath;
}