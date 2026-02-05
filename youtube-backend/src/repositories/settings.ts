import { pool } from '../db.js';
import { PlanConfig, SmtpConfig, MpConfig } from '../types/settings.js';

export class SettingsRepository {
  async getPlans(): Promise<PlanConfig[]> {
    const [rows] = await pool.query('SELECT * FROM plans');
    return (rows as any[]).map(r => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      channels: Number(r.channels),
      active: !!r.active,
      popular: !!r.popular,
    }));
  }

  async savePlans(plans: PlanConfig[]): Promise<void> {
    await pool.execute('DELETE FROM plans');
    for (const p of plans) {
      await pool.execute(
        'INSERT INTO plans (id, name, price, channels, active, popular) VALUES (?,?,?,?,?,?)',
        [p.id, p.name, p.price, p.channels, p.active ? 1 : 0, p.popular ? 1 : 0]
      );
    }
  }

  async getSmtp(): Promise<SmtpConfig | null> {
    const [rows] = await pool.query('SELECT * FROM smtp_settings WHERE id = 1');
    const row = (rows as any[])[0];
    if (!row) return null;
    return {
      host: row.host || '',
      port: Number(row.port) || 0,
      secure: !!row.secure,
      user: row.user || '',
      pass: row.pass || '',
      fromName: row.from_name || '',
      fromEmail: row.from_email || '',
      replyTo: row.reply_to || undefined,
    };
  }

  async saveSmtp(cfg: SmtpConfig): Promise<void> {
    await pool.execute(
      `INSERT INTO smtp_settings (id, host, port, secure, user, pass, from_name, from_email, reply_to)
       VALUES (1,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE host=VALUES(host), port=VALUES(port), secure=VALUES(secure), user=VALUES(user), pass=VALUES(pass), from_name=VALUES(from_name), from_email=VALUES(from_email), reply_to=VALUES(reply_to)`,
      [cfg.host, cfg.port, cfg.secure ? 1 : 0, cfg.user, cfg.pass, cfg.fromName, cfg.fromEmail, cfg.replyTo || null]
    );
  }

  async getMp(): Promise<MpConfig | null> {
    const [rows] = await pool.query('SELECT * FROM mp_settings WHERE id = 1');
    const row = (rows as any[])[0];
    if (!row) return null;
    return {
      accessToken: row.access_token || '',
      webhookSecret: row.webhook_secret || '',
    };
    }

  async saveMp(cfg: MpConfig): Promise<void> {
    await pool.execute(
      `INSERT INTO mp_settings (id, access_token, webhook_secret)
       VALUES (1,?,?)
       ON DUPLICATE KEY UPDATE access_token=VALUES(access_token), webhook_secret=VALUES(webhook_secret)`,
      [cfg.accessToken, cfg.webhookSecret]
    );
  }
}
