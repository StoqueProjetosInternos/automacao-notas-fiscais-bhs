export interface BoletoData {
  documentType?: string;
  beneficiary?: {
    name?: string;
  };
  payer?: {
    name?: string;
    cnpjCpf?: string;
  };
  supplier?: {
    name?: string;
    cnpjCpf?: string;
  };
  financial?: {
    dueDate?: string;
    originalValue?: number;
    chargedValue?: number;
  };
  documentIdentifiers?: {
    ourNumber?: string;
    documentNumber?: string;
    issueDate?: string;
  };
  barcode?: string; 
  rawText?: string;
}

/*
 * Helpers
 */

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function parseBrazilianMoney(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}

function cleanExtractedLabel(value: string): string {
  return value
    .replace(/^[\s:-]+/, "")
    .replace(/[\s:-]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function removeTrailingDocumentTokens(value: string): string {
  return cleanExtractedLabel(
    value
      .replace(/\s+\d{2}\/\d{2}\/\d{4}\s+\d{1,3}(?:\.\d{3})*,\d{2}\s*$/i, "")
      .replace(/\s+-\s*$/, "")
  );
}

function parsePortugueseDate(value: string): string | undefined {
  const match = value.match(/(\d{1,2})\s+de\s+([A-Za-zçÇãõáéíóúâêô]+)\s+de\s+(\d{4})/i);
  if (!match) {
    return undefined;
  }

  const months: Record<string, string> = {
    janeiro: "01",
    fevereiro: "02",
    marco: "03",
    março: "03",
    abril: "04",
    maio: "05",
    junho: "06",
    julho: "07",
    agosto: "08",
    setembro: "09",
    outubro: "10",
    novembro: "11",
    dezembro: "12",
  };

  const day = match[1].padStart(2, "0");
  const normalizedMonth = match[2].toLowerCase();
  const month = months[normalizedMonth];

  if (!month) {
    return undefined;
  }

  return `${day}/${month}/${match[3]}`;
}

function extractLongDateNearLabel(text: string, label: string): string | undefined {
  const match = text.match(new RegExp(`${label}[^\n]{0,120}`, "i"));
  if (!match?.[0]) {
    return undefined;
  }

  return parsePortugueseDate(match[0]);
}

function isLikelyHeaderText(value: string): boolean {
  const normalized = value.toLowerCase();

  return /benefici[aá]rio final|dados do pagador|mensagem pagador|local de pagamento|uso do banco|ficha de compensa[cç][aã]o|autentica[cç][aã]o mec[aâ]nica|vencimento valor do documento|cliente vencimento|identifica[cç][aã]o para d[eé]bito|vencimento:?\s*c[oó]digo|^vencimento$|^c[oó]digo$|^valor:?$|n[úu]mero do documento|cpf\/cnpj|endere[cç]o|muni[cç][ií]pio|valor documento|instru[cç][oõ]es|pagador$|data do documento|boleto banc[aá]rio|forma de pagamento|recibo do pagador|m[eê]s refer[eê]ncia valor|^m[eê]s:/i.test(normalized);
}

function isLikelyAddressLine(value: string): boolean {
  return /^(rua|av\.?|avenida|travessa|tv\.?|rodovia|alameda|pra[cç]a|bairro|cep)\b/i.test(value);
}

function isLikelyEntityName(value: string): boolean {
  const cleaned = removeTrailingDocumentTokens(value);
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

  if (!cleaned || cleaned.length < 6 || isLikelyHeaderText(cleaned)) {
    return false;
  }

  if (/^[-\d./\s]+$/.test(cleaned)) {
    return false;
  }

  if (isLikelyAddressLine(cleaned)) {
    return false;
  }

  if (wordCount < 2) {
    return false;
  }

  return /[A-Za-zÀ-ÿ]/.test(cleaned);
}

function extractEntityNearTaxId(text: string): string | undefined {
  const lines = text
    .split("\n")
    .map(line => cleanExtractedLabel(line))
    .filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    if (!extractTaxId(lines[index])) {
      continue;
    }

    for (let offset = 1; offset <= 4; offset += 1) {
      const candidate = lines[index + offset];
      if (!candidate || !isLikelyEntityName(candidate)) {
        continue;
      }

      if (/[A-Za-zÀ-ÿ]/.test(candidate) && !isLikelyAddressLine(candidate)) {
        return removeTrailingDocumentTokens(candidate);
      }
    }
  }

  return undefined;
}

function extractStandaloneUppercaseEntity(text: string): string | undefined {
  const lines = text
    .split("\n")
    .map(line => cleanExtractedLabel(line))
    .filter(Boolean);

  for (const line of lines) {
    const candidate = removeTrailingDocumentTokens(line);
    if (!isLikelyEntityName(candidate)) {
      continue;
    }

    if (/^[A-ZÀ-Ú0-9][A-ZÀ-Ú0-9\s/&.-]{8,}$/.test(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function extractTaxId(value: string): string | undefined {
  return value.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/)?.[0];
}

function extractLineAfterHeader(text: string, headerPattern: RegExp): string | undefined {
  const match = text.match(headerPattern);
  return match?.[1]?.trim();
}

function extractDateNearLabel(text: string, label: string): string | undefined {
  const datePattern = "(\\d{2}\\/\\d{2}\\/\\d{4})";
  const patterns = [
    new RegExp(`${label}[^\\d\\n]{0,80}${datePattern}`, "i"),
    new RegExp(`${label}[^\\n]*\\n[^\\n]{0,140}?${datePattern}`, "i"),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

function extractFirstValidMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const candidate = match[1] ? cleanExtractedLabel(match[1]) : "";
      if (isLikelyEntityName(candidate)) {
        return removeTrailingDocumentTokens(candidate);
      }
    }
  }

  return undefined;
}

function isValidDocumentIdentifier(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return /^[A-Z0-9./-]{3,}$/i.test(value) && !isLikelyHeaderText(value);
}

function detectDocumentType(text: string): string {
  if (/hidr\s+\d+|leitura anterior|consumo/i.test(text)) {
    return "Água";
  }
  if (/claro|minha-?claro|telefonia|internet/i.test(text)) {
    return "Internet/Telefonia";
  }
  if (/energia elétrica|kwh/i.test(text)) {
    return "Energia Elétrica";
  }
  if (/gás|g[áa]s natural|consumo\s+em\s+m3|m3\s+de\s+gás/i.test(text)) {
    return "Gás";
  }
  return "Outros";
}

/**
 * Extrai valor monetário associado a rótulos conhecidos
 */
function extractMoneyByLabel(
  text: string,
  labels: string[]
): number | undefined {
  const moneyPattern = "(\\d{1,3}(?:\\.\\d{3})*,\\d{2})";

  for (const label of labels) {
    const patterns = [
      new RegExp(`${label}[^\\d\\n]{0,30}(?:R\\$\\s*)?${moneyPattern}`, "i"),
      new RegExp(`${label}[^\\n]*\\n[^\\n]{0,80}?(?:R\\$\\s*)?${moneyPattern}`, "i"),
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return parseBrazilianMoney(match[1]);
      }
    }
  }

  return undefined;
}

/**
 * Extrai linha digitável / código de barras normalizado
 */
function extractBarcode(text: string): string | undefined {
  const linePatterns = [
    /\b(\d{5}\.\d{5}\s+\d{5}\.\d{6}\s+\d{5}\.\d{6}\s+\d\s+\d{14})\b/,
    /\b((?:\d{11,12}-\d\s+){3}\d{11,12}-\d)\b/,
    /\b(\d{47,48})\b/,
    /(\d{3,5}[.\s-]?\d{5}[.\s-]?\d{5,6}[.\s-]?\d{5,6}[.\s-]?\d[.\s-]?\d{10,14})/,
  ];

  for (const pattern of linePatterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const numeric = match[1].replace(/[^\d]/g, "");
    if (numeric.length >= 44 && numeric.length <= 48) {
      return numeric;
    }
  }

  return undefined;
}

/**
 * Extrai beneficiário de forma genérica:
 * - Linha em CAIXA ALTA
 * - Próxima linha contém CNPJ
 */

function extractBeneficiary(text: string): string | undefined {
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length - 1; i++) {
    if (
      /^[A-ZÀ-Ú\s]{10,}$/.test(lines[i]) &&
      /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/.test(lines[i + 1])
    ) {
      return lines[i];
    }
  }

  return undefined;
}

/**
 * Fallback semântico para beneficiário
 */
function extractBeneficiaryFallback(text: string): string | undefined {
  const byLabel = extractFirstValidMatch(text, [
    /(?:^|\n)Beneficiário\s+([^\n]+)/gim,
    /(?:^|\n)Beneficiário\s*\n([^\n]+)/gim,
  ]);

  if (byLabel) {
    return byLabel.replace(/\s+-\s+\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}.*$/i, "");
  }

  const dueDateLineMatch = text.match(/(?:^|\n)([A-ZÀ-Ú][A-ZÀ-Ú\s.&/-]{8,}?)\s+\d{2}\/\d{2}\/\d{4}\s+\d{1,3}(?:\.\d{3})*,\d{2}(?:\n|$)/m);
  if (dueDateLineMatch?.[1]) {
    return removeTrailingDocumentTokens(dueDateLineMatch[1]);
  }

  return undefined;
}

