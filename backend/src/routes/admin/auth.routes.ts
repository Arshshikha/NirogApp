import { Router } from 'express';
import { adminLogin } from '../../controllers/admin/auth.controller';

const router = Router();

router.post('/login', adminLogin);

export default router;
