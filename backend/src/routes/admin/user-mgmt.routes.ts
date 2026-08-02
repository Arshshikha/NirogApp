import { Router } from 'express';
import { getUsers, getUserDetail, toggleUserStatus, softDeleteUser, getBookings, updateBookingStatus } from '../../controllers/admin/user-mgmt.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// User management endpoints
router.get('/', requireAuth, requireRole([UserRole.ADMIN]), getUsers);
router.get('/detail/:userId', requireAuth, requireRole([UserRole.ADMIN]), getUserDetail);
router.post('/status/:userId', requireAuth, requireRole([UserRole.ADMIN]), toggleUserStatus);
router.delete('/:userId', requireAuth, requireRole([UserRole.ADMIN]), softDeleteUser);

// Booking management endpoints
router.get('/bookings', requireAuth, requireRole([UserRole.ADMIN]), getBookings);
router.post('/bookings/:bookingId/status', requireAuth, requireRole([UserRole.ADMIN]), updateBookingStatus);

export default router;
