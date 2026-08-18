import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Payroll } from '../models/Payroll.js';
import { Employee } from '../models/Employee.js';
import { computePayslip } from '../services/payroll.service.js';
import { scopeToEmployees, ownEmployeeId, isPrivileged } from '../utils/access.js';

/**
 * POST /api/payroll/generate — generate (or regenerate) payslips for a month.
 * Runs for one employee if `employee` is supplied, otherwise for all active staff.
 * Existing *draft* slips are overwritten; already-paid slips are left untouched.
 */
export const generatePayroll = asyncHandler(async (req, res) => {
  const { month, year, employee, bonus, tax, otherDeductions } = req.body;

  const query = employee
    ? { _id: employee }
    : { status: { $nin: ['resigned', 'terminated'] } };
  const employees = await Employee.find(query);
  if (!employees.length) throw ApiError.badRequest('No matching employees to run payroll for');

  const results = [];
  let skipped = 0;

  for (const emp of employees) {
    const existing = await Payroll.findOne({ employee: emp._id, month, year });
    if (existing && existing.status === 'paid') {
      skipped += 1;
      continue;
    }

    const breakdown = await computePayslip(emp, { month, year, bonus, tax, otherDeductions });
    const doc = await Payroll.findOneAndUpdate(
      { employee: emp._id, month, year },
      { $set: { ...breakdown, status: 'processed', generatedBy: req.user._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    results.push(doc);
  }

  res.json({
    success: true,
    message: `Generated ${results.length} payslip(s)${skipped ? `, skipped ${skipped} already paid` : ''}`,
    data: results,
  });
});

/** GET /api/payroll — access-scoped payslip list. */
export const listPayroll = asyncHandler(async (req, res) => {
  const { month, year, status, employee, page = 1, limit = 20 } = req.query;
  const filter = await scopeToEmployees(req.user);
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  if (status) filter.status = status;
  if (employee && isPrivileged(req.user)) filter.employee = employee;

  const pageNum = Math.max(1, Number(page));
  const perPage = Math.min(100, Number(limit));

  const [items, total, totals] = await Promise.all([
    Payroll.find(filter)
      .populate('employee', 'firstName lastName employeeId avatar designation')
      .sort('-year -month')
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean(),
    Payroll.countDocuments(filter),
    Payroll.aggregate([
      { $match: filter },
      { $group: { _id: null, net: { $sum: '$netPay' }, gross: { $sum: '$grossEarnings' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: items,
    totals: totals[0] || { net: 0, gross: 0 },
    pagination: { page: pageNum, limit: perPage, total, pages: Math.ceil(total / perPage) },
  });
});

/** GET /api/payroll/:id — a single payslip (access-checked). */
export const getPayslip = asyncHandler(async (req, res) => {
  const slip = await Payroll.findById(req.params.id).populate(
    'employee',
    'firstName lastName employeeId designation department bank salary'
  );
  if (!slip) throw ApiError.notFound('Payslip not found');

  if (!isPrivileged(req.user)) {
    if (String(slip.employee._id) !== String(ownEmployeeId(req.user)) && req.user.role !== 'manager') {
      throw ApiError.forbidden();
    }
  }
  res.json({ success: true, data: slip });
});

/** PATCH /api/payroll/:id — adjust a draft/processed slip and recompute totals. */
export const updatePayslip = asyncHandler(async (req, res) => {
  const slip = await Payroll.findById(req.params.id);
  if (!slip) throw ApiError.notFound('Payslip not found');
  if (slip.status === 'paid') throw ApiError.badRequest('A paid payslip cannot be edited');

  const { bonus, overtimePay, tax, otherDeductions, note } = req.body;
  if (bonus != null) slip.bonus = bonus;
  if (overtimePay != null) slip.overtimePay = overtimePay;
  if (tax != null) slip.tax = tax;
  if (otherDeductions != null) slip.otherDeductions = otherDeductions;
  if (note != null) slip.note = note;

  // Recompute derived totals.
  slip.grossEarnings = slip.basic + slip.hra + slip.allowances + slip.bonus + slip.overtimePay;
  slip.totalDeductions = slip.pf + slip.professionalTax + slip.tax + slip.lopDeduction + slip.otherDeductions;
  slip.netPay = Math.max(0, slip.grossEarnings - slip.totalDeductions);
  await slip.save();

  res.json({ success: true, data: slip });
});

/** PATCH /api/payroll/:id/pay — mark a payslip as paid. */
export const markPaid = asyncHandler(async (req, res) => {
  const slip = await Payroll.findByIdAndUpdate(
    req.params.id,
    { $set: { status: 'paid', paidAt: new Date() } },
    { new: true }
  );
  if (!slip) throw ApiError.notFound('Payslip not found');
  res.json({ success: true, data: slip });
});

/** DELETE /api/payroll/:id — remove a non-paid payslip. */
export const deletePayslip = asyncHandler(async (req, res) => {
  const slip = await Payroll.findById(req.params.id);
  if (!slip) throw ApiError.notFound('Payslip not found');
  if (slip.status === 'paid') throw ApiError.badRequest('A paid payslip cannot be deleted');
  await slip.deleteOne();
  res.json({ success: true, message: 'Payslip deleted' });
});
