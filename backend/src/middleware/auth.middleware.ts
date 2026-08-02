import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nirog_secret_key_123';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
