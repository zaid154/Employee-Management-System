import { Router } from 'express';
import authRoutes from './auth.routes.js';
import employeeRoutes from './employee.routes.js';
import departmentRoutes from './department.routes.js';
import attendanceRoutes from './attendance.routes.js';
import leaveRoutes from './leave.routes.js';
import payrollRoutes from './payroll.routes.js';
import performanceRoutes from './performance.routes.js';
import announcementRoutes from './announcement.routes.js';
import holidayRoutes from './holiday.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', service: 'ems-payroll-api' }));

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/performance', performanceRoutes);
router.use('/announcements', announcementRoutes);
router.use('/holidays', holidayRoutes);
router.use('/', dashboardRoutes); // /dashboard + /reports/*

export default router;