function extractPersonByLabel(text: string, label: string): { name?: string; cnpjCpf?: string } | undefined {
  const patterns = [
    new RegExp(`(?:^|\\n)${label}\\s*\\n([^\\n]+)`, "i"),
    new RegExp(`(?:^|\\n)${label}\\s+([^\\n]+)`, "i"),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const line = cleanExtractedLabel(match[1]);
    if (!isLikelyEntityName(line)) {
      continue;
    }

    const cnpjCpf = extractTaxId(line);
    const name = cleanExtractedLabel(line.replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "").replace(/\s+-\s*$/, ""));

    if (name) {
      return {
        name,
        cnpjCpf,
      };
    }
  }

  return undefined;
}

function extractPayer(text: string): { name?: string; cnpjCpf?: string } | undefined {
  const explicitPayer = extractPersonByLabel(text, "Pagador");
  if (explicitPayer) {
    return explicitPayer;
  }

  const clientMatch = text.match(/(?:^|\n)Cliente:\s*([^\n]+)(?:\nCNPJ:\s*([^\n]+))?/im);
  if (clientMatch?.[1] && isLikelyEntityName(clientMatch[1])) {
    const line = cleanExtractedLabel(clientMatch[1]);
    return {
      name: removeTrailingDocumentTokens(line),
      cnpjCpf: extractTaxId(clientMatch[2] ?? ""),
    };
  }

  return undefined;
}

