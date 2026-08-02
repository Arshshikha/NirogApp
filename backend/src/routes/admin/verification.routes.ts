import { Router } from 'express';
import { getVerificationQueue, processVerification } from '../../controllers/admin/verification.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/queue', requireAuth, requireRole([UserRole.ADMIN]), getVerificationQueue);
router.post('/process/:profileId', requireAuth, requireRole([UserRole.ADMIN]), processVerification);

export default router;
