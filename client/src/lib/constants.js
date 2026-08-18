// Shared front-end constants: roles, nav config, and status → badge-colour maps.

export const ROLES = { ADMIN: 'admin', HR: 'hr', MANAGER: 'manager', EMPLOYEE: 'employee' };

export const ROLE_LABELS = {
  admin: 'Administrator',
  hr: 'HR Manager',
  manager: 'Team Manager',
  employee: 'Employee',
};

// Which roles may see each nav destination. Empty = everyone.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', roles: [] },
  { to: '/employees', label: 'Employees', icon: 'Users', roles: [] },
  { to: '/departments', label: 'Departments', icon: 'Building2', roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER] },
  { to: '/attendance', label: 'Attendance', icon: 'CalendarCheck', roles: [] },
  { to: '/leaves', label: 'Leave', icon: 'CalendarDays', roles: [], badgeKey: 'pendingLeaves' },
  { to: '/payroll', label: 'Payroll', icon: 'Wallet', roles: [] },
  { to: '/performance', label: 'Performance', icon: 'TrendingUp', roles: [] },
  { to: '/reports', label: 'Reports', icon: 'PieChart', roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER] },
  { to: '/announcements', label: 'Announcements', icon: 'Megaphone', roles: [] },
  { to: '/holidays', label: 'Holidays', icon: 'Palmtree', roles: [] },
];

export const isPrivileged = (role) => role === ROLES.ADMIN || role === ROLES.HR;

export const canManage = (role) => role === ROLES.ADMIN || role === ROLES.HR || role === ROLES.MANAGER;

// status → badge colour class
export const STATUS_COLORS = {
  // employee
  active: 'green',
  probation: 'amber',
  'on-leave': 'blue',
  resigned: 'gray',
  terminated: 'red',
  // attendance
  present: 'green',
  absent: 'red',
  late: 'amber',
  'half-day': 'cyan',
  holiday: 'violet',
  weekend: 'gray',
  // leave / payroll
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  cancelled: 'gray',
  draft: 'gray',
  processed: 'blue',
  paid: 'green',
  submitted: 'blue',
  acknowledged: 'green',
};

export const badgeColor = (status) => STATUS_COLORS[status] || 'gray';

export const LEAVE_TYPES = ['casual', 'sick', 'earned', 'unpaid', 'maternity', 'paternity'];
export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'intern'];
export const EMPLOYEE_STATUSES = ['active', 'probation', 'on-leave', 'resigned', 'terminated'];
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'];

// Colour palette for charts (accessible, consistent across light/dark).
export const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#a855f7'];
