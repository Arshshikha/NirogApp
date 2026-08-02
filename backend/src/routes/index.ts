import { Router } from 'express';
import authRoutes from './auth.routes';
import bookingRoutes from './booking.routes';
import doctorRoutes from './doctor.routes';
import providerRoutes from './provider.routes';
import chatRoutes from './chat.routes';
import hubRoutes from './hub.routes';
import paymentRoutes from './payment.routes';
import reviewRoutes from './review.routes';
import notificationRoutes from './notification.routes';
import deviceTokenRoutes from './deviceToken.routes';
import adminRoutes from './admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/doctors', doctorRoutes);
router.use('/providers', providerRoutes);
router.use('/chat', chatRoutes);
router.use('/hub', hubRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/device-token', deviceTokenRoutes);
router.use('/admin', adminRoutes);

export default router;
