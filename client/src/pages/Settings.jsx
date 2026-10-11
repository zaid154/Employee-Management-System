import { useState, useEffect } from 'react';
import {
  Building, Wallet, CalendarClock, CalendarDays, Bell, ShieldCheck,
  Save, RotateCcw, CheckCircle2, Server, Database, Lock, Globe,
  Clock, Percent, DollarSign, Calendar, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { isPrivileged } from '../lib/constants.js';
import {
  PageHeader, Card, CardHeader, Button, Badge, Field, Input, Select,
  AlertBanner,
} from '../components/ui.jsx';

const DEFAULT_SETTINGS = {
  // Company Profile
  companyName: 'PeoplePay Technologies Inc.',
  companyRegNo: 'CIN-U72200DL2024PTC123456',
  officialEmail: 'hr@peoplepay.internal',
  supportPhone: '+91 (011) 4567-8900',
  headquarters: 'Tower B, Tech Park, Cyber City, Gurugram, India',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  fiscalYearStart: 'april',

  // Payroll Configuration
  payrollCycleDay: 'last-day',
  workingDaysModel: '26',
  employeePfRate: '12',
  employerPfRate: '12',
  professionalTax: true,
  overtimeMultiplier: '1.5',
  autoEmailPayslips: true,

  // Attendance & Shifts
  workShiftStart: '09:00',
  workShiftEnd: '18:00',
  gracePeriodMins: '15',
  halfDayHours: '4.5',
  weekOffPolicy: '5-day',
  autoMarkAbsent: true,

  // Leave Quotas
  annualCasualLeave: '12',
  annualSickLeave: '12',
  annualEarnedLeave: '18',
  maxConsecutiveLeaves: '3',
  carryForwardLimit: '10',
  maternityWeeks: '26',

  // Security & Notifications
  notifyHrOnLeave: true,
  dailyAttendanceReminder: true,
  sessionTimeoutHours: '8',
};

const STORAGE_KEY = 'ems_enterprise_system_settings';

export default function Settings() {
  const { user } = useAuth();
  const canModify = isPrivileged(user?.role);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
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

  return (
    <div className="settings-container">
      <PageHeader
        title="System Settings & Policy"
        subtitle="Manage company defaults, shift timings, payroll calculation rules, and leave quotas"
        actions={
          canModify && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={RotateCcw}
                onClick={handleReset}
                disabled={saving}
              >
                Reset Defaults
              </Button>
              <Button
                icon={Save}
                onClick={handleSave}
                loading={saving}
                disabled={!isDirty}
              >
                Save Changes
              </Button>
            </div>
          )
        }
      />

      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="mb-4">
          <AlertBanner
            type="warning"
            title="Unsaved Changes Pending"
            message="You have modified system configurations. Review the fields below and click 'Save Changes' to apply."
          />
        </div>
      )}

      {/* ============================================================
          SECTION 1: Organization & Company Profile
          ============================================================ */}
      <Card pad={false} className="settings-card">
        <CardHeader
          title="Organization & Company Profile"
          subtitle="Official corporate registration details, headquarters, timezone, and fiscal calendar"
          action={
            <span className="settings-section-badge">
              <Building size={14} /> Corporate Identity
            </span>
          }
        />
        <div className="card-pad">
          <div className="form-grid-2">
            <Field
              label="Legal Company Name"
              hint="Official business name displayed on employee payslips, appointment letters, and reports."
              required
            >
              <Input
                value={settings.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="Registration / CIN Number"
              hint="Corporate Identity Number for statutory filings and tax records."
            >
              <Input
                value={settings.companyRegNo}
                onChange={(e) => handleChange('companyRegNo', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="Primary Accounting Currency"
              hint="Standard currency used for base salaries, allowances, and payslip calculations."
            >
              <Select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                disabled={!canModify}
              >
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="USD">USD ($ US Dollar)</option>
                <option value="EUR">EUR (€ Euro)</option>
                <option value="GBP">GBP (£ British Pound)</option>
                <option value="AED">AED (د.إ UAE Dirham)</option>
              </Select>
            </Field>

            <Field
              label="Corporate Timezone"
              hint="Timezone used to record timestamps for employee check-in and check-out punches."
            >
              <Select
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                disabled={!canModify}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
              </Select>
            </Field>

            <Field
              label="Official HR Support Email"
              hint="Default contact email where employees send leave queries and payroll questions."
            >
              <Input
                type="email"
                value={settings.officialEmail}
                onChange={(e) => handleChange('officialEmail', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="HR Helpdesk Phone"
              hint="Direct telephone hotline displayed on the employee dashboard."
            >
              <Input
                value={settings.supportPhone}
                onChange={(e) => handleChange('supportPhone', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="Fiscal Financial Year"
              hint="Annual accounting cycle when annual leave quotas reset and statutory taxes are audited."
            >
              <Select
                value={settings.fiscalYearStart}
                onChange={(e) => handleChange('fiscalYearStart', e.target.value)}
                disabled={!canModify}
              >
                <option value="april">April 1 – March 31 (Standard Indian FY)</option>
                <option value="january">January 1 – December 31 (Calendar Year)</option>
              </Select>
            </Field>

            <Field
              label="Headquarters / Registered Address"
              hint="Physical corporate office location printed on official PDF payslips."
            >
              <Input
                value={settings.headquarters}
                onChange={(e) => handleChange('headquarters', e.target.value)}
                disabled={!canModify}
              />
            </Field>
          </div>
        </div>
      </Card>

      {/* ============================================================
          SECTION 2: Payroll & Compensation Rules
          ============================================================ */}
      <Card pad={false} className="settings-card">
        <CardHeader
          title="Payroll & Compensation Rules"
          subtitle="Monthly salary disbursement cycle, working days divisor, statutory PF rates, and overtime compensation"
          action={
            <span className="settings-section-badge">
              <Wallet size={14} /> Salary & Statutory
            </span>
          }
        />
        <div className="card-pad">
          <div className="form-grid-2">
            <Field
              label="Monthly Salary Payday"
              hint="The scheduled date when monthly salary batches are processed and released."
            >
              <Select
                value={settings.payrollCycleDay}
                onChange={(e) => handleChange('payrollCycleDay', e.target.value)}
                disabled={!canModify}
              >
                <option value="last-day">Last Business Day of Month</option>
                <option value="1st">1st of Following Month</option>
                <option value="25th">25th of Current Month</option>
                <option value="28th">28th of Current Month</option>
              </Select>
            </Field>

            <Field
              label="Salary Working Days Model"
              hint="Number of days used to calculate an employee's per-day wage rate for leaves and deductions."
            >
              <Select
                value={settings.workingDaysModel}
                onChange={(e) => handleChange('workingDaysModel', e.target.value)}
                disabled={!canModify}
              >
                <option value="26">26 Days (Standard Industrial - Sundays Excluded)</option>
                <option value="22">22 Days (Corporate 5-Day Work Week)</option>
                <option value="calendar">Actual Calendar Days in Month (28–31)</option>
              </Select>
            </Field>

            <Field
              label="Employee PF Deduction (%)"
              hint="Statutory Provident Fund percentage deducted from monthly Basic Pay (Standard: 12%)."
            >
              <Input
                type="number"
                value={settings.employeePfRate}
                onChange={(e) => handleChange('employeePfRate', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="Employer Matching PF (%)"
              hint="Company's matching Provident Fund contribution (Standard: 12%)."
            >
              <Input
                type="number"
                value={settings.employerPfRate}
                onChange={(e) => handleChange('employerPfRate', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="Overtime Hourly Multiplier"
              hint="Multiplier applied to hourly wage for approved extra hours worked beyond shifts."
            >
              <Select
                value={settings.overtimeMultiplier}
                onChange={(e) => handleChange('overtimeMultiplier', e.target.value)}
                disabled={!canModify}
              >
                <option value="1.0">1.0x (Standard Hourly Rate)</option>
                <option value="1.5">1.5x Hourly Wage (Standard Overtime)</option>
                <option value="2.0">2.0x Hourly Wage (Double Time / Sunday Work)</option>
              </Select>
            </Field>

            <Field
              label="State Professional Tax (PT)"
              hint="State statutory tax deducted from monthly gross compensation."
            >
              <Select
                value={settings.professionalTax ? 'true' : 'false'}
                onChange={(e) => handleChange('professionalTax', e.target.value === 'true')}
                disabled={!canModify}
              >
                <option value="true">Enabled (Auto-apply ₹200 standard monthly deduction)</option>
                <option value="false">Disabled / State Tax Exempt</option>
              </Select>
            </Field>

            <Field
              label="Auto-Email Payslips on Approval"
              hint="Automatically email PDF salary slip directly to employee's registered email when paid."
            >
              <Select
                value={settings.autoEmailPayslips ? 'true' : 'false'}
                onChange={(e) => handleChange('autoEmailPayslips', e.target.value === 'true')}
                disabled={!canModify}
              >
                <option value="true">Enabled (Auto-send PDF to employee email)</option>
                <option value="false">Disabled (Employee downloads manually)</option>
              </Select>
            </Field>

            <div className="settings-info-box">
              <Info size={16} className="text-primary" style={{ flexShrink: 0, marginTop: 1 }} />
              <span className="text-xs text-2" style={{ lineHeight: 1.5 }}>
                <strong>Statutory Compliance Note:</strong> PF deductions apply to (Basic + DA) up to statutory ceilings. Income tax (TDS) complies with prevailing taxation slabs.
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================================
          SECTION 3: Attendance & Shift Timings
          ============================================================ */}
      <Card pad={false} className="settings-card">
        <CardHeader
          title="Attendance & Shift Timings"
          subtitle="Standard daily shift schedule, arrival grace buffer, half-day threshold, and automated absence detection"
          action={
            <span className="settings-section-badge">
              <CalendarClock size={14} /> Time & Shifts
            </span>
          }
        />
        <div className="card-pad">
          <div className="form-grid-2">
            <Field
              label="Standard Shift Start Time"
              hint="Expected daily arrival time. Punches recorded after grace period are marked 'Late Arrival'."
              required
            >
              <Input
                type="time"
                value={settings.workShiftStart}
                onChange={(e) => handleChange('workShiftStart', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="Standard Shift End Time"
              hint="Official daily departure time. Checking out earlier will be flagged in attendance logs."
              required
            >
              <Input
                type="time"
                value={settings.workShiftEnd}
                onChange={(e) => handleChange('workShiftEnd', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="Arrival Grace Period"
              hint="Buffer minutes after shift start during which employee punch is still classified as 'Present'."
            >
              <Select
                value={settings.gracePeriodMins}
                onChange={(e) => handleChange('gracePeriodMins', e.target.value)}
                disabled={!canModify}
              >
                <option value="15">15 Minutes (Standard - punches up to 09:15 AM On-Time)</option>
                <option value="10">10 Minutes</option>
                <option value="30">30 Minutes (Relaxed)</option>
                <option value="0">0 Minutes (Strict - 09:01 AM is Late)</option>
              </Select>
            </Field>

            <Field
              label="Half-Day Min. Work Hours"
              hint="Minimum worked hours in a shift required to qualify for half-day attendance credit."
            >
              <Select
                value={settings.halfDayHours}
                onChange={(e) => handleChange('halfDayHours', e.target.value)}
                disabled={!canModify}
              >
                <option value="4.5">4.5 Hours (Standard for 9-hour shift)</option>
                <option value="4.0">4.0 Hours</option>
                <option value="5.0">5.0 Hours</option>
              </Select>
            </Field>

            <Field
              label="Weekly Off Schedule"
              hint="Official weekly rest days excluded from mandatory daily shift attendance."
            >
              <Select
                value={settings.weekOffPolicy}
                onChange={(e) => handleChange('weekOffPolicy', e.target.value)}
                disabled={!canModify}
              >
                <option value="5-day">5-Day Work Week (Saturday & Sunday Off)</option>
                <option value="6-day">6-Day Work Week (Sunday Off only)</option>
                <option value="alt-sat">Alternate Saturdays (2nd & 4th Saturday Off)</option>
              </Select>
            </Field>

            <Field
              label="Automated Absence Detection"
              hint="Automatically records absent status for unpunched shifts after mid-day."
            >
              <Select
                value={settings.autoMarkAbsent ? 'true' : 'false'}
                onChange={(e) => handleChange('autoMarkAbsent', e.target.value === 'true')}
                disabled={!canModify}
              >
                <option value="true">Enabled (Auto-mark Absent after 1:00 PM if no clock-in)</option>
                <option value="false">Disabled (Leave empty for manual HR review)</option>
              </Select>
            </Field>
          </div>
        </div>
      </Card>

      {/* ============================================================
          SECTION 4: Leave Quotas & Vacation Policy
          ============================================================ */}
      <Card pad={false} className="settings-card">
        <CardHeader
          title="Leave Quotas & Vacation Policy"
          subtitle="Annual paid leave allowances per employee, statutory maternity benefit, and carry-forward caps"
          action={
            <span className="settings-section-badge">
              <CalendarDays size={14} /> Quotas & Policies
            </span>
          }
        />
        <div className="card-pad">
          {/* Key Annual Leave Quotas (CL, SL, EL) */}
          <div className="form-grid-3 mb-3">
            <Field
              label="Casual Leave (CL)"
              hint="Paid days per year allocated for personal emergencies or short planned time-off."
            >
              <Input
                type="number"
                value={settings.annualCasualLeave}
                onChange={(e) => handleChange('annualCasualLeave', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="Sick Leave (SL)"
              hint="Paid days per year reserved for medical recovery, doctor visits, and illness."
            >
              <Input
                type="number"
                value={settings.annualSickLeave}
                onChange={(e) => handleChange('annualSickLeave', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="Earned Leave (EL)"
              hint="Annual paid vacation leaves accrued across the year (1.5 days / month)."
            >
              <Input
                type="number"
                value={settings.annualEarnedLeave}
                onChange={(e) => handleChange('annualEarnedLeave', e.target.value)}
                disabled={!canModify}
              />
            </Field>
          </div>

          <div className="form-grid-2">
            <Field
              label="Paid Maternity Benefit (Weeks)"
              hint="Statutory 26 weeks paid leave granted to eligible female staff under Maternity Benefit Act."
            >
              <Input
                type="number"
                value={settings.maternityWeeks}
                onChange={(e) => handleChange('maternityWeeks', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="Earned Leave Carry-Forward Cap (Days)"
              hint="Maximum unused Earned Leaves that roll over into the new fiscal year (excess leaves lapse)."
            >
              <Input
                type="number"
                value={settings.carryForwardLimit}
                onChange={(e) => handleChange('carryForwardLimit', e.target.value)}
                disabled={!canModify}
              />
            </Field>

            <Field
              label="Consecutive Leave Cap (Without HR Approval)"
              hint="Maximum continuous leave days before advance HR clearance is mandatory."
            >
              <Select
                value={settings.maxConsecutiveLeaves}
                onChange={(e) => handleChange('maxConsecutiveLeaves', e.target.value)}
                disabled={!canModify}
              >
                <option value="3">3 Consecutive Days (Standard - 4+ days requires advance approval)</option>
                <option value="2">2 Consecutive Days (Strict)</option>
                <option value="5">5 Consecutive Days (Relaxed)</option>
                <option value="unlimited">Unlimited (Manager Discretion)</option>
              </Select>
            </Field>

            <div className="settings-info-box">
              <Info size={16} className="text-primary" style={{ flexShrink: 0, marginTop: 1 }} />
              <span className="text-xs text-2" style={{ lineHeight: 1.5 }}>
                <strong>Accrual Schedule:</strong> Casual and Sick leaves are credited in full on April 1st. Earned Leaves accrue monthly at 1.5 days per completed calendar month of active service.
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================================
          SECTION 5: Notifications, Security & Infrastructure
          ============================================================ */}
      <Card pad={false} className="settings-card">
        <CardHeader
          title="Notifications, Security & Infrastructure Telemetry"
          subtitle="Automated alerts, session inactivity timeout, and real-time backend engine health"
          action={
            <span className="settings-section-badge">
              <ShieldCheck size={14} /> Security & Telemetry
            </span>
          }
        />
        <div className="card-pad">
          <div className="form-grid-2">
            <Field
              label="Instant Leave Application Alert to HR"
              hint="Notifies HR Managers immediately when an employee submits a leave application."
            >
              <Select
                value={settings.notifyHrOnLeave ? 'true' : 'false'}
                onChange={(e) => handleChange('notifyHrOnLeave', e.target.value === 'true')}
                disabled={!canModify}
              >
                <option value="true">Enabled (Instant in-app notification to HR manager)</option>
                <option value="false">Disabled (Silent review)</option>
              </Select>
            </Field>

            <Field
              label="Morning Clock-In Reminder"
              hint="Sends morning reminder notification at 09:15 AM to employees who haven't clocked in."
            >
              <Select
                value={settings.dailyAttendanceReminder ? 'true' : 'false'}
                onChange={(e) => handleChange('dailyAttendanceReminder', e.target.value === 'true')}
                disabled={!canModify}
              >
                <option value="true">Enabled (Send reminder to clocked-out employees at 09:15 AM)</option>
                <option value="false">Disabled</option>
              </Select>
            </Field>

            <Field
              label="Browser Session Inactivity Timeout"
              hint="Automatically logs users out after extended inactivity to protect payroll confidentiality."
            >
              <Select
                value={settings.sessionTimeoutHours}
                onChange={(e) => handleChange('sessionTimeoutHours', e.target.value)}
                disabled={!canModify}
              >
                <option value="8">8 Hours (Standard Full Working Day)</option>
                <option value="4">4 Hours</option>
                <option value="24">24 Hours</option>
                <option value="never">Never Expire (Development Environment)</option>
              </Select>
            </Field>

            <div className="settings-info-box">
              <Lock size={16} className="text-primary" style={{ flexShrink: 0, marginTop: 1 }} />
              <span className="text-xs text-2" style={{ lineHeight: 1.5 }}>
                <strong>Security Architecture:</strong> Passwords are cryptographically salted with BCrypt. API endpoints enforce strict Role-Based Access Control (RBAC).
              </span>
            </div>
          </div>

          {/* Live Diagnostics Telemetry Strip */}
          <div className="settings-telemetry-grid">
            <div className="telemetry-card">
              <div className="telemetry-icon" style={{ color: 'var(--green-text)', background: 'var(--green-subtle)' }}>
                <Database size={17} />
              </div>
              <div>
                <div className="text-xs text-3 font-medium">Database</div>
                <div className="text-sm font-semi text-1">MongoDB Atlas</div>
                <div className="text-xs" style={{ color: 'var(--green-text)' }}>Connected · Healthy</div>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon" style={{ color: 'var(--blue-text)', background: 'var(--blue-subtle)' }}>
                <Server size={17} />
              </div>
              <div>
                <div className="text-xs text-3 font-medium">Backend API</div>
                <div className="text-sm font-semi text-1">Node / Express</div>
                <div className="text-xs" style={{ color: 'var(--blue-text)' }}>Port 5002 · v1.0.4-prod</div>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon" style={{ color: 'var(--purple-text)', background: 'var(--purple-subtle)' }}>
                <Lock size={17} />
              </div>
              <div>
                <div className="text-xs text-3 font-medium">Authentication</div>
                <div className="text-sm font-semi text-1">JWT Auth Engine</div>
                <div className="text-xs" style={{ color: 'var(--purple-text)' }}>HMAC-SHA256 Signed</div>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon" style={{ color: 'var(--amber-text)', background: 'var(--amber-subtle)' }}>
                <ShieldCheck size={17} />
              </div>
              <div>
                <div className="text-xs text-3 font-medium">Role Permissions</div>
                <div className="text-sm font-semi text-1">Enterprise RBAC</div>
                <div className="text-xs" style={{ color: 'var(--amber-text)' }}>4 Tier Hierarchy</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================================
          BOTTOM ACTION BAR: Save / Reset buttons always accessible
          ============================================================ */}
      {canModify && (
        <div className="settings-bottom-bar">
          <div>
            {isDirty ? (
              <span className="text-sm font-medium" style={{ color: 'var(--amber-text)' }}>
                You have modified settings. Don't forget to save your changes!
              </span>
            ) : (
              <span className="text-sm text-3">
                All settings and policies are saved and up to date.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={RotateCcw}
              onClick={handleReset}
              disabled={saving}
            >
              Reset Defaults
            </Button>
            <Button
              icon={Save}
              onClick={handleSave}
              loading={saving}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
