import { Router } from 'express';
import {
  listReviews,
  getReview,
  createReview,
  updateReview,
  acknowledgeReview,
  deleteReview,
} from '../controllers/performance.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { performanceSchema } from '../validators/schemas.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(requireAuth);

const reviewer = requireRole(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER);

router.get('/', listReviews);
router.get('/:id', getReview);
router.post('/', reviewer, validate(performanceSchema), createReview);
router.patch('/:id', reviewer, updateReview);
router.patch('/:id/acknowledge', acknowledgeReview);
router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.HR), deleteReview);

export default router;
