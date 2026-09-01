import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BoletoData } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findDataFile(relativePath: string): string {
  const resourcesPath = (process as any).resourcesPath || '';
  const possiblePaths = [
    path.resolve(resourcesPath, relativePath),
    path.resolve(resourcesPath, 'app', relativePath),
    path.resolve(process.cwd(), relativePath),
    path.resolve(__dirname, "../../../../../", relativePath),
    path.resolve(__dirname, "../../../../", relativePath),
    path.resolve(__dirname, "../../../", relativePath),
    path.resolve(__dirname, "../../", relativePath),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.resolve(process.cwd(), relativePath);
}

// Caminhos para as bases de referência
const CONSOLIDATED_JSON_PATH = findDataFile("data/rateios_consolidado.json");
const BASE_PATH = findDataFile("data/base_referencia.csv");
const ITEMS_MAPPING_PATH = findDataFile("data/mapeamento_itens.json");
const CNPJ_ALIASES_PATH = findDataFile("data/cnpj_aliases.json");
const BASE_FORNECEDORES_JSON_PATH = findDataFile("data/base_fornecedores_faturas.json");
const ROOT_CR_JSON_PATH = findDataFile("cr.json");
const ROOT_CD_JSON_PATH = findDataFile("cd.json");
const ROOT_NATUREZAS_JSON_PATH = findDataFile("naturezas.json");

// Cache e carregamento de descrições das Naturezas Contábeis da raiz
let naturezaDescriptionsMap: Record<string, string> = {};

function loadNaturezaDescriptions() {
  const jsonPath = ROOT_NATUREZAS_JSON_PATH;
  if (fs.existsSync(jsonPath)) {
    try {
      const content = fs.readFileSync(jsonPath, "utf8");
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        naturezaDescriptionsMap = {};
        for (const item of data) {
          const code = String(item.codNat).trim().replace(/\D/g, "");
          naturezaDescriptionsMap[code] = item.descricao;
        }
      }
    } catch (err) {
      console.error("[Enrichment] Falha ao carregar catálogo de naturezas da raiz:", err);
    }
  }
}

loadNaturezaDescriptions();

export function getNaturezaDescription(natCode: string | number | undefined | null): string {
  if (natCode === undefined || natCode === null) return "Rateio Geral";
  const cleanCode = String(natCode).split("-")[0].trim().replace(/\D/g, "");
  if (cleanCode === "") return "Rateio Geral";
  
  if (Object.keys(naturezaDescriptionsMap).length === 0) {
    loadNaturezaDescriptions();
  }
  
  return naturezaDescriptionsMap[cleanCode] || "Rateio Geral";
}

// Cache e carregamento de descrições dos Centros de Resultado (CR) da raiz
let crDescriptionsMap: Record<string, string> = {};

function loadCrDescriptions() {
  let jsonPath = ROOT_CR_JSON_PATH;
  if (!fs.existsSync(jsonPath) && fs.existsSync(ROOT_CD_JSON_PATH)) {
    jsonPath = ROOT_CD_JSON_PATH;
  }
  
  if (fs.existsSync(jsonPath)) {
    try {
      const content = fs.readFileSync(jsonPath, "utf8");
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        crDescriptionsMap = {};
        for (const item of data) {
          const code = String(item.codCencus).trim();
          crDescriptionsMap[code] = item.descricao;
        }
      }
    } catch (err) {
      console.error("[Enrichment] Falha ao carregar catálogo de CRs da raiz:", err);
    }
  }
}

loadCrDescriptions();

export function getCrDescription(cr: string | number | undefined | null): string {
  if (cr === undefined || cr === null) return "N/A";
  const cleanCr = String(cr).trim();
  if (cleanCr === "" || cleanCr.toUpperCase() === "N/A") return "N/A";
  
  if (Object.keys(crDescriptionsMap).length === 0) {
    loadCrDescriptions();
  }
  
  return crDescriptionsMap[cleanCr] || `Centro de Custo ${cleanCr}`;
}

