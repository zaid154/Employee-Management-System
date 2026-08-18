import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { DEFAULT_LEAVE_BALANCE, ROLES } from '../utils/constants.js';
import { isPrivileged, ownEmployeeId, teamEmployeeIds } from '../utils/access.js';

/** Generate the next sequential employee id, e.g. EMP0007. */
async function nextEmployeeId() {
  const last = await Employee.findOne({ employeeId: /^EMP\d+$/ })
    .sort({ employeeId: -1 })
    .select('employeeId')
    .lean();
  const lastNum = last ? parseInt(last.employeeId.replace('EMP', ''), 10) : 0;
  return `EMP${String(lastNum + 1).padStart(4, '0')}`;
}

/** GET /api/employees — list with search, filters, pagination. */
export const listEmployees = asyncHandler(async (req, res) => {
  const { search, department, status, page = 1, limit = 12, sort = '-createdAt' } = req.query;
  const filter = {};

  // Scope: managers see their team; employees see only themselves.
  if (!isPrivileged(req.user)) {
    if (req.user.role === ROLES.MANAGER) {
      filter._id = { $in: await teamEmployeeIds(req.user) };
    } else {
      filter._id = ownEmployeeId(req.user);
    }
  }

  if (search) filter.$text = { $search: search };
  if (department) filter.department = department;
  if (status) filter.status = status;

  const pageNum = Math.max(1, Number(page));
  const perPage = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Employee.find(filter)
      .populate('department', 'name code')
      .populate('manager', 'firstName lastName employeeId')
      .sort(sort)
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean({ virtuals: true }),
    Employee.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: perPage, total, pages: Math.ceil(total / perPage) },
  });
});

/** GET /api/employees/:id */
export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('department', 'name code')
    .populate('manager', 'firstName lastName employeeId avatar')
    .populate('user', 'email role isActive lastLoginAt')
    .lean({ virtuals: true });
  if (!employee) throw ApiError.notFound('Employee not found');

  // Access control: employees can only view themselves, managers their team.
  if (!isPrivileged(req.user)) {
    const allowed =
      req.user.role === ROLES.MANAGER
        ? (await teamEmployeeIds(req.user)).includes(String(employee._id))
        : ownEmployeeId(req.user) === String(employee._id);
    if (!allowed) throw ApiError.forbidden();
  }

  res.json({ success: true, data: employee });
});

/** POST /api/employees */
export const createEmployee = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  const { createAccount, role, password, ...employeeData } = body;

  const dept = await Department.findById(employeeData.department);
  if (!dept) throw ApiError.badRequest('Selected department does not exist');

  if (!employeeData.employeeId) employeeData.employeeId = await nextEmployeeId();
  employeeData.leaveBalance = new Map(Object.entries(DEFAULT_LEAVE_BALANCE));

  const employee = await Employee.create(employeeData);

  // Optionally create a login account tied to this employee.
  if (createAccount) {
    if (!password) {
      await employee.deleteOne();
      throw ApiError.badRequest('A password is required to create a login account');
    }
    const existing = await User.findOne({ email: employee.email });
    if (existing) {
      await employee.deleteOne();
      throw ApiError.conflict('A user account with that email already exists');
    }
    const user = await User.create({
      name: employee.fullName,
      email: employee.email,
      password,
      role: role || ROLES.EMPLOYEE,
      employee: employee._id,
    });
    employee.user = user._id;
    await employee.save();
  }

  const populated = await employee.populate('department', 'name code');
  res.status(201).json({ success: true, data: populated });
});

/** PATCH /api/employees/:id */
export const updateEmployee = asyncHandler(async (req, res) => {
  // These are managed through dedicated flows, not the generic update.
  const { createAccount, role, password, leaveBalance, ...updates } = req.body;

  const employee = await Employee.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('department', 'name code');
  if (!employee) throw ApiError.notFound('Employee not found');

  // Keep the linked user's display name/email in sync.
  if (employee.user && (updates.firstName || updates.lastName || updates.email)) {
    await User.findByIdAndUpdate(employee.user, {
      name: employee.fullName,
      ...(updates.email ? { email: employee.email } : {}),
    });
  }

  res.json({ success: true, data: employee });
});

/** DELETE /api/employees/:id — also removes the linked login account. */
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw ApiError.notFound('Employee not found');

  if (employee.user) await User.findByIdAndDelete(employee.user);
  await employee.deleteOne();

  res.json({ success: true, message: 'Employee removed' });
});

/** GET /api/employees/options — light list for dropdowns. */
export const employeeOptions = asyncHandler(async (_req, res) => {
  const employees = await Employee.find({ status: { $nin: ['resigned', 'terminated'] } })
    .select('firstName lastName employeeId designation')
    .sort('firstName')
    .lean({ virtuals: true });
  res.json({ success: true, data: employees });
});
