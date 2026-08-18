import { ROLES } from './constants.js';
import { Employee } from '../models/Employee.js';

export const isPrivileged = (user) => user.role === ROLES.ADMIN || user.role === ROLES.HR;

/**
 * Resolve the Employee id the logged-in user represents (null for a pure admin
 * with no linked employee record).
 */
export const ownEmployeeId = (user) =>
  user.employee?._id ? String(user.employee._id) : user.employee ? String(user.employee) : null;

/**
 * Returns the list of employee ids a manager is allowed to see (their direct
 * reports plus themselves).
 */
export async function teamEmployeeIds(user) {
  const selfId = ownEmployeeId(user);
  const reports = await Employee.find({ manager: selfId }).select('_id').lean();
  return [selfId, ...reports.map((e) => String(e._id))].filter(Boolean);
}

/**
 * Build a Mongoose filter that scopes a query to what the user may read.
 * - admin/hr: everything
 * - manager: their team
 * - employee: only themselves
 */
export async function scopeToEmployees(user, field = 'employee') {
  if (isPrivileged(user)) return {};
  if (user.role === ROLES.MANAGER) {
    return { [field]: { $in: await teamEmployeeIds(user) } };
  }
  return { [field]: ownEmployeeId(user) };
}
