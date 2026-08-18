// Central place for shared enums so models, validators, and seed data agree.

export const ROLES = {
  ADMIN: 'admin', // full access, manages users + settings
  HR: 'hr', // manages employees, payroll, leaves, performance
  MANAGER: 'manager', // approves leave / reviews their own team
  EMPLOYEE: 'employee', // self-service only
};

export const ROLE_VALUES = Object.values(ROLES);

export const EMPLOYEE_STATUS = ['active', 'probation', 'on-leave', 'resigned', 'terminated'];

export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'intern'];

export const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday', 'weekend'];

export const LEAVE_TYPES = ['casual', 'sick', 'earned', 'unpaid', 'maternity', 'paternity'];

export const LEAVE_STATUS = ['pending', 'approved', 'rejected', 'cancelled'];

export const PAYROLL_STATUS = ['draft', 'processed', 'paid'];

export const REVIEW_STATUS = ['draft', 'submitted', 'acknowledged'];

// Default annual leave allotment per type used when creating an employee.
export const DEFAULT_LEAVE_BALANCE = {
  casual: 12,
  sick: 10,
  earned: 15,
  unpaid: 0,
  maternity: 0,
  paternity: 0,
};
