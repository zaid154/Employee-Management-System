import { Router } from 'express';
import {
  applyLeave,
  listLeaves,
  reviewLeave,
  cancelLeave,
  leaveBalance,
} from '../controllers/leave.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { applyLeaveSchema, reviewLeaveSchema } from '../validators/schemas.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(requireAuth);

router.get('/', listLeaves);
router.get('/balance', leaveBalance);
router.post('/', validate(applyLeaveSchema), applyLeave);
router.patch('/:id/review', requireRole(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER), validate(reviewLeaveSchema), reviewLeave);
router.patch('/:id/cancel', cancelLeave);

export default router;
