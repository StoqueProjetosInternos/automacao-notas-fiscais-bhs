import { Request, Response } from 'express';
import { NoteService } from '../services/noteService.js';

export class NoteController {
  public static getAllNotes(req: Request, res: Response) {
    try {
      const notes = NoteService.listAllNotes();
      console.log(`[API] Retornando ${notes.length} notas processadas.`);
      res.json(notes);
    } catch (error) {
      console.error('[Error] Falha ao listar notas:', error);
      res.status(500).json({ error: 'Erro ao ler arquivos' });
    }
  }

  public static async saveNote(req: Request, res: Response) {
    const { id } = req.params;
    const newData = req.body;

    try {
      const result = await NoteService.updateNote(id as string, newData);
      res.json({ ...result, message: 'Nota atualizada com sucesso' });
    } catch (error: any) {
      if (error.message === 'Nota não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      console.error('[Error] Falha ao salvar nota:', error);
      res.status(500).json({ error: 'Erro ao salvar arquivo' });
    }
  }

  public static async reprocessNote(req: Request, res: Response) {
    const { id } = req.params;
    try {
      if (id === 'all') {
        const result = await NoteService.reprocessAllNotes();
        console.log(`[API] Reprocessamento em lote concluido: ${result.processedCount} faturas.`);
        res.json({ ...result, message: 'Todas as notas foram reprocessadas com sucesso' });
      } else {
        const result = await NoteService.reprocessNote(id as string);
        console.log(`[API] Fatura reprocessada com sucesso: ${id}`);
        res.json({ ...result, message: 'Nota reprocessada com sucesso' });
      }
    } catch (error: any) {
      console.error('[Error] Falha ao reprocessar nota:', error);
      res.status(500).json({ error: 'Erro ao reprocessar nota' });
    }
  }

  public static getUsageLog(req: Request, res: Response) {
    try {
      const logs = NoteService.getUsageLog();
      console.log(`[API] Retornando ${logs.length} registros de log de uso.`);
      res.json(logs);
    } catch (error) {
      console.error('[Error] Falha ao obter relatorio de uso:', error);
      res.status(500).json({ error: 'Erro ao ler arquivo de logs' });
    }
  }

  public static async deleteNote(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const result = NoteService.deleteNote(id as string);
      console.log(`[API] Fatura excluída com sucesso: ${id}`);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Nota não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      console.error('[Error] Falha ao excluir nota:', error);
      res.status(500).json({ error: 'Erro ao excluir arquivo' });
    }
  }

  public static async syncNotes(req: Request, res: Response) {
    try {
      const results = await NoteService.syncEmails();
      if (results.length > 0) {
        res.json({ 
          success: true, 
          imported: true, 
          message: `${results.length} fatura(s) de e-mail(s) importada(s) com sucesso.` 
        });
      } else {
        res.json({ 
          success: true, 
          imported: false, 
          message: 'A fila de e-mails está vazia. Não há novas faturas para processar no momento.' 
        });
      }
    } catch (error: any) {
      console.error('[Error] Falha na sincronização de e-mails:', error);
      res.status(500).json({ error: 'Erro ao conectar à API do e-mail ou ao processar fatura' });
    }
  }
}
