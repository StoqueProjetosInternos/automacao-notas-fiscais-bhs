import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MaskedSettings {
  geminiApiKey: { isConfigured: boolean; masked: string };
  zeevApiUrl: string;
  zeevApiToken: { isConfigured: boolean; masked: string };
  zeevFlowId: string;
  zeevRequester: string;
  userEmail: string;
  tenantId: { isConfigured: boolean; masked: string };
  clientId: { isConfigured: boolean; masked: string };
  clientSecret: { isConfigured: boolean; masked: string };
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: { isConfigured: boolean; masked: string };
  smtpFrom: string;
  smtpTo: string;
}

export class SettingsService {
  private static getEnvPath(): string {
    const appData = process.env.APPDATA || '';
    const userDataEnv = appData ? path.resolve(appData, 'StoqueFiscalIntelligence', '.env') : '';
    const resourcesPath = (process as any).resourcesPath || '';

    const possiblePaths = [
      userDataEnv,
      path.resolve(resourcesPath, '.env'),
      path.resolve(resourcesPath, 'app', '.env'),
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '../../.env'),
      path.resolve(__dirname, '../../../../.env'),
      path.resolve(__dirname, '../../../.env'),
      path.resolve(__dirname, '../../.env'),
      path.resolve(__dirname, '../.env'),
    ].filter(Boolean);
    const found = possiblePaths.find(p => fs.existsSync(p));
    return found || userDataEnv || path.resolve(process.cwd(), '.env');
  }

  private static maskSecret(val?: string): { isConfigured: boolean; masked: string } {
    if (!val || val.trim() === '') {
      return { isConfigured: false, masked: '' };
    }
    const clean = val.trim();
    if (clean.length <= 8) {
      return { isConfigured: true, masked: '••••••••' };
    }
    const prefix = clean.substring(0, 4);
    const suffix = clean.substring(clean.length - 4);
    return { isConfigured: true, masked: `${prefix}••••••••${suffix}` };
  }

  public static getSettings(): MaskedSettings {
    return {
      geminiApiKey: this.maskSecret(process.env.GEMINI_API_KEY),
      zeevApiUrl: process.env.ZEEV_API_URL || '',
      zeevApiToken: this.maskSecret(process.env.ZEEV_API_TOKEN),
      zeevFlowId: process.env.ZEEV_FLOW_ID || '2044',
      zeevRequester: process.env.ZEEV_REQUESTER || '',
      userEmail: process.env.USER_EMAIL || '',
      tenantId: this.maskSecret(process.env.TENANT_ID),
      clientId: this.maskSecret(process.env.CLIENT_ID),
      clientSecret: this.maskSecret(process.env.CLIENT_SECRET),
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: Number(process.env.SMTP_PORT) || 587,
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: this.maskSecret(process.env.SMTP_PASS),
      smtpFrom: process.env.SMTP_FROM || '',
      smtpTo: process.env.SMTP_TO || ''
    };
  }

  public static updateSettings(newSettings: Record<string, any>): void {
    const envPath = this.getEnvPath();
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

    const updates: Record<string, string | undefined> = {
      GEMINI_API_KEY: newSettings.geminiApiKey && newSettings.geminiApiKey.trim() !== '' ? newSettings.geminiApiKey.trim() : undefined,
      ZEEV_API_URL: newSettings.zeevApiUrl !== undefined && newSettings.zeevApiUrl !== '' ? newSettings.zeevApiUrl.trim() : undefined,
      ZEEV_API_TOKEN: newSettings.zeevApiToken && newSettings.zeevApiToken.trim() !== '' ? newSettings.zeevApiToken.trim() : undefined,
      ZEEV_FLOW_ID: newSettings.zeevFlowId !== undefined && newSettings.zeevFlowId !== '' ? newSettings.zeevFlowId.trim() : undefined,
      ZEEV_REQUESTER: newSettings.zeevRequester !== undefined ? newSettings.zeevRequester.trim() : undefined,
      USER_EMAIL: newSettings.userEmail !== undefined ? newSettings.userEmail.trim() : undefined,
      TENANT_ID: newSettings.tenantId && newSettings.tenantId.trim() !== '' ? newSettings.tenantId.trim() : undefined,
      CLIENT_ID: newSettings.clientId && newSettings.clientId.trim() !== '' ? newSettings.clientId.trim() : undefined,
      CLIENT_SECRET: newSettings.clientSecret && newSettings.clientSecret.trim() !== '' ? newSettings.clientSecret.trim() : undefined,
      SMTP_HOST: newSettings.smtpHost !== undefined ? newSettings.smtpHost.trim() : undefined,
      SMTP_PORT: newSettings.smtpPort !== undefined ? String(newSettings.smtpPort).trim() : undefined,
      SMTP_SECURE: newSettings.smtpSecure !== undefined ? String(newSettings.smtpSecure) : undefined,
      SMTP_USER: newSettings.smtpUser !== undefined ? newSettings.smtpUser.trim() : undefined,
      SMTP_PASS: newSettings.smtpPass && newSettings.smtpPass.trim() !== '' ? newSettings.smtpPass.trim() : undefined,
      SMTP_FROM: newSettings.smtpFrom !== undefined ? newSettings.smtpFrom.trim() : undefined,
      SMTP_TO: newSettings.smtpTo !== undefined ? newSettings.smtpTo.trim() : undefined
    };

    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) {
        process.env[key] = val; // Atualiza a memória ativa do processo em tempo de execução
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(content)) {
          content = content.replace(regex, `${key}=${val}`);
        } else {
          content += `\n${key}=${val}`;
        }
      }
    }

    fs.writeFileSync(envPath, content.trim() + '\n', 'utf-8');
    console.log(`[SettingsService] Configurações de ambiente atualizadas e sincronizadas com sucesso em: ${envPath}`);
  }
}
