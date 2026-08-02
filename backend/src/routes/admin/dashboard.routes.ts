import { Router } from 'express';
import { getDashboardStats } from '../../controllers/admin/dashboard.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/stats', requireAuth, requireRole([UserRole.ADMIN]), getDashboardStats);

export default router;
