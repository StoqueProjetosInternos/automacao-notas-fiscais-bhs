import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ZeevClient } from '../infra/zeev/zeevClient.js';
import { FILES_DIR } from '../server/config/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregamento redundante e robusto das variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function run() {
  console.log('=== Zeev Integration - Consulta de Campos de Formulário (Teste) ===');
  
  const apiUrl = process.env.ZEEV_API_URL;
  const apiToken = process.env.ZEEV_API_TOKEN;
  
  // Lê do .env ou usa o fluxo de teste 1908 como fallback padrão
  const flowIdStr = process.env.ZEEV_FLOW_ID || '2044';
  const flowId = parseInt(flowIdStr, 10);

  if (!apiUrl || !apiToken) {
    console.error('[Erro] Configuração do Zeev ausente no .env.');
    console.error('Certifique-se de configurar ZEEV_API_URL e ZEEV_API_TOKEN no seu .env.');
    return;
  }

  if (isNaN(flowId)) {
    console.error(`[Erro] ID de fluxo inválido: ${flowIdStr}`);
    return;
  }

  try {
    console.log(`\nIniciando consulta para o Fluxo ID de Teste: ${flowId}...`);
    
    // Busca os campos do formulário para o ID do fluxo
    const formFields = await ZeevClient.getFormFields(flowId);

    // Grava o resultado para análise do De/Para do formulário
    if (!fs.existsSync(FILES_DIR)) {
      fs.mkdirSync(FILES_DIR, { recursive: true });
    }

    const outputPath = path.join(FILES_DIR, `zeev_${flowId}_fields_schema.json`);
    fs.writeFileSync(outputPath, JSON.stringify(formFields, null, 2), 'utf-8');
    
    console.log(`\n[Sucesso] Estrutura do formulário do Fluxo ${flowId} salva com sucesso em:`);
    console.log(outputPath);
    console.log('Use esse arquivo para validar as propriedades de formulário esperadas pelo Zeev.');
  } catch (error: any) {
    console.error('[Falha] Erro na comunicação com a API do Zeev:', error.message);
    if (error.response) {
      console.error('Resposta do Servidor:', error.response.status, error.response.data);
    }
  }
}

run();
