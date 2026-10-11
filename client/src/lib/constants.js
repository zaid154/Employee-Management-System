// Shared front-end constants: roles, navigation groups, and status mapping.

export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  hr: 'HR Manager',
  manager: 'Team Manager',
  employee: 'Employee',
};

// Navigation items with explicit allowed roles and role-aware labels
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE] },
  {
    to: '/employees',
    label: (role) => (role === ROLES.ADMIN || role === ROLES.HR ? 'Employees' : role === ROLES.MANAGER ? 'My Team' : 'Directory'),
    icon: 'Users',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  { to: '/departments', label: 'Departments & Roles', icon: 'Building2', roles: [ROLES.ADMIN, ROLES.HR] },
  {
    to: '/attendance',
    label: (role) => (role === ROLES.EMPLOYEE ? 'My Attendance' : role === ROLES.MANAGER ? 'Team Attendance' : 'Attendance'),
    icon: 'CalendarCheck',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  {
    to: '/leaves',
    label: (role) => (role === ROLES.EMPLOYEE ? 'My Leaves' : 'Leave Requests'),
    icon: 'CalendarDays',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE],
    badgeKey: 'pendingLeaves',
  },
  { to: '/holidays', label: 'Holiday Calendar', icon: 'Calendar', roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE] },
  {
    to: '/payroll',
    label: (role) => (role === ROLES.ADMIN || role === ROLES.HR ? 'Payroll & Slips' : 'My Payslips'),
    icon: 'Wallet',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  {
    to: '/performance',
    label: (role) => (role === ROLES.EMPLOYEE ? 'My Performance' : role === ROLES.MANAGER ? 'Team Appraisals' : 'Performance'),
    icon: 'TrendingUp',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  { to: '/reports', label: 'Reports & Export', icon: 'PieChart', roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER] },
  { to: '/announcements', label: 'Notice Board', icon: 'Megaphone', roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE] },
  { to: '/settings', label: 'System Settings', icon: 'Settings', roles: [ROLES.ADMIN] },
];

export const NAV_SECTIONS = [
  { title: 'Navigation', items: NAV_ITEMS },
];

export const isPrivileged = (role) => role === ROLES.ADMIN || role === ROLES.HR;
export const canManage = (role) => role === ROLES.ADMIN || role === ROLES.HR || role === ROLES.MANAGER;

// status → badge colour style class
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
  holiday: 'purple',
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

export const badgeColor = (status) => STATUS_COLORS[status?.toLowerCase?.()] || 'gray';

export const LEAVE_TYPES = ['casual', 'sick', 'earned', 'unpaid', 'maternity', 'paternity'];
export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'intern'];
export const EMPLOYEE_STATUSES = ['active', 'probation', 'on-leave', 'resigned', 'terminated'];
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'];

// Enterprise muted palette for charts
export const CHART_COLORS = [
  '#2563eb', // Blue
  '#0284c7', // Sky
  '#0d9488', // Teal
  '#16a34a', // Emerald
  '#d97706', // Amber
  '#6366f1', // Indigo
  '#475569', // Slate
  '#dc2626', // Crimson
];
