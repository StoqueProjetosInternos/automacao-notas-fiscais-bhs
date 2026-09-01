import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function inspectInstance(instanceId: string | number) {
  const apiUrl = process.env.ZEEV_API_URL;
  let token = process.env.ZEEV_API_TOKEN;

  if (!apiUrl || !token) {
    console.error('Configurações ausentes no .env');
    return;
  }

  token = token.trim().replace(/^["']|["']$/g, '');
  const url = `${apiUrl.replace(/\/$/, '')}/api/2/instances/${instanceId}`;

  console.log(`[Zeev Inspector] Consultando instância ID ${instanceId} em: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 15000
    });

    console.log('\n=== Detalhes da Instância Zeev ===');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('[Falha] Erro na consulta:', error.response?.status, error.response?.data || error.message);
  }
}

// Inspeciona a instância 243737 gerada no teste anterior
const targetInstanceId = process.argv[2] || '243737';
inspectInstance(targetInstanceId);
