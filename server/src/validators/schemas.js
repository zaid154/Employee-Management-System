import { z } from 'zod';
import {
  ROLE_VALUES,
  EMPLOYEE_STATUS,
  EMPLOYMENT_TYPES,
  LEAVE_TYPES,
  ATTENDANCE_STATUS,
} from '../utils/constants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const isoDate = z.coerce.date();

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').max(80),
  email: z.string().email('Please enter a valid corporate work email'),
  phone: z.string().min(8, 'Please enter a valid mobile number with country code').max(20).optional().default(''),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().min(4, 'Code is too short').max(8, 'Code is too long'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().min(4, 'Code is too short').max(8, 'Code is too long'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// ---- Onboarding & Approval ----
export const approveOnboardingSchema = z.object({
  role: z.enum(ROLE_VALUES).default('employee'),
  employeeId: z.string().min(1).max(20).optional(),
  department: objectId,
  designation: z.string().min(1).max(80),
  employmentType: z.enum(EMPLOYMENT_TYPES).default('full-time'),
  dateOfJoining: isoDate.optional(),
  salary: z.object({
    basic: z.number().min(0).default(0),
    hra: z.number().min(0).default(0),
    allowances: z.number().min(0).default(0),
    pf: z.number().min(0).default(0),
    professionalTax: z.number().min(0).default(0),
  }).partial().optional(),
  bank: z.object({
    accountName: z.string().optional().default(''),
    accountNumber: z.string().optional().default(''),
    bankName: z.string().optional().default(''),
    ifsc: z.string().optional().default(''),
  }).optional(),
});

export const rejectOnboardingSchema = z.object({
  reason: z.string().min(2, 'Please provide a rejection reason').max(500),
});

export const verifyDocumentSchema = z.object({
  status: z.enum(['verified', 'rejected', 'resubmission_required']),
  adminRemarks: z.string().max(500).optional().default(''),
});

export const recordPaymentSchema = z.object({
  status: z.enum(['paid', 'processing', 'failed']).default('paid'),
  paymentReference: z.string().min(1, 'Payment reference / transaction ID is required'),
  paymentMethod: z.string().optional().default('bank_transfer'),
  paidAt: isoDate.optional(),
  note: z.string().max(500).optional().default(''),
});

// ---- Department ----
export const departmentSchema = z.object({
  name: z.string().min(2).max(80),
  code: z.string().min(1).max(10),
  description: z.string().max(500).optional().default(''),
  head: objectId.nullish(),
});

// ---- Employee ----
const salarySchema = z.object({
  basic: z.number().min(0).default(0),
  hra: z.number().min(0).default(0),
  allowances: z.number().min(0).default(0),
  pf: z.number().min(0).default(0),
  professionalTax: z.number().min(0).default(0),
}).partial();

export const createEmployeeSchema = z.object({
  employeeId: z.string().min(1).max(20).optional(),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  phone: z.string().max(20).optional().default(''),
  gender: z.enum(['male', 'female', 'other', '']).optional().default(''),
  dateOfBirth: isoDate.nullish(),
  address: z.string().max(300).optional().default(''),
  designation: z.string().min(1).max(80),
  department: objectId,
  manager: objectId.nullish(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional().default('full-time'),
  status: z.enum(EMPLOYEE_STATUS).optional().default('active'),
  dateOfJoining: isoDate.optional(),
  salary: salarySchema.optional(),
  emergencyContact: z
    .object({ name: z.string().default(''), phone: z.string().default(''), relation: z.string().default('') })
    .partial()
    .optional(),
  bank: z
    .object({
      accountName: z.string().default(''),
      accountNumber: z.string().default(''),
      bankName: z.string().default(''),
      ifsc: z.string().default(''),
    })
    .partial()
    .optional(),
  // Optionally create a login account for this employee.
  createAccount: z.boolean().optional().default(false),
  role: z.enum(ROLE_VALUES).optional(),
  password: z.string().min(6).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const markAttendanceSchema = z.object({
  employee: objectId,
  date: isoDate.refine((d) => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return d <= endOfToday;
  }, { message: 'Attendance date cannot be in the future' }),
  status: z.enum(ATTENDANCE_STATUS).default('present'),
  checkIn: isoDate.nullish(),
  checkOut: isoDate.nullish(),
  note: z.string().max(300).optional().default(''),
});

// ---- Leave ----
export const applyLeaveSchema = z
  .object({
    employee: objectId.optional(), // HR can apply on behalf; employees infer from token
    type: z.enum(LEAVE_TYPES),
    startDate: isoDate,
    endDate: isoDate,
    halfDay: z.boolean().optional().default(false),
    reason: z.string().min(3).max(500),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

export const reviewLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNote: z.string().max(300).optional().default(''),
});

// ---- Payroll ----
export const generatePayrollSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  employee: objectId.optional(), // omit to run for everyone
  bonus: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0),
  otherDeductions: z.number().min(0).optional().default(0),
});

export const updatePayrollSchema = z.object({
  bonus: z.number().min(0).optional(),
  overtimePay: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  otherDeductions: z.number().min(0).optional(),
  note: z.string().max(300).optional(),
});


// ---- Performance ----
const ratingsSchema = z
  .object({
    productivity: z.number().min(0).max(5),
    quality: z.number().min(0).max(5),
    communication: z.number().min(0).max(5),
    teamwork: z.number().min(0).max(5),
    leadership: z.number().min(0).max(5),
  })
  .partial();

export const performanceSchema = z.object({
  employee: objectId,
  reviewer: objectId.nullish(),
  period: z.string().min(2).max(30),
  ratings: ratingsSchema.optional(),
  goals: z
    .array(
      z.object({
        title: z.string().min(1),
        weight: z.number().min(0).max(100).optional().default(0),
        rating: z.number().min(0).max(5).optional().default(0),
        comment: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  strengths: z.string().max(1000).optional().default(''),
  improvements: z.string().max(1000).optional().default(''),
  reviewerComment: z.string().max(1000).optional().default(''),
  status: z.enum(['draft', 'submitted', 'acknowledged']).optional().default('draft'),
});

// ---- Announcement ----
export const announcementSchema = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(2),
  category: z.enum(['general', 'policy', 'event', 'holiday', 'urgent']).optional().default('general'),
  audience: z.array(z.enum(ROLE_VALUES)).optional().default([]),
  pinned: z.boolean().optional().default(false),
});

// ---- Holiday ----
export const holidaySchema = z.object({
  name: z.string().min(2).max(80),
  date: isoDate,
  type: z.enum(['public', 'optional', 'company']).optional().default('public'),
  description: z.string().max(300).optional().default(''),
});
