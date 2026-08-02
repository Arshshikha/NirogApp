import { Router } from 'express';
import { getPayments, getPayouts, approvePayout, triggerRefund } from '../../controllers/admin/finance.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/payments', requireAuth, requireRole([UserRole.ADMIN]), getPayments);
router.get('/payouts', requireAuth, requireRole([UserRole.ADMIN]), getPayouts);
router.post('/payouts/approve/:payoutId', requireAuth, requireRole([UserRole.ADMIN]), approvePayout);
router.post('/refund/:paymentId', requireAuth, requireRole([UserRole.ADMIN]), triggerRefund);

export default router;
