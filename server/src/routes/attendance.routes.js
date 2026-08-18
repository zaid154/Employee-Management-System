import { Router } from 'express';
import {
  checkIn,
  checkOut,
  myToday,
  listAttendance,
  markAttendance,
  attendanceSummary,
} from '../controllers/attendance.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { markAttendanceSchema } from '../validators/schemas.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(requireAuth);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', myToday);
router.get('/summary', attendanceSummary);
router.get('/', listAttendance);
router.post('/mark', requireRole(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER), validate(markAttendanceSchema), markAttendance);

export default router;
