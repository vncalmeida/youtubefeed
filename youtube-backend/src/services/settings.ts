import nodemailer from 'nodemailer';
import { SettingsRepository } from '../repositories/settings.js';
import { PlanConfig, SmtpConfig, MpConfig } from '../types/settings.js';

export class SettingsService {
  constructor(private repo = new SettingsRepository()) {}

  async getAll(): Promise<{ plans: PlanConfig[]; smtp: SmtpConfig | null; mp: MpConfig | null }> {
    const [plans, smtp, mp] = await Promise.all([
      this.repo.getPlans(),
      this.repo.getSmtp(),
      this.repo.getMp(),
    ]);
    return { plans, smtp, mp };
  }

  savePlans(plans: PlanConfig[]): Promise<void> {
    return this.repo.savePlans(plans);
  }

  saveSmtp(cfg: SmtpConfig): Promise<void> {
    return this.repo.saveSmtp(cfg);
  }

  saveMp(cfg: MpConfig): Promise<void> {
    return this.repo.saveMp(cfg);
  }

  getMp(): Promise<MpConfig | null> {
    return this.repo.getMp();
  }

  async testSmtp(to: string): Promise<{ success: boolean; message?: string }> {
    const cfg = await this.repo.getSmtp();
    if (!cfg || !cfg.host) return { success: false, message: 'SMTP não configurado' };
    try {
      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass },
      });
      await transporter.sendMail({
        from: `${cfg.fromName} <${cfg.fromEmail}>`,
        to,
        subject: 'Teste SMTP',
        text: 'Teste SMTP bem-sucedido',
      });
      return { success: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao enviar';
      return { success: false, message };
    }
  }
}
