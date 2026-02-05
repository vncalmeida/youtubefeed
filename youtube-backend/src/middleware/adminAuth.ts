import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.header('authorization');
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { adminId: number };
    (req as any).adminId = payload.adminId;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
