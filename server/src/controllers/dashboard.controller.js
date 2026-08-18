import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Employee } from '../models/Employee.js';
import { Department } from '../models/Department.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { Payroll } from '../models/Payroll.js';
import { Holiday } from '../models/Holiday.js';
import { startOfDay, endOfDay } from '../utils/dates.js';
import { isPrivileged, ownEmployeeId } from '../utils/access.js';

/** GET /api/dashboard — role-aware summary widgets. */
export const dashboard = asyncHandler(async (req, res) => {
  const today = startOfDay(new Date());
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (isPrivileged(req.user) || req.user.role === 'manager') {
    const [
      totalEmployees,
      activeEmployees,
      departments,
      pendingLeaves,
      onLeaveToday,
      presentToday,
      payrollAgg,
      byDepartment,
      byStatus,
      recentHires,
      upcomingHolidays,
    ] = await Promise.all([
      Employee.countDocuments({ status: { $nin: ['resigned', 'terminated'] } }),
      Employee.countDocuments({ status: 'active' }),
      Department.countDocuments(),
      Leave.countDocuments({ status: 'pending' }),
      Attendance.countDocuments({ date: today, status: 'on-leave' }),
      Attendance.countDocuments({ date: today, status: { $in: ['present', 'late', 'half-day'] } }),
      Payroll.aggregate([
        { $match: { month, year } },
        { $group: { _id: null, net: { $sum: '$netPay' }, count: { $sum: 1 } } },
      ]),
      Employee.aggregate([
        { $match: { status: { $nin: ['resigned', 'terminated'] } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, name: '$dept.name', count: 1 } },
        { $sort: { count: -1 } },
      ]),
      Employee.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Employee.find({ status: { $nin: ['resigned', 'terminated'] } })
        .sort('-dateOfJoining')
        .limit(5)
        .populate('department', 'name')
        .select('firstName lastName employeeId designation avatar dateOfJoining department')
        .lean({ virtuals: true }),
      Holiday.find({ date: { $gte: today } }).sort('date').limit(4).lean(),
    ]);

    return res.json({
      success: true,
      role: req.user.role,
      data: {
        stats: {
          totalEmployees,
          activeEmployees,
          departments,
          pendingLeaves,
          onLeaveToday,
          presentToday,
          attendanceRate: totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0,
          monthlyPayroll: payrollAgg[0]?.net || 0,
          payslipsThisMonth: payrollAgg[0]?.count || 0,
        },
        byDepartment,
        byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
        recentHires,
        upcomingHolidays,
      },
    });
  }

  // ---- Employee self-service dashboard ----
  const employeeId = ownEmployeeId(req.user);
  const monthStart = startOfDay(new Date(year, month - 1, 1));
  const monthEnd = endOfDay(new Date(year, month, 0));

  const [employee, todayAttendance, attendanceRows, pendingLeaves, recentPayslips, upcomingHolidays] =
    await Promise.all([
      Employee.findById(employeeId).select('leaveBalance firstName lastName designation salary').lean(),
      Attendance.findOne({ employee: employeeId, date: today }).lean(),
      Attendance.aggregate([
        { $match: { employee: employee_idSafe(employeeId), date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Leave.countDocuments({ employee: employeeId, status: 'pending' }),
      Payroll.find({ employee: employeeId }).sort('-year -month').limit(3).lean(),
      Holiday.find({ date: { $gte: today } }).sort('date').limit(4).lean(),
    ]);

  const attendance = Object.fromEntries(attendanceRows.map((r) => [r._id, r.count]));

  res.json({
    success: true,
    role: req.user.role,
    data: {
      employee,
      leaveBalance: employee?.leaveBalance || {},
      todayAttendance,
      monthlyAttendance: {
        present: attendance.present || 0,
        late: attendance.late || 0,
        absent: attendance.absent || 0,
        onLeave: attendance['on-leave'] || 0,
      },
      pendingLeaves,
      recentPayslips,
      upcomingHolidays,
    },
  });
});

function employee_idSafe(id) {
  return mongoose.Types.ObjectId.createFromHexString(String(id));
}
