import { Router } from 'express';
import {
  listHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../controllers/holiday.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { holidaySchema } from '../validators/schemas.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(requireAuth);

const hrOnly = requireRole(ROLES.ADMIN, ROLES.HR);

router.get('/', listHolidays);
router.post('/', hrOnly, validate(holidaySchema), createHoliday);
router.patch('/:id', hrOnly, updateHoliday);
router.delete('/:id', hrOnly, deleteHoliday);

export default router;
