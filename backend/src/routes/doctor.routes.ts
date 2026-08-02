import { Router } from 'express';
import { getDoctors, registerDoctorProfile } from '../controllers/doctor.controller';

const router = Router();

router.get('/', getDoctors);
router.post('/profile', registerDoctorProfile);

export default router;
