import { useState, useEffect } from 'react';
import {
  Building, Wallet, CalendarClock, CalendarDays, Bell, ShieldCheck,
  Save, RotateCcw, CheckCircle2, Server, Database, Lock, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { isPrivileged, ROLES } from '../lib/constants.js';
import {
  PageHeader, Card, CardHeader, Button, Badge, Field, Input, Select,
  Segment, AlertBanner,
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
  twoFactorAuth: false,
  sessionTimeoutHours: '8',
};

const STORAGE_KEY = 'ems_enterprise_system_settings';

export default function Settings() {
  const { user } = useAuth();
  const canModify = isPrivileged(user.role);

  const [activeTab, setActiveTab] = useState('general');
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
    if (window.confirm('Reset all configuration to factory defaults?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem(STORAGE_KEY);
      setIsDirty(false);
      toast.success('Settings reset to defaults');
    }
  };

  return (
    <>
      <PageHeader
        title="System Settings & Policy"
        subtitle="Configure organization parameters, payroll rules, shift timings, and security"
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

      {isDirty && (
        <div className="mb-4">
          <AlertBanner
            type="warning"
            title="Unsaved Changes"
            message="You have modified system configurations. Click 'Save Changes' at the top to apply."
          />
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="mb-4">
        <Segment
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'general', label: 'Organization & Profile' },
            { value: 'payroll', label: 'Payroll & Compensation' },
            { value: 'attendance', label: 'Attendance & Shifts' },
            { value: 'leaves', label: 'Leave Quotas & Policy' },
            { value: 'security', label: 'Security & System Health' },
          ]}
        />
      </div>

      {/* Tab 1: Organization & Profile */}
      {activeTab === 'general' && (
        <div className="grid-2">
          <Card pad={false}>
            <CardHeader
              title="Company Identity"
              subtitle="Official corporate registration details"
              action={<Building size={16} className="muted" />}
            />
            <div className="card-pad">
              <Field label="Legal Company Name" required>
                <Input
                  value={settings.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  disabled={!canModify}
                />
              </Field>

              <div className="form-grid-2">
                <Field label="Registration / CIN Number">
                  <Input
                    value={settings.companyRegNo}
                    onChange={(e) => handleChange('companyRegNo', e.target.value)}
                    disabled={!canModify}
                  />
                </Field>
                <Field label="Corporate Currency">
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
              </div>

              <Field label="Headquarters Address">
                <Input
                  value={settings.headquarters}
                  onChange={(e) => handleChange('headquarters', e.target.value)}
                  disabled={!canModify}
                />
              </Field>
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader
              title="Regional & Communications"
              subtitle="Timezone, fiscal year, and contact channels"
              action={<Globe size={16} className="muted" />}
            />
            <div className="card-pad">
              <div className="form-grid-2">
                <Field label="Corporate Timezone">
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

                <Field label="Fiscal Financial Year">
                  <Select
                    value={settings.fiscalYearStart}
                    onChange={(e) => handleChange('fiscalYearStart', e.target.value)}
                    disabled={!canModify}
                  >
                    <option value="april">April 1 – March 31 (Standard Indian FY)</option>
                    <option value="january">January 1 – December 31 (Calendar Year)</option>
                  </Select>
                </Field>
              </div>

              <div className="form-grid-2">
                <Field label="Official HR Contact Email">
                  <Input
                    type="email"
                    value={settings.officialEmail}
                    onChange={(e) => handleChange('officialEmail', e.target.value)}
                    disabled={!canModify}
                  />
                </Field>
                <Field label="HR Helpdesk Phone">
                  <Input
                    value={settings.supportPhone}
                    onChange={(e) => handleChange('supportPhone', e.target.value)}
                    disabled={!canModify}
                  />
                </Field>
              </div>

              <div className="p-3 mt-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} style={{ color: 'var(--green-text)' }} />
                  <span>Company profile information is embedded into generated official PDF payslips and tax summaries.</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Payroll & Compensation */}
      {activeTab === 'payroll' && (
        <div className="grid-2">
          <Card pad={false}>
            <CardHeader
              title="Payroll Processing Parameters"
              subtitle="Monthly salary cycle, day calculation, and overtime rates"
              action={<Wallet size={16} className="muted" />}
            />
            <div className="card-pad">
              <div className="form-grid-2">
                <Field label="Salary Disbursement Day">
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

                <Field label="Standard Working Days Model">
                  <Select
                    value={settings.workingDaysModel}
                    onChange={(e) => handleChange('workingDaysModel', e.target.value)}
                    disabled={!canModify}
                  >
                    <option value="26">26 Days (Standard Industrial Model)</option>
                    <option value="22">22 Days (5-Day Corporate Week)</option>
                    <option value="calendar">Actual Calendar Days in Month</option>
                  </Select>
                </Field>
              </div>

              <div className="form-grid-2">
                <Field label="Overtime Rate Multiplier">
                  <Select
                    value={settings.overtimeMultiplier}
                    onChange={(e) => handleChange('overtimeMultiplier', e.target.value)}
                    disabled={!canModify}
                  >
                    <option value="1.0">1.0x (Standard Hourly)</option>
                    <option value="1.5">1.5x Hourly Wage (Standard Overtime)</option>
                    <option value="2.0">2.0x Hourly Wage (Double Time / Holiday)</option>
                  </Select>
                </Field>

                <Field label="Auto-Email Payslips on Approval">
                  <Select
                    value={settings.autoEmailPayslips ? 'true' : 'false'}
                    onChange={(e) => handleChange('autoEmailPayslips', e.target.value === 'true')}
                    disabled={!canModify}
                  >
                    <option value="true">Enabled (Auto-send PDF to employee)</option>
                    <option value="false">Disabled (Manual download only)</option>
                  </Select>
                </Field>
              </div>
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader
              title="Statutory Deductions & Contributions"
              subtitle="Provident Fund (PF) and Professional Tax (PT) settings"
              action={<Building size={16} className="muted" />}
            />
            <div className="card-pad">
              <div className="form-grid-2">
                <Field label="Employee PF Contribution (%)">
                  <Input
                    type="number"
                    value={settings.employeePfRate}
                    onChange={(e) => handleChange('employeePfRate', e.target.value)}
                    disabled={!canModify}
                  />
                </Field>

                <Field label="Employer PF Contribution (%)">
                  <Input
                    type="number"
                    value={settings.employerPfRate}
                    onChange={(e) => handleChange('employerPfRate', e.target.value)}
                    disabled={!canModify}
                  />
                </Field>
              </div>

              <Field label="Professional Tax (PT) Auto-Deduction">
                <Select
                  value={settings.professionalTax ? 'true' : 'false'}
                  onChange={(e) => handleChange('professionalTax', e.target.value === 'true')}
                  disabled={!canModify}
                >
                  <option value="true">Enabled (Auto-apply ₹200 standard monthly PT)</option>
                  <option value="false">Disabled / Exempt</option>
                </Select>
              </Field>

              <div className="p-3 mt-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                <p className="text-xs muted" style={{ lineHeight: 1.5 }}>
                  <strong>Note:</strong> PF contributions are calculated on Base Salary + Dearness Allowance up to statutory ceilings. Tax deductions comply with prevailing income tax slabs.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Attendance & Shifts */}
      {activeTab === 'attendance' && (
        <div className="grid-2">
          <Card pad={false}>
            <CardHeader
              title="Shift Timings & Grace Period"
              subtitle="Daily work schedule and late arrival rules"
              action={<CalendarClock size={16} className="muted" />}
            />
            <div className="card-pad">
              <div className="form-grid-2">
                <Field label="Shift Start Time" required>
                  <Input
                    type="time"
                    value={settings.workShiftStart}
                    onChange={(e) => handleChange('workShiftStart', e.target.value)}
                    disabled={!canModify}
                  />
                </Field>

                <Field label="Shift End Time" required>
                  <Input
                    type="time"
                    value={settings.workShiftEnd}
                    onChange={(e) => handleChange('workShiftEnd', e.target.value)}
                    disabled={!canModify}
                  />
                </Field>
              </div>

              <div className="form-grid-2">
                <Field label="Check-in Grace Period (Minutes)">
                  <Select
                    value={settings.gracePeriodMins}
                    onChange={(e) => handleChange('gracePeriodMins', e.target.value)}
                    disabled={!canModify}
                  >
                    <option value="0">0 mins (Strict)</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes (Standard)</option>
                    <option value="30">30 minutes</option>
                  </Select>
                </Field>

                <Field label="Half-Day Min. Work Hours">
                  <Select
                    value={settings.halfDayHours}
                    onChange={(e) => handleChange('halfDayHours', e.target.value)}
                    disabled={!canModify}
                  >
                    <option value="4.0">4.0 Hours</option>
                    <option value="4.5">4.5 Hours (Standard)</option>
                    <option value="5.0">5.0 Hours</option>
                  </Select>
                </Field>
              </div>
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader
              title="Work Week & Auto-Absence"
              subtitle="Weekend structure and automated attendance status rules"
              action={<CalendarClock size={16} className="muted" />}
            />
            <div className="card-pad">
              <Field label="Weekly Off Policy">
                <Select
                  value={settings.weekOffPolicy}
                  onChange={(e) => handleChange('weekOffPolicy', e.target.value)}
                  disabled={!canModify}
                >
                  <option value="5-day">5-Day Work Week (Saturday & Sunday Off)</option>
                  <option value="6-day">6-Day Work Week (Sunday Off only)</option>
                  <option value="alt-sat">Alternate Saturdays (2nd & 4th Sat Off)</option>
                </Select>
              </Field>

                <Field label="Auto-Mark Absent for Missing Check-In">
                  <Select
                    value={settings.autoMarkAbsent ? 'true' : 'false'}
                    onChange={(e) => handleChange('autoMarkAbsent', e.target.value === 'true')}
                    disabled={!canModify}
                  >
                    <option value="true">Enabled (Auto-mark Absent after 1:00 PM if no clock-in)</option>
                    <option value="false">Disabled (Keep empty / pending)</option>
                  </Select>
                </Field>

              <div className="p-3 mt-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} style={{ color: 'var(--green-text)' }} />
                  <span>Check-ins within grace period ({settings.gracePeriodMins}m) are flagged as <strong>On-Time</strong>; arrivals after that are recorded as <strong>Late</strong>.</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Leave Quotas & Policy */}
      {activeTab === 'leaves' && (
        <div className="grid-2">
          <Card pad={false}>
            <CardHeader
              title="Annual Leave Allotment"
              subtitle="Standard paid leave days credited per employee per fiscal year"
              action={<CalendarDays size={16} className="muted" />}
            />
            <div className="card-pad">
              <div className="form-grid-3">
                <Field label="Casual Leave (CL)">
                  <Input
                    type="number"
                    value={settings.annualCasualLeave}
                    onChange={(e) => handleChange('annualCasualLeave', e.target.value)}
                    disabled={!canModify}
                  />
                </Field>

                <Field label="Sick Leave (SL)">
                  <Input
                    type="number"
                    value={settings.annualSickLeave}
                    onChange={(e) => handleChange('annualSickLeave', e.target.value)}
                    disabled={!canModify}
                  />
                </Field>

                <Field label="Earned Leave (EL)">
                  <Input
                    type="number"
                    value={settings.annualEarnedLeave}
                    onChange={(e) => handleChange('annualEarnedLeave', e.target.value)}
                    disabled={!canModify}
                  >
                  </Input>
                </Field>
              </div>

              <div className="form-grid-2">
                <Field label="Maternity Leave (Weeks)">
                  <Input
                    type="number"
                    value={settings.maternityWeeks}
                    onChange={(e) => handleChange('maternityWeeks', e.target.value)}
                    disabled={!canModify}
                  />
                </Field>

                <Field label="Max Annual Carry-Forward (Days)">
                  <Input
                    type="number"
                    value={settings.carryForwardLimit}
                    onChange={(e) => handleChange('carryForwardLimit', e.target.value)}
                    disabled={!canModify}
                  />
                </Field>
              </div>
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader
              title="Leave Workflow & Constraints"
              subtitle="Approval hierarchy and consecutive leave limits"
              action={<CalendarClock size={16} className="muted" />}
            />
            <div className="card-pad">
              <Field label="Max Consecutive Leaves without Advance HR Notice">
                <Select
                  value={settings.maxConsecutiveLeaves}
                  onChange={(e) => handleChange('maxConsecutiveLeaves', e.target.value)}
                  disabled={!canModify}
                >
                  <option value="2">2 Consecutive Days</option>
                  <option value="3">3 Consecutive Days (Standard)</option>
                  <option value="5">5 Consecutive Days</option>
                  <option value="unlimited">Unlimited (Manager Discretion)</option>
                </Select>
              </Field>

              <div className="p-3 mt-4" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                <p className="text-xs muted" style={{ lineHeight: 1.5 }}>
                  <strong>Leave Accrual Note:</strong> Casual and Sick leaves are credited on the 1st of April each fiscal year. Earned leaves accrue at the rate of 1.5 days per completed month of active service.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Security & System Health */}
      {activeTab === 'security' && (
        <div className="grid-2">
          <Card pad={false}>
            <CardHeader
              title="Access & Notification Triggers"
              subtitle="Automated alerts and security parameters"
              action={<Bell size={16} className="muted" />}
            />
            <div className="card-pad">
              <Field label="HR Notification on New Leave Application">
                <Select
                  value={settings.notifyHrOnLeave ? 'true' : 'false'}
                  onChange={(e) => handleChange('notifyHrOnLeave', e.target.value === 'true')}
                  disabled={!canModify}
                >
                  <option value="true">Enabled (Instant in-app + email alert)</option>
                  <option value="false">Disabled</option>
                </Select>
              </Field>

              <Field label="Daily Attendance Reminder Notification">
                <Select
                  value={settings.dailyAttendanceReminder ? 'true' : 'false'}
                  onChange={(e) => handleChange('dailyAttendanceReminder', e.target.value === 'true')}
                  disabled={!canModify}
                >
                  <option value="true">Enabled (Send reminder to clocked-out employees at 09:15 AM)</option>
                  <option value="false">Disabled</option>
                </Select>
              </Field>

              <Field label="Session Idle Timeout">
                <Select
                  value={settings.sessionTimeoutHours}
                  onChange={(e) => handleChange('sessionTimeoutHours', e.target.value)}
                  disabled={!canModify}
                >
                  <option value="4">4 Hours</option>
                  <option value="8">8 Hours (Standard Business Day)</option>
                  <option value="24">24 Hours</option>
                  <option value="never">Never Expire (Development Mode)</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader
              title="System Diagnostics & Telemetry"
              subtitle="Live production infrastructure status"
              action={<Server size={16} className="muted" />}
            />
            <div className="card-pad">
              <div className="flex-col gap-3">
                <div className="flex items-center justify-between p-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 text-xs">
                    <Database size={15} style={{ color: 'var(--green-text)' }} />
                    <span className="font-semi">Database (MongoDB Atlas)</span>
                  </div>
                  <Badge color="green">Connected · Healthy</Badge>
                </div>

                <div className="flex items-center justify-between p-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 text-xs">
                    <Server size={15} style={{ color: 'var(--blue-text)' }} />
                    <span className="font-semi">API Engine (Node/Express)</span>
                  </div>
                  <Badge color="blue">Port 5002 · v1.0.4-prod</Badge>
                </div>

                <div className="flex items-center justify-between p-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 text-xs">
                    <Lock size={15} style={{ color: 'var(--purple-text)' }} />
                    <span className="font-semi">Authentication Security</span>
                  </div>
                  <Badge color="purple">JWT HMAC-SHA256</Badge>
                </div>

                <div className="flex items-center justify-between p-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldCheck size={15} style={{ color: 'var(--green-text)' }} />
                    <span className="font-semi">Role-Based Access Control</span>
                  </div>
                  <span className="text-xs muted font-mono">Admin · HR · Manager · Employee</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
