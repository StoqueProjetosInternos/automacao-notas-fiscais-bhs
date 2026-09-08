import fs from 'fs';
import path from 'path';
import { FILES_DIR } from '../config/paths.js';
import { NoteService } from './noteService.js';

export interface DeadlineState {
  lastExecutionDate: string; // YYYY-MM-DD
  lastExecutionTime?: string; // ISO String
  lastSentCount: number;
  lastStatus: 'idle' | 'success' | 'no_critical_items' | 'error';
  lastMessage?: string;
  lastError?: string;
}

export class DeadlineAlertService {
  private static schedulerTimer: NodeJS.Timeout | null = null;

  private static getStateFilePath(): string {
    return path.join(path.dirname(FILES_DIR), 'deadline_alerts_state.json');
  }

  public static getDeadlineAlertsState(): DeadlineState {
    const filePath = this.getStateFilePath();
    if (!fs.existsSync(filePath)) {
      return {
        lastExecutionDate: '',
        lastSentCount: 0,
        lastStatus: 'idle',
        lastMessage: 'Nenhuma verificação executada ainda.'
      };
    }
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return {
        lastExecutionDate: '',
        lastSentCount: 0,
        lastStatus: 'idle'
      };
    }
  }

  private static saveState(state: DeadlineState): void {
    try {
      const filePath = this.getStateFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('[DeadlineAlertService] Falha ao salvar estado de alertas:', err.message);
    }
  }

  private static parseBrazilianDate(dateStr?: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  public static async checkAndDispatchDailyAlerts(force: boolean = false): Promise<DeadlineState> {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentState = this.getDeadlineAlertsState();

    if (!force && currentState.lastExecutionDate === todayStr && currentState.lastStatus === 'success') {
      console.log(`[DeadlineAlertService] Alerta diário já executado com sucesso hoje (${todayStr}). Envio suprimido.`);
      return currentState;
    }

    console.log(`[DeadlineAlertService] Iniciando checagem diária automática de vencimentos...`);

    try {
      const allNotes = NoteService.listAllNotes();
      const pendingNotes = allNotes.filter(n => n.data.status !== 'validado' && n.data.status !== 'arquivado');

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const criticalItems: any[] = [];

      for (const note of pendingNotes) {
        const dueDateStr = note.data.financial?.dueDate;
        const dueDate = this.parseBrazilianDate(dueDateStr);
        if (!dueDate) continue;

        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - hoje.getTime();
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diasRestantes <= 10 && diasRestantes >= -15) {
          criticalItems.push({
            fornecedor: note.data.supplier?.name || 'DESCONHECIDO',
            valor: Number(note.data.financial?.chargedValue || note.data.financial?.originalValue || 0),
            vencimento: dueDateStr,
            diasRestantes
          });
        }
      }

      if (criticalItems.length === 0) {
        const updatedState: DeadlineState = {
          lastExecutionDate: todayStr,
          lastExecutionTime: new Date().toISOString(),
          lastSentCount: 0,
          lastStatus: 'no_critical_items',
          lastMessage: 'Nenhuma fatura pendente com vencimento crítico (<= 10 dias).'
        };
        this.saveState(updatedState);
        console.log(`[DeadlineAlertService] ${updatedState.lastMessage}`);
        return updatedState;
      }

      console.log(`[DeadlineAlertService] Disparando alerta por e-mail para ${criticalItems.length} faturas críticas...`);
      const result = await NoteService.sendDeadlineAlerts(criticalItems);

      const updatedState: DeadlineState = {
        lastExecutionDate: todayStr,
        lastExecutionTime: new Date().toISOString(),
        lastSentCount: criticalItems.length,
        lastStatus: 'success',
        lastMessage: result.message
      };
      this.saveState(updatedState);
      console.log(`[DeadlineAlertService] Alerta diário enviado com sucesso para ${criticalItems.length} faturas.`);
      return updatedState;
    } catch (error: any) {
      console.error('[DeadlineAlertService] Falha na verificação/envio de alertas de vencimento:', error.message);
      const errorState: DeadlineState = {
        ...currentState,
        lastExecutionTime: new Date().toISOString(),
        lastStatus: 'error',
        lastError: error.message
      };
      this.saveState(errorState);
      return errorState;
    }
  }

  public static startDeadlineScheduler(): void {
    if (this.schedulerTimer) return;

    // Disparo inicial 5 segundos após a inicialização do app
    setTimeout(() => {
      this.checkAndDispatchDailyAlerts().catch(err => {
        console.warn('[DeadlineAlertService] Erro no startup check:', err.message);
      });
    }, 5000);

    // Verificação periódica a cada 2 horas enquanto o app estiver aberto
    const INTERVAL_MS = 2 * 60 * 60 * 1000;
    this.schedulerTimer = setInterval(() => {
      this.checkAndDispatchDailyAlerts().catch(err => {
        console.warn('[DeadlineAlertService] Erro na verificação periódica:', err.message);
      });
    }, INTERVAL_MS);

    // Permite que o processo Node.js encerre sem ser travado pelo timer
    this.schedulerTimer.unref();
    console.log('[DeadlineAlertService] Monitoramento automático de vencimentos ativado.');
  }
}
