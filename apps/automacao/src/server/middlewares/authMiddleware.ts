import { Request, Response, NextFunction } from 'express';
import { sessionManager } from '../services/sessionManager.js';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Ignora validação para a rota de login
  if (req.path === '/login') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[AUTH] Acesso negado. Token ausente para a url: ${req.url}`);
    return res.status(401).json({ error: 'Não autorizado. Token de sessão ausente.' });
  }

  const token = authHeader.split(' ')[1];
  const session = sessionManager.validateSession(token);
  
  if (!session) {
    console.warn(`[AUTH] Sessão expirada ou inválida para o token: ${token}`);
    return res.status(401).json({ error: 'Não autorizado. Sessão de login expirada ou inválida.' });
  }

  // Sessão válida, prossegue
  next();
};
