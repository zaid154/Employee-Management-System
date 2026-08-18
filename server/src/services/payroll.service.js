import { Attendance } from '../models/Attendance.js';
import { Holiday } from '../models/Holiday.js';
import { startOfDay, endOfDay, workingDaysBetween } from '../utils/dates.js';

/**
 * Compute a payslip breakdown for one employee for a given month/year.
 * Loss-of-pay days are derived from recorded absences + unpaid-leave days, and
 * capped by the number of scheduled working days in the month.
 */
export async function computePayslip(employee, { month, year, bonus = 0, tax = 0, otherDeductions = 0 }) {
  const monthStart = startOfDay(new Date(year, month - 1, 1));
  const monthEnd = endOfDay(new Date(year, month, 0));

  const holidayDocs = await Holiday.find({ date: { $gte: monthStart, $lte: monthEnd } }).select('date').lean();
  const holidays = holidayDocs.map((h) => h.date);
  const workingDays = workingDaysBetween(monthStart, monthEnd, holidays);

  // Count attendance-derived unpaid days for the month.
  const rows = await Attendance.aggregate([
    { $match: { employee: employee._id, date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const absentDays = byStatus.absent || 0;
  const halfDays = byStatus['half-day'] || 0;
  // Absent counts as a full LOP day, half-day as 0.5.
  const lopDays = Math.min(workingDays, absentDays + halfDays * 0.5);
  const paidDays = Math.max(0, workingDays - lopDays);

  const s = employee.salary || {};
  const basic = s.basic || 0;
  const hra = s.hra || 0;
  const allowances = s.allowances || 0;
  const pf = s.pf || 0;
  const professionalTax = s.professionalTax || 0;

  const grossMonthly = basic + hra + allowances;
  const perDay = workingDays > 0 ? grossMonthly / workingDays : 0;
  const lopDeduction = Math.round(perDay * lopDays);

  const grossEarnings = grossMonthly + bonus;
  const totalDeductions = pf + professionalTax + tax + lopDeduction + otherDeductions;
  const netPay = Math.max(0, grossEarnings - totalDeductions);

  return {
    month,
    year,
    basic,
    hra,
    allowances,
    bonus,
    overtimePay: 0,
    pf,
    professionalTax,
    tax,
    lopDeduction,
    otherDeductions,
    workingDays,
    paidDays,
    lopDays,
    grossEarnings: Math.round(grossEarnings),
    totalDeductions: Math.round(totalDeductions),
    netPay: Math.round(netPay),
  };
}
