import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function checkZeevUser() {
  const apiUrl = process.env.ZEEV_API_URL;
  let token = process.env.ZEEV_API_TOKEN;

  if (!apiUrl || !token) {
    console.error('ZEEV_API_URL ou ZEEV_API_TOKEN nao configurados no .env');
    return;
  }

  token = token.trim().replace(/^["']|["']$/g, '');
  const url = `${apiUrl.replace(/\/$/, '')}/api/2/users/me`;

  console.log(`Consultando dados do usuario autenticado em: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 15000
    });

    console.log('\nDados do Usuario Autenticado:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Falha ao consultar usuario:', error.response?.data || error.message);
  }
}

checkZeevUser();
