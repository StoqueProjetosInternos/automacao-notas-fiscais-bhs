import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

function resolveFilesDir(): string {
  if (process.env.FILES_DIR) {
    return path.resolve(process.env.FILES_DIR);
  }

  const possiblePaths = [
    path.resolve(process.cwd(), 'data', 'extracted'),
    path.resolve(__dirname, '..', '..', '..', '..', '..', 'data', 'extracted'),
    path.resolve(__dirname, '..', '..', '..', '..', 'data', 'extracted'),
    path.resolve(__dirname, '..', '..', '..', 'data', 'extracted'),
    path.resolve((process as any).resourcesPath || '', 'data', 'extracted'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p) || fs.existsSync(path.dirname(p))) {
      return p;
    }
  }

  return path.resolve(process.cwd(), 'data', 'extracted');
}

export const FILES_DIR = resolveFilesDir();
