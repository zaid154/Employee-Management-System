import { asyncHandler } from '../utils/asyncHandler.js';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { Payroll } from '../models/Payroll.js';
import { MONTH_NAMES } from '../utils/dates.js';

/** GET /api/reports/headcount — headcount by department, status, and type. */
export const headcountReport = asyncHandler(async (_req, res) => {
  const [byDepartment, byType, byStatus, genderSplit] = await Promise.all([
    Employee.aggregate([
      { $match: { status: { $nin: ['resigned', 'terminated'] } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'd' } },
      { $unwind: { path: '$d', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, label: '$d.name', count: 1 } },
      { $sort: { count: -1 } },
    ]),
    Employee.aggregate([
      { $group: { _id: '$employmentType', count: { $sum: 1 } } },
      { $project: { _id: 0, label: '$_id', count: 1 } },
    ]),
    Employee.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, label: '$_id', count: 1 } },
    ]),
    Employee.aggregate([
      { $match: { gender: { $ne: '' } } },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
      { $project: { _id: 0, label: '$_id', count: 1 } },
    ]),
  ]);

  res.json({ success: true, data: { byDepartment, byType, byStatus, genderSplit } });
});

/** GET /api/reports/attendance?year= — company-wide attendance trend by month. */
export const attendanceReport = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const rows = await Attendance.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { month: { $month: '$date' }, status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Shape into one row per month with per-status counts.
  const months = MONTH_NAMES.map((name, i) => ({
    month: name.slice(0, 3),
    present: 0,
    absent: 0,
    late: 0,
    'on-leave': 0,
    'half-day': 0,
    _index: i + 1,
  }));
  rows.forEach((r) => {
    const row = months[r._id.month - 1];
    if (row && row[r._id.status] !== undefined) row[r._id.status] = r.count;
  });

  res.json({ success: true, data: months.map(({ _index, ...m }) => m) });
});

/** GET /api/reports/payroll?year= — monthly payroll cost trend. */
export const payrollReport = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();

  const rows = await Payroll.aggregate([
    { $match: { year } },
    {
      $group: {
        _id: '$month',
        net: { $sum: '$netPay' },
        gross: { $sum: '$grossEarnings' },
        deductions: { $sum: '$totalDeductions' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byMonth = MONTH_NAMES.map((name, i) => {
    const found = rows.find((r) => r._id === i + 1);
    return {
      month: name.slice(0, 3),
      net: found?.net || 0,
      gross: found?.gross || 0,
      deductions: found?.deductions || 0,
      count: found?.count || 0,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({ net: acc.net + r.net, gross: acc.gross + r.gross, deductions: acc.deductions + r.deductions }),
    { net: 0, gross: 0, deductions: 0 }
  );

  res.json({ success: true, data: { byMonth, totals } });
});

/** GET /api/reports/leaves?year= — leave usage by type and status. */
export const leaveReport = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const [byType, byStatus] = await Promise.all([
    Leave.aggregate([
      { $match: { startDate: { $gte: start, $lte: end } } },
      { $group: { _id: '$type', days: { $sum: '$days' }, count: { $sum: 1 } } },
      { $project: { _id: 0, label: '$_id', days: 1, count: 1 } },
      { $sort: { days: -1 } },
    ]),
    Leave.aggregate([
      { $match: { startDate: { $gte: start, $lte: end } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, label: '$_id', count: 1 } },
    ]),
  ]);

  res.json({ success: true, data: { byType, byStatus } });
});
