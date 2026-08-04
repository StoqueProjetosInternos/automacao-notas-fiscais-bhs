import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { FILES_DIR } from './config/paths.js';
import noteRoutes from './routes/noteRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { authMiddleware } from './middlewares/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garante que o .env é carregado mesmo quando o app é importado por outro serviço
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env'),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Arquivos Estáticos
app.use('/files', express.static(FILES_DIR));

// Rotas de Autenticação
app.use('/api/auth', authRoutes);

// Rotas de Notas protegidas por autenticação
app.use('/api/notes', authMiddleware, noteRoutes);

export default app;
