import { pool } from '../db.js';

interface PaymentRecord {
  id: string;
  amount: number;
  description: string;
  email: string;
  status: string;
  metadata?: any;
}

export class PaymentRepository {
  async create(p: PaymentRecord): Promise<void> {
    await pool.query(
      'INSERT INTO payments (id, amount, description, email, status, metadata) VALUES (?,?,?,?,?,?)',
      [p.id, p.amount, p.description, p.email, p.status, JSON.stringify(p.metadata || {})]
    );
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await pool.query('UPDATE payments SET status = ? WHERE id = ?', [status, id]);
  }

  async findById(id: string): Promise<any | null> {
    const [rows]: any = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
    return rows[0] || null;
  }
}

