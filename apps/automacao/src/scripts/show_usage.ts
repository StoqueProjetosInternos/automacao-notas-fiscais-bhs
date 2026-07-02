import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o log (sobe 4 níveis a partir de src/scripts/show_usage.ts)
const logPath = path.resolve(__dirname, "../../../../data/usage_log.csv");

// Função robusta para dividir colunas do CSV respeitando aspas e tolerando espaços em branco
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function showUsage() {
  if (!fs.existsSync(logPath)) {
    console.log("\n[AVISO] Nenhum log de uso encontrado em: " + logPath);
    return;
  }

  const content = fs.readFileSync(logPath, "utf8");
  const lines = content.trim().split("\n");

  if (lines.length <= 1) {
    console.log("\n[AVISO] O log de uso está vazio.");
    return;
  }

  // Mapeamento dinâmico de cabeçalho para garantir retrocompatibilidade com logs antigos
  const header = lines[0].trim().split(",");
  const idxDate = header.indexOf("data_hora");
  const idxInput = header.indexOf("tokens_entrada");
  const idxOutput = header.indexOf("tokens_saida");
  const idxLatency = header.indexOf("tempo_processamento_ms");

  const dataLines = lines.slice(1);

  let totalFiles = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUSD = 0;
  let totalLatencyMs = 0;
  let filesWithLatency = 0;

  // Preços oficiais do Gemini 2.5 Flash
  const GEMINI_25_INPUT_COST_PER_M = 0.30;
  const GEMINI_25_OUTPUT_COST_PER_M = 2.50;

  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    // Divide a linha de forma segura usando o parser robusto
    const parts = splitCsvLine(line);
    
    const input = parts[idxInput];
    const output = parts[idxOutput];
    const latency = idxLatency !== -1 ? parts[idxLatency] : undefined;

    if (input && output) {
      totalFiles++;
      const inputTokens = parseInt(input, 10);
      const outputTokens = parseInt(output, 10);
      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
      
      // Recalcula retroativamente com as taxas corretas do Gemini 2.5 Flash
      const recomputedCost = ((inputTokens / 1_000_000) * GEMINI_25_INPUT_COST_PER_M) + 
                             ((outputTokens / 1_000_000) * GEMINI_25_OUTPUT_COST_PER_M);
      totalCostUSD += recomputedCost;

      if (latency && latency !== "N/A" && latency !== "") {
        const latVal = parseInt(latency, 10);
        if (!isNaN(latVal)) {
          totalLatencyMs += latVal;
          filesWithLatency++;
        }
      }
    }
  }

  console.log("\n=========================================");
  console.log("      RELATÓRIO DE CONSUMO IA (GEMINI)");
  console.log("=========================================");
  console.log(`Total de Arquivos: ${totalFiles}`);
  console.log(`Tokens de Entrada: ${totalInputTokens.toLocaleString('pt-BR')}`);
  console.log(`Tokens de Saída:   ${totalOutputTokens.toLocaleString('pt-BR')}`);
  if (filesWithLatency > 0) {
    const avgLatencySec = (totalLatencyMs / filesWithLatency) / 1000;
    console.log(`Tempo Médio de Resp.: ${avgLatencySec.toFixed(2)}s`);
  }
  console.log("-----------------------------------------");
  console.log(`CUSTO TOTAL:       $${totalCostUSD.toFixed(6)} USD`);
  console.log(`CUSTO EM REAIS*:   R$ ${(totalCostUSD * 5.5).toFixed(4)}`);
  console.log("=========================================");
  console.log("* Estimativa baseada em Dólar a R$ 5,50\n");
}

showUsage().catch(err => {
  console.error("Erro ao gerar relatório:", err);
});