function extractDocumentNumber(text: string): string | undefined {
  const directMatch = text.match(/(?:^|\n)(?:Número|Numero) do documento[:\s]*([A-Z0-9./-]+)\s*(?:\n|$)/i);
  if (isValidDocumentIdentifier(directMatch?.[1])) {
    return directMatch[1].trim();
  }

  const tableLine = extractLineAfterHeader(text, /(?:Número|Numero) do documento[^\n]*\n([^\n]+)/i);
  if (tableLine) {
    const candidate = tableLine.split(/\s+/)[0]?.trim();
    if (isValidDocumentIdentifier(candidate) && !/[A-Za-z]{4,}/.test(candidate)) {
      return candidate;
    }
  }

  const alternateLine = extractLineAfterHeader(text, /Data do documento\s+No documento[^\n]*\n([^\n]+)/i);
  if (alternateLine) {
    const candidate = alternateLine.split(/\s+/)[1]?.trim();
    if (isValidDocumentIdentifier(candidate)) {
      return candidate;
    }
  }

  const invoiceMatch = text.match(/Fatura de [^\n]*n[ºo]?\s*([A-Z0-9./-]+)/i);
  if (isValidDocumentIdentifier(invoiceMatch?.[1])) {
    return invoiceMatch[1].trim();
  }

  const utilityMatch = text.match(/FAT\s+N\s+\d{2}\/\d{2}\/\d{4}\s+([A-Z0-9./-]+)/i);
  if (isValidDocumentIdentifier(utilityMatch?.[1])) {
    return utilityMatch[1].trim();
  }

  return undefined;
}

function extractOurNumber(text: string): string | undefined {
  const directMatch = text.match(/(?:^|\n)Nosso n[úu]mero[:\s]*([0-9./-]+)\s*(?:\n|$)/i);
  if (directMatch?.[1]) {
    return directMatch[1].trim();
  }

  const tableLine = extractLineAfterHeader(text, /Data do documento[^\n]*Nosso n[úu]mero\s*\n([^\n]+)/i);
  if (tableLine) {
    const parts = tableLine.split(/\s+/);
    return parts[parts.length - 1]?.trim();
  }

  const beneficiaryLine = extractLineAfterHeader(text, /Agência\/Código do Beneficiário[^\n]*Nosso número\s*\n([^\n]+)/i);
  if (beneficiaryLine) {
    return beneficiaryLine.match(/([A-Z0-9]+\/[A-Z0-9-]+)/i)?.[1]?.trim();
  }

  return undefined;
}

function extractIssueDate(text: string): string | undefined {
  const explicitDate = (
    extractDateNearLabel(text, "Data de Emissão") ??
    extractDateNearLabel(text, "Data do documento")
  );

  if (explicitDate) {
    return explicitDate;
  }

  return extractLongDateNearLabel(text, "Emissão") ?? extractDateNearLabel(text, "Emissão");
}

