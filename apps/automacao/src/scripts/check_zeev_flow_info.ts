import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function listAllFlows() {
  const apiUrl = process.env.ZEEV_API_URL;
  let token = process.env.ZEEV_API_TOKEN;

  if (!apiUrl || !token) {
    console.error('Configuracoes ausentes no .env');
    return;
  }

  token = token.trim().replace(/^["']|["']$/g, '');
  const url = `${apiUrl.replace(/\/$/, '')}/api/2/flows`;

  console.log(`Buscando lista de processos implantados em: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 15000
    });

    const flows = response.data || [];
    console.log(`\nTotal de fluxos retornados: ${flows.length}`);

    // Filtra fluxos relacionados a pagamentos, notas ou IDs 2044/2149
    const filtered = flows.filter((f: any) => 
      String(f.flowId).includes('2044') || 
      String(f.flowId).includes('2149') || 
      String(f.flowName || '').toLowerCase().includes('pagamento') ||
      String(f.flowName || '').toLowerCase().includes('documento fiscal')
    );

    console.log('\nFluxos Relevantes Encontrados:');
    console.log(JSON.stringify(filtered.length > 0 ? filtered : flows.slice(0, 10), null, 2));
  } catch (error: any) {
    console.error('Falha ao listar fluxos:', error.response?.status, error.response?.data || error.message);
  }
}

listAllFlows();
