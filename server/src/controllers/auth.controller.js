import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { signToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Department } from '../models/Department.js';
import { ROLES } from '../utils/constants.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'employee', designation = 'Associate', departmentName = 'General' } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.badRequest('An account with this email address already exists');
  }

  // Check if an existing employee record with this email exists
  let employee = await Employee.findOne({ email: normalizedEmail });

  if (!employee && role !== ROLES.ADMIN) {
    // Find or create a default department
    let dept = await Department.findOne({ code: 'GEN' });
    if (!dept) {
      dept = await Department.findOne();
      if (!dept) {
        dept = await Department.create({
          name: departmentName || 'General Administration',
          code: 'GEN',
          description: 'General organization department',
        });
      }
    }

    const count = await Employee.countDocuments();
    const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || 'Team';
    const lastName = nameParts.slice(1).join(' ') || 'Member';

    employee = await Employee.create({
      employeeId,
      firstName,
      lastName,
      email: normalizedEmail,
      designation: designation || 'Associate',
      department: dept._id,
      employmentType: 'full-time',
      status: 'active',
      dateOfJoining: new Date(),
    });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: role || ROLES.EMPLOYEE,
    employee: employee ? employee._id : null,
  });

  if (employee) {
    employee.user = user._id;
    await employee.save();
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ sub: user._id, role: user.role });
  res.cookie('token', token, cookieOptions);

  const populatedUser = await User.findById(user._id).populate('employee');
  res.status(201).json({ success: true, token, user: populatedUser.toJSON() });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+password').populate('employee');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated');

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ sub: user._id, role: user.role });
  res.cookie('token', token, cookieOptions);

  res.json({ success: true, token, user: user.toJSON() });
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ success: true, message: 'Logged out' });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
});

/** PATCH /api/auth/password */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated' });
});
