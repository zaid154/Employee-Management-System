import { Router } from 'express';
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/department.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { departmentSchema } from '../validators/schemas.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(requireAuth);

router.get('/', listDepartments);
router.post('/', requireRole(ROLES.ADMIN, ROLES.HR), validate(departmentSchema), createDepartment);
router.patch('/:id', requireRole(ROLES.ADMIN, ROLES.HR), updateDepartment);
router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.HR), deleteDepartment);

export default router;
