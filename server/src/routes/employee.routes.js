import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  employeeOptions,
} from '../controllers/employee.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/schemas.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(requireAuth);

router.get('/', listEmployees);
router.get('/options', employeeOptions);
router.get('/:id', getEmployee);
router.post('/', requireRole(ROLES.ADMIN, ROLES.HR), validate(createEmployeeSchema), createEmployee);
router.patch('/:id', requireRole(ROLES.ADMIN, ROLES.HR), validate(updateEmployeeSchema), updateEmployee);
router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.HR), deleteEmployee);

export default router;
