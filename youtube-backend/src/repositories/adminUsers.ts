import { pool } from '../db.js';
import { AdminUser } from '../types/adminUser.js';

export class AdminUserRepository {
  async findByEmail(email: string): Promise<AdminUser | null> {
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE email = ?', [email]);
    const row = (rows as any[])[0];
    return row ? this.mapRow(row) : null;
  }

  async create(input: { name: string; email: string; passwordHash: string }): Promise<AdminUser> {
    const [res] = await pool.execute(
      'INSERT INTO admin_users (name, email, password_hash) VALUES (?,?,?)',
      [input.name, input.email, input.passwordHash]
    );
    const id = (res as any).insertId as number;
    return { id, name: input.name, email: input.email, passwordHash: input.passwordHash };
  }

  private mapRow(row: any): AdminUser {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
    };
  }
}
