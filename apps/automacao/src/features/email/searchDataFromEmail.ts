import "dotenv/config";
import axios, { AxiosInstance } from "axios";
import fs from "fs";
import path from "path";
import { extractDataFromPDF } from "../pdf/extractDataFromPDF.js";
import { generateRateioExcel } from "../excel/generateRateioExcel.js";

/** =========================
 *  Tipos (iguais aos seus)
 *  ========================= */

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface EmailAddress {
  address: string;
  name?: string;
}

interface EmailMessage {
  id: string;
  subject: string;
  from: { emailAddress: EmailAddress };
  isRead: boolean;

  receivedDateTime?: string;
  conversationId?: string;
  internetMessageId?: string;
  hasAttachments?: boolean;
  bodyPreview?: string;

  body?: {
    contentType: "HTML" | "Text";
    content: string;
  };
}

interface Attachment {
  id: string;
  name: string;
  contentType: string;
  size: number;

  /**
   * Nem todo attachment vem com contentBytes dependendo do tipo
   * (fileAttachment vs itemAttachment vs referenceAttachment).
   * Mantive compatível com seu fluxo, mas deixei opcional para robustez.
   */
  
  contentBytes?: string; // base64 (quando disponível)
}

interface EmailsResponse {
  value: EmailMessage[];
}

interface AttachmentsResponse {
  value: Attachment[];
}

type NormalizedEmail = {
  id: string;
  subject: string;
  from: { name?: string; address: string };
  receivedDateTime?: string;
  isRead: boolean;
  conversationId?: string;
  internetMessageId?: string;
  hasAttachments?: boolean;
  preview?: string;

  bodyText: string; // última mensagem limpa
  bodyRaw?: string;
};

/** =========================
 *  Funções utilitárias (ficam como funções!)
 *  ========================= */

function findFirstRegexIndex(text: string, patterns: RegExp[]) {
  let best = -1;

  for (const re of patterns) {
    // evita efeitos de lastIndex se algum regex tiver "g"
    const local = new RegExp(re.source, re.flags.replace("g", ""));
    const m = local.exec(text);
    if (!m) continue;

    const idx = m.index;
    if (best === -1 || idx < best) best = idx;
  }

  return best;
}

/** Mantém SOMENTE a última mensagem (corta histórico e ruídos) */
function cleanEmailText(input: string) {
  if (!input) return "";

  let text = input;

  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/\u00A0/g, " ");
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  const replySeparators: RegExp[] = [
    // PT-BR
    /^Em\s.+\sescreveu:\s*$/im,
    /^De:\s.*$/im,
    /^Enviado:\s.*$/im,
    /^Para:\s.*$/im,
    /^Assunto:\s.*$/im,
    /^-{2,}\s*Mensagem original\s*-{2,}\s*$/im,

    // EN
    /^On\s.+\swrote:\s*$/im,
    /^From:\s.*$/im,
    /^Sent:\s.*$/im,
    /^To:\s.*$/im,
    /^Subject:\s.*$/im,
    /^-{2,}\s*Original Message\s*-{2,}\s*$/im,

    // separadores genéricos
    /^_{2,}\s*$/m,
    /^-{5,}\s*$/m,
  ];

  const cutIndex = findFirstRegexIndex(text, replySeparators);
  if (cutIndex >= 0) text = text.slice(0, cutIndex).trim();

  const disclaimers: RegExp[] = [
    /Este e-mail.*confidencial.*$/gims,
    /As informações contidas.*privilegiad.*$/gims,
    /This email.*confidential.*$/gims,
  ];

  for (const re of disclaimers) {
    text = text.replace(re, "").trim();
  }

  const signatureMarkers: RegExp[] = [
    /^\s*--\s*$/m,
    /^\s*Atenciosamente[,]*\s*$/im,
    /^\s*Att[,]*\s*$/im,
    /^\s*Regards[,]*\s*$/im,
    /^\s*Sent from my.*$/im,
  ];

  const sigIndex = findFirstRegexIndex(text, signatureMarkers);
  if (sigIndex >= 0 && sigIndex > 0) {
    const ratio = sigIndex / text.length;
    if (ratio > 0.5) text = text.slice(0, sigIndex).trim();
  }

  text = text.replace(/[ \t]{2,}/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

function normalizeEmail(email: EmailMessage): NormalizedEmail {
  const raw = email.body?.content ?? "";
  const cleaned = cleanEmailText(raw);

  return {
    id: email.id,
    subject: email.subject ?? "",
    from: {
      name: email.from?.emailAddress?.name,
      address: email.from?.emailAddress?.address ?? "",
    },
    receivedDateTime: email.receivedDateTime,
    isRead: email.isRead,
    conversationId: email.conversationId,
    internetMessageId: email.internetMessageId,
    hasAttachments: email.hasAttachments,
    preview: email.bodyPreview,
    bodyText: cleaned,
    bodyRaw: raw,
  };
}

/** =========================
 *  Classe (orquestradora)
 *  ========================= */

type ProcessorConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  userEmail: string;

  // onde salvar temporário e saídas
  tempDir?: string;       // default: .tmp
  outputDir?: string;     // default: data/extracted

  // comportamento
  markAsReadAfterSuccess?: boolean; // default: false
};

