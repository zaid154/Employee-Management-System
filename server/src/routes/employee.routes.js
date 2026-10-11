import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  employeeOptions,
  listPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  uploadAvatar,
  uploadDocument,
  verifyDocument,
  deleteDocument,
} from '../controllers/employee.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  approveOnboardingSchema,
  rejectOnboardingSchema,
  verifyDocumentSchema,
} from '../validators/schemas.js';
import { ROLES } from '../utils/constants.js';
import { upload } from '../services/cloudinary.service.js';

const router = Router();
router.use(requireAuth);

// Pending Registrations & Onboarding (Must be placed before /:id)
router.get('/pending-registrations', requireRole(ROLES.ADMIN, ROLES.HR), listPendingRegistrations);
router.post(
  '/approve-registration/:id',
  requireRole(ROLES.ADMIN, ROLES.HR),
  validate(approveOnboardingSchema),
  approveRegistration
);
router.post(
  '/reject-registration/:id',
  requireRole(ROLES.ADMIN, ROLES.HR),
  validate(rejectOnboardingSchema),
  rejectRegistration
);

// Standard Employee Endpoints
router.get('/', listEmployees);
router.get('/options', employeeOptions);
router.get('/:id', getEmployee);
router.post('/', requireRole(ROLES.ADMIN, ROLES.HR), validate(createEmployeeSchema), createEmployee);
router.patch('/:id', requireRole(ROLES.ADMIN, ROLES.HR), validate(updateEmployeeSchema), updateEmployee);
router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.HR), deleteEmployee);

// Cloudinary Media & Document Endpoints
router.post('/:id/avatar', upload.single('avatar'), uploadAvatar);
router.post('/:id/documents', upload.single('document'), uploadDocument);
router.patch(
  '/:id/documents/:docId/verify',
  requireRole(ROLES.ADMIN, ROLES.HR),
  validate(verifyDocumentSchema),
  verifyDocument
);
router.delete('/:id/documents/:docId', deleteDocument);

export default router;
