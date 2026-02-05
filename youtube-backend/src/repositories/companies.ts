import { pool } from '../db.js';
import { Company, CompanyCreateInput, CompanyUser, CompanyUserCreateInput } from '../types/company.js';

export class CompanyRepository {
  async findAll(): Promise<Company[]> {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(u.id) AS users_count
       FROM companies c
       LEFT JOIN users u ON u.company_id = c.id
       GROUP BY c.id`
    );
    return (rows as any[]).map(this.mapCompany);
  }

  async findById(id: number): Promise<Company | null> {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(u.id) AS users_count
       FROM companies c
       LEFT JOIN users u ON u.company_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [id]
    );
    const row = (rows as any[])[0];
    return row ? this.mapCompany(row) : null;
  }

  async create(input: CompanyCreateInput): Promise<Company> {
    const [res] = await pool.execute(
      'INSERT INTO companies (name, plan, is_active, mrr, plan_expires_at) VALUES (?,?,?,?,?)',
      [
        input.name,
        input.plan,
        input.isActive ? 1 : 0,
        input.mrr,
        input.planExpiresAt ? new Date(input.planExpiresAt) : null,
      ]
    );
    const id = (res as any).insertId as number;
    return (await this.findById(id)) as Company;
  }

  async update(id: number, input: CompanyCreateInput): Promise<Company> {
    await pool.execute(
      'UPDATE companies SET name=?, plan=?, is_active=?, mrr=?, plan_expires_at=? WHERE id=?',
      [
        input.name,
        input.plan,
        input.isActive ? 1 : 0,
        input.mrr,
        input.planExpiresAt ? new Date(input.planExpiresAt) : null,
        id,
      ]
    );
    return (await this.findById(id)) as Company;
  }

  async updatePlan(companyId: number, plan: string, mrr: number, planExpiresAt: Date): Promise<void> {
    await pool.execute('UPDATE companies SET plan=?, mrr=?, plan_expires_at=? WHERE id=?', [plan, mrr, planExpiresAt, companyId]);
  }

  async delete(id: number): Promise<void> {
    await pool.execute('DELETE FROM companies WHERE id = ?', [id]);
  }

  async findUsers(companyId: number): Promise<CompanyUser[]> {
    const [rows] = await pool.query('SELECT * FROM users WHERE company_id = ?', [companyId]);
    return (rows as any[]).map(this.mapUser);
  }

  async findUser(companyId: number, userId: number): Promise<CompanyUser | null> {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? AND company_id = ?', [userId, companyId]);
    const row = (rows as any[])[0];
    return row ? this.mapUser(row) : null;
  }

  async createUser(companyId: number, input: CompanyUserCreateInput): Promise<CompanyUser> {
    const [res] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, is_active, company_id) VALUES (?,?,?,?,?,?)',
      [input.name, input.email, '', input.role, input.isActive ? 1 : 0, companyId]
    );
    const id = (res as any).insertId as number;
    return (await this.findUser(companyId, id)) as CompanyUser;
  }

  async updateUser(companyId: number, userId: number, input: CompanyUserCreateInput): Promise<CompanyUser> {
    await pool.execute(
      'UPDATE users SET name=?, email=?, role=?, is_active=? WHERE id=? AND company_id=?',
      [input.name, input.email, input.role, input.isActive ? 1 : 0, userId, companyId]
    );
    return (await this.findUser(companyId, userId)) as CompanyUser;
  }

  async deleteUser(companyId: number, userId: number): Promise<void> {
    await pool.execute('DELETE FROM users WHERE id=? AND company_id=?', [userId, companyId]);
  }

  private mapCompany = (row: any): Company => ({
    id: row.id,
    name: row.name,
    plan: row.plan,
    isActive: !!row.is_active,
    mrr: Number(row.mrr),
    usersCount: Number(row.users_count) || 0,
    planExpiresAt: row.plan_expires_at ? new Date(row.plan_expires_at).toISOString() : null,
    createdAt: row.created_at,
  });

  private mapUser = (row: any): CompanyUser => ({
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  });
}
