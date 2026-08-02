import { Router } from 'express';
import { createHubItem, getCourseDetails, getHubItems, getCourseStatus } from '../controllers/hub.controller';

const router = Router();

router.get('/', getHubItems);
router.post('/', createHubItem);
router.get('/courses/:courseId', getCourseDetails);
router.get('/courses/:courseId/status', getCourseStatus);

export default router;
