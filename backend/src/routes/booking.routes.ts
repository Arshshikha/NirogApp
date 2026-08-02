import { Router } from 'express';
import { createBooking, getBookings, updateBookingStatus } from '../controllers/booking.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getBookings);
router.post('/', createBooking);
router.patch('/:id/status', updateBookingStatus);

export default router;
