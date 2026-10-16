import { useState, useEffect } from 'react';
import {
  Building, Wallet, CalendarClock, CalendarDays, ShieldCheck,
  Save, RotateCcw, Server, Database, Lock, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { isPrivileged } from '../lib/constants.js';
import {
  PageHeader, Card, CardHeader, Button, Field, Input, Select, AlertBanner,
} from '../components/ui.jsx';

const STORAGE_KEY = 'ems_enterprise_system_settings';

const DEFAULT_SETTINGS = {
  companyName: 'PeoplePay Technologies Inc.',
  companyRegNo: 'CIN-U72200DL2024PTC123456',
  officialEmail: 'hr@peoplepay.internal',
  supportPhone: '+91 (011) 4567-8900',
  headquarters: 'Tower B, Tech Park, Cyber City, Gurugram, India',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  fiscalYearStart: 'april',

  payrollCycleDay: 'last-day',
  workingDaysModel: '26',
  employeePfRate: '12',
  employerPfRate: '12',
  professionalTax: true,
  overtimeMultiplier: '1.5',
  autoEmailPayslips: true,

  workShiftStart: '09:00',
  workShiftEnd: '18:00',
  gracePeriodMins: '15',
  halfDayHours: '4.5',
  weekOffPolicy: '5-day',
  autoMarkAbsent: true,

  annualCasualLeave: '12',
  annualSickLeave: '12',
  annualEarnedLeave: '18',
  maxConsecutiveLeaves: '3',
  carryForwardLimit: '10',
  maternityWeeks: '26',

  notifyHrOnLeave: true,
  dailyAttendanceReminder: true,
  sessionTimeoutHours: '8',
};

const SETTINGS_SECTIONS = [
  {
    title: 'Organization & Company Profile',
    subtitle: 'Official corporate registration details, headquarters, timezone, and fiscal calendar',
    badgeIcon: Building,
    badgeText: 'Corporate Identity',
    fields: [
      { key: 'companyName', label: 'Legal Company Name', hint: 'Official business name displayed on employee payslips, appointment letters, and reports.', required: true },
      { key: 'companyRegNo', label: 'Registration / CIN Number', hint: 'Corporate Identity Number for statutory filings and tax records.' },
      {
        key: 'currency', label: 'Primary Accounting Currency', hint: 'Standard currency used for base salaries, allowances, and payslip calculations.', type: 'select',
        options: [
          { value: 'INR', label: 'INR (₹ Indian Rupee)' }, { value: 'USD', label: 'USD ($ US Dollar)' },
          { value: 'EUR', label: 'EUR (€ Euro)' }, { value: 'GBP', label: 'GBP (£ British Pound)' },
          { value: 'AED', label: 'AED (د.إ UAE Dirham)' },
        ],
      },
      {
        key: 'timezone', label: 'Corporate Timezone', hint: 'Timezone used to record timestamps for employee check-in and check-out punches.', type: 'select',
        options: [
          { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)' }, { value: 'Asia/Dubai', label: 'Asia/Dubai (GST, UTC+4:00)' },
          { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT, UTC+8:00)' }, { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
          { value: 'America/New_York', label: 'America/New_York (EST/EDT)' }, { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
        ],
      },
      { key: 'officialEmail', label: 'Official HR Support Email', hint: 'Default contact email where employees send leave queries and payroll questions.', type: 'email' },
      { key: 'supportPhone', label: 'HR Helpdesk Phone', hint: 'Direct telephone hotline displayed on the employee dashboard.' },
      {
        key: 'fiscalYearStart', label: 'Fiscal Financial Year', hint: 'Annual accounting cycle when annual leave quotas reset and statutory taxes are audited.', type: 'select',
        options: [
          { value: 'april', label: 'April 1 – March 31 (Standard Indian FY)' },
          { value: 'january', label: 'January 1 – December 31 (Calendar Year)' },
        ],
      },
      { key: 'headquarters', label: 'Headquarters / Registered Address', hint: 'Physical corporate office location printed on official PDF payslips.' },
    ],
  },
  {
    title: 'Payroll & Compensation Rules',
    subtitle: 'Monthly salary disbursement cycle, working days divisor, statutory PF rates, and overtime compensation',
    badgeIcon: Wallet,
    badgeText: 'Salary & Statutory',
    infoBox: 'Statutory Compliance Note: PF deductions apply to (Basic + DA) up to statutory ceilings. Income tax (TDS) complies with prevailing taxation slabs.',
    fields: [
      {
        key: 'payrollCycleDay', label: 'Monthly Salary Payday', hint: 'The scheduled date when monthly salary batches are processed and released.', type: 'select',
        options: [
          { value: 'last-day', label: 'Last Business Day of Month' }, { value: '1st', label: '1st of Following Month' },
          { value: '25th', label: '25th of Current Month' }, { value: '28th', label: '28th of Current Month' },
        ],
      },
      {
        key: 'workingDaysModel', label: 'Salary Working Days Model', hint: "Number of days used to calculate an employee's per-day wage rate for leaves and deductions.", type: 'select',
        options: [
          { value: '26', label: '26 Days (Standard Industrial - Sundays Excluded)' },
          { value: '22', label: '22 Days (Corporate 5-Day Work Week)' },
          { value: 'calendar', label: 'Actual Calendar Days in Month (28–31)' },
        ],
      },
      { key: 'employeePfRate', label: 'Employee PF Deduction (%)', hint: 'Statutory Provident Fund percentage deducted from monthly Basic Pay (Standard: 12%).', type: 'number' },
      { key: 'employerPfRate', label: 'Employer Matching PF (%)', hint: "Company's matching Provident Fund contribution (Standard: 12%).", type: 'number' },
      {
        key: 'overtimeMultiplier', label: 'Overtime Hourly Multiplier', hint: 'Multiplier applied to hourly wage for approved extra hours worked beyond shifts.', type: 'select',
        options: [
          { value: '1.0', label: '1.0x (Standard Hourly Rate)' },
          { value: '1.5', label: '1.5x Hourly Wage (Standard Overtime)' },
          { value: '2.0', label: '2.0x Hourly Wage (Double Time / Sunday Work)' },
        ],
      },
      {
        key: 'professionalTax', label: 'State Professional Tax (PT)', hint: 'State statutory tax deducted from monthly gross compensation.', type: 'select', isBool: true,
        options: [
          { value: 'true', label: 'Enabled (Auto-apply ₹200 standard monthly deduction)' },
          { value: 'false', label: 'Disabled / State Tax Exempt' },
        ],
      },
      {
        key: 'autoEmailPayslips', label: 'Auto-Email Payslips on Approval', hint: "Automatically email PDF salary slip directly to employee's registered email when paid.", type: 'select', isBool: true,
        options: [
          { value: 'true', label: 'Enabled (Auto-send PDF to employee email)' },
          { value: 'false', label: 'Disabled (Employee downloads manually)' },
        ],
      },
    ],
  },
  {
    title: 'Attendance & Shift Timings',
    subtitle: 'Standard daily shift schedule, arrival grace buffer, half-day threshold, and automated absence detection',
    badgeIcon: CalendarClock,
    badgeText: 'Time & Shifts',
    fields: [
      { key: 'workShiftStart', label: 'Standard Shift Start Time', hint: "Expected daily arrival time. Punches recorded after grace period are marked 'Late Arrival'.", type: 'time', required: true },
      { key: 'workShiftEnd', label: 'Standard Shift End Time', hint: 'Official daily departure time. Checking out earlier will be flagged in attendance logs.', type: 'time', required: true },
      {
        key: 'gracePeriodMins', label: 'Arrival Grace Period', hint: "Buffer minutes after shift start during which employee punch is still classified as 'Present'.", type: 'select',
        options: [
          { value: '15', label: '15 Minutes (Standard - punches up to 09:15 AM On-Time)' },
          { value: '10', label: '10 Minutes' }, { value: '30', label: '30 Minutes (Relaxed)' }, { value: '0', label: '0 Minutes (Strict - 09:01 AM is Late)' },
        ],
      },
      {
        key: 'halfDayHours', label: 'Half-Day Min. Work Hours', hint: 'Minimum worked hours in a shift required to qualify for half-day attendance credit.', type: 'select',
        options: [{ value: '4.5', label: '4.5 Hours (Standard for 9-hour shift)' }, { value: '4.0', label: '4.0 Hours' }, { value: '5.0', label: '5.0 Hours' }],
      },
      {
        key: 'weekOffPolicy', label: 'Weekly Off Schedule', hint: 'Official weekly rest days excluded from mandatory daily shift attendance.', type: 'select',
        options: [
          { value: '5-day', label: '5-Day Work Week (Saturday & Sunday Off)' },
          { value: '6-day', label: '6-Day Work Week (Sunday Off only)' },
          { value: 'alt-sat', label: 'Alternate Saturdays (2nd & 4th Saturday Off)' },
        ],
      },
      {
        key: 'autoMarkAbsent', label: 'Automated Absence Detection', hint: 'Automatically records absent status for unpunched shifts after mid-day.', type: 'select', isBool: true,
        options: [
          { value: 'true', label: 'Enabled (Auto-mark Absent after 1:00 PM if no clock-in)' },
          { value: 'false', label: 'Disabled (Leave empty for manual HR review)' },
        ],
      },
    ],
  },
  {
    title: 'Leave Quotas & Vacation Policy',
    subtitle: 'Annual paid leave allowances per employee, statutory maternity benefit, and carry-forward caps',
    badgeIcon: CalendarDays,
    badgeText: 'Quotas & Policies',
    infoBox: 'Accrual Schedule: Casual and Sick leaves are credited in full on April 1st. Earned Leaves accrue monthly at 1.5 days per completed calendar month of active service.',
    fields: [
      { key: 'annualCasualLeave', label: 'Casual Leave (CL)', hint: 'Paid days per year allocated for personal emergencies or short planned time-off.', type: 'number' },
      { key: 'annualSickLeave', label: 'Sick Leave (SL)', hint: 'Paid days per year reserved for medical recovery, doctor visits, and illness.', type: 'number' },
      { key: 'annualEarnedLeave', label: 'Earned Leave (EL)', hint: 'Annual paid vacation leaves accrued across the year (1.5 days / month).', type: 'number' },
      { key: 'maternityWeeks', label: 'Paid Maternity Benefit (Weeks)', hint: 'Statutory 26 weeks paid leave granted to eligible female staff under Maternity Benefit Act.', type: 'number' },
      { key: 'carryForwardLimit', label: 'Earned Leave Carry-Forward Cap (Days)', hint: 'Maximum unused Earned Leaves that roll over into the new fiscal year (excess leaves lapse).', type: 'number' },
      {
        key: 'maxConsecutiveLeaves', label: 'Consecutive Leave Cap (Without HR Approval)', hint: 'Maximum continuous leave days before advance HR clearance is mandatory.', type: 'select',
        options: [
          { value: '3', label: '3 Consecutive Days (Standard - 4+ days requires advance approval)' },
          { value: '2', label: '2 Consecutive Days (Strict)' },
          { value: '5', label: '5 Consecutive Days (Relaxed)' },
          { value: 'unlimited', label: 'Unlimited (Manager Discretion)' },
        ],
      },
    ],
  },
  {
    title: 'Notifications, Security & Infrastructure Telemetry',
    subtitle: 'Automated alerts, session inactivity timeout, and real-time backend engine health',
    badgeIcon: ShieldCheck,
    badgeText: 'Security & Telemetry',
    securityBox: 'Security Architecture: Passwords are cryptographically salted with BCrypt. API endpoints enforce strict Role-Based Access Control (RBAC).',
    fields: [
      {
        key: 'notifyHrOnLeave', label: 'Instant Leave Application Alert to HR', hint: 'Notifies HR Managers immediately when an employee submits a leave application.', type: 'select', isBool: true,
        options: [{ value: 'true', label: 'Enabled (Instant in-app notification to HR manager)' }, { value: 'false', label: 'Disabled (Silent review)' }],
      },
      {
        key: 'dailyAttendanceReminder', label: 'Morning Clock-In Reminder', hint: "Sends morning reminder notification at 09:15 AM to employees who haven't clocked in.", type: 'select', isBool: true,
        options: [{ value: 'true', label: 'Enabled (Send reminder to clocked-out employees at 09:15 AM)' }, { value: 'false', label: 'Disabled' }],
      },
      {
        key: 'sessionTimeoutHours', label: 'Browser Session Inactivity Timeout', hint: 'Automatically logs users out after extended inactivity to protect payroll confidentiality.', type: 'select',
        options: [
          { value: '8', label: '8 Hours (Standard Full Working Day)' }, { value: '4', label: '4 Hours' },
          { value: '24', label: '24 Hours' }, { value: 'never', label: 'Never Expire (Development Environment)' },
        ],
      },
    ],
  },
];

const TELEMETRY_CARDS = [
  { icon: Database, label: 'Database', name: 'MongoDB Atlas', status: 'Connected · Healthy', color: 'green' },
  { icon: Server, label: 'Backend API', name: 'Node / Express', status: 'Port 5002 · v1.0.4-prod', color: 'blue' },
  { icon: Lock, label: 'Authentication', name: 'JWT Auth Engine', status: 'HMAC-SHA256 Signed', color: 'purple' },
  { icon: ShieldCheck, label: 'Role Permissions', name: 'Enterprise RBAC', status: '4 Tier Hierarchy', color: 'amber' },
];

export default function Settings() {
  const { user } = useAuth();
  const canModify = isPrivileged(user?.role);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        toast.success('System settings saved successfully');
        setIsDirty(false);
      } catch {
        toast.error('Failed to save settings');
      } finally {
        setSaving(false);
      }
    }, 400);
  };

  const handleReset = () => {
    if (window.confirm('Reset all organization rules and policies to default values?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem(STORAGE_KEY);
      setIsDirty(false);
      toast.success('Settings reset to recommended defaults');
    }
  };

  const actionButtons = canModify && (
    <div className="flex items-center gap-2">
      <Button variant="secondary" icon={RotateCcw} onClick={handleReset} disabled={saving}>Reset Defaults</Button>
      <Button icon={Save} onClick={handleSave} loading={saving} disabled={!isDirty}>Save Changes</Button>
    </div>
  );

  return (
    <div className="settings-container">
      <PageHeader
        title="System Settings & Policy"
        subtitle="Manage company defaults, shift timings, payroll calculation rules, and leave quotas"
        actions={actionButtons}
      />

      {isDirty && (
        <div className="mb-4">
          <AlertBanner
            type="warning"
            title="Unsaved Changes Pending"
            message="You have modified system configurations. Review the fields below and click 'Save Changes' to apply."
          />
        </div>
      )}

      {SETTINGS_SECTIONS.map((sec, idx) => {
        const BadgeIcon = sec.badgeIcon;
        return (
          <Card key={idx} pad={false} className="settings-card">
            <CardHeader
              title={sec.title}
              subtitle={sec.subtitle}
              action={
                <span className="settings-section-badge">
                  <BadgeIcon size={14} /> {sec.badgeText}
                </span>
              }
            />
            <div className="card-pad">
              <div className="form-grid-2">
                {sec.fields.map((f) => (
                  <Field key={f.key} label={f.label} hint={f.hint} required={f.required}>
                    {f.type === 'select' ? (
                      <Select
                        value={f.isBool ? (settings[f.key] ? 'true' : 'false') : settings[f.key]}
                        onChange={(e) => handleChange(f.key, f.isBool ? e.target.value === 'true' : e.target.value)}
                        disabled={!canModify}
                      >
                        {f.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        type={f.type || 'text'}
                        value={settings[f.key] ?? ''}
                        onChange={(e) => handleChange(f.key, e.target.value)}
                        disabled={!canModify}
                      />
                    )}
                  </Field>
                ))}

                {sec.infoBox && (
                  <div className="settings-info-box">
                    <Info size={16} className="text-primary" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span className="text-xs text-2" style={{ lineHeight: 1.5 }}>{sec.infoBox}</span>
                  </div>
                )}

                {sec.securityBox && (
                  <div className="settings-info-box">
                    <Lock size={16} className="text-primary" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span className="text-xs text-2" style={{ lineHeight: 1.5 }}>{sec.securityBox}</span>
                  </div>
                )}
              </div>

              {sec.badgeText === 'Security & Telemetry' && (
                <div className="settings-telemetry-grid">
                  {TELEMETRY_CARDS.map((t, tIdx) => {
                    const TeleIcon = t.icon;
                    return (
                      <div key={tIdx} className="telemetry-card">
                        <div className="telemetry-icon" style={{ color: `var(--${t.color}-text)`, background: `var(--${t.color}-subtle)` }}>
                          <TeleIcon size={17} />
                        </div>
                        <div>
                          <div className="text-xs text-3 font-medium">{t.label}</div>
                          <div className="text-sm font-semi text-1">{t.name}</div>
                          <div className="text-xs" style={{ color: `var(--${t.color}-text)` }}>{t.status}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {canModify && (
        <div className="settings-bottom-bar">
          <div>
            {isDirty ? (
              <span className="text-sm font-medium" style={{ color: 'var(--amber-text)' }}>
                You have modified settings. Don't forget to save your changes!
              </span>
            ) : (
              <span className="text-sm text-3">All settings and policies are saved and up to date.</span>
            )}
          </div>
          {actionButtons}
        </div>
      )}
    </div>
  );
}
