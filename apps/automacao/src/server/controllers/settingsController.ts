import { Request, Response } from 'express';
import { SettingsService } from '../services/settingsService.js';

export const getSettings = (req: Request, res: Response) => {
  try {
    const settings = SettingsService.getSettings();
    res.json(settings);
  } catch (error: any) {
    console.error('[SettingsController] Erro ao obter configurações:', error);
    res.status(500).json({ error: 'Falha ao recuperar configurações do sistema.' });
  }
};

export const updateSettings = (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem alterar configurações do sistema.' });
    }

    SettingsService.updateSettings(req.body);
    const updated = SettingsService.getSettings();
    res.json({
      success: true,
      message: 'Configurações atualizadas e sincronizadas com sucesso em tempo real.',
      settings: updated
    });
  } catch (error: any) {
    console.error('[SettingsController] Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Falha ao salvar configurações do sistema: ' + error.message });
  }
};
