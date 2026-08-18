import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api.js';
import { Modal, Button, Field, Input, Select } from './ui.jsx';
import { fmtDateInput } from '../lib/format.js';
import { EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from '../lib/constants.js';

const empty = {
  firstName: '', lastName: '', email: '', phone: '', gender: '', dateOfBirth: '', address: '',
  designation: '', department: '', manager: '', employmentType: 'full-time', status: 'active',
  dateOfJoining: fmtDateInput(new Date()),
  salary: { basic: '', hra: '', allowances: '', pf: '', professionalTax: '' },
  createAccount: false, role: 'employee', password: '',
};

export default function EmployeeForm({ open, onClose, onSaved, employee, departments = [], managers = [] }) {
  const isEdit = Boolean(employee);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('personal');

  useEffect(() => {
    if (employee) {
      setForm({
        ...empty,
        ...employee,
        department: employee.department?._id || employee.department || '',
        manager: employee.manager?._id || employee.manager || '',
        dateOfBirth: fmtDateInput(employee.dateOfBirth),
        dateOfJoining: fmtDateInput(employee.dateOfJoining),
        salary: { ...empty.salary, ...(employee.salary || {}) },
        createAccount: false,
        password: '',
      });
    } else {
      setForm(empty);
    }
    setTab('personal');
  }, [employee, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSalary = (k, v) => setForm((f) => ({ ...f, salary: { ...f.salary, [k]: v } }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Coerce salary strings to numbers.
      const salary = Object.fromEntries(Object.entries(form.salary).map(([k, v]) => [k, Number(v) || 0]));
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
        toast.success('Employee updated');
      } else {
        await api.post('/employees', payload);
        toast.success('Employee added 🎉');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Could not save employee');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'job', label: 'Job & Salary' },
    ...(!isEdit ? [{ id: 'account', label: 'Login Access' }] : []),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit Employee' : 'Add Employee'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add employee'}</Button>
        </>
      }
    >
      <div className="segment mb-4" style={{ width: '100%' }}>
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)} type="button" style={{ flex: 1 }}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex-col gap-4">
        {tab === 'personal' && (
          <>
            <div className="grid-2" style={{ gap: 14 }}>
              <Field label="First name" required>
                <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
              </Field>
              <Field label="Last name" required>
                <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
              </Field>
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              <Field label="Email" required>
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </Field>
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              <Field label="Gender">
                <Select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Date of birth">
                <Input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
              </Field>
            </div>
            <Field label="Address">
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
          </>
        )}

        {tab === 'job' && (
          <>
            <div className="grid-2" style={{ gap: 14 }}>
              <Field label="Designation" required>
                <Input value={form.designation} onChange={(e) => set('designation', e.target.value)} required />
              </Field>
              <Field label="Department" required>
                <Select value={form.department} onChange={(e) => set('department', e.target.value)} required>
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              <Field label="Reporting manager">
                <Select value={form.manager} onChange={(e) => set('manager', e.target.value)}>
                  <option value="">None</option>
                  {managers.filter((m) => m._id !== employee?._id).map((m) => (
                    <option key={m._id} value={m._id}>{m.firstName} {m.lastName} · {m.designation}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Employment type">
                <Select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
                  {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              <Field label="Status">
                <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Date of joining">
                <Input type="date" value={form.dateOfJoining} onChange={(e) => set('dateOfJoining', e.target.value)} />
              </Field>
            </div>

            <div className="divider" />
            <div className="text-sm font-bold">Monthly Salary Structure (₹)</div>
            <div className="grid-2" style={{ gap: 14 }}>
              <Field label="Basic">
                <Input type="number" value={form.salary.basic} onChange={(e) => setSalary('basic', e.target.value)} />
              </Field>
              <Field label="HRA">
                <Input type="number" value={form.salary.hra} onChange={(e) => setSalary('hra', e.target.value)} />
              </Field>
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              <Field label="Allowances">
                <Input type="number" value={form.salary.allowances} onChange={(e) => setSalary('allowances', e.target.value)} />
              </Field>
              <Field label="PF deduction">
                <Input type="number" value={form.salary.pf} onChange={(e) => setSalary('pf', e.target.value)} />
              </Field>
            </div>
            <Field label="Professional tax">
              <Input type="number" value={form.salary.professionalTax} onChange={(e) => setSalary('professionalTax', e.target.value)} />
            </Field>
          </>
        )}

        {tab === 'account' && !isEdit && (
          <>
            <label className="flex items-center gap-3 pointer" style={{ padding: 14, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <input type="checkbox" checked={form.createAccount} onChange={(e) => set('createAccount', e.target.checked)} style={{ width: 18, height: 18 }} />
              <div>
                <div className="font-semi">Create a login account</div>
                <div className="text-xs muted">Let this employee sign in to the self-service portal.</div>
              </div>
            </label>
            {form.createAccount && (
              <div className="grid-2" style={{ gap: 14 }}>
                <Field label="Role">
                  <Select value={form.role} onChange={(e) => set('role', e.target.value)}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </Select>
                </Field>
                <Field label="Temporary password" required>
                  <Input type="text" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min 6 characters" />
                </Field>
              </div>
            )}
          </>
        )}
      </form>
    </Modal>
  );
}