export class GraphEmailPdfProcessor {
  /** axios específico para Graph */
  private readonly graph: AxiosInstance;

  /** cache do token */
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0; // epoch ms

  /** config fica guardada na instância */
  constructor(private readonly cfg: ProcessorConfig) {
    this.graph = axios.create({
      baseURL: "https://graph.microsoft.com/v1.0",
      timeout: 30_000,
    });
  }

  /**
   * Método público principal:
   * - busca 1 email mais recente não lido
   * - normaliza body
   * - busca anexos
   * - processa PDFs (json + excel)
   * - (opcional) marca como lido se tudo deu certo
   * - MUDAR ESSE NOME DEPOIS, POIS ESTÁ CONSIDERANDO APENAS UM E-MAIL POR VEZ, MAS A IDEIA É DEPOIS PROCESSAR VÁRIOS EM LOOP (OU TODOS).
   */
  public async processLatestUnreadEmails(limit: number = 5): Promise<NormalizedEmail[]> {
    try {
      const emails = await this.fetchLatestUnreadEmails(limit);
      if (!emails || emails.length === 0) return [];

      const processedEmails: NormalizedEmail[] = [];

      for (const email of emails) {
        const normalized = normalizeEmail(email);

        console.log([normalized], "Emails Normalizados em JSON");
        console.log("Assunto:", normalized.subject);
        console.log("De:", normalized.from.address);
        console.log("Recebido em:", normalized.receivedDateTime);
        console.log("Conteúdo (última mensagem, limpo):");
        console.log(normalized.bodyText);

        let processedAllPdfs = true;

        if (email.hasAttachments) {
          const attachments = await this.fetchAttachments(email.id);

          for (const file of attachments) {
            if (!file.name?.toLowerCase().endsWith(".pdf")) continue;

            const ok = await this.processPdfAttachment(file);
            if (!ok) processedAllPdfs = false;
          }
        }

        // marca como lido somente se configurado e se não houve erro nos PDFs
        if (this.cfg.markAsReadAfterSuccess && processedAllPdfs) {
          await this.markEmailAsRead(email.id);
          console.log(`E-mail "${email.subject}" marcado como lido.`);
        }

        // log extra
        if (email.body) {
          console.log("Conteúdo do E-mail (Tipo:", email.body.contentType, "):");
          console.log(email.body.content);
        }

        console.log("---------------");
        processedEmails.push(normalized);
      }

      return processedEmails;
    } catch (error) {
      console.error("Erro no processamento de e-mails via Microsoft Graph:", error);
      return [];
    }
  }

  /** =========================
   *  Métodos privados (internos)
   *  ========================= */

