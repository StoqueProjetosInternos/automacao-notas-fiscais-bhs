import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sobe 3 níveis: config -> server -> src -> root (ou similar dependendo da estrutura)
// Ajustando para apontar corretamente para data/extracted (5 níveis acima)
export const FILES_DIR = path.resolve(__dirname, '..', '..', '..', '..', '..', 'data', 'extracted');
