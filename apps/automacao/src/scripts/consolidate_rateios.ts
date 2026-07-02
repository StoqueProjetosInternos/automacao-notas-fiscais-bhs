import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_RATEIOS_DIR = path.resolve(__dirname, "../../../../base_rateios");
const OUTPUT_JSON_PATH = path.resolve(__dirname, "../../../../data/rateios_consolidado.json");

interface ConsolidatedRateio {
  faturas: Record<string, any[]>;
  contas: Record<string, any[]>;
  series: Record<string, any>;
  colaboradores: Record<string, any>;
}

// Normaliza string para comparação
function cleanString(val: any): string {
  if (val === undefined || val === null) return "";
  return String(val).trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (file.endsWith(".xlsx") || file.endsWith(".xlsb") || file.endsWith(".xls")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function consolidate() {
  console.log("--- Iniciando Consolidação de Rateios ---");
  const files = scanDirectory(BASE_RATEIOS_DIR);
  
  const output: ConsolidatedRateio = {
    faturas: {},
    contas: {},
    series: {},
    colaboradores: {}
  };

  // Funções de busca adaptativa de colunas
  const findKey = (row: any, searchTerms: string[]): string | undefined => {
    const keys = Object.keys(row);
    return keys.find(k => {
      const normKey = cleanString(k);
      return searchTerms.some(term => normKey.includes(term));
    });
  };

  for (const filePath of files) {
    const relativePath = path.relative(BASE_RATEIOS_DIR, filePath);
    const folderName = path.basename(path.dirname(filePath));
    const fileName = path.basename(filePath);

    try {
      const workbook = XLSX.readFile(filePath);

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        let rawData = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];
        if (rawData.length === 0) continue;

        const firstRow = rawData[0];
        const keys = Object.keys(firstRow);

        // 1. Detectar padrão de cabeçalho na linha 1 (onde as chaves vêm como __EMPTY e o valor da linha 0 é o nome da coluna)
        const hasHeaderInRow0 = keys.some(k => k.includes("__EMPTY")) && 
                                (String(firstRow[keys[0]]).toLowerCase().includes("cr") || String(firstRow[keys[0]]).toLowerCase().includes("centro"));

        if (hasHeaderInRow0) {
          // Trata planilha que tem título na primeira linha
          const realHeaders = keys.map(k => String(firstRow[k] || "").trim());
          rawData = XLSX.utils.sheet_to_json(sheet, { range: 1 }) as Record<string, any>[];
        }

        // Relê as chaves normalizadas
        const sampleRow = rawData[0] || {};
        const crKey = findKey(sampleRow, ["cr", "centro", "cc", "resultado", "codigo cr", "codigo_cr", "codcencus"]);
        const naturezaKey = findKey(sampleRow, ["natureza", "natureza de despesa", "cod.natureza", "cod_natureza", "cod.naturza", "classificacao"]);
        const contratoKey = findKey(sampleRow, ["contrato", "contract", "num_contrato", "numero_contrato", "numcontrato"]);
        const valorKey = findKey(sampleRow, ["valor", "rateio", "soma", "total", "valor_rateio", "valor_total"]);
        const serieKey = findKey(sampleRow, ["serie", "serial", "ativo", "patrimonio"]);
        const funcKey = findKey(sampleRow, ["codfunc", "func", "codigo_func", "codigo func"]);
        const colabKey = findKey(sampleRow, ["colaborador", "nome", "display name", "colab"]);

        // Padrão A: Rateios baseados em Série (Notebooks/Monitores)
        if (serieKey && crKey) {
          rawData.forEach(row => {
            const serial = String(row[serieKey] || "").trim().toUpperCase();
            if (serial && serial !== "-" && serial !== "SERIE") {
              output.series[serial] = {
                cr: String(row[crKey] || "").trim(),
                naturezaCode: naturezaKey ? String(row[naturezaKey] || "").trim() : "",
                contract: contratoKey ? String(row[contratoKey] || "").trim() : "0"
              };
            }
          });
          continue;
        }

        // Padrão B: Rateios por Colaborador/Pessoal
        if (funcKey && crKey && (sheetName.toLowerCase().includes("fonte") || sheetName.includes("05 2026") || sheetName.includes("04 2026"))) {
          rawData.forEach(row => {
            const codFunc = String(row[funcKey] || "").trim();
            const rateioVal = parseFloat(row[valorKey || ""] || "100");
            if (codFunc) {
              const colabName = colabKey ? String(row[colabKey] || "").trim() : "";
              if (!output.colaboradores[codFunc]) {
                output.colaboradores[codFunc] = {
                  nome: colabName,
                  rateios: []
                };
              }
              output.colaboradores[codFunc].rateios.push({
                cr: String(row[crKey] || "").trim(),
                rateioPercent: isNaN(rateioVal) ? 100 : rateioVal,
                contract: contratoKey ? String(row[contratoKey] || "").trim() : "0"
              });
            }
          });
          continue;
        }

        // Padrão C: Contas/Operadoras de Telecom Vivo/Claro específicas
        if (crKey && folderName.toLowerCase().includes("vivo") && fileName.includes("Rateio")) {
          const matchConta = fileName.match(/Rateio Vivo (\d+)/);
          const conta = matchConta ? matchConta[1] : fileName.replace(".xlsx", "");
          
          if (!output.contas[conta]) output.contas[conta] = [];
          
          rawData.forEach(row => {
            const cr = String(row[crKey] || "").trim();
            if (cr && cr !== "Código CR") {
              const val = valorKey ? parseFloat(row[valorKey] || "0") : 0;
              output.contas[conta].push({
                cr,
                naturezaCode: naturezaKey ? String(row[naturezaKey] || "").trim() : "",
                contract: contratoKey ? String(row[contratoKey] || "").trim() : "0",
                value: isNaN(val) ? 0 : val
              });
            }
          });
          continue;
        }

        // Padrão D: Rateios Fixos Globais de Faturas por Fornecedor (Fallback)
        if (crKey) {
          const faturaName = folderName.replace("Faturas ", "").replace("Rateios ", "");
          if (!output.faturas[faturaName]) output.faturas[faturaName] = [];
          
          rawData.forEach(row => {
            const cr = String(row[crKey] || "").trim();
            if (cr && cr !== "Código CR") {
              const val = valorKey ? parseFloat(row[valorKey] || "0") : 0;
              output.faturas[faturaName].push({
                cr,
                naturezaCode: naturezaKey ? String(row[naturezaKey] || "").trim() : "",
                contract: contratoKey ? String(row[contratoKey] || "").trim() : "0",
                value: isNaN(val) ? 0 : val
              });
            }
          });
        }
      }
    } catch (err: any) {
      console.warn(`[Consolidador] Erro ao ler arquivo ${relativePath}:`, err.message);
    }
  }

  // Grava o JSON resultante em data/
  const dir = path.dirname(OUTPUT_JSON_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2), "utf-8");

  console.log(`\n--- Consolidação Concluída com Sucesso ---`);
  console.log(`JSON gerado em: ${OUTPUT_JSON_PATH}`);
  console.log(`Mapeamentos consolidados:`);
  console.log(` - Faturas Fixas: ${Object.keys(output.faturas).length} fornecedores`);
  console.log(` - Contas de Telecom: ${Object.keys(output.contas).length} circuitos`);
  console.log(` - Hardware/Séries: ${Object.keys(output.series).length} equipamentos`);
  console.log(` - Colaboradores: ${Object.keys(output.colaboradores).length} funcionários`);
}

consolidate();
