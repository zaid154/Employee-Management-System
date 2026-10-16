import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { DEFAULT_LEAVE_BALANCE, ROLES } from '../utils/constants.js';
import { isPrivileged, ownEmployeeId, teamEmployeeIds } from '../utils/access.js';
import { sendApprovalEmail } from '../services/email.service.js';
import {
  uploadAvatarToCloudinary,
  uploadDocumentToCloudinary,
  deleteMediaFromCloudinary,
} from '../services/cloudinary.service.js';

export async function nextEmployeeId() {
  const last = await Employee.findOne({ employeeId: /^EMP\d+$/ })
    .sort({ employeeId: -1 })
    .select('employeeId')
    .lean();
  const lastNum = last ? parseInt(last.employeeId.replace('EMP', ''), 10) : 0;
  return `EMP${String(lastNum + 1).padStart(4, '0')}`;
}

function checkOwnerOrPrivileged(employee, user) {
  const isOwner = String(employee._id) === String(ownEmployeeId(user));
  if (!isPrivileged(user) && !isOwner) throw ApiError.forbidden();
  return isOwner;
}

/** GET /api/employees — list with search, filters, pagination. */
export const listEmployees = asyncHandler(async (req, res) => {
  const { search, department, status, page = 1, limit = 12, sort = '-createdAt' } = req.query;
  const filter = {};

  if (!isPrivileged(req.user)) {
    filter._id = req.user.role === ROLES.MANAGER
      ? { $in: await teamEmployeeIds(req.user) }
      : ownEmployeeId(req.user);
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

  if (!isPrivileged(req.user)) {
    const ownId = String(ownEmployeeId(req.user));
    items.forEach((item) => {
      if (String(item._id) !== ownId && item.bank?.accountNumber) {
        item.bank.accountNumber = `****${item.bank.accountNumber.slice(-4)}`;
      }
    });
  }

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
    .populate('user', 'email role isActive status lastLoginAt')
    .populate('documents.verifiedBy', 'name role')
    .lean({ virtuals: true });
  if (!employee) throw ApiError.notFound('Employee not found');

  if (!isPrivileged(req.user)) {
    const allowed = req.user.role === ROLES.MANAGER
      ? (await teamEmployeeIds(req.user)).includes(String(employee._id))
      : ownEmployeeId(req.user) === String(employee._id);
    if (!allowed) throw ApiError.forbidden();
  }

  const isOwner = String(employee._id) === String(ownEmployeeId(req.user));
  if (!isPrivileged(req.user) && !isOwner) {
    delete employee.salary;
    if (employee.bank?.accountNumber) {
      employee.bank.accountNumber = `****${employee.bank.accountNumber.slice(-4)}`;
    }
  }

  res.json({ success: true, data: employee });
});

/** POST /api/employees */
export const createEmployee = asyncHandler(async (req, res) => {
  const { createAccount, role, password, ...employeeData } = req.body;

  const dept = await Department.findById(employeeData.department);
  if (!dept) throw ApiError.badRequest('Selected department does not exist');

  if (!employeeData.employeeId) employeeData.employeeId = await nextEmployeeId();
  employeeData.leaveBalance = new Map(Object.entries(DEFAULT_LEAVE_BALANCE));

  const employee = await Employee.create(employeeData);

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
      phone: employee.phone || '',
      password,
      role: role || ROLES.EMPLOYEE,
      employee: employee._id,
      isVerified: true,
      status: 'ACTIVE',
    });
    employee.user = user._id;
    await employee.save();
  }

  const populated = await employee.populate('department', 'name code');
  res.status(201).json({ success: true, data: populated });
});

/** PATCH /api/employees/:id */
export const updateEmployee = asyncHandler(async (req, res) => {
  const { createAccount, role, password, leaveBalance, ...updates } = req.body;

  const employee = await Employee.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('department', 'name code');
  if (!employee) throw ApiError.notFound('Employee not found');

  if (employee.user && (updates.firstName || updates.lastName || updates.email || updates.phone)) {
    await User.findByIdAndUpdate(employee.user, {
      name: employee.fullName,
      ...(updates.email ? { email: employee.email } : {}),
      ...(updates.phone ? { phone: updates.phone } : {}),
    });
  }

  res.json({ success: true, data: employee });
});

/** DELETE /api/employees/:id */
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw ApiError.notFound('Employee not found');

  if (employee.user) await User.findByIdAndDelete(employee.user);
  await employee.deleteOne();
  res.json({ success: true, message: 'Employee removed' });
});

/** GET /api/employees/options */
export const employeeOptions = asyncHandler(async (req, res) => {
  const filter = { status: { $nin: ['resigned', 'terminated'] } };
  if (!isPrivileged(req.user)) {
    filter._id = req.user.role === ROLES.MANAGER
      ? { $in: await teamEmployeeIds(req.user) }
      : ownEmployeeId(req.user);
  }

  const employees = await Employee.find(filter)
    .select('firstName lastName employeeId designation')
    .sort('firstName')
    .lean({ virtuals: true });
  res.json({ success: true, data: employees });
});

/** GET /api/employees/pending-registrations — Admin/HR only */
export const listPendingRegistrations = asyncHandler(async (_req, res) => {
  const pendingUsers = await User.find({ status: 'PENDING_ADMIN_APPROVAL' })
    .select('name email phone role status createdAt updatedAt')
    .sort('-updatedAt')
    .lean();
  res.json({ success: true, data: pendingUsers });
});

