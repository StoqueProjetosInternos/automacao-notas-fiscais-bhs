import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveFilesDir(): string {
  if (process.env.FILES_DIR) {
    const customPath = path.resolve(process.env.FILES_DIR);
    if (!fs.existsSync(customPath)) {
      try {
        fs.mkdirSync(customPath, { recursive: true });
      } catch (err) {
        console.error('[Paths] Falha ao criar diretório customizado:', err);
      }
    }
    return customPath;
  }

  const appData = process.env.APPDATA || (process.platform === 'darwin' ? (process.env.HOME || '') + '/Library/Preferences' : '/var/local');
  const appDataExtracted = path.resolve(appData, 'StoqueFiscalIntelligence', 'data', 'extracted');

  const possiblePaths = [
    appDataExtracted,
    path.resolve(process.cwd(), 'data', 'extracted'),
    path.resolve(__dirname, '..', '..', '..', '..', '..', 'data', 'extracted'),
    path.resolve(__dirname, '..', '..', '..', '..', 'data', 'extracted'),
    path.resolve(__dirname, '..', '..', '..', 'data', 'extracted'),
    path.resolve((process as any).resourcesPath || '', 'data', 'extracted'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  try {
    if (!fs.existsSync(appDataExtracted)) {
      fs.mkdirSync(appDataExtracted, { recursive: true });
    }
    return appDataExtracted;
  } catch {
    const localDir = path.resolve(process.cwd(), 'data', 'extracted');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  }
}

export const FILES_DIR = resolveFilesDir();
