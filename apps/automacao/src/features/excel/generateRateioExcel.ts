import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { BoletoData, ApportionmentItem } from "../pdf/types.js";

export async function generateRateioExcel(
  boleto: BoletoData,
  outputDir = path.join("..", "..", "data", "extracted")
): Promise<string> {

  // Extração e higienização dinâmica do nome do parceiro comercial
  const rawSupplierName = boleto.supplier?.name || "Fornecedor";
  const partnerName = rawSupplierName
    .replace(/\s+(spain|s\.l\.u\.|s\/a|s\.a\.|ltda|s\.a|ltda\.|s\.l\.|solucoes|tecnologicas)/gi, "")
    .trim();

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Normalização de itens
  let items: ApportionmentItem[] = boleto.apportionment || [];

  // Extrai fallbacks do cabeçalho contábil geral editado pelo usuário
  const headerCr = boleto.accountingFields?.cr && boleto.accountingFields.cr !== "N/A" ? boleto.accountingFields.cr : "N/A";
  const headerCrDesc = boleto.accountingFields?.crDescription && boleto.accountingFields.crDescription !== "N/A" ? boleto.accountingFields.crDescription : "Centro de Custo";
  const headerNatureza = boleto.accountingFields?.naturezaCode && boleto.accountingFields.naturezaCode !== "N/A" ? boleto.accountingFields.naturezaCode : "N/A";
  const headerNaturezaDesc = boleto.accountingFields?.naturezaDescription && boleto.accountingFields.naturezaDescription !== "N/A" ? boleto.accountingFields.naturezaDescription : "Locação de bens móveis";
  const headerContract = boleto.accountingFields?.contract && boleto.accountingFields.contract !== "-" ? boleto.accountingFields.contract : "0";

  if (items.length === 0) {
    const value = Math.round((boleto.financial?.chargedValue ?? 0) * 100) / 100;
    items = [{
      cr: headerCr,
      naturezaCode: headerNatureza,
      contract: headerContract,
      value,
      crDescription: headerCrDesc,
      naturezaDescription: headerNaturezaDesc,
      description: "-",
      serialNumber: "-"
    }];
  } else {
    // Se a fatura tiver itens de rateio, enriquece itens que não possuem dados contábeis próprios herdando-os do cabeçalho geral editado pelo usuário
    items = items.map(item => ({
      ...item,
      cr: item.cr && item.cr !== "N/A" ? item.cr : headerCr,
      crDescription: item.crDescription && item.crDescription !== "N/A" ? item.crDescription : headerCrDesc,
      naturezaCode: item.naturezaCode && item.naturezaCode !== "N/A" ? item.naturezaCode : headerNatureza,
      naturezaDescription: item.naturezaDescription && item.naturezaDescription !== "N/A" ? item.naturezaDescription : headerNaturezaDesc,
      contract: item.contract && item.contract !== "-" && item.contract !== "N/A" ? item.contract : (headerContract !== "0" ? headerContract : "0")
    }));
  }

  const workbook = new ExcelJS.Workbook();

  /* =========================================================================
   * ABA 1: Rateio (Agrupamento Consolidado - 7 colunas solicitadas)
   * ========================================================================= */
  const rateioSheet = workbook.addWorksheet("Rateio");
  rateioSheet.columns = [
    { width: 14 },
    { width: 18 },
    { width: 12 },
    { width: 14 }
  ];

  // Título (merge A1:D1)
  rateioSheet.mergeCells("A1:D1");
  const rTitleCell = rateioSheet.getCell("A1");
  rTitleCell.value = `Rateio ${partnerName}`;
  rTitleCell.font = { bold: true, size: 14 };
  rTitleCell.alignment = { vertical: "middle", horizontal: "center" };
  rTitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E2EFDA" } // verde claro
  };
  rateioSheet.getRow(1).height = 28;

  // Cabeçalhos (linha 2)
  const rateioHeaders = [
    "Código CR",
    "Cód. Natureza",
    "Contrato",
    "Valor"
  ];
  rateioSheet.addRow(rateioHeaders);

  const rHeaderRow = rateioSheet.getRow(2);
  rHeaderRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D9D9D9" } // cinza
    };
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" },
      bottom: { style: "thin" }, right: { style: "thin" }
    };
  });

  // Agrupamento dos itens
  interface GroupedItem {
    cr: string;
    crDescription: string;
    naturezaCode: string;
    naturezaDescription: string;
    contract: string;
    valueSum: number;
    description: string;
  }
  
  const groups = new Map<string, GroupedItem>();

  items.forEach(item => {
    const cr = item.cr || "N/A";
    const crDescription = item.crDescription || "Centro de Custo";
    const naturezaCode = item.naturezaCode || "N/A";
    const naturezaDescription = item.naturezaDescription || "Locação de bens móveis";
    const contract = item.contract && item.contract !== "-" ? item.contract : "0";
    const value = Math.round((item.value ?? 0) * 100) / 100;
    const description = item.description || "-";

    const key = `${cr}|${naturezaCode}|${contract}`;
    if (groups.has(key)) {
      const g = groups.get(key)!;
      g.valueSum = Math.round((g.valueSum + value) * 100) / 100;
    } else {
      groups.set(key, {
        cr,
        crDescription,
        naturezaCode,
        naturezaDescription,
        contract,
        valueSum: Math.round(value * 100) / 100,
        description
      });
    }
  });

  // Insere itens consolidados
  Array.from(groups.values()).forEach((g, index) => {
    const rowNumber = index + 3;
    const dataRow = rateioSheet.addRow([
      g.cr,
      g.naturezaCode,
      g.contract,
      g.valueSum
    ]);

    dataRow.eachCell(cell => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      };
    });

    // Formatação monetária da soma
    rateioSheet.getCell(`D${rowNumber}`).numFmt = '"R$" #,##0.00';
  });

  // Colunas já configuradas no início da aba para preservar o mergeCells


  /* =========================================================================
   * ABA 2: Rateio_Detalhado (Detalhamento por Item)
   * ========================================================================= */
  const detalhadoSheet = workbook.addWorksheet("Rateio_Detalhado");
  detalhadoSheet.columns = [
    { width: 14 },
    { width: 18 },
    { width: 12 },
    { width: 14 },
    { width: 32 },
    { width: 20 },
    { width: 18 },
    { width: 18 }
  ];

  // Título (merge A1:H1)
  detalhadoSheet.mergeCells("A1:H1");
  const dTitleCell = detalhadoSheet.getCell("A1");
  dTitleCell.value = `Rateio Detalhado ${partnerName}`;
  dTitleCell.font = { bold: true, size: 14 };
  dTitleCell.alignment = { vertical: "middle", horizontal: "center" };
  dTitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FCE4D6" } 
  };
  detalhadoSheet.getRow(1).height = 28;

  // Cabeçalhos (linha 2)
  const detalhadoHeaders = [
    "Código CR",
    "Cód. Natureza",
    "Contrato",
    "Valor",
    "Desc. CR",
    "Desc. Natureza",
    "Desc. Contrato",
    "Série"
  ];
  detalhadoSheet.addRow(detalhadoHeaders);

  const dHeaderRow = detalhadoSheet.getRow(2);
  dHeaderRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D9D9D9" } // cinza
    };
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" },
      bottom: { style: "thin" }, right: { style: "thin" }
    };
  });

  // Insere itens detalhados
  items.forEach((item, index) => {
    const rowNumber = index + 3;
    const value = Math.round((item.value ?? 0) * 100) / 100;
    const cr = item.cr || "N/A";
    const natureza = item.naturezaCode || "N/A";
    const contrato = item.contract || "0";
    const descCr = item.crDescription || "-";
    const descNatureza = item.naturezaDescription || "-";
    const descContrato = item.description || "-";
    const serial = item.serialNumber || "-";

    const dataRow = detalhadoSheet.addRow([
      cr,
      natureza,
      contrato,
      value,
      descCr,
      descNatureza,
      descContrato,
      serial
    ]);

    dataRow.eachCell(cell => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      };
    });

    detalhadoSheet.getCell(`D${rowNumber}`).numFmt = '"R$" #,##0.00';
  });

  // Colunas já configuradas no início da aba para preservar o mergeCells

  const folderName = path.basename(outputDir);
  const fileName = `${folderName}.xlsx`;
  const filePath = path.join(outputDir, fileName);

  await workbook.xlsx.writeFile(filePath);

  return filePath;
}