/** POST /api/employees/approve-registration/:id — Admin/HR only */
export const approveRegistration = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Registration request not found');
  if (user.status !== 'PENDING_ADMIN_APPROVAL') {
    throw ApiError.badRequest(`Cannot approve account in status "${user.status}"`);
  }

  const {
    role = ROLES.EMPLOYEE,
    employeeId,
    department,
    designation,
    employmentType = 'full-time',
    dateOfJoining = new Date(),
    salary,
    bank,
  } = req.body;

  const dept = await Department.findById(department);
  if (!dept) throw ApiError.badRequest('Selected department does not exist');

  const finalEmpId = employeeId || (await nextEmployeeId());
  const nameParts = (user.name || '').trim().split(' ');
  const firstName = nameParts[0] || 'Team';
  const lastName = nameParts.slice(1).join(' ') || 'Member';

  const employeeData = {
    employeeId: finalEmpId,
    firstName,
    lastName,
    email: user.email,
    phone: user.phone || '',
    designation,
    department: dept._id,
    employmentType,
    status: 'active',
    dateOfJoining,
    salary: salary || { basic: 0, hra: 0, allowances: 0, pf: 0, professionalTax: 0 },
    bank: bank || { accountName: '', accountNumber: '', bankName: '', ifsc: '' },
    user: user._id,
  };

  let employee = await Employee.findOne({ email: user.email });
  if (employee) {
    Object.assign(employee, employeeData);
    await employee.save();
  } else {
    employeeData.leaveBalance = new Map(Object.entries(DEFAULT_LEAVE_BALANCE));
    employee = await Employee.create(employeeData);
  }

  user.role = role;
  user.status = 'ACTIVE';
  user.employee = employee._id;
  user.rejectionReason = '';
  await user.save();

  console.log(`[ONBOARDING] User ${user.email} approved as ${user.role} (${employee.employeeId})`);
  await sendApprovalEmail(user.email, user.name, user.role);

  const populated = await Employee.findById(employee._id).populate('department', 'name code');
  res.json({
    success: true,
    message: `Account approved and ${user.name} onboarded as ${user.role}.`,
    data: populated,
  });
});

/** POST /api/employees/reject-registration/:id — Admin/HR only */
export const rejectRegistration = asyncHandler(async (req, res) => {
  const { reason = 'Application requirements not met' } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Registration request not found');

  user.status = 'REJECTED';
  user.rejectionReason = reason;
  await user.save();
  res.json({ success: true, message: 'Registration rejected successfully.' });
});

/** POST /api/employees/:id/avatar */
export const uploadAvatar = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw ApiError.notFound('Employee not found');
  checkOwnerOrPrivileged(employee, req.user);

  if (!req.file) throw ApiError.badRequest('No image file provided');
  const result = await uploadAvatarToCloudinary(req.file.buffer, req.file.originalname);

  if (employee.avatarPublicId) await deleteMediaFromCloudinary(employee.avatarPublicId);

  employee.avatar = result.url;
  employee.avatarPublicId = result.publicId;
  await employee.save();

  if (employee.user) {
    await User.findByIdAndUpdate(employee.user, { avatar: result.url, avatarPublicId: result.publicId });
  }

  res.json({ success: true, message: 'Avatar updated successfully', avatar: result.url });
});

/** POST /api/employees/:id/documents */
export const uploadDocument = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw ApiError.notFound('Employee not found');
  checkOwnerOrPrivileged(employee, req.user);

  if (!req.file) throw ApiError.badRequest('No document file provided');
  const { documentType = 'other', title } = req.body;
  const result = await uploadDocumentToCloudinary(req.file.buffer, req.file.originalname);

  employee.documents.push({
    documentType,
    title: title || req.file.originalname,
    fileName: req.file.originalname,
    fileUrl: result.url,
    filePublicId: result.publicId,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    status: 'pending',
    uploadedAt: new Date(),
  });
  await employee.save();

  res.status(201).json({
    success: true,
    message: 'Document uploaded for verification',
    data: employee.documents[employee.documents.length - 1],
  });
});

/** PATCH /api/employees/:id/documents/:docId/verify — Admin/HR only */
export const verifyDocument = asyncHandler(async (req, res) => {
  const { status, adminRemarks = '' } = req.body;
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw ApiError.notFound('Employee not found');

  const doc = employee.documents.id(req.params.docId);
  if (!doc) throw ApiError.notFound('Document item not found');

  doc.status = status;
  doc.adminRemarks = adminRemarks;
  doc.verifiedBy = req.user._id;
  doc.verifiedAt = new Date();
  await employee.save();

  res.json({ success: true, message: `Document status updated to "${status}"`, data: doc });
});

/** DELETE /api/employees/:id/documents/:docId */
export const deleteDocument = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw ApiError.notFound('Employee not found');
  checkOwnerOrPrivileged(employee, req.user);

  const doc = employee.documents.id(req.params.docId);
  if (!doc) throw ApiError.notFound('Document item not found');

  if (doc.filePublicId) await deleteMediaFromCloudinary(doc.filePublicId);

  doc.deleteOne();
  await employee.save();
  res.json({ success: true, message: 'Document removed successfully' });
});
