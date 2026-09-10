import { ApportionmentItem } from "./types.js";

/**
 * Extrai itens de equipamentos e locação diretamente do texto vetorial do documento PDF
 */
export async function extractTableItemsFromPdf(
  pdfBuffer: Buffer,
  chargedValue?: number
): Promise<ApportionmentItem[]> {
  try {
    const pdfParseModule: any = await import("pdf-parse");
    const PDFParse =
      pdfParseModule.PDFParse ||
      pdfParseModule.default?.PDFParse ||
      pdfParseModule.default;

    let fullText = "";

    if (typeof PDFParse === "function" && PDFParse.prototype && PDFParse.prototype.getText) {
      const parser = new PDFParse(new Uint8Array(pdfBuffer));
      const parsed = await parser.getText();
      if (Array.isArray(parsed?.pages)) {
        fullText = parsed.pages.map((p: any) => p.text || "").join("\n");
      } else if (typeof parsed?.text === "string") {
        fullText = parsed.text;
      }
    } else if (typeof pdfParseModule.default === "function") {
      const parsed = await pdfParseModule.default(pdfBuffer);
      fullText = parsed.text || "";
    }

    if (!fullText || fullText.trim().length === 0) {
      return [];
    }

    const items: ApportionmentItem[] = [];

    // 1. Layout Magna Locação de Informática
    // Formato da linha: QTD DATA_INI DATA_FIM DESCRIÇÃO VALOR_UNIT VALOR_TOTAL UN
    const isMagna =
      fullText.includes("MAGNA SERVICOS DE MANUTENCAO") ||
      fullText.includes("11.603.140/0001-70") ||
      fullText.includes("ND-00") ||
      fullText.includes("\tUN") ||
      fullText.includes(" UN");

    if (isMagna) {
      const magnaRegex = /(\d+)\s+(\d{2}\/\d{2})\s+(\d{2}\/\d{2})\s+([\s\S]*?)\s+([\d.,]+)\s+([\d.,]+)\s+UN/g;
      const matches = [...fullText.matchAll(magnaRegex)];

      if (matches.length > 0) {
        for (const m of matches) {
          const qty = parseInt(m[1], 10) || 1;
          const cleanDesc = m[4].replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
          const unitVal = parseFloat(m[5].replace(/\./g, "").replace(",", "."));
          const totalVal = parseFloat(m[6].replace(/\./g, "").replace(",", "."));

          const parMatches = [...cleanDesc.matchAll(/\(([^)]+)\)/g)].map(x => x[1].trim().toUpperCase());
          const serial = parMatches.length > 1 ? parMatches[parMatches.length - 1] : (parMatches[0] || undefined);

          if (!isNaN(totalVal)) {
            items.push({
              description: cleanDesc,
              quantity: qty,
              unitValue: isNaN(unitVal) ? totalVal : unitVal,
              value: totalVal,
              serialNumber: serial
            });
          }
        }
      }
    }

    // 2. Layout EMC Tecnologia
    // Formato da linha: CódigoItem Descrição DataIni DataFim ValorUnit PróRata ValorTotal
    const isEmc =
      fullText.includes("EMC TECNOLOGIA") ||
      fullText.includes("22.261.093/0001-40") ||
      fullText.includes("PRÓ RATA");

    if (items.length === 0 && isEmc) {
      const emcRegex = /(\d{5,7})\s+(.+?)\s+\d{2}\/\d{2}\/\d{4}\s+\d{2}\/\d{2}\/\d{4}\s+R\$\s*([\d.,]+)\s+-?R\$\s*[\d.,]+\s+R\$\s*([\d.,]+)/g;
      const matches = [...fullText.matchAll(emcRegex)];

      if (matches.length > 0) {
        for (const m of matches) {
          const itemCode = m[1];
          const rawDesc = m[2].replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
          const unitVal = parseFloat(m[3].replace(/\./g, "").replace(",", "."));
          const totalVal = parseFloat(m[4].replace(/\./g, "").replace(",", "."));

          if (!isNaN(totalVal)) {
            items.push({
              description: `${rawDesc} (Item ${itemCode})`,
              quantity: 1,
              unitValue: isNaN(unitVal) ? totalVal : unitVal,
              value: totalVal,
              serialNumber: itemCode
            });
          }
        }
      }
    }

    // Validação de integridade: confere se a soma dos itens fecha com o valor cobrado
    if (items.length > 0) {
      const itemsSum = items.reduce((acc, it) => acc + (it.value || 0), 0);
      if (chargedValue && chargedValue > 0) {
        const diff = Math.abs(chargedValue - itemsSum);
        if (diff <= 2.00 || (itemsSum / chargedValue) >= 0.95) {
          console.log(`[TableExtractor] ${items.length} itens extraídos via texto nativo do PDF. Soma: R$ ${itemsSum.toFixed(2)} (Total documento: R$ ${chargedValue.toFixed(2)}).`);
          return items;
        } else {
          console.warn(`[TableExtractor] Divergência na soma dos itens nativos (R$ ${itemsSum.toFixed(2)}) versus total cobrado (R$ ${chargedValue.toFixed(2)}).`);
        }
      } else {
        return items;
      }
    }

    return items;
  } catch (error) {
    console.warn("[TableExtractor] Falha ao extrair itens via texto nativo do PDF:", error);
    return [];
  }
}