// Mapeamento de CNPJs de fornecedores conhecidos (fallback em memória)
let CNPJ_TO_PARTNER: Record<string, string> = {
  "14737908000197": "Guilherme Carrapatoso", // INOVACODE / GUILHERME CARRAPATOSO GARCIA SERVICOS
};

// Carrega mapeamentos de CNPJ dinâmicos adicionais se o arquivo existir
if (fs.existsSync(CNPJ_ALIASES_PATH)) {
  try {
    const fileContent = fs.readFileSync(CNPJ_ALIASES_PATH, "utf8");
    const parsed = JSON.parse(fileContent);
    CNPJ_TO_PARTNER = { ...CNPJ_TO_PARTNER, ...parsed };
    console.log(`[Enrichment] Mapeamento de CNPJs carregado com sucesso (${Object.keys(CNPJ_TO_PARTNER).length} registros).`);
  } catch (err) {
    console.error("[Enrichment] Falha ao analisar cnpj_aliases.json, usando padrao em memoria:", err);
  }
}

/**
 * Normaliza uma string para comparação (apenas números)
 */
function normalizeNumbers(value: string): string {
  if (!value) return "";
  return value.replace(/[^0-9]/g, "").replace(/^0+/, "");
}

/**
 * Normaliza string para comparação genérica textual
 */
