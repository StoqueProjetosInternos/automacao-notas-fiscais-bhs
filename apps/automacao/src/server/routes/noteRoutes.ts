import { Router } from 'express';
import { NoteController } from '../controllers/noteController.js';

const router = Router();

// Rota para listar todas as notas
router.get('/', NoteController.getAllNotes);

// Rota para obter logs de consumo
router.get('/usage', NoteController.getUsageLog);

// Rota para obter logs gerais de console da API
router.get('/logs', NoteController.getApiLogs);

// Rota para enviar alertas de vencimento por e-mail
router.post('/deadlines/send-alerts', NoteController.sendDeadlineAlerts);

// Rota para sincronizar e-mails
router.post('/sync', NoteController.syncNotes);

// Rota para reprocessar nota(s) contábil(eis)
router.post('/reprocess/:id', NoteController.reprocessNote);

// Rota para salvar uma nota específica
router.post('/:id', NoteController.saveNote);

// Rota para excluir uma nota específica
router.delete('/:id', NoteController.deleteNote);

export default router;
