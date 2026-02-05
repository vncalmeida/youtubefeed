import { Request, Response } from 'express';
import { AdminAuthService } from '../services/adminAuth.js';

export class AdminAuthController {
  private service = new AdminAuthService();

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    try {
      const { token } = await this.service.login(email, password);
      res.json({ token });
    } catch {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  };
}
