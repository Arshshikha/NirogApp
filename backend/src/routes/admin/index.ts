import { Router } from 'express';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import verificationRoutes from './verification.routes';
import userMgmtRoutes from './user-mgmt.routes';
import financeRoutes from './finance.routes';
import moderationRoutes from './moderation.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/verifications', verificationRoutes);
router.use('/users', userMgmtRoutes);
router.use('/finance', financeRoutes);
router.use('/moderation', moderationRoutes);

export default router;
