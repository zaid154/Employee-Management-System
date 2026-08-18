import { useState } from 'react';
import { CalendarDays, Plus, Check, X, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Badge, Avatar, Loader, EmptyState, Select, Input,
  Textarea, Pagination, Modal, Field, Segment, IconButton, ConfirmDialog,
} from '../components/ui.jsx';
import { fmtDate, fullName } from '../lib/format.js';
import { canManage, isPrivileged, LEAVE_TYPES } from '../lib/constants.js';

export default function Leaves() {
  const { user } = useAuth();
  const manage = canManage(user.role);
  const hasEmployee = Boolean(user.employee);

  const [statusTab, setStatusTab] = useState('');
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({ page, limit: 12, ...(statusTab && { status: statusTab }) }).toString();

  const { data, loading, refetch } = useFetch(`/leaves?${query}`, [query]);
  const { data: balance, refetch: refetchBalance } = useFetch(hasEmployee ? '/leaves/balance' : null);

  const [applyOpen, setApplyOpen] = useState(false);
  const [review, setReview] = useState(null); // { leave, action }
  const [cancelId, setCancelId] = useState(null);
  const [busy, setBusy] = useState(false);

  const doReview = async (note) => {
    setBusy(true);
    try {
      await api.patch(`/leaves/${review.leave._id}/review`, { status: review.action, reviewNote: note });
      toast.success(`Leave ${review.action}`);
      setReview(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async () => {
    setBusy(true);
    try {
      await api.patch(`/leaves/${cancelId}/cancel`);
      toast.success('Leave cancelled');
      setCancelId(null);
      refetch(); refetchBalance();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const leaves = data?.data || [];
  const bal = balance?.data || {};

  return (
    <>
      <PageHeader
        title="Leave Management"
        subtitle={manage ? 'Review and approve time-off requests' : 'Apply for time off and track your requests'}
        actions={hasEmployee && <Button icon={Plus} onClick={() => setApplyOpen(true)}>Apply for Leave</Button>}
      />

      {hasEmployee && (
        <div className="grid-stats mb-4">
          {['casual', 'sick', 'earned', 'unpaid'].map((t) => (
            <Card key={t} className="stat-card">
              <div className="stat-value">{bal[t] ?? 0}</div>
              <div className="stat-label capitalize">{t} leave left</div>
            </Card>
          ))}
        </div>
      )}

      <div className="toolbar">
        <Segment
          value={statusTab}
          onChange={(v) => { setStatusTab(v); setPage(1); }}
          options={[
            { value: '', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
      </div>

      {loading ? (
        <Loader />
      ) : leaves.length === 0 ? (
        <Card><EmptyState icon={CalendarDays} title="No leave requests" message={hasEmployee ? 'Apply for leave to see it here.' : 'No requests to review right now.'} /></Card>
      ) : (
        <Card pad={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {manage && <th>Employee</th>}
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => {
                  const isOwn = String(l.employee?._id) === String(user.employee?._id || user.employee);
                  return (
                    <tr key={l._id}>
                      {manage && (
                        <td>
                          <div className="flex items-center gap-2">
                            <Avatar name={fullName(l.employee)} src={l.employee?.avatar} size={32} />
                            <div>
                              <div className="strong text-sm">{fullName(l.employee)}</div>
                              <div className="text-xs muted">{l.employee?.employeeId}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td><Badge color="violet" dot={false}>{l.type}</Badge></td>
                      <td className="text-sm">{fmtDate(l.startDate)} → {fmtDate(l.endDate)}</td>
                      <td className="strong">{l.days}{l.halfDay ? ' (½)' : ''}</td>
                      <td className="text-sm truncate" style={{ maxWidth: 200 }} title={l.reason}>{l.reason}</td>
                      <td><Badge status={l.status}>{l.status}</Badge></td>
                      <td>
                        <div className="flex gap-2 justify-end">
                          {manage && l.status === 'pending' && (
                            <>
                              <IconButton icon={Check} size={15} onClick={() => setReview({ leave: l, action: 'approved' })} title="Approve" style={{ color: 'var(--green)' }} />
                              <IconButton icon={X} size={15} onClick={() => setReview({ leave: l, action: 'rejected' })} title="Reject" style={{ color: 'var(--red)' }} />
                            </>
                          )}
                          {isOwn && ['pending', 'approved'].includes(l.status) && (
                            <IconButton icon={Ban} size={15} onClick={() => setCancelId(l._id)} title="Cancel" />
                          )}
                          {l.status !== 'pending' && !isOwn && <span className="text-xs muted">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} onPage={setPage} />
          </div>
        </Card>
      )}

      <ApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} onSaved={() => { refetch(); refetchBalance(); }} privileged={isPrivileged(user.role)} />

      <ReviewModal review={review} onClose={() => setReview(null)} onConfirm={doReview} busy={busy} />

      <ConfirmDialog
        open={Boolean(cancelId)}
        onClose={() => setCancelId(null)}
        onConfirm={doCancel}
        loading={busy}
        title="Cancel this leave?"
        message="Cancelling will restore your leave balance if the request was already approved."
        confirmText="Cancel leave"
      />
    </>
  );
}

function ApplyModal({ open, onClose, onSaved, privileged }) {
  const [form, setForm] = useState({ type: 'casual', startDate: '', endDate: '', halfDay: false, reason: '', employee: '' });
  const [saving, setSaving] = useState(false);
  const { data: options } = useFetch(privileged && open ? '/employees/options' : null);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!privileged || !payload.employee) delete payload.employee;
      await api.post('/leaves', payload);
      toast.success('Leave request submitted 🎉');
      onSaved();
      onClose();
      setForm({ type: 'casual', startDate: '', endDate: '', halfDay: false, reason: '', employee: '' });
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
      title="Apply for Leave"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Submitting…' : 'Submit request'}</Button>
        </>
      }
    >
      <form onSubmit={save} className="flex-col gap-4">
        {privileged && (
          <Field label="Employee (leave blank for yourself)">
            <Select value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })}>
              <option value="">Myself</option>
              {(options?.data || []).map((m) => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Leave type" required>
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {LEAVE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </Select>
        </Field>
        <div className="grid-2" style={{ gap: 14 }}>
          <Field label="Start date" required>
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </Field>
          <Field label="End date" required>
            <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </Field>
        </div>
        <label className="flex items-center gap-2 pointer text-sm">
          <input type="checkbox" checked={form.halfDay} onChange={(e) => setForm({ ...form, halfDay: e.target.checked })} style={{ width: 16, height: 16 }} />
          Half day
        </label>
        <Field label="Reason" required>
          <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Briefly describe the reason for your leave" required />
        </Field>
      </form>
    </Modal>
  );
}

function ReviewModal({ review, onClose, onConfirm, busy }) {
  const [note, setNote] = useState('');
  if (!review) return null;
  const { leave, action } = review;

  return (
    <Modal
      open={Boolean(review)}
      onClose={onClose}
      title={action === 'approved' ? 'Approve Leave' : 'Reject Leave'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={action === 'approved' ? 'success' : 'danger'} onClick={() => onConfirm(note)} disabled={busy}>
            {busy ? 'Working…' : action === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 mb-4" style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)' }}>
        <Avatar name={fullName(leave.employee)} src={leave.employee?.avatar} size={40} />
        <div>
          <div className="font-semi">{fullName(leave.employee)}</div>
          <div className="text-xs muted capitalize">{leave.type} leave · {leave.days} day(s) · {fmtDate(leave.startDate)} → {fmtDate(leave.endDate)}</div>
        </div>
      </div>
      <p className="text-sm text-2 mb-4"><span className="muted">Reason:</span> {leave.reason}</p>
      <Field label="Review note (optional)">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the employee" />
      </Field>
    </Modal>
  );
}
