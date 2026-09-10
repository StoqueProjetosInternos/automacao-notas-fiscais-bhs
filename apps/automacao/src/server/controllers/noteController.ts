import { Request, Response } from 'express';
import { NoteService } from '../services/noteService.js';
import { ZeevService } from '../services/zeevService.js';
import { DeadlineAlertService } from '../services/deadlineAlertService.js';
import { getLogsContent, clearLogsContent } from '../config/logger.js';
import fs from 'fs';
import path from 'path';
import { FILES_DIR } from '../config/paths.js';

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
      // Se o status de transição for 'validado', executa a integração/simulação primeiro
      if (newData.status === 'validado') {
        console.log(`[API] Executando simulação de integração com o Zeev para fatura ${id} antes de validar.`);
        const zeevResult = await ZeevService.generateDryRunPayload(id as string, newData);
        const createdZeevId = zeevResult?.instanceId || zeevResult?.id || zeevResult?.code || zeevResult?.instanceCode;
        if (createdZeevId) {
          newData.zeevInstanceId = String(createdZeevId);
        }
      }

      // Se passou pela simulação (ou se não for 'validado'), persiste as atualizações em disco
      const result = await NoteService.updateNote(id as string, newData);

      res.json({ ...result, message: 'Nota atualizada com sucesso' });
    } catch (error: any) {
      if (error.message === 'Nota não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      console.error('[Error] Falha ao salvar nota:', error);

      // Se for um erro vindo da integração com o Zeev, repassa o erro detalhado
      if (error.message && error.message.startsWith('[Zeev]')) {
        return res.status(400).json({ error: error.message });
      }

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

  public static async sendDeadlineAlerts(req: Request, res: Response) {
    const { items } = req.body;
    try {
      const result = await NoteService.sendDeadlineAlerts(items);
      res.json(result);
    } catch (error: any) {
      console.error('[Error] Falha ao enviar alertas de vencimento:', error);
      res.status(500).json({ error: error.message || 'Erro ao enviar alertas por e-mail' });
    }
  }

  public static getDeadlineStatus(req: Request, res: Response) {
    try {
      const status = DeadlineAlertService.getDeadlineAlertsState();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao consultar status de prazos' });
    }
  }

  public static async triggerDeadlineCheck(req: Request, res: Response) {
    try {
      const force = req.query.force === 'true';
      const result = await DeadlineAlertService.checkAndDispatchDailyAlerts(force);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao executar checagem de prazos' });
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

  public static getApiLogs(req: Request, res: Response) {
    try {
      const logs = getLogsContent(200);
      res.json({ logs });
    } catch (error) {
      console.error('[Error] Falha ao ler logs do sistema:', error);
      res.status(500).json({ error: 'Erro ao obter logs da API' });
    }
  }

  public static clearApiLogs(req: Request, res: Response) {
    try {
      clearLogsContent();
      res.json({ success: true, message: 'Logs limpos com sucesso.' });
    } catch (error) {
      console.error('[Error] Falha ao limpar logs do sistema:', error);
      res.status(500).json({ error: 'Erro ao limpar logs da API' });
    }
  }

  public static async uploadPdf(req: Request, res: Response) {
    try {
      const fileNameHeader = req.headers['x-file-name'];
      if (!fileNameHeader) {
        return res.status(400).json({ error: 'Cabeçalho X-File-Name é obrigatório.' });
      }

      const originalName = decodeURIComponent(String(fileNameHeader));
      if (!originalName.toLowerCase().endsWith('.pdf')) {
        return res.status(400).json({ error: 'Apenas arquivos PDF são permitidos.' });
      }

      const chunks: Buffer[] = [];
      
      req.on('data', (chunk) => {
        chunks.push(chunk);
      });

      req.on('end', async () => {
        try {
          const fileBuffer = Buffer.concat(chunks);
          if (fileBuffer.length === 0) {
            return res.status(400).json({ error: 'O corpo do arquivo enviado está vazio.' });
          }

          const tempDir = path.resolve(FILES_DIR, '..', '..', '.tmp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          const tempPath = path.join(tempDir, `upload_${Date.now()}_${originalName.replace(/\s+/g, '_')}`);
          fs.writeFileSync(tempPath, fileBuffer);

          console.log(`[API] Upload temporário salvo em: ${tempPath}`);

          const userObj = {
            email: (req as any).user?.email || 'Upload Manual',
            name: (req as any).user?.name || 'Upload Manual',
            origin: 'Upload Manual'
          };
          const result = await NoteService.importManualNote(tempPath, userObj);
          
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }

          res.json({
            success: true,
            message: 'Fatura importada e processada via Gemini com sucesso.',
            data: result.data
          });
        } catch (innerError: any) {
          console.error('[API] Erro ao ler body do arquivo ou processar OCR:', innerError);
          res.status(500).json({ error: innerError.message || 'Erro ao processar arquivo' });
        }
      });
    } catch (error: any) {
      console.error('[API] Falha no upload manual de PDF:', error);
      res.status(500).json({ error: 'Erro no recebimento da fatura manual' });
    }
  }
}
