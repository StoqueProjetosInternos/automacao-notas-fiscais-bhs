import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Rota de login (aberta)
router.post('/login', AuthController.login);

// Rota de verificação do usuário (protegida)
router.get('/me', authMiddleware, AuthController.me);

export default router;
