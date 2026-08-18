import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Attendance } from '../models/Attendance.js';
import { startOfDay, endOfDay } from '../utils/dates.js';
import { scopeToEmployees, ownEmployeeId, isPrivileged } from '../utils/access.js';

const WORK_DAY_HOURS = 9; // scheduled hours; anything less on check-in past 9:30 => late

/** POST /api/attendance/check-in — self check-in for today. */
export const checkIn = asyncHandler(async (req, res) => {
  const employeeId = ownEmployeeId(req.user);
  if (!employeeId) throw ApiError.badRequest('Your account is not linked to an employee record');

  const today = startOfDay(new Date());
  const now = new Date();

  let record = await Attendance.findOne({ employee: employeeId, date: today });
  if (record?.checkIn) throw ApiError.badRequest('You have already checked in today');

  // Late if checking in after 09:30.
  const lateThreshold = new Date(today);
  lateThreshold.setHours(9, 30, 0, 0);
  const status = now > lateThreshold ? 'late' : 'present';

  record = await Attendance.findOneAndUpdate(
    { employee: employeeId, date: today },
    { $set: { checkIn: now, status, markedBy: req.user._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, data: record });
});

/** POST /api/attendance/check-out — self check-out for today. */
export const checkOut = asyncHandler(async (req, res) => {
  const employeeId = ownEmployeeId(req.user);
  if (!employeeId) throw ApiError.badRequest('Your account is not linked to an employee record');

  const today = startOfDay(new Date());
  const record = await Attendance.findOne({ employee: employeeId, date: today });
  if (!record?.checkIn) throw ApiError.badRequest('Please check in before checking out');
  if (record.checkOut) throw ApiError.badRequest('You have already checked out today');

  const now = new Date();
  const workHours = Math.round(((now - record.checkIn) / 3600000) * 100) / 100;
  record.checkOut = now;
  record.workHours = workHours;
  if (workHours < WORK_DAY_HOURS / 2) record.status = 'half-day';
  await record.save();

  res.json({ success: true, data: record });
});

/** GET /api/attendance/today — the caller's status for today. */
export const myToday = asyncHandler(async (req, res) => {
  const employeeId = ownEmployeeId(req.user);
  if (!employeeId) return res.json({ success: true, data: null });
  const record = await Attendance.findOne({ employee: employeeId, date: startOfDay(new Date()) }).lean();
  res.json({ success: true, data: record });
});

/** GET /api/attendance — list with date-range + employee filters (access-scoped). */
export const listAttendance = asyncHandler(async (req, res) => {
  const { employee, from, to, status, page = 1, limit = 31 } = req.query;
  const filter = await scopeToEmployees(req.user);

  if (employee) {
    // Ensure the requested employee is within the caller's scope.
    if (filter.employee && String(filter.employee) !== String(employee)) throw ApiError.forbidden();
    if (filter.employee?.$in && !filter.employee.$in.map(String).includes(String(employee))) {
      throw ApiError.forbidden();
    }
    filter.employee = employee;
  }
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = startOfDay(from);
    if (to) filter.date.$lte = endOfDay(to);
  }

  const pageNum = Math.max(1, Number(page));
  const perPage = Math.min(100, Number(limit));

  const [items, total] = await Promise.all([
    Attendance.find(filter)
      .populate('employee', 'firstName lastName employeeId avatar')
      .sort('-date')
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean(),
    Attendance.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: perPage, total, pages: Math.ceil(total / perPage) },
  });
});

/** POST /api/attendance/mark — HR marks/edits an employee's attendance. */
export const markAttendance = asyncHandler(async (req, res) => {
  const { employee, date, status, checkIn, checkOut, note } = req.body;
  const day = startOfDay(date);

  let workHours = 0;
  if (checkIn && checkOut) workHours = Math.round(((new Date(checkOut) - new Date(checkIn)) / 3600000) * 100) / 100;

  const record = await Attendance.findOneAndUpdate(
    { employee, date: day },
    { $set: { status, checkIn: checkIn || null, checkOut: checkOut || null, workHours, note, markedBy: req.user._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate('employee', 'firstName lastName employeeId');

  res.json({ success: true, data: record });
});

/** GET /api/attendance/summary — monthly counts for one employee. */
export const attendanceSummary = asyncHandler(async (req, res) => {
  const { employee, month, year } = req.query;
  const employeeId = employee || ownEmployeeId(req.user);
  if (!employeeId) throw ApiError.badRequest('employee is required');

  // Non-privileged users may only summarise themselves.
  if (!isPrivileged(req.user) && req.user.role !== 'manager' && String(employeeId) !== String(ownEmployeeId(req.user))) {
    throw ApiError.forbidden();
  }

  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year) || new Date().getFullYear();
  const start = startOfDay(new Date(y, m - 1, 1));
  const end = endOfDay(new Date(y, m, 0));

  const rows = await Attendance.aggregate([
    { $match: { employee: mongoose.Types.ObjectId.createFromHexString(String(employeeId)), date: { $gte: start, $lte: end } } },
    { $group: { _id: '$status', count: { $sum: 1 }, hours: { $sum: '$workHours' } } },
  ]);

  const summary = { present: 0, absent: 0, late: 0, 'half-day': 0, 'on-leave': 0, holiday: 0, weekend: 0, totalHours: 0 };
  rows.forEach((r) => {
    summary[r._id] = r.count;
    summary.totalHours += r.hours || 0;
  });
  summary.totalHours = Math.round(summary.totalHours * 100) / 100;

  res.json({ success: true, data: { month: m, year: y, ...summary } });
});