  /** garante token válido em cache */
  private async getToken(): Promise<string> {
    const now = Date.now();

    // 60s de folga para evitar expirar no meio
    if (this.accessToken && now < this.accessTokenExpiresAt - 60_000) {
      return this.accessToken;
    }

    const url = `https://login.microsoftonline.com/${this.cfg.tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append("client_id", this.cfg.clientId);
    params.append("client_secret", this.cfg.clientSecret);
    params.append("scope", "https://graph.microsoft.com/.default");
    params.append("grant_type", "client_credentials");

    const response = await axios.post<AccessTokenResponse>(url, params);

    this.accessToken = response.data.access_token;
    this.accessTokenExpiresAt = now + response.data.expires_in * 1000;

    return this.accessToken;
  }

  private async fetchLatestUnreadEmails(limit: number = 5): Promise<EmailMessage[]> {
    const token = await this.getToken();

    /**
     * - $top=limit e $orderby=receivedDateTime desc para pegar os mais recentes.
     * - Prefer: outlook.body-content-type="text" para devolver body em texto
     *   (o Graph documenta esse header como forma de escolher text/html).
     *
     * Observação: sem orderby o Graph não garante ordem; por isso usamos receivedDateTime desc.
     */
    const url =
      `/users/${encodeURIComponent(this.cfg.userEmail)}/mailFolders/inbox/messages` +
      `?$top=${limit}` +
      `&$orderby=receivedDateTime desc` +
      `&$filter=isRead eq false and hasAttachments eq true` +
      `&$select=id,subject,from,isRead,receivedDateTime,conversationId,internetMessageId,hasAttachments,bodyPreview,body`;

    const response = await this.graph.get<EmailsResponse>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Prefer: `outlook.body-content-type="text"`, // corpo em texto
      },
    });

    return response.data.value ?? [];
  }

  private async fetchAttachments(messageId: string): Promise<Attachment[]> {
    const token = await this.getToken();

    const url =
      `/users/${encodeURIComponent(this.cfg.userEmail)}/messages/${encodeURIComponent(messageId)}/attachments`;

    const response = await this.graph.get<AttachmentsResponse>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.value ?? [];
  }

  private async markEmailAsRead(messageId: string): Promise<void> {
    const token = await this.getToken();

    const url =
      `/users/${encodeURIComponent(this.cfg.userEmail)}/messages/${encodeURIComponent(messageId)}`;

    await this.graph.patch(
      url,
      { isRead: true },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  }

  /**
   * Processa um PDF:
   * - salva temporário
   * - extrai dados
   * - salva JSON estruturado
   * - gera Excel
   * Retorna true/false se deu certo.
   */
  private async processPdfAttachment(file: Attachment): Promise<boolean> {
    console.log("PDF encontrado:", file.name);

    if (!file.contentBytes) {
      console.warn(
        `Anexo "${file.name}" não possui contentBytes (pode não ser fileAttachment). Pulando.`
      );
      return false;
    }

    const tempDir = this.cfg.tempDir ?? path.join("..", "..", ".tmp");
    const outputDir = this.cfg.outputDir ?? path.join("..", "..", "data", "extracted");

    // base64 -> buffer
    const buffer = Buffer.from(file.contentBytes, "base64");

    // path temporário
    const tempPdfPath = path.join(tempDir, file.name);

    // garante diretórios
    fs.mkdirSync(path.dirname(tempPdfPath), { recursive: true });

    // grava
    fs.writeFileSync(tempPdfPath, buffer);
    console.log(`PDF salvo temporariamente em: ${tempPdfPath}`);

    try {
      // Chama o extrator via IA (que agora já cria a pasta, salva PDF, JSON e TXT)
      const { parsedContent, outputDir } = await extractDataFromPDF(tempPdfPath);
      console.log(`Dados extraídos via IA para ${file.name}`);

      // Gerar Excel dentro da mesma pasta organizada
      const excelPath = await generateRateioExcel(parsedContent, outputDir);
      console.log(`Excel de rateio gerado em: ${excelPath}`);

      return true;
    } catch (pdfError) {
      console.error(`Erro ao processar PDF ${file.name}:`, pdfError);
      return false;
    } finally {
      // remove temporário
      try {
        fs.unlinkSync(tempPdfPath);
        console.log(`PDF temporário removido: ${tempPdfPath}`);
      } catch (e) {
        console.warn(`Não foi possível remover temp "${tempPdfPath}":`, e);
      }
    }
  }
}