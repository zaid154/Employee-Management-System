import { useState } from 'react';
import { CalendarCheck, LogIn, LogOut, Clock, Plus, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Badge, Avatar, Loader, EmptyState, Select, Input,
  Pagination, Modal, Field,
} from '../components/ui.jsx';
import { fmtDate, fmtTime, fullName, fmtDateInput } from '../lib/format.js';
import { canManage, isPrivileged, ATTENDANCE_STATUSES } from '../lib/constants.js';

export default function Attendance() {
  const { user } = useAuth();
  const manage = canManage(user.role);
  const hasEmployee = Boolean(user.employee);

  const [page, setPage] = useState(1);
  const [empFilter, setEmpFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const query = new URLSearchParams({
    page, limit: 15,
    ...(empFilter && { employee: empFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(from && { from }),
    ...(to && { to }),
  }).toString();

  const { data, loading, refetch } = useFetch(`/attendance?${query}`, [query]);
  const { data: today, refetch: refetchToday } = useFetch(hasEmployee ? '/attendance/today' : null);
  const { data: summary, refetch: refetchSummary } = useFetch(hasEmployee ? '/attendance/summary' : null);
  const { data: options } = useFetch(isPrivileged(user.role) ? '/employees/options' : null);

  const [busy, setBusy] = useState(false);
  const [markOpen, setMarkOpen] = useState(false);

  const punch = async (type) => {
    setBusy(true);
    try {
      await api.post(`/attendance/${type}`);
      toast.success(type === 'check-in' ? 'Checked in ✅' : 'Checked out 👋');
      refetchToday(); refetchSummary(); refetch();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const att = today?.data;
  const sm = summary?.data;
  const records = data?.data || [];

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="Track daily check-ins and working hours"
        actions={manage && <Button icon={Plus} onClick={() => setMarkOpen(true)}>Mark Attendance</Button>}
      />

      {hasEmployee && (
        <div className="grid-2 mb-4">
          <Card>
            <div className="card-header">
              <div className="card-title">Today · {fmtDate(new Date())}</div>
              <Clock size={18} className="muted" />
            </div>
            <div className="flex gap-5 items-center flex-wrap">
              <div className="flex gap-5">
                <div>
                  <div className="text-xs muted">Check in</div>
                  <div className="font-bold text-xl">{att?.checkIn ? fmtTime(att.checkIn) : '—'}</div>
                </div>
                <div>
                  <div className="text-xs muted">Check out</div>
                  <div className="font-bold text-xl">{att?.checkOut ? fmtTime(att.checkOut) : '—'}</div>
                </div>
                <div>
                  <div className="text-xs muted mb-2">Status</div>
                  {att ? <Badge status={att.status}>{att.status}</Badge> : <span className="muted text-sm">Not marked</span>}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                {!att?.checkIn ? (
                  <Button icon={LogIn} onClick={() => punch('check-in')} disabled={busy}>Check in</Button>
                ) : !att?.checkOut ? (
                  <Button icon={LogOut} variant="ghost" onClick={() => punch('check-out')} disabled={busy}>Check out</Button>
                ) : (
                  <Badge status="approved">Done · {att.workHours}h</Badge>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="card-title mb-4">This Month&apos;s Summary</div>
            {sm ? (
              <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Present', value: sm.present, color: '#10b981' },
                  { label: 'Late', value: sm.late, color: '#f59e0b' },
                  { label: 'Absent', value: sm.absent, color: '#ef4444' },
                  { label: 'Hours', value: sm.totalHours, color: '#6366f1' },
                ].map((x) => (
                  <div key={x.label} style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)', textAlign: 'center' }}>
                    <div className="font-bold text-xl" style={{ color: x.color }}>{x.value}</div>
                    <div className="text-xs muted">{x.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="muted text-sm">No records this month.</span>
            )}
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-4" style={{ padding: 16 }}>
        <div className="toolbar" style={{ margin: 0 }}>
          <Filter size={16} className="muted" />
          {isPrivileged(user.role) && (
            <Select value={empFilter} onChange={(e) => { setEmpFilter(e.target.value); setPage(1); }} style={{ minWidth: 190 }}>
              <option value="">All employees</option>
              {(options?.data || []).map((m) => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
            </Select>
          )}
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ minWidth: 140 }}>
            <option value="">All statuses</option>
            {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-xs muted">From</span>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} style={{ width: 150 }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs muted">To</span>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} style={{ width: 150 }} />
          </div>
        </div>
      </Card>

      {loading ? (
        <Loader />
      ) : records.length === 0 ? (
        <Card><EmptyState icon={CalendarCheck} title="No attendance records" message="Records will appear here as employees check in." /></Card>
      ) : (
        <Card pad={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {isPrivileged(user.role) && <th>Employee</th>}
                  <th>Date</th>
                  <th>Check in</th>
                  <th>Check out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    {isPrivileged(user.role) && (
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={fullName(r.employee)} src={r.employee?.avatar} size={32} />
                          <div>
                            <div className="strong text-sm">{fullName(r.employee)}</div>
                            <div className="text-xs muted">{r.employee?.employeeId}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="strong">{fmtDate(r.date)}</td>
                    <td>{r.checkIn ? fmtTime(r.checkIn) : '—'}</td>
                    <td>{r.checkOut ? fmtTime(r.checkOut) : '—'}</td>
                    <td>{r.workHours ? `${r.workHours}h` : '—'}</td>
                    <td><Badge status={r.status}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} onPage={setPage} />
          </div>
        </Card>
      )}

      {manage && (
        <MarkModal open={markOpen} onClose={() => setMarkOpen(false)} onSaved={refetch} options={options?.data || []} />
      )}
    </>
  );
}

function MarkModal({ open, onClose, onSaved, options }) {
  const [form, setForm] = useState({ employee: '', date: fmtDateInput(new Date()), status: 'present', checkIn: '', checkOut: '', note: '' });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        employee: form.employee,
        date: form.date,
        status: form.status,
        note: form.note,
        checkIn: form.checkIn ? new Date(`${form.date}T${form.checkIn}`) : null,
        checkOut: form.checkOut ? new Date(`${form.date}T${form.checkOut}`) : null,
      };
      await api.post('/attendance/mark', payload);
      toast.success('Attendance recorded');
      onSaved();
      onClose();
      setForm({ employee: '', date: fmtDateInput(new Date()), status: 'present', checkIn: '', checkOut: '', note: '' });
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark Attendance"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.employee}>{saving ? 'Saving…' : 'Save'}</Button>
        </>
      }
    >
      <form onSubmit={save} className="flex-col gap-4">
        <Field label="Employee" required>
          <Select value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} required>
            <option value="">Select employee</option>
            {options.map((m) => <option key={m._id} value={m._id}>{m.firstName} {m.lastName} · {m.employeeId}</option>)}
          </Select>
        </Field>
        <div className="grid-2" style={{ gap: 14 }}>
          <Field label="Date" required>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid-2" style={{ gap: 14 }}>
          <Field label="Check in time">
            <Input type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
          </Field>
          <Field label="Check out time">
            <Input type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
          </Field>
        </div>
        <Field label="Note">
          <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" />
        </Field>
      </form>
    </Modal>
  );
}
