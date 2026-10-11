import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api.js';
import { Modal, Button, Field, Input, Select, Segment } from './ui.jsx';
import { fmtDateInput } from '../lib/format.js';
import { EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from '../lib/constants.js';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  designation: '',
  department: '',
  manager: '',
  employmentType: 'full-time',
  status: 'active',
  dateOfJoining: fmtDateInput(new Date()),
  salary: { basic: '', hra: '', allowances: '', pf: '', professionalTax: '' },
  createAccount: false,
  role: 'employee',
  password: '',
};

export default function EmployeeForm({
  open,
  onClose,
  onSaved,
  employee,
  departments = [],
  managers = [],
}) {
  const isEdit = Boolean(employee);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('personal');

  useEffect(() => {
    if (employee) {
      setForm({
        ...initialForm,
        ...employee,
        department: employee.department?._id || employee.department || '',
        manager: employee.manager?._id || employee.manager || '',
        dateOfBirth: fmtDateInput(employee.dateOfBirth),
        dateOfJoining: fmtDateInput(employee.dateOfJoining),
        salary: { ...initialForm.salary, ...(employee.salary || {}) },
        createAccount: false,
        password: '',
      });
    } else {
      setForm(initialForm);
    }
    setTab('personal');
  }, [employee, open]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateSalary = (key, value) => {
    setForm((prev) => ({
      ...prev,
      salary: { ...prev.salary, [key]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.designation) {
      toast.error('Please complete all required fields');
      return;
    }

    setSaving(true);
    try {
      const salary = Object.fromEntries(
        Object.entries(form.salary).map(([k, v]) => [k, Number(v) || 0])
      );
      const payload = {
        ...form,
        salary,
        manager: form.manager || null,
        dateOfBirth: form.dateOfBirth || null,
      };

      if (!payload.createAccount) {
        delete payload.password;
        delete payload.role;
      }

      if (isEdit) {
        await api.patch(`/employees/${employee._id}`, payload);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees', payload);
        toast.success('Employee onboarded successfully');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { value: 'personal', label: '1. Personal Details' },
    { value: 'job', label: '2. Job & Compensation' },
    ...(!isEdit ? [{ value: 'account', label: '3. System Access' }] : []),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit Employee Record' : 'Onboard New Employee'}
      subtitle={isEdit ? `Updating profile for ${employee?.firstName} ${employee?.lastName}` : 'Add a new member to the organization'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? 'Save Changes' : 'Complete Onboarding'}
          </Button>
        </>
      }
    >
      <div className="mb-4">
        <Segment options={tabs} value={tab} onChange={setTab} />
      </div>

      <form onSubmit={handleSubmit}>
        {tab === 'personal' && (
          <div>
            <div className="form-grid-2">
              <Field label="First Name" required>
                <Input
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="e.g. Priya"
                  required
                />
              </Field>
              <Field label="Last Name" required>
                <Input
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="e.g. Nair"
                  required
                />
              </Field>
            </div>

            <div className="form-grid-2">
              <Field label="Work Email" required>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="priya.nair@company.com"
                  required
                />
              </Field>
              <Field label="Phone Number">
                <Input
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </Field>
            </div>

            <div className="form-grid-2">
              <Field label="Gender">
                <Select
                  value={form.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Date of Birth">
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                />
              </Field>
            </div>

            <Field label="Residential Address">
              <Input
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Apartment, Street, City, State, PIN Code"
              />
            </Field>
          </div>
        )}

        {tab === 'job' && (
          <div>
            <div className="form-grid-2">
              <Field label="Job Designation" required>
                <Input
                  value={form.designation}
                  onChange={(e) => updateField('designation', e.target.value)}
                  placeholder="e.g. Software Engineer"
                  required
                />
              </Field>
              <Field label="Department">
                <Select
                  value={form.department}
                  onChange={(e) => updateField('department', e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="form-grid-2">
              <Field label="Reporting Manager">
                <Select
                  value={form.manager}
                  onChange={(e) => updateField('manager', e.target.value)}
                >
                  <option value="">None (Reports to Leadership)</option>
                  {managers
                    .filter((m) => m._id !== employee?._id)
                    .map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.name || 'Manager'} ({m.designation})
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Date of Joining" required>
                <Input
                  type="date"
                  value={form.dateOfJoining}
                  onChange={(e) => updateField('dateOfJoining', e.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="form-grid-2">
              <Field label="Employment Type">
                <Select
                  value={form.employmentType}
                  onChange={(e) => updateField('employmentType', e.target.value)}
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Employment Status">
                <Select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  {EMPLOYEE_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div className="text-sm font-semi mb-3">Monthly Compensation Breakdown (₹)</div>
              <div className="form-grid-3">
                <Field label="Basic Salary">
                  <Input
                    type="number"
                    value={form.salary.basic}
                    onChange={(e) => updateSalary('basic', e.target.value)}
                    placeholder="40000"
                  />
                </Field>
                <Field label="HRA">
                  <Input
                    type="number"
                    value={form.salary.hra}
                    onChange={(e) => updateSalary('hra', e.target.value)}
                    placeholder="20000"
                  />
                </Field>
                <Field label="Allowances">
                  <Input
                    type="number"
                    value={form.salary.allowances}
                    onChange={(e) => updateSalary('allowances', e.target.value)}
                    placeholder="10000"
                  />
                </Field>
              </div>
              <div className="form-grid-2">
                <Field label="Provident Fund (PF) Deduction">
                  <Input
                    type="number"
                    value={form.salary.pf}
                    onChange={(e) => updateSalary('pf', e.target.value)}
                    placeholder="1800"
                  />
                </Field>
                <Field label="Professional Tax Deduction">
                  <Input
                    type="number"
                    value={form.salary.professionalTax}
                    onChange={(e) => updateSalary('professionalTax', e.target.value)}
                    placeholder="200"
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {tab === 'account' && !isEdit && (
          <div>
            <div style={{ padding: 12, backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
              <label className="flex items-center gap-2 pointer text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.createAccount}
                  onChange={(e) => updateField('createAccount', e.target.checked)}
                />
                <span>Generate portal login credentials for this employee</span>
              </label>
            </div>

            {form.createAccount && (
              <div className="form-grid-2">
                <Field label="Account Role">
                  <Select
                    value={form.role}
                    onChange={(e) => updateField('role', e.target.value)}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Team Manager</option>
                    <option value="hr">HR Manager</option>
                    <option value="admin">Administrator</option>
                  </Select>
                </Field>
                <Field label="Initial Password" required>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="At least 6 characters"
                    required
                  />
                </Field>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
