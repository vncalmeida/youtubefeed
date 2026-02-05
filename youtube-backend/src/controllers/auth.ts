import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthService } from '../services/auth.js';
import { UserRepository } from '../repositories/users.js';

export class AuthController {
  private service = new AuthService();
  private users = new UserRepository();

  register = async (req: Request, res: Response) => {
    const { name, email, company, password } = req.body;
    if (!name || !email || !company || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    try {
      await this.service.register(name, email, company, password);
      res.status(201).json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    try {
      const { token, user, expiringSoon, planExpiresAt } = await this.service.login(email, password);
      res.json({ token, companyId: user.companyId, expiringSoon, planExpiresAt });
    } catch (err: any) {
      if (err.message === 'INACTIVE_OR_EXPIRED') {
        res.status(403).json({ error: 'Access denied' });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    }
  };

  requestReset = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    await this.service.requestPasswordReset(email);
    res.json({ ok: true });
  };

  verifyReset = async (req: Request, res: Response) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Missing fields' });
    try {
      await this.service.verifyReset(email, code);
      res.json({ ok: true });
    } catch {
      res.status(400).json({ error: 'Invalid code' });
    }
  };

  confirmReset = async (req: Request, res: Response) => {
    const { email, code, password } = req.body;
    if (!email || !code || !password) return res.status(400).json({ error: 'Missing fields' });
    try {
      await this.service.confirmReset(email, code, password);
      res.json({ ok: true });
    } catch {
      res.status(400).json({ error: 'Invalid code' });
    }
  };

  registerAfterPayment = async (req: Request, res: Response) => {
    const { email, companyName, password } = req.body;
    if (!email || !companyName || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    try {
      const hash = await bcrypt.hash(password, 10);
      await this.users.createCompanyAndUser({
        name: companyName,
        email,
        passwordHash: hash,
        companyName,
      });
      res.status(201).json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };
}
