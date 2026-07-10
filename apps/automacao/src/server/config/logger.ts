import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.resolve(__dirname, '../../../../../data/logs');
const LOG_FILE = path.join(LOGS_DIR, 'api.log');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

let lineCount = 0;
try {
  if (fs.existsSync(LOG_FILE)) {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    lineCount = content.split('\n').filter(line => line.trim().length > 0).length;
  }
} catch (e) {
  lineCount = 0;
}

let logStream = fs.createWriteStream(LOG_FILE, { flags: 'a', encoding: 'utf8' });

const originalLog = console.log;
const originalInfo = console.info;
const originalWarn = console.warn;
const originalError = console.error;

function getLocalTimestamp(): string {
  const now = new Date();
  const tzo = -now.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num: number) => String(num).padStart(2, '0');
  const padMs = (num: number) => String(num).padStart(3, '0');
  
  return now.getFullYear() +
    '-' + pad(now.getMonth() + 1) +
    '-' + pad(now.getDate()) +
    'T' + pad(now.getHours()) +
    ':' + pad(now.getMinutes()) +
    ':' + pad(now.getSeconds()) +
    '.' + padMs(now.getMilliseconds()) +
    dif + pad(Math.floor(Math.abs(tzo) / 60)) +
    ':' + pad(Math.abs(tzo) % 60);
}

function writeLog(level: string, ...args: any[]) {
  const timestamp = getLocalTimestamp();
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');

  let safeMessage = message;
  const secrets = [
    process.env.CLIENT_SECRET,
    process.env.TENANT_ID,
    process.env.CLIENT_ID
  ].filter(Boolean) as string[];

  for (const secret of secrets) {
    if (secret.length > 5) {
      const escapedSecret = secret.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedSecret, 'gi');
      safeMessage = safeMessage.replace(regex, '********');
    }
  }

  const logLine = `[${timestamp}] [${level}] ${safeMessage}\n`;
  logStream.write(logLine);
  lineCount++;

  try {
    if (lineCount >= 3000) {
      logStream.end();
      fs.writeFileSync(LOG_FILE, '', 'utf8');
      logStream = fs.createWriteStream(LOG_FILE, { flags: 'a', encoding: 'utf8' });
      lineCount = 0;
    }
  } catch (err) {
    // ignorar falhas de rotação
  }
}

console.log = function (...args: any[]) {
  writeLog('INFO', ...args);
  originalLog.apply(console, args);
};

console.info = function (...args: any[]) {
  writeLog('INFO', ...args);
  originalInfo.apply(console, args);
};

console.warn = function (...args: any[]) {
  writeLog('WARN', ...args);
  originalWarn.apply(console, args);
};

console.error = function (...args: any[]) {
  writeLog('ERROR', ...args);
  originalError.apply(console, args);
};

export function getLogsContent(limitLines = 200): string {
  if (!fs.existsSync(LOG_FILE)) {
    return '';
  }
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n');
    if (lines.length > limitLines) {
      return lines.slice(lines.length - limitLines).join('\n');
    }
    return content;
  } catch (error) {
    return `Erro ao ler os logs: ${error}`;
  }
}
