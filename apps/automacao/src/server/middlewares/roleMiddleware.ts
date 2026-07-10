import { Request, Response, NextFunction } from 'express';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    console.warn(`[AUTH] Acesso negado. Ação restrita a ADMINs. Usuário: ${user?.email || 'Desconhecido'}`);
    return res.status(403).json({ error: 'Acesso negado. Esta ação é restrita para administradores.' });
  }
  next();
};
