import { Router } from 'express';
import { NoteController } from '../controllers/noteController.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// Rota para listar todas as notas
router.get('/', NoteController.getAllNotes);

// Rota para obter logs de consumo
router.get('/usage', NoteController.getUsageLog);

// Rota para obter logs gerais de console da API (Apenas Admin)
router.get('/logs', requireAdmin, NoteController.getApiLogs);

// Rota para enviar alertas de vencimento por e-mail
router.post('/deadlines/send-alerts', NoteController.sendDeadlineAlerts);

// Rota para sincronizar e-mails (Apenas Admin)
router.post('/sync', requireAdmin, NoteController.syncNotes);

// Rota para reprocessar nota(s) contábil(eis) (Apenas Admin)
router.post('/reprocess/:id', requireAdmin, NoteController.reprocessNote);

// Rota para realizar upload manual de faturas PDF
router.post('/upload', NoteController.uploadPdf);

// Rota para salvar uma nota específica
router.post('/:id', NoteController.saveNote);

// Rota para excluir uma nota específica (Apenas Admin)
router.delete('/:id', requireAdmin, NoteController.deleteNote);

export default router;
