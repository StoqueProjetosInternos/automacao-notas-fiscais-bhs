import express from 'express';
import cors from 'cors';
import { FILES_DIR } from './config/paths.js';
import noteRoutes from './routes/noteRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { authMiddleware } from './middlewares/authMiddleware.js';

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
