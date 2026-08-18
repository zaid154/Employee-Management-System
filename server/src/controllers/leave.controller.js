import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Leave } from '../models/Leave.js';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { workingDaysBetween, startOfDay } from '../utils/dates.js';
import { scopeToEmployees, ownEmployeeId, isPrivileged } from '../utils/access.js';
import { ROLES } from '../utils/constants.js';

/** POST /api/leaves — apply for leave (self by default, HR can pass employee). */
export const applyLeave = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, halfDay, reason } = req.body;
  let employeeId = req.body.employee;

  // Only privileged users may file on someone else's behalf.
  if (!employeeId || !isPrivileged(req.user)) employeeId = ownEmployeeId(req.user);
  if (!employeeId) throw ApiError.badRequest('Your account is not linked to an employee record');

  const employee = await Employee.findById(employeeId);
  if (!employee) throw ApiError.notFound('Employee not found');

  const days = halfDay ? 0.5 : workingDaysBetween(startDate, endDate);
  if (days <= 0) throw ApiError.badRequest('Selected range has no working days');

  // Warn early if there is not enough balance for a paid leave type.
  const balance = employee.leaveBalance?.get(type) ?? 0;
  if (type !== 'unpaid' && days > balance) {
    throw ApiError.badRequest(`Insufficient ${type} leave balance (available: ${balance} day(s))`);
  }

  const leave = await Leave.create({
    employee: employeeId,
    type,
    startDate: startOfDay(startDate),
    endDate: startOfDay(endDate),
    days,
    halfDay,
    reason,
  });

  res.status(201).json({ success: true, data: leave });
});

/** GET /api/leaves — access-scoped list with optional status/type filters. */
export const listLeaves = asyncHandler(async (req, res) => {
  const { status, type, employee, page = 1, limit = 15 } = req.query;
  const filter = await scopeToEmployees(req.user);
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (employee && isPrivileged(req.user)) filter.employee = employee;

  const pageNum = Math.max(1, Number(page));
  const perPage = Math.min(100, Number(limit));

  const [items, total] = await Promise.all([
    Leave.find(filter)
      .populate('employee', 'firstName lastName employeeId avatar department')
      .populate('reviewedBy', 'name')
      .sort('-createdAt')
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean(),
    Leave.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: perPage, total, pages: Math.ceil(total / perPage) },
  });
});

/** PATCH /api/leaves/:id/review — approve or reject (HR / manager). */
export const reviewLeave = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  const leave = await Leave.findById(req.params.id).populate('employee');
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (leave.status !== 'pending') throw ApiError.badRequest('This request has already been reviewed');

  // A manager may only review their own team's requests.
  if (req.user.role === ROLES.MANAGER) {
    const isReport = String(leave.employee.manager) === String(ownEmployeeId(req.user));
    if (!isReport) throw ApiError.forbidden('You can only review your team members');
  }

  if (status === 'approved') {
    const employee = leave.employee;
    if (leave.type !== 'unpaid') {
      const balance = employee.leaveBalance?.get(leave.type) ?? 0;
      if (leave.days > balance) throw ApiError.badRequest('Employee no longer has enough balance');
      employee.leaveBalance.set(leave.type, balance - leave.days);
      await employee.save();
    }
    // Reflect the approved leave on the attendance calendar.
    await markLeaveDays(employee._id, leave.startDate, leave.endDate, req.user._id);
  }

  leave.status = status;
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  leave.reviewNote = reviewNote || '';
  await leave.save();

  res.json({ success: true, data: leave });
});

/** PATCH /api/leaves/:id/cancel — employee cancels their own request. */
export const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id).populate('employee');
  if (!leave) throw ApiError.notFound('Leave request not found');

  const isOwner = String(leave.employee._id) === String(ownEmployeeId(req.user));
  if (!isOwner && !isPrivileged(req.user)) throw ApiError.forbidden();
  if (['cancelled', 'rejected'].includes(leave.status)) {
    throw ApiError.badRequest('This request cannot be cancelled');
  }

  // Restore balance if it had already been approved.
  if (leave.status === 'approved' && leave.type !== 'unpaid') {
    const employee = leave.employee;
    const balance = employee.leaveBalance?.get(leave.type) ?? 0;
    employee.leaveBalance.set(leave.type, balance + leave.days);
    await employee.save();
    await Attendance.deleteMany({
      employee: employee._id,
      date: { $gte: leave.startDate, $lte: leave.endDate },
      status: 'on-leave',
    });
  }

  leave.status = 'cancelled';
  await leave.save();
  res.json({ success: true, data: leave });
});

/** GET /api/leaves/balance — remaining balance for an employee. */
export const leaveBalance = asyncHandler(async (req, res) => {
  const employeeId = req.query.employee && isPrivileged(req.user) ? req.query.employee : ownEmployeeId(req.user);
  if (!employeeId) throw ApiError.badRequest('employee is required');

  const employee = await Employee.findById(employeeId).select('leaveBalance').lean();
  if (!employee) throw ApiError.notFound('Employee not found');

  res.json({ success: true, data: employee.leaveBalance || {} });
});

/** Mark each working day of an approved leave as 'on-leave'. */
async function markLeaveDays(employeeId, start, end, markedBy) {
  const cursor = startOfDay(start);
  const last = startOfDay(end);
  const ops = [];
  while (cursor <= last) {
    const day = new Date(cursor);
    ops.push({
      updateOne: {
        filter: { employee: employeeId, date: day },
        update: { $set: { status: 'on-leave', markedBy } },
        upsert: true,
      },
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  if (ops.length) await Attendance.bulkWrite(ops);
}
