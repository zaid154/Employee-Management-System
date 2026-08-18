import mongoose from 'mongoose';
import { PAYROLL_STATUS } from '../utils/constants.js';

// A payslip for one employee for one month.
const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 }, // 1-12
    year: { type: Number, required: true },

    // Earnings (snapshot of the salary structure at generation time)
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },

    // Deductions
    pf: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    tax: { type: Number, default: 0 }, // income tax (TDS)
    lopDeduction: { type: Number, default: 0 }, // loss of pay (unpaid leave / absent days)
    otherDeductions: { type: Number, default: 0 },

    // Attendance snapshot that drove the LOP calculation
    workingDays: { type: Number, default: 0 },
    paidDays: { type: Number, default: 0 },
    lopDays: { type: Number, default: 0 },

    grossEarnings: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },

    status: { type: String, enum: PAYROLL_STATUS, default: 'draft', index: true },
    paidAt: { type: Date, default: null },
    note: { type: String, default: '' },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// One payslip per employee per month/year.
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

payrollSchema.set('toJSON', { virtuals: true });

export const Payroll = mongoose.model('Payroll', payrollSchema);
