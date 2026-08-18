import { Router } from 'express';
import {
  generatePayroll,
  listPayroll,
  getPayslip,
  updatePayslip,
  markPaid,
  deletePayslip,
} from '../controllers/payroll.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { generatePayrollSchema, updatePayrollSchema } from '../validators/schemas.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(requireAuth);

const hrOnly = requireRole(ROLES.ADMIN, ROLES.HR);

router.get('/', listPayroll);
router.get('/:id', getPayslip);
router.post('/generate', hrOnly, validate(generatePayrollSchema), generatePayroll);
router.patch('/:id', hrOnly, validate(updatePayrollSchema), updatePayslip);
router.patch('/:id/pay', hrOnly, markPaid);
router.delete('/:id', hrOnly, deletePayslip);

export default router;
