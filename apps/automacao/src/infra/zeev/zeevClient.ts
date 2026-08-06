import axios from 'axios';

export interface ZeevFlowInfo {
  flowId: number;
  flowName: string;
  flowVersion: number;
  deploy: boolean;
}

export interface CreateInstanceFormField {
  id?: number;
  name: string;
  value: string;
  row?: number;
}

export interface CreateInstanceFile {
  filename: string;
  resume?: string;
  requesterCanSee?: boolean;
  docType?: string;
  base64Content: string;
}

export interface CreateInstancePayload {
  flowId: number;
  isSimulation: boolean;
  teamId?: number;
  positionId?: number;
  formFields?: CreateInstanceFormField[];
  files?: CreateInstanceFile[];
}

export class ZeevClient {
  private static getHeaders() {
    let token = process.env.ZEEV_API_TOKEN;
    if (!token) {
      throw new Error('ZEEV_API_TOKEN não está definido nas variáveis de ambiente.');
    }
    token = token.trim().replace(/^["']|["']$/g, '');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private static getBaseUrl() {
    const url = process.env.ZEEV_API_URL;
    if (!url) {
      throw new Error('ZEEV_API_URL não está definido nas variáveis de ambiente.');
    }
    return url.replace(/\/$/, '');
  }

  /**
   * Busca fluxos editáveis contendo o termo pesquisado
   */
  public static async findFlows(flowNameQuery: string): Promise<ZeevFlowInfo[]> {
    const url = `${this.getBaseUrl()}/api/2/flows/edit`;
    console.log(`[ZeevClient] Buscando processos contendo: "${flowNameQuery}"...`);
    
    const response = await axios.get(url, {
      headers: this.getHeaders(),
      params: { flowName: flowNameQuery },
      timeout: 10000
    });

    console.log(response.data, 'Encontra processoos');

    return response.data || [];
  }

  /**
   * Busca o design e campos de formulário associados ao flowId
   */
  public static async getFormFields(flowId: number): Promise<any> {
    const url = `${this.getBaseUrl()}/api/2/flows/${flowId}/design/form`;
    console.log(`[ZeevClient] Obtendo estrutura do formulário do fluxo ID: ${flowId}...`);

    const response = await axios.get(url, {
      headers: this.getHeaders(),
      timeout: 10000
    });

    console.log(response.data, 'Encontra campos de formulário');

    return response.data || {};
  }

  /**
   * Cria uma instância de processo enviando dados de formulário e anexos em Base64
   * Utiliza a chamada HTTP real para testes de validação ou abertura.
   */
  public static async createInstance(payload: CreateInstancePayload): Promise<any> {
    const url = `${this.getBaseUrl()}/api/2/instances`;
    // console.log(payload, 'Payload Zeev')
    console.log(`[ZeevClient] Enviando requisição de instância para o Zeev: ${url}`);
    const response = await axios.post(url, payload, {
      headers: this.getHeaders(),
      timeout: 45000
    });
    return response.data;
  }

  /**
   * Adiciona mensagem a uma instância de solicitação no Zeev via POST /api/2/messages
   * Suporta as 3 rotas do módulo de mensagens com retentativa inteligente.
   */
  public static async postInstanceMessage(instanceId: number | string, messageText: string): Promise<any> {
    const numericId = parseInt(String(instanceId), 10);
    const idVal = !isNaN(numericId) ? numericId : instanceId;

    // Tentativa 1: Rota oficial POST /api/2/messages com instanceId numérico
    const urlMain = `${this.getBaseUrl()}/api/2/messages`;
    console.log(`[ZeevClient] Rota 1: Enviando POST /api/2/messages para a instância ID ${idVal}...`);
    
    try {
      const response = await axios.post(urlMain, {
        instanceId: idVal,
        message: messageText
      }, {
        headers: this.getHeaders(),
        timeout: 15000
      });
      console.log(`[ZeevClient] Mensagem vinculada com sucesso na Rota 1:`, response.data);
      return response.data;
    } catch (err1: any) {
      console.warn(`[ZeevClient] Falha na Rota 1 (instanceId):`, err1.response?.data || err1.message);
    }

    // Tentativa 2: Rota POST /api/2/messages com instanceCode string
    try {
      const response = await axios.post(urlMain, {
        instanceCode: String(idVal),
        message: messageText
      }, {
        headers: this.getHeaders(),
        timeout: 15000
      });
      console.log(`[ZeevClient] Mensagem vinculada com sucesso na Rota 2 (instanceCode):`, response.data);
      return response.data;
    } catch (err2: any) {
      console.warn(`[ZeevClient] Falha na Rota 2 (instanceCode):`, err2.response?.data || err2.message);
    }

    // Tentativa 3: Rota POST /api/2/messages/instance-task
    const urlTask = `${this.getBaseUrl()}/api/2/messages/instance-task`;
    console.log(`[ZeevClient] Rota 3: Tentando POST /api/2/messages/instance-task...`);
    try {
      const response = await axios.post(urlTask, {
        instanceTaskId: idVal,
        message: messageText
      }, {
        headers: this.getHeaders(),
        timeout: 15000
      });
      console.log(`[ZeevClient] Mensagem vinculada com sucesso na Rota 3:`, response.data);
      return response.data;
    } catch (err3: any) {
      console.error(`[ZeevClient] Todas as rotas de mensagens falharam para a instância ${idVal}:`, err3.response?.data || err3.message);
      throw new Error(`[Zeev Messages] Não foi possível vincular a mensagem à instância ${idVal}. Detalhes: ${JSON.stringify(err3.response?.data || err3.message)}`);
    }
  }
}
