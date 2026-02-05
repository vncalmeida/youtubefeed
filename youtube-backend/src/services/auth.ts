import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/users.js';
import { CompanyRepository } from '../repositories/companies.js';
import { User } from '../types/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export class AuthService {
  private repo: UserRepository;
  private companies: CompanyRepository;

  constructor(repo = new UserRepository(), companies = new CompanyRepository()) {
    this.repo = repo;
    this.companies = companies;
  }

  async register(name: string, email: string, company: string, password: string): Promise<User> {
    const hash = await bcrypt.hash(password, 10);
    return this.repo.createCompanyAndUser({ name, email, passwordHash: hash, companyName: company });
  }

  async login(email: string, password: string): Promise<{ token: string; user: User; expiringSoon: boolean; planExpiresAt: string | null }> {
    const user = await this.repo.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');
    const company = await this.companies.findById(user.companyId);
    if (!company || !company.isActive) throw new Error('INACTIVE_OR_EXPIRED');
    if (company.planExpiresAt && new Date(company.planExpiresAt) < new Date()) {
      throw new Error('INACTIVE_OR_EXPIRED');
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new Error('Invalid credentials');
    const token = jwt.sign({ userId: user.id, companyId: user.companyId }, JWT_SECRET, { expiresIn: '1h' });
    const expiringSoon = !!(company.planExpiresAt && new Date(company.planExpiresAt).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000);
    return { token, user, expiringSoon, planExpiresAt: company.planExpiresAt };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.repo.findByEmail(email);
    if (!user) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await this.repo.createPasswordReset(user.id, code, expires);
  }

  async verifyReset(email: string, code: string): Promise<void> {
    const entry = await this.repo.findValidReset(email, code);
    if (!entry) throw new Error('Invalid code');
  }

  async confirmReset(email: string, code: string, password: string): Promise<void> {
    const entry = await this.repo.findValidReset(email, code);
    if (!entry) throw new Error('Invalid code');
    const hash = await bcrypt.hash(password, 10);
    await this.repo.updatePassword(entry.userId, hash);
    await this.repo.deleteReset(entry.id);
  }
}
