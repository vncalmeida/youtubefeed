import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.js';

export class SettingsController {
  private service = new SettingsService();

  getAll = async (_req: Request, res: Response) => {
    const data = await this.service.getAll();
    res.json(data);
  };

  savePlans = async (req: Request, res: Response) => {
    const { plans } = req.body;
    if (!Array.isArray(plans)) {
      return res.status(400).json({ error: 'plans required' });
    }
    await this.service.savePlans(plans);
    res.json({ success: true });
  };

  saveSmtp = async (req: Request, res: Response) => {
    const { smtp } = req.body;
    if (!smtp) {
      return res.status(400).json({ error: 'smtp required' });
    }
    await this.service.saveSmtp(smtp);
    res.json({ success: true });
  };

  saveMp = async (req: Request, res: Response) => {
    const { mp } = req.body;
    if (!mp) {
      return res.status(400).json({ error: 'mp required' });
    }
    await this.service.saveMp(mp);
    res.json({ success: true });
  };

  testSmtp = async (req: Request, res: Response) => {
    const { to } = req.body;
    if (!to) return res.status(400).json({ success: false, message: 'email requerido' });
    const result = await this.service.testSmtp(to);
    res.json(result);
  };
}
