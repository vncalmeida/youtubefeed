import { pool } from '../db.js';
import { Subscription } from '../types/subscription.js';

export class SubscriptionRepository {
  async create(input: Subscription): Promise<void> {
    await pool.execute(
      'INSERT INTO subscriptions (payment_id, company_id, plan_id, status) VALUES (?,?,?,?)',
      [input.paymentId, input.companyId, input.planId, input.status]
    );
  }

  async findByPaymentId(paymentId: string): Promise<Subscription | null> {
    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE payment_id = ?', [paymentId]);
    const row = (rows as any[])[0];
    return row ? this.map(row) : null;
  }

  async updateStatus(paymentId: string, status: string): Promise<void> {
    await pool.execute('UPDATE subscriptions SET status=? WHERE payment_id=?', [status, paymentId]);
  }

  private map = (row: any): Subscription => ({
    paymentId: row.payment_id,
    companyId: row.company_id,
    planId: row.plan_id,
    status: row.status,
  });
}
