import { Request, Response } from 'express';
import { sessionManager } from '../services/sessionManager.js';

// Credenciais fixas de demonstração
const USER_EMAIL = 'admin@stoque.com.br';
const USER_PASSWORD = 'stoque-fiscal';

export class AuthController {
  public static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    if (email.toLowerCase() === USER_EMAIL && password === USER_PASSWORD) {
      console.log(`[AUTH] Login bem-sucedido para o usuário: ${email}`);
      const sessionId = sessionManager.createSession({
        name: 'Analista Fiscal Stoque',
        email: USER_EMAIL,
        role: 'ADMIN'
      });
      return res.json({
        token: sessionId,
        user: {
          name: 'Analista Fiscal Stoque',
          email: USER_EMAIL,
          role: 'ADMIN'
        }
      });
    }

    console.warn(`[AUTH] Falha de login para o e-mail: ${email}`);
    return res.status(401).json({ error: 'Credenciais inválidas. E-mail ou senha incorretos.' });
  }

  public static async me(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Não autorizado. Token de sessão ausente.' });
    }

    const token = authHeader.split(' ')[1];
    const session = sessionManager.validateSession(token);
    
    if (!session) {
      return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
    }

    return res.json({ user: session.user });
  }
}
