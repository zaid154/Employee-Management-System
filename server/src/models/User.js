import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_VALUES, ROLES } from '../utils/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, select: false, minlength: 6 },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.EMPLOYEE, index: true },
    // Linked employee record (null for a pure admin account).
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    avatar: { type: String, default: '' },
    avatarPublicId: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['PENDING_EMAIL_VERIFICATION', 'PENDING_ADMIN_APPROVAL', 'ACTIVE', 'REJECTED', 'DISABLED'],
      default: 'PENDING_EMAIL_VERIFICATION',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    verificationCode: { type: String, select: false },
    verificationExpires: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpLastSentAt: { type: Date, default: null, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash the password whenever it is set/changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak the password hash or verification secrets in JSON responses.
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.verificationCode;
    delete ret.verificationExpires;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
