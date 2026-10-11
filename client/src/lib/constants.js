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

// Structured navigation groups for enterprise sidebar
export const NAV_SECTIONS = [
  {
    title: 'Core',
    items: [
      { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', roles: [] },
    ],
  },
  {
    title: 'People & Org',
    items: [
      { to: '/employees', label: 'Employees', icon: 'Users', roles: [] },
      { to: '/departments', label: 'Departments & Roles', icon: 'Building2', roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER] },
    ],
  },
  {
    title: 'Time & Leave',
    items: [
      { to: '/attendance', label: 'Attendance', icon: 'CalendarCheck', roles: [] },
      { to: '/leaves', label: 'Leave Requests', icon: 'CalendarDays', roles: [], badgeKey: 'pendingLeaves' },
      { to: '/holidays', label: 'Holiday Calendar', icon: 'Calendar', roles: [] },
    ],
  },
  {
    title: 'Compensation',
    items: [
      { to: '/payroll', label: 'Payroll & Slips', icon: 'Wallet', roles: [] },
      { to: '/performance', label: 'Performance', icon: 'TrendingUp', roles: [] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/reports', label: 'Reports & Export', icon: 'PieChart', roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER] },
      { to: '/announcements', label: 'Notice Board', icon: 'Megaphone', roles: [] },
      { to: '/settings', label: 'System Settings', icon: 'Settings', roles: [ROLES.ADMIN, ROLES.HR] },
    ],
  },
];

// Flat nav items list for route matching & backward compatibility
export const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

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
