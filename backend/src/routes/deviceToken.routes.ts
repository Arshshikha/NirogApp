import { Router } from 'express';
import { saveDeviceToken } from '../controllers/deviceToken.controller';

const router = Router();

router.post('/', saveDeviceToken);

export default router;
