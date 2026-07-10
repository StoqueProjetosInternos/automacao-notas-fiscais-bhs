import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Rota de login (aberta)
router.post('/login', AuthController.login);

// Rota de verificação do usuário (protegida)
router.get('/me', authMiddleware, AuthController.me);

// Rota pública de estatísticas agregadas para a tela de boas-vindas (Home)
router.get('/metrics', AuthController.getMetrics);

export default router;
