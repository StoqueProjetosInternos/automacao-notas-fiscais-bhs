import { Router } from 'express';
import { NoteController } from '../controllers/noteController.js';

const router = Router();

// Rota para listar todas as notas
router.get('/', NoteController.getAllNotes);

// Rota para reprocessar nota(s) contábil(eis)
router.post('/reprocess/:id', NoteController.reprocessNote);

// Rota para salvar uma nota específica
router.post('/:id', NoteController.saveNote);

// Rota para excluir uma nota específica
router.delete('/:id', NoteController.deleteNote);

// Rota para obter logs de consumo
router.get('/usage', NoteController.getUsageLog);

export default router;
