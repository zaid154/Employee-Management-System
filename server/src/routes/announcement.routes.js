import { Router } from 'express';
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { announcementSchema } from '../validators/schemas.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(requireAuth);

const hrOnly = requireRole(ROLES.ADMIN, ROLES.HR);

router.get('/', listAnnouncements);
router.post('/', hrOnly, validate(announcementSchema), createAnnouncement);
router.patch('/:id', hrOnly, updateAnnouncement);
router.delete('/:id', hrOnly, deleteAnnouncement);

export default router;
