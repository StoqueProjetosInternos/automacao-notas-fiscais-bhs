import { Request, Response } from 'express';
import { sessionManager } from '../services/sessionManager.js';
export class AuthController {
  public static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const userEmail = process.env.ADMIN_EMAIL;
    const userPassword = process.env.ADMIN_PASSWORD;

    if (!userEmail || !userPassword) {
      return res.status(500).json({ error: 'Erro de configuração de autenticação no servidor.' });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    if (email.toLowerCase() === userEmail.toLowerCase().trim() && password === userPassword) {
      console.log(`[AUTH] Login bem-sucedido para o usuário: ${email}`);
      const sessionId = sessionManager.createSession({
        name: 'Analista Fiscal Stoque',
        email: userEmail,
        role: 'ADMIN'
      });
      return res.json({
        token: sessionId,
        user: {
          name: 'Analista Fiscal Stoque',
          email: userEmail,
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
