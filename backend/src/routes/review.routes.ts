import { Router } from 'express';
import { submitReview, getReviews } from '../controllers/review.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// GET /reviews - Get all reviews for a doctor or provider profile (Public)
router.get('/', getReviews);

// POST /reviews - Submit a rating and review (Authenticated Patients)
router.post('/', requireAuth, submitReview);

export default router;
