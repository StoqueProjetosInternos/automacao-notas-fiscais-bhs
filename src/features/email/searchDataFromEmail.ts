import axios from "axios";

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
  from: {
    emailAddress: EmailAddress;
  };
  isRead: boolean;
}

interface Attachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes: string; // base64
}

interface EmailsResponse {
  value: EmailMessage[];
}

interface AttachmentsResponse {
  value: Attachment[];
}

const TENANT_ID = process.env.TENANT_ID!;
const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const USER_EMAIL = process.env.USER_EMAIL!;

// 1. Obter token
async function getAccessToken(): Promise<string> {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  const response = await axios.post<AccessTokenResponse>(url, params);

  return response.data.access_token;
}

// 2. Buscar e-mails
async function getEmails(token: string) {
  const url = `https://graph.microsoft.com/v1.0/users/${USER_EMAIL}/messages?$top=5&$filter=isRead eq false`;

  const response = await axios.get<EmailsResponse>(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data.value;
}

// 3. Buscar anexos
async function getAttachments(token: string, messageId: string) {
  const url = `https://graph.microsoft.com/v1.0/users/${USER_EMAIL}/messages/${messageId}/attachments`;

  const response = await axios.get<AttachmentsResponse>(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data.value;
}

// 4. Fluxo principal
async function main() {
  try {
    const token = await getAccessToken();

    const emails = await getEmails(token);

    for (const email of emails) {
      console.log("Assunto:", email.subject);
      console.log("De:", email.from?.emailAddress?.address);

      const attachments = await getAttachments(token, email.id);

      for (const file of attachments) {
        if (file.name.endsWith(".pdf")) {
          console.log(" PDF encontrado:", file.name);

          // conteúdo base64
          const base64 = file.contentBytes;

          // converter para buffer
          const buffer = Buffer.from(base64, "base64");

          // salvar arquivo
          const fs = await import("fs");
          fs.writeFileSync(`./${file.name}`, buffer);

          console.log("PDF salvo!");
        }
      }

      console.log("---------------");
    }
  } catch (error) {
    console.error("Erro:", (error as any).response?.data || (error as any).message);
  }
}

export { getEmails };

export async function processEmails() {
  await main();
}