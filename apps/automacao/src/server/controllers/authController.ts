import { Request, Response } from 'express';
import { sessionManager } from '../services/sessionManager.js';
import { NoteService } from '../services/noteService.js';

export class AuthController {
  public static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    // Dados cadastrais dinâmicos lidos do .env (simulação de request/banco)
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@stoque.com.br').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'Administrador Fiscal SFI';
    const adminRole = process.env.ADMIN_ROLE || 'ADMIN';

    const userEmail = (process.env.USER_EMAIL || 'user@stoque.com.br').toLowerCase().trim();
    const userPassword = process.env.USER_PASSWORD || 'User@123';
    const userName = process.env.USER_NAME || 'Operador Fiscal SFI';
    const userRole = process.env.USER_ROLE || 'USER';

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const inputEmailClean = email.toLowerCase().trim();

    // Validação ADMIN
    if (inputEmailClean === adminEmail && password === adminPassword) {
      console.log(`[AUTH] Login de Administrador bem-sucedido para: ${email}`);
      const sessionId = sessionManager.createSession({
        name: adminName,
        email: adminEmail,
        role: adminRole
      });
      return res.json({
        token: sessionId,
        user: {
          name: adminName,
          email: adminEmail,
          role: adminRole
        }
      });
    }

    // Validação USER
    if (inputEmailClean === userEmail && password === userPassword) {
      console.log(`[AUTH] Login de Operador bem-sucedido para: ${email}`);
      const sessionId = sessionManager.createSession({
        name: userName,
        email: userEmail,
        role: userRole
      });
      return res.json({
        token: sessionId,
        user: {
          name: userName,
          email: userEmail,
          role: userRole
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

  public static async getMetrics(req: Request, res: Response) {
    try {
      const logs = NoteService.getUsageLog();
      const totalProcessed = logs.length;
      
      const successLogs = logs.filter(log => log.status === 'Sucesso');
      let avgTimeMs = 0;
      if (successLogs.length > 0) {
        const sum = successLogs.reduce((acc, log) => {
          const ms = parseInt(String(log.tempoProcessamentoMs).replace(/\D/g, '')) || 0;
          return acc + ms;
        }, 0);
        avgTimeMs = Math.round(sum / successLogs.length);
      }

      return res.json({
        totalProcessed,
        avgTimeMs: avgTimeMs > 0 ? parseFloat((avgTimeMs / 1000).toFixed(1)) : 2.5,
        successRate: totalProcessed > 0 ? parseFloat(((successLogs.length / totalProcessed) * 100).toFixed(1)) : 100
      });
    } catch (error) {
      console.error('[AUTH] Erro ao calcular metricas publicas:', error);
      return res.json({ totalProcessed: 0, avgTimeMs: 2.5, successRate: 100 });
    }
  }
}
