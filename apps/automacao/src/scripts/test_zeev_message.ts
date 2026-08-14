import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function testMessages() {
  const apiUrl = process.env.ZEEV_API_URL;
  let token = process.env.ZEEV_API_TOKEN;
  const instanceId = 240922; // Instância gerada recentemente no teste
  const messageText = '[SFI - Automação IA] Fatura telefônica homologada com sucesso via inteligência fiscal.';

  if (!apiUrl || !token) {
    console.error('Configuracoes ausentes no .env');
    return;
  }

  token = token.trim().replace(/^["']|["']$/g, '');
  const urlMain = `${apiUrl.replace(/\/$/, '')}/api/2/messages`;

  console.log(`Testando envio de mensagem oficial para a instância ID: ${instanceId}...`);

  try {
    const response = await axios.post(urlMain, {
      instanceId: Number(instanceId),
      messageBody: messageText
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 15000
    });
    console.log('\n[SUCESSO] Mensagem vinculada com sucesso no Zeev:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    console.error('\n[FALHA] Erro retornado pelo Zeev:', err.response?.status, err.response?.data || err.message);
  }
}

testMessages();
