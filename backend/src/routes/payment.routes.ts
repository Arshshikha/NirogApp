import { Router } from 'express';
import { initiatePayment, confirmPayment, getEarnings, getPayments, razorpayCheckout, razorpayCallback, razorpayPatientCheckout, razorpayPatientCallback, getPaymentStatus } from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Public hosted checkout endpoints
router.get('/razorpay-checkout', razorpayCheckout);
router.get('/razorpay-callback', razorpayCallback);
router.get('/razorpay-patient-checkout', razorpayPatientCheckout);
router.get('/razorpay-patient-callback', razorpayPatientCallback);

router.use(requireAuth);

router.get('/', getPayments);
router.post('/initiate', initiatePayment);
router.post('/confirm', confirmPayment);
router.get('/earnings', getEarnings);
router.get('/:paymentId/status', getPaymentStatus);

export default router;
