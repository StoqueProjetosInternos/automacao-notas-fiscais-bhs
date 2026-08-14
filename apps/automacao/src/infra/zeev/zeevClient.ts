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
  requester?: string;
  requesterUser?: string;
  requesterEmail?: string;
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
    console.log(`[Zeev Client] Buscando fluxos contendo: "${flowNameQuery}"...`);
    
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

    const urlMain = `${this.getBaseUrl()}/api/2/messages`;
    console.log(`[ZeevClient] Enviando mensagem para a instância ID ${idVal}...`);
    
    try {
      const response = await axios.post(urlMain, {
        instanceId: idVal,
        messageBody: messageText
      }, {
        headers: this.getHeaders(),
        timeout: 15000
      });
      console.log(`[ZeevClient] Mensagem de IA vinculada com sucesso à instância ${idVal}:`, response.data);
      return response.data;
    } catch (err: any) {
      console.error(`[ZeevClient] Falha ao vincular mensagem à instância ${idVal}:`, err.response?.data || err.message);
      throw new Error(`[Zeev Messages] Falha ao enviar mensagem: ${JSON.stringify(err.response?.data || err.message)}`);
    }
  }
}
