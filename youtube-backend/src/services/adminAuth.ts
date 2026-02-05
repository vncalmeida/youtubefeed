import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminUserRepository } from '../repositories/adminUsers.js';
import { AdminUser } from '../types/adminUser.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export class AdminAuthService {
  private repo: AdminUserRepository;

  constructor(repo = new AdminUserRepository()) {
    this.repo = repo;
  }

  async login(email: string, password: string): Promise<{ token: string; admin: AdminUser }> {
    const admin = await this.repo.findByEmail(email);
    if (!admin) throw new Error('Invalid credentials');
    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) throw new Error('Invalid credentials');
    const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, { expiresIn: '1h' });
    return { token, admin };
  }
}
