import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { signToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { ROLES } from '../utils/constants.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../services/email.service.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Generates a secure, readable 6-digit numeric OTP code
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedPhone = (phone || '').trim();

  // Enforce least-privileged default role. Public registration NEVER grants privileged roles.
  const defaultRole = ROLES.EMPLOYEE;

  const existingUser = await User.findOne({ email: normalizedEmail }).select(
    '+verificationCode +verificationExpires +otpAttempts +otpLastSentAt'
  );

  if (existingUser) {
    if (existingUser.isVerified && existingUser.status === 'ACTIVE') {
      throw ApiError.badRequest('An account with this corporate email already exists. Please sign in.');
    }
    if (existingUser.isVerified && existingUser.status === 'PENDING_ADMIN_APPROVAL') {
      return res.status(200).json({
        success: true,
        pendingApproval: true,
        email: normalizedEmail,
        message: 'Your email has already been verified and is currently awaiting Administrator review & onboarding.',
      });
    }

    // Cooldown check (60 seconds)
    if (existingUser.otpLastSentAt) {
      const elapsed = Date.now() - new Date(existingUser.otpLastSentAt).getTime();
      if (elapsed < 60000) {
        const remaining = Math.ceil((60000 - elapsed) / 1000);
        throw ApiError.badRequest(`Please wait ${remaining} seconds before requesting a new verification code.`);
      }
    }

    // Existing unverified account: regenerate OTP and resend email
    const code = generateOTP();
    existingUser.name = name.trim();
    if (normalizedPhone) existingUser.phone = normalizedPhone;
    existingUser.password = password; // Hashed by pre('save')
    existingUser.verificationCode = code;
    existingUser.verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    existingUser.otpAttempts = 0;
    existingUser.otpLastSentAt = new Date();
    await existingUser.save();

    // Send real email via SMTP / Brevo
    await sendOtpEmail(normalizedEmail, code, existingUser.name);

    return res.status(200).json({
      success: true,
      requiresVerification: true,
      email: normalizedEmail,
      message: 'A fresh 6-digit verification code has been dispatched to your email.',
      devCode: process.env.NODE_ENV === 'production' ? undefined : code,
    });
  }

  const verificationCode = generateOTP();
  const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role: defaultRole,
    employee: null,
    isVerified: false,
    status: 'PENDING_EMAIL_VERIFICATION',
    verificationCode,
    verificationExpires,
    otpAttempts: 0,
    otpLastSentAt: new Date(),
  });

  // Send real email via SMTP / Brevo
  await sendOtpEmail(normalizedEmail, verificationCode, user.name);

  res.status(201).json({
    success: true,
    requiresVerification: true,
    email: normalizedEmail,
    message: 'Account registered! Please enter the 6-digit verification code sent to your email to verify your address.',
    devCode: process.env.NODE_ENV === 'production' ? undefined : verificationCode,
  });
});

/** POST /api/auth/verify-email */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanCode = (code || '').trim();

  const user = await User.findOne({ email: normalizedEmail })
    .select('+verificationCode +verificationExpires +otpAttempts')
    .populate('employee');

  if (!user) {
    throw ApiError.notFound('No account found with this email address');
  }

  if (user.isVerified) {
    if (user.status === 'PENDING_ADMIN_APPROVAL') {
      return res.json({
        success: true,
        pendingApproval: true,
        message: 'Email is already verified. Your account is awaiting Administrator onboarding review.',
      });
    }
    const token = signToken({ sub: user._id, role: user.role });
    res.cookie('token', token, cookieOptions);
    return res.json({
      success: true,
      message: 'Account is already verified. Signed in successfully.',
      token,
      user: user.toJSON(),
    });
  }

  // Attempt limit check (max 5 tries)
  if (user.otpAttempts >= 5) {
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();
    throw ApiError.badRequest('Too many incorrect attempts. For security, this code has been invalidated. Please request a new code.');
  }

  if (!user.verificationCode || user.verificationCode !== cleanCode) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();
    const remaining = 5 - user.otpAttempts;
    throw ApiError.badRequest(`Invalid verification code. ${remaining} attempts remaining.`);
  }

  if (!user.verificationExpires || user.verificationExpires < new Date()) {
    throw ApiError.badRequest('Verification code has expired. Please request a new code.');
  }

  // Mark verified and transition to PENDING_ADMIN_APPROVAL
  user.isVerified = true;
  user.status = 'PENDING_ADMIN_APPROVAL';
  user.verificationCode = undefined;
  user.verificationExpires = undefined;
  user.otpAttempts = 0;
  await user.save();

  console.log(`[AUTH] Email verified for ${user.email}. User transitioned to PENDING_ADMIN_APPROVAL.`);

  res.json({
    success: true,
    pendingApproval: true,
    email: user.email,
    message: 'Corporate email verified successfully! Your profile has been submitted to Organization Administrators for onboarding review and role assignment.',
  });
});