function extractAllEntityCnpjPairs(text: string): Array<{ entity: string; cnpj: string }> {
  const pairs: Array<{ entity: string; cnpj: string }> = [];
  const lines = text.split("\n").map(l => cleanExtractedLabel(l)).filter(Boolean);

  for (const line of lines) {
    const cnpj = extractTaxId(line);
    if (!cnpj) {
      continue;
    }

    const entityMatch = line.match(/([A-Za-zÀ-ÿ\s&./-]+)\s*-?\s*\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    if (entityMatch?.[1]) {
      let entity = removeTrailingDocumentTokens(entityMatch[1]);
      
      entity = entity.replace(/^(?:benefici[aá]rio|empresa|contratante|fornecedor|cliente)\s+/i, "").trim();
      
      if (isLikelyEntityName(entity)) {
        pairs.push({ entity, cnpj });
      }
    }
  }

  return pairs;
}

function extractSupplier(text: string, payerCnpj?: string): { name?: string; cnpjCpf?: string } | undefined {
  const pairs = extractAllEntityCnpjPairs(text);

  if (pairs.length === 0) {
    return undefined;
  }

  if (pairs.length === 1) {
    const pair = pairs[0];
    if (payerCnpj && pair.cnpj === payerCnpj) {
      return undefined;
    }

    return { name: pair.entity, cnpjCpf: pair.cnpj };
  }

  const byLabel = extractFirstValidMatch(text, [
    /(?:^|\n)Beneficiário(?:\s+Final)?\s+([^\n]+)/gim,
    /(?:^|\n)(?:Empresa|Contratante|Fornecedor)\s+([^\n]+)/gim,
  ]);

  if (byLabel) {
    const labelCnpj = extractTaxId(text);
    const match = pairs.find(p => p.entity === byLabel || p.cnpj === labelCnpj);
    if (match) {
      return { name: match.entity, cnpjCpf: match.cnpj };
    }
  }

  for (const pair of pairs) {
    if (payerCnpj && pair.cnpj === payerCnpj) {
      continue;
    }

    return { name: pair.entity, cnpjCpf: pair.cnpj };
  }

  return undefined;
}

/*
 * Parser principal
 */

export function parseBoletoData(rawText: string): BoletoData {
  const text = normalizeText(rawText);

  const parsedData: BoletoData = {
    rawText: text,
  };

  /* 
   * Tipo do documento
   */
  const documentType = detectDocumentType(text);
  parsedData.documentType = documentType;

  /* 
   * Beneficiário (best-effort)
   */
  const beneficiary =
    extractBeneficiary(text) ??
    extractBeneficiaryFallback(text) ??
    extractEntityNearTaxId(text) ??
    extractStandaloneUppercaseEntity(text);

  if (beneficiary) {
    parsedData.beneficiary = { name: beneficiary };
  }

  const payer = extractPayer(text);
  if (payer?.name || payer?.cnpjCpf) {
    parsedData.payer = payer;
  }

  const supplier = extractSupplier(text, payer?.cnpjCpf);
  if (supplier?.name || supplier?.cnpjCpf) {
    parsedData.supplier = supplier;
  }

  const documentNumber = extractDocumentNumber(text);
  const ourNumber = extractOurNumber(text);
  const issueDate = extractIssueDate(text);

  if (documentNumber || ourNumber || issueDate) {
    parsedData.documentIdentifiers = {
      documentNumber,
      ourNumber,
      issueDate,
    };
  }

  /* 
   * Vencimento
   */
  const dueDate =
    extractDateNearLabel(text, "Vencimento") ??
    text.match(/(\d{2}\/\d{2}\/\d{4})\s+\d{1,3}(?:\.\d{3})*,\d{2}/)?.[1];

  if (dueDate) {
    parsedData.financial = {
      ...parsedData.financial,
      dueDate,
    };
  }

  /* 
   * Valores financeiros
   */
  let value: number | undefined;

  if (documentType === "Internet/Telefonia") {
    value =
      extractMoneyByLabel(text, [
        "Valor Total",
        "TOTAL DA NOTA FISCAL",
        "Total Internet",
        "Total",
      ]) ??
      extractMoneyByLabel(text, ["Internet"]);
  } else {
    value = extractMoneyByLabel(text, [
      "Valor documento",
      "Valor cobrado",
      "Valor Total",
      "TOTAL DA NOTA FISCAL",
    ]);

    const moneyMatches = text.match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g);
    if (value === undefined && moneyMatches?.length) {
      value = parseBrazilianMoney(
        moneyMatches[moneyMatches.length - 1]
      );
    }
  }

  if (value !== undefined) {
    parsedData.financial = {
      ...parsedData.financial,
      originalValue: value,
      chargedValue: value,
    };
  }

  /*
   * Código de barras
   */
  const barcode = extractBarcode(text);
  if (barcode) {
    parsedData.barcode = barcode;
  }

  return parsedData;
}
