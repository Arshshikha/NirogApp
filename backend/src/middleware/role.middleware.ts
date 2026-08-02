import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication token missing.' });
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ 
        error: `Forbidden: Role '${userRole}' does not have permission to access this resource.` 
      });
      return;
    }

    next();
  };
};
