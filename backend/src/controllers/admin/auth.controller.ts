import { Request, Response } from 'express';
import { db } from '../../config/db';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nirog_secret_key_123';

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const emailLower = String(email).trim().toLowerCase();
    const user = await db.user.findFirst({
      where: {
        email: emailLower,
        role: 'ADMIN',
      },
      include: {
        profile: true,
        adminProfile: true,
      },
    });

    if (!user || user.passwordHash !== password) {
      res.status(401).json({ error: 'Invalid email, password, or you are not an authorized admin.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Your account has been deactivated.' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // Create session record if possible
    try {
      await db.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        }
      });
    } catch (sessionErr) {
      console.error('Failed to create session in database:', sessionErr);
    }

    const { passwordHash, ...safeUser } = user;
    res.status(200).json({
      message: 'Admin login successful',
      token,
      session: safeUser,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
