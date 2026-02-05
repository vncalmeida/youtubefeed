import { pool } from '../db.js';
import { User } from '../types/user.js';

export class UserRepository {
  async createCompanyAndUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    companyName: string;
    plan?: string;
  }): Promise<User> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [companyRes] = await conn.execute('INSERT INTO companies (name, plan) VALUES (?,?)', [
        input.companyName,
        input.plan || 'Pro',
      ]);
      const companyId = (companyRes as any).insertId as number;
      const [userRes] = await conn.execute(
        'INSERT INTO users (name, email, password_hash, company_id) VALUES (?,?,?,?)',
        [input.name, input.email, input.passwordHash, companyId]
      );
      const userId = (userRes as any).insertId as number;
      await conn.commit();
      return { id: userId, name: input.name, email: input.email, passwordHash: input.passwordHash, companyId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const row = (rows as any[])[0];
    return row ? this.mapRow(row) : null;
  }

  async updatePassword(userId: number, hash: string): Promise<void> {
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
  }

  async createPasswordReset(userId: number, code: string, expiresAt: Date): Promise<void> {
    await pool.execute('INSERT INTO password_resets (user_id, code, expires_at) VALUES (?,?,?)', [userId, code, expiresAt]);
  }

  async findValidReset(email: string, code: string): Promise<{ id: number; userId: number } | null> {
    const [rows] = await pool.query(
      `SELECT pr.id, pr.user_id as userId
       FROM password_resets pr
       INNER JOIN users u ON u.id = pr.user_id
       WHERE u.email = ? AND pr.code = ? AND pr.expires_at > NOW()`,
      [email, code]
    );
    const row = (rows as any[])[0];
    return row ? { id: row.id, userId: row.userId } : null;
  }

  async deleteReset(id: number): Promise<void> {
    await pool.execute('DELETE FROM password_resets WHERE id = ?', [id]);
  }

  private mapRow(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      companyId: row.company_id,
    };
  }
}