/** POST /api/auth/resend-verification */
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select(
    '+verificationCode +verificationExpires +otpLastSentAt'
  );
  if (!user) {
    throw ApiError.notFound('No account found with this email address');
  }

  if (user.isVerified) {
    return res.json({
      success: true,
      message: 'This account is already verified. You can sign in immediately.',
    });
  }

  // Cooldown check (60 seconds)
  if (user.otpLastSentAt) {
    const elapsed = Date.now() - new Date(user.otpLastSentAt).getTime();
    if (elapsed < 60000) {
      const remaining = Math.ceil((60000 - elapsed) / 1000);
      throw ApiError.badRequest(`Please wait ${remaining} seconds before requesting another code.`);
    }
  }

  const code = generateOTP();
  user.verificationCode = code;
  user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
  user.otpAttempts = 0;
  user.otpLastSentAt = new Date();
  await user.save();

  // Send real email
  await sendOtpEmail(normalizedEmail, code, user.name);

  res.json({
    success: true,
    message: 'A fresh 6-digit verification code has been dispatched to your email.',
    devCode: process.env.NODE_ENV === 'production' ? undefined : code,
  });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail })
    .select('+password +verificationCode +verificationExpires')
    .populate('employee');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Account Status Lifecycle Checks
  if (user.status === 'PENDING_EMAIL_VERIFICATION' || user.isVerified === false) {
    return res.status(403).json({
      success: false,
      requiresVerification: true,
      email: user.email,
      message: 'Email verification is required before signing in. Please enter your 6-digit code.',
    });
  }

  if (user.status === 'PENDING_ADMIN_APPROVAL') {
    return res.status(403).json({
      success: false,
      pendingApproval: true,
      email: user.email,
      message: 'Your email is verified, but your account is awaiting Administrator approval and employee onboarding. You will be notified via email once approved.',
    });
  }

  if (user.status === 'REJECTED') {
    return res.status(403).json({
      success: false,
      rejected: true,
      message: `Your registration request was reviewed and rejected. Reason: ${user.rejectionReason || 'Please contact Organization HR.'}`,
    });
  }

  if (user.status === 'DISABLED' || !user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact HR administration.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ sub: user._id, role: user.role });
  res.cookie('token', token, cookieOptions);

  res.json({ success: true, token, user: user.toJSON() });
});

/** POST /api/auth/forgot-password */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.json({
      success: true,
      message: 'If an active account exists with that address, password reset instructions have been dispatched.',
    });
  }

  const resetCode = generateOTP();
  user.resetPasswordToken = resetCode;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Send real email via SMTP / Brevo
  await sendPasswordResetEmail(normalizedEmail, resetCode, user.name);

  res.json({
    success: true,
    message: 'Password reset code has been dispatched to your email.',
    devCode: process.env.NODE_ENV === 'production' ? undefined : resetCode,
  });
});

/** POST /api/auth/reset-password */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanCode = (code || '').trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordToken +resetPasswordExpires');
  if (!user || !user.resetPasswordToken || user.resetPasswordToken !== cleanCode) {
    throw ApiError.badRequest('Invalid password reset code');
  }

  if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw ApiError.badRequest('Password reset code has expired. Please request a new one.');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully! You may now sign in with your new credentials.',
  });
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
