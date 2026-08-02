import { Router } from 'express';
import { getReports, resolveReport, moderateContent, deleteComment, deleteReview, getAuditLogs } from '../../controllers/admin/moderation.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/reports', requireAuth, requireRole([UserRole.ADMIN]), getReports);
router.post('/reports/resolve/:reportId', requireAuth, requireRole([UserRole.ADMIN]), resolveReport);
router.post('/content/moderate/:contentId', requireAuth, requireRole([UserRole.ADMIN]), moderateContent);
router.delete('/comments/:commentId', requireAuth, requireRole([UserRole.ADMIN]), deleteComment);
router.delete('/reviews/:reviewId', requireAuth, requireRole([UserRole.ADMIN]), deleteReview);
router.get('/audit-logs', requireAuth, requireRole([UserRole.ADMIN]), getAuditLogs);

export default router;