function cleanString(val: any): string {
  if (val === undefined || val === null) return "";
  return String(val).trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Busca fallback contábil no CSV de parceiros caso o fornecedor não esteja na base consolidada
 */
function getCsvFallback(supplierCnpj: string, clientAccount: string): any {
  if (!fs.existsSync(BASE_PATH)) {
    return { cr: "N/A", naturezaCode: "N/A", contract: "0" };
  }

  try {
    const content = fs.readFileSync(BASE_PATH, "utf8");
    const lines = content.trim().split("\n");
    const rows = lines.slice(1);

    const normalizedCnpj = normalizeNumbers(supplierCnpj);
    const normalizedAccount = normalizeNumbers(clientAccount);

    const cnpjMatches = rows.filter(row => {
      const cols = row.split(",");
      return normalizeNumbers(cols[0]) === normalizedCnpj;
    });

    if (cnpjMatches.length === 0) {
      return { cr: "N/A", naturezaCode: "N/A", contract: "0" };
    }

    let matchRow = cnpjMatches[0];
    if (cnpjMatches.length > 1) {
      const accMatch = cnpjMatches.find(row => normalizeNumbers(row.split(",")[1]) === normalizedAccount);
      if (accMatch) matchRow = accMatch;
      else {
        const defMatch = cnpjMatches.find(row => row.split(",")[1] === "DEFAULT");
        if (defMatch) matchRow = defMatch;
      }
    }

    const cols = matchRow.split(",");
    return {
      naturezaCode: cols[3],
      naturezaDescription: cols[4],
      cr: cols[5],
      contract: cols[6],
    };
  } catch (err) {
    console.error("[Enrichment] Falha ao ler CSV de fallback:", err);
    return { cr: "N/A", naturezaCode: "N/A", contract: "0" };
  }
}

/**
 * Enriquece os dados extraídos com informações contábeis baseadas na nova base consolidada
 */
export async function enrichData(data: BoletoData): Promise<BoletoData> {
  const supplierCnpj = data.supplier?.cnpjCpf || "";
  const supplierName = data.supplier?.name || "";
  const clientAccount = data.documentIdentifiers?.clientAccount || data.documentIdentifiers?.documentNumber || "";

  console.log(`[Enrichment] Processando enriquecimento contábil de: ${supplierName || "Fornecedor Desconhecido"}`);

  const cleanCnpj = normalizeNumbers(supplierCnpj);

  // Carrega base de fornecedores cadastrados
  let baseFornecedores: any[] = [];
  if (fs.existsSync(BASE_FORNECEDORES_JSON_PATH)) {
    try {
      baseFornecedores = JSON.parse(fs.readFileSync(BASE_FORNECEDORES_JSON_PATH, "utf8"));
    } catch (err) {
      console.error("[Enrichment] Erro ao analisar base_fornecedores_faturas.json:", err);
    }
  }

  // Busca correspondência de cadastro pelo CNPJ ou secundariamente pela Razão Social
  let matchedSupplier = cleanCnpj ? baseFornecedores.find(item => normalizeNumbers(item.cnpj) === cleanCnpj) : undefined;
  
  if (!matchedSupplier && supplierName) {
    const cleanSupplierName = cleanString(supplierName);
    matchedSupplier = baseFornecedores.find(item => {
      const cleanItemName = cleanString(item.fornecedor);
      return cleanSupplierName.includes(cleanItemName) || cleanItemName.includes(cleanSupplierName);
    });
  }
  
  let matchedPartnerCode = "";
  let isMagna = false;

  if (matchedSupplier) {
    isMagna = cleanString(matchedSupplier.fornecedor).includes("magna");
    matchedPartnerCode = matchedSupplier.documento.replace("PARC-", "");

    // Normaliza a Razão Social oficial do fornecedor, restaura o CNPJ e anexa o CódParceiro
    if (data.supplier) {
      data.supplier.name = matchedSupplier.fornecedor;
      data.supplier.partnerCode = matchedPartnerCode;
      if (!data.supplier.cnpjCpf) {
        data.supplier.cnpjCpf = matchedSupplier.cnpj;
      }
    }
  }

  // 1. Carregar fallback padrão do CSV caso o consolidado não possua a regra
  const fallback = getCsvFallback(supplierCnpj, clientAccount);

  // Sobrescreve as regras de fallback caso o fornecedor esteja cadastrado (exceto para o caso da Magna)
  if (matchedSupplier && !isMagna) {
    if (matchedSupplier.centroResultado) {
      fallback.cr = String(matchedSupplier.centroResultado);
    }
    if (matchedSupplier.natureza) {
      fallback.naturezaCode = String(matchedSupplier.natureza);
    }
  }

  let defaultAccounting = {
    cr: fallback.cr,
    crDescription: getCrDescription(fallback.cr),
    naturezaCode: fallback.naturezaCode,
    naturezaDescription: getNaturezaDescription(fallback.naturezaCode),
    contract: fallback.contract !== "0" && fallback.contract !== "" ? fallback.contract : "0"
  };

  // 2. Carregar a base de dados consolidada se existir
  let database: any = null;
  if (fs.existsSync(CONSOLIDATED_JSON_PATH)) {
    try {
      database = JSON.parse(fs.readFileSync(CONSOLIDATED_JSON_PATH, "utf8"));
    } catch (err) {
      console.error("[Enrichment] Falha ao analisar base consolidada JSON:", err);
    }
  }

  let matchedRateios: any[] | null = null;

  if (database) {
    // A. Tentar correspondência por Circuito/Conta específica de Telecom (Vivo/Claro)
    const cleanAccount = normalizeNumbers(clientAccount);
    if (cleanAccount && database.contas[cleanAccount]) {
      matchedRateios = database.contas[cleanAccount];
      console.log(`[Enrichment] Sucesso! Conta de Telecom correspondida no consolidado: ${clientAccount}`);
    }

    // B. Tentar correspondência por CNPJ do Fornecedor para evitar divergências de nome fantasia/razão social
    const cleanCnpj = normalizeNumbers(supplierCnpj);
    if (!matchedRateios && cleanCnpj) {
      const mappedPartner = CNPJ_TO_PARTNER[cleanCnpj];
      if (mappedPartner && database.faturas[mappedPartner]) {
        matchedRateios = database.faturas[mappedPartner];
        console.log(`[Enrichment] Sucesso! Fornecedor correspondido via mapeamento de CNPJ: ${mappedPartner}`);
      }
    }

    // C. Se não achou, tentar correspondência por Nome de Fornecedor nas Faturas Globais
    if (!matchedRateios && supplierName) {
      const cleanSupplier = cleanString(supplierName);
      const matchedFaturaKey = Object.keys(database.faturas).find(key => {
        const cleanKey = cleanString(key);
        return cleanSupplier.includes(cleanKey) || cleanKey.includes(cleanSupplier);
      });

      if (matchedFaturaKey) {
        matchedRateios = database.faturas[matchedFaturaKey];
        console.log(`[Enrichment] Sucesso! Fornecedor correspondido no consolidado: ${matchedFaturaKey}`);
      }
    }
  }

  // C. Se encontramos um rateio global no consolidado, atualizamos os dados contábeis padrão
  if (matchedRateios && matchedRateios.length === 1) {
    defaultAccounting = {
      cr: matchedRateios[0].cr,
      crDescription: getCrDescription(matchedRateios[0].cr),
      naturezaCode: matchedRateios[0].naturezaCode || defaultAccounting.naturezaCode,
      naturezaDescription: getNaturezaDescription(matchedRateios[0].naturezaCode || defaultAccounting.naturezaCode),
      contract: matchedRateios[0].contract && matchedRateios[0].contract !== "0" ? matchedRateios[0].contract : defaultAccounting.contract
    };
  }

  // Carrega mapeamentos textuais extras de itens se existirem
  let itemsMapping: any[] = [];
  if (fs.existsSync(ITEMS_MAPPING_PATH)) {
    try {
      itemsMapping = JSON.parse(fs.readFileSync(ITEMS_MAPPING_PATH, "utf8"));
    } catch (err) {
      console.error("[Enrichment] Erro ao ler mapeamento textual de itens:", err);
    }
  }

  // 3. Enriquecer os itens do rateio detalhado (apportionment)
  if (data.apportionment && data.apportionment.length > 0) {
    console.log(`[Enrichment] Processando rateio de ${data.apportionment.length} itens.`);
    data.apportionment = data.apportionment.map(item => {
      const desc = item.description || "";
      const parMatches = [...desc.matchAll(/\(([^)]+)\)/g)].map(m => m[1].trim().toUpperCase());

      // I. Exceção de Negócio: Correspondência por Código de Item da EMC (Aba Rateio_Detalhado)
      const isEmcSupplier = supplierName.toUpperCase().includes("EMC") || cleanCnpj === "22261093000140";
      if (database && database.emcItens) {
        const itemCodeMatch = desc.match(/Item\s+(\d+)/i) || desc.match(/\((\d+)\)/) || desc.match(/(\d{4,6})/);
        const itemCode = itemCodeMatch ? itemCodeMatch[1] : null;
        if (itemCode && database.emcItens[itemCode]) {
          const emcMap = database.emcItens[itemCode];
          console.log(`[Enrichment] Exceção EMC: Item ${itemCode} vinculado à Série: ${emcMap.serialNumber}`);
          return {
            ...item,
            serialNumber: emcMap.serialNumber,
            cr: emcMap.cr || defaultAccounting.cr,
            crDescription: getCrDescription(emcMap.cr || defaultAccounting.cr),
            naturezaCode: emcMap.naturezaCode || defaultAccounting.naturezaCode,
            naturezaDescription: getNaturezaDescription(emcMap.naturezaCode || defaultAccounting.naturezaCode),
            contract: emcMap.contract && emcMap.contract !== "0" && emcMap.contract !== "" ? emcMap.contract : "0"
          };
        }
      }

      // II. Tentar correspondência por Série de Hardware no banco consolidado
      if (database) {
        for (const code of parMatches) {
          if (database.series[code]) {
            const sMap = database.series[code];
            console.log(`[Enrichment] Item associado por Série de hardware "${code}" via base consolidada.`);
            return {
              ...item,
              cr: sMap.cr,
              crDescription: getCrDescription(sMap.cr),
              naturezaCode: sMap.naturezaCode || item.naturezaCode || defaultAccounting.naturezaCode,
              naturezaDescription: getNaturezaDescription(sMap.naturezaCode || item.naturezaCode || defaultAccounting.naturezaCode),
              contract: sMap.contract && sMap.contract !== "0" && sMap.contract !== "" ? sMap.contract : "0",
              serialNumber: code
            };
          }
        }
      }

      // II. Tentar correspondência por Padrão Textual extra (mapeamento_itens.json)
      const matchedItem = itemsMapping.find(m => desc.toLowerCase().includes(m.pattern.toLowerCase()));
      if (matchedItem) {
        return {
          ...item,
          cr: matchedItem.cr,
          crDescription: getCrDescription(matchedItem.cr),
          naturezaCode: matchedItem.naturezaCode,
          naturezaDescription: getNaturezaDescription(matchedItem.naturezaCode),
          contract: matchedItem.contract || defaultAccounting.contract
        };
      }

      // III. Fallback para os dados contábeis padrões (tratando "N/A" como ausente)
      const itemCr = (!item.cr || item.cr === "N/A") ? defaultAccounting.cr : item.cr;
      const itemCrDesc = (!item.crDescription || item.crDescription === "Centro de Custo N/A" || item.crDescription === "N/A" || item.crDescription.startsWith("Centro de Custo "))
        ? getCrDescription(itemCr)
        : item.crDescription;
      
      const itemNatCode = (!item.naturezaCode || item.naturezaCode === "N/A") ? defaultAccounting.naturezaCode : item.naturezaCode;

      return {
        ...item,
        cr: itemCr,
        crDescription: itemCrDesc,
        naturezaCode: itemNatCode,
        naturezaDescription: (!item.naturezaDescription || item.naturezaDescription === "Rateio Geral" || item.naturezaDescription === "N/A" || item.naturezaDescription === "Rateio Textual" || item.naturezaDescription === "Equipamento por Série")
          ? getNaturezaDescription(itemNatCode)
          : item.naturezaDescription,
        contract: (!item.contract || item.contract === "0" || item.contract === "-") 
          ? (defaultAccounting.contract && defaultAccounting.contract !== "-" ? defaultAccounting.contract : "0") 
          : item.contract
      };
    });

    // Mantém o accountingFields do cabeçalho preenchido para retrocompatibilidade
    data.accountingFields = {
      cr: defaultAccounting.cr,
      crDescription: defaultAccounting.crDescription,
      naturezaCode: defaultAccounting.naturezaCode,
      naturezaDescription: defaultAccounting.naturezaDescription,
      contract: defaultAccounting.contract && defaultAccounting.contract !== "0" && defaultAccounting.contract !== "-" ? defaultAccounting.contract : "0"
    };
  } else {
    // Caso de fatura com rateio simplificado (único)
    data.accountingFields = {
      cr: defaultAccounting.cr,
      crDescription: defaultAccounting.crDescription,
      naturezaCode: defaultAccounting.naturezaCode,
      naturezaDescription: defaultAccounting.naturezaDescription,
      contract: defaultAccounting.contract && defaultAccounting.contract !== "0" && defaultAccounting.contract !== "-" ? defaultAccounting.contract : "0"
    };

    // Preenche o apportionment com item único correspondente ao valor total
    const desc = data.additionalInfo?.naturezaOperacao || "Rateio de Despesa Única";
    const parMatches = [...desc.matchAll(/\(([^)]+)\)/g)].map(m => m[1].trim().toUpperCase());
    
    let matchedSerial: string | undefined;
    let sMap: any = null;

    if (database) {
      for (const code of parMatches) {
        if (database.series[code]) {
          sMap = database.series[code];
          matchedSerial = code;
          break;
        }
      }
    }

    let itemCr = defaultAccounting.cr;
    let itemNatCode = defaultAccounting.naturezaCode;
    let itemContract = defaultAccounting.contract;

    if (sMap) {
      itemCr = sMap.cr;
      itemNatCode = sMap.naturezaCode || defaultAccounting.naturezaCode;
      itemContract = sMap.contract || "0";
    }

    data.apportionment = [
      {
        description: desc,
        quantity: 1,
        unitValue: data.financial?.chargedValue || 0,
        value: data.financial?.chargedValue || 0,
        cr: itemCr,
        crDescription: getCrDescription(itemCr),
        naturezaCode: itemNatCode,
        naturezaDescription: getNaturezaDescription(itemNatCode),
        contract: itemContract,
        serialNumber: matchedSerial
      }
    ];
  }

  return data;
}
