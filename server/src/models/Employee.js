import mongoose from 'mongoose';
import { EMPLOYEE_STATUS, EMPLOYMENT_TYPES, DEFAULT_LEAVE_BALANCE } from '../utils/constants.js';

// Salary is stored as a structured breakdown so payslips can itemise it.
const salarySchema = new mongoose.Schema(
  {
    basic: { type: Number, default: 0, min: 0 }, // monthly basic
    hra: { type: Number, default: 0, min: 0 }, // house rent allowance
    allowances: { type: Number, default: 0, min: 0 }, // conveyance, medical, etc.
    // Statutory / recurring deductions expressed as monthly amounts.
    pf: { type: Number, default: 0, min: 0 }, // provident fund
    professionalTax: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    dateOfBirth: { type: Date, default: null },
    address: { type: String, default: '' },

    // Job info
    designation: { type: String, required: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: 'full-time' },
    status: { type: String, enum: EMPLOYEE_STATUS, default: 'active', index: true },
    dateOfJoining: { type: Date, required: true, default: Date.now },
    dateOfExit: { type: Date, default: null },

    salary: { type: salarySchema, default: () => ({}) },

    // Remaining leave balance per type, decremented when leave is approved.
    leaveBalance: {
      type: Map,
      of: Number,
      default: () => new Map(Object.entries(DEFAULT_LEAVE_BALANCE)),
    },

    // Optional emergency contact + bank details for payroll.
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
    bank: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
      ifsc: { type: String, default: '' },
    },

    // Back-reference to the login account (if the employee can sign in).
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

employeeSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Convenient computed monthly figures used by payroll + reports.
employeeSchema.virtual('grossSalary').get(function grossSalary() {
  const s = this.salary || {};
  return (s.basic || 0) + (s.hra || 0) + (s.allowances || 0);
});

employeeSchema.index({ firstName: 'text', lastName: 'text', email: 'text', employeeId: 'text' });

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

export const Employee = mongoose.model('Employee', employeeSchema);
