import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

async function run() {
  console.log('=== Iniciando Abertura de Instância do Processo 1908 (Direct Call) ===');
  
  const apiUrl = process.env.ZEEV_API_URL;
  let token = process.env.ZEEV_API_TOKEN;

  if (!apiUrl || !token) {
    console.error('[Erro] URL do Zeev ou Token não configurados no .env.');
    return;
  }

  token = token.trim().replace(/^["']|["']$/g, '');

  const payload = {
    flowId: 1908,
    isSimulation: true,
    formFields: [
      { name: 'selecaoTermo', value: 'Termo de disponibilização' },
      { name: 'nomeColaborador', value: 'Colaborador de Teste' },
      { name: 'emailColaborador', value: 'colaborador@stoque.com.br' },
      { name: 'cpf', value: '111.222.333-44' },
      { name: 'codFuncionario', value: '9999' },
      { name: 'departamento', value: 'Tecnologia' },
      { name: 'codDep', value: '1103' },
      { name: 'centroResultado', value: '1103' },
      { name: 'fornecedor', value: 'Voke S.A.' },
      { name: 'usuarioDisponibilizador', value: 'Responsavel Teste' },
      { name: 'emailDisponibilizador', value: 'responsavel@stoque.com.br' },
      { name: 'descricaoItem', value: 'Notebook Dell Latitude' },
      { name: 'serieEquipamento', value: 'ABC123XYZ' },
      { name: 'marcaEquipamento', value: 'Dell' },
      { name: 'informacoesAdicionais', value: 'Abertura de teste via API do SFI' },
      { name: 'estadoAtualEquipamento', value: 'Novo' },
      { name: 'motivoDevolucao', value: 'Outras causas' },
      { name: 'estadoDevolucao', value: 'Conservado' }
    ]
  };

  const url = `${apiUrl.replace(/\/$/, '')}/api/2/instances`;
  console.log(`URL do POST: ${url}`);
  console.log('Enviando requisição e aguardando resposta (Timeout configurado para 120 segundos)...');

  const startTime = Date.now();

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 120000 // 120 segundos de timeout
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[Sucesso] Resposta recebida em ${duration} segundos!`);
    console.log('Dados da Resposta:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n[Falha] Erro após ${duration} segundos:`, error.message);
    if (error.response) {
      console.error('Resposta do Servidor:', error.response.status, error.response.data);
    }
  }
}

run();
