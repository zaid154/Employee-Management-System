import { Router } from 'express';
import { dashboard } from '../controllers/dashboard.controller.js';
import {
  headcountReport,
  attendanceReport,
  payrollReport,
  leaveReport,
} from '../controllers/report.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(requireAuth);

router.get('/dashboard', dashboard);

// Reports are for management only.
const management = requireRole(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER);
router.get('/reports/headcount', management, headcountReport);
router.get('/reports/attendance', management, attendanceReport);
router.get('/reports/payroll', requireRole(ROLES.ADMIN, ROLES.HR), payrollReport);
router.get('/reports/leaves', management, leaveReport);

export default router;
