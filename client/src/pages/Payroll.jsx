import { useState } from 'react';
import { Wallet, Sparkles, Eye, CheckCircle2, Trash2, Printer, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, Button, Badge, Avatar, Loader, EmptyState, Select,
  Pagination, Modal, Field, Input, IconButton, ConfirmDialog,
} from '../components/ui.jsx';
import { money, fmtDate, fullName, MONTHS } from '../lib/format.js';
import { isPrivileged } from '../lib/constants.js';

const now = new Date();
const YEARS = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

export default function Payroll() {
  const { user } = useAuth();
  const canRun = isPrivileged(user.role);

  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const query = new URLSearchParams({
    page, limit: 15,
    ...(month && { month }), ...(year && { year }), ...(status && { status }),
  }).toString();
  const { data, loading, refetch } = useFetch(`/payroll?${query}`, [query]);

  const [genOpen, setGenOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const markPaid = async (id) => {
    try {
      await api.patch(`/payroll/${id}/pay`);
      toast.success('Marked as paid ✅');
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage);
    }
  };

  const del = async () => {
    setBusy(true);
    try {
      await api.delete(`/payroll/${toDelete._id}`);
      toast.success('Payslip deleted');
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const slips = data?.data || [];
  const totals = data?.totals || { net: 0, gross: 0 };

  return (
    <>
      <PageHeader
        title="Payroll"
        subtitle={canRun ? 'Generate and manage employee payslips' : 'View and download your payslips'}
        actions={canRun && <Button icon={Sparkles} onClick={() => setGenOpen(true)}>Generate Payroll</Button>}
      />

      {canRun && (
        <div className="grid-stats mb-4">
          <Card className="stat-card">
            <div className="stat-icon" style={{ background: '#6366f1' }}><Wallet size={20} /></div>
            <div className="stat-value">{money(totals.net)}</div>
            <div className="stat-label">Total net (filtered)</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-icon" style={{ background: '#10b981' }}><TrendingUp size={20} /></div>
            <div className="stat-value">{money(totals.gross)}</div>
            <div className="stat-label">Total gross (filtered)</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-icon" style={{ background: '#f59e0b' }}><TrendingDown size={20} /></div>
            <div className="stat-value">{money(totals.gross - totals.net)}</div>
            <div className="stat-label">Total deductions</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-icon" style={{ background: '#8b5cf6' }}><Wallet size={20} /></div>
            <div className="stat-value">{data?.pagination?.total ?? 0}</div>
            <div className="stat-label">Payslips</div>
          </Card>
        </div>
      )}

      <Card className="mb-4" style={{ padding: 16 }}>
        <div className="toolbar" style={{ margin: 0 }}>
          <Select value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} style={{ minWidth: 150 }}>
            <option value="">All months</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </Select>
          <Select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} style={{ minWidth: 120 }}>
            <option value="">All years</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ minWidth: 130 }}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="processed">Processed</option>
            <option value="paid">Paid</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <Loader />
      ) : slips.length === 0 ? (
        <Card><EmptyState icon={Wallet} title="No payslips found" message={canRun ? 'Generate payroll for a month to get started.' : 'Your payslips will appear here once processed.'} /></Card>
      ) : (
        <Card pad={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {canRun && <th>Employee</th>}
                  <th>Period</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((p) => (
                  <tr key={p._id}>
                    {canRun && (
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={fullName(p.employee)} src={p.employee?.avatar} size={32} />
                          <div>
                            <div className="strong text-sm">{fullName(p.employee)}</div>
                            <div className="text-xs muted">{p.employee?.designation}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="strong">{MONTHS[p.month - 1]} {p.year}</td>
                    <td>{money(p.grossEarnings)}</td>
                    <td style={{ color: 'var(--red)' }}>− {money(p.totalDeductions)}</td>
                    <td className="strong">{money(p.netPay)}</td>
                    <td><Badge status={p.status}>{p.status}</Badge></td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <IconButton icon={Eye} size={16} onClick={() => setViewId(p._id)} title="View payslip" />
                        {canRun && p.status !== 'paid' && (
                          <IconButton icon={CheckCircle2} size={16} onClick={() => markPaid(p._id)} title="Mark paid" style={{ color: 'var(--green)' }} />
                        )}
                        {canRun && p.status !== 'paid' && (
                          <IconButton icon={Trash2} size={16} onClick={() => setToDelete(p)} title="Delete" style={{ color: 'var(--red)' }} />
                        )}
                      </div>
                    </td>
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

      {canRun && <GenerateModal open={genOpen} onClose={() => setGenOpen(false)} onDone={refetch} />}
      <PayslipModal id={viewId} onClose={() => setViewId(null)} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={del}
        loading={busy}
        title="Delete payslip?"
        message="This payslip will be permanently removed. You can regenerate it later."
      />
    </>
  );
}

function GenerateModal({ open, onClose, onDone }) {
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [form, setForm] = useState({ month: prev.getMonth() + 1, year: prev.getFullYear(), bonus: 0, tax: 0 });
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      const { data } = await api.post('/payroll/generate', {
        month: Number(form.month), year: Number(form.year), bonus: Number(form.bonus) || 0, tax: Number(form.tax) || 0,
      });
      toast.success(data.message || 'Payroll generated');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate Payroll"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={running}>Cancel</Button>
          <Button icon={Sparkles} onClick={run} disabled={running}>{running ? 'Processing…' : 'Run payroll'}</Button>
        </>
      }
    >
      <p className="text-sm text-2 mb-4" style={{ lineHeight: 1.6 }}>
        This generates payslips for all active employees for the selected month, using their salary structure and
        recorded attendance (absences reduce pay). Already-paid payslips are skipped.
      </p>
      <div className="grid-2" style={{ gap: 14 }}>
        <Field label="Month">
          <Select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Year">
          <Select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid-2 mt-4" style={{ gap: 14 }}>
        <Field label="Bonus (applied to all)">
          <Input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
        </Field>
        <Field label="Income tax / TDS (applied to all)">
          <Input type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

function Row({ label, value, negative, strong }) {
  return (
    <div className="flex justify-between" style={{ padding: '7px 0' }}>
      <span className={strong ? 'font-semi' : 'text-2 text-sm'}>{label}</span>
      <span className={strong ? 'font-bold' : 'text-sm'} style={negative ? { color: 'var(--red)' } : undefined}>
        {negative ? '− ' : ''}{money(value)}
      </span>
    </div>
  );
}

function PayslipModal({ id, onClose }) {
  const { data, loading } = useFetch(id ? `/payroll/${id}` : null, [id]);
  const p = data?.data;

  return (
    <Modal open={Boolean(id)} onClose={onClose} size="lg" title="Payslip" footer={<Button variant="ghost" icon={Printer} onClick={() => window.print()}>Print</Button>}>
      {loading || !p ? (
        <div style={{ minHeight: 200 }}><Loader label="Loading payslip…" /></div>
      ) : (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4" style={{ padding: 16, borderRadius: 14, background: 'var(--gradient-soft)' }}>
            <div className="flex items-center gap-3">
              <Avatar name={fullName(p.employee)} src={p.employee?.avatar} size={48} />
              <div>
                <div className="font-bold text-lg">{fullName(p.employee)}</div>
                <div className="text-xs muted">{p.employee?.designation} · {p.employee?.employeeId}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs muted">Pay period</div>
              <div className="font-bold">{MONTHS[p.month - 1]} {p.year}</div>
              <Badge status={p.status}>{p.status}</Badge>
            </div>
          </div>

          {/* Attendance snapshot */}
          <div className="grid-stats mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)', textAlign: 'center' }}>
              <div className="font-bold text-lg">{p.workingDays}</div><div className="text-xs muted">Working days</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)', textAlign: 'center' }}>
              <div className="font-bold text-lg" style={{ color: 'var(--green)' }}>{p.paidDays}</div><div className="text-xs muted">Paid days</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)', textAlign: 'center' }}>
              <div className="font-bold text-lg" style={{ color: 'var(--red)' }}>{p.lopDays}</div><div className="text-xs muted">Loss of pay</div>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 20 }}>
            <div>
              <div className="text-xs font-bold muted mb-2" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>Earnings</div>
              <Row label="Basic" value={p.basic} />
              <Row label="HRA" value={p.hra} />
              <Row label="Allowances" value={p.allowances} />
              {p.bonus > 0 && <Row label="Bonus" value={p.bonus} />}
              {p.overtimePay > 0 && <Row label="Overtime" value={p.overtimePay} />}
              <div className="divider" style={{ margin: '8px 0' }} />
              <Row label="Gross earnings" value={p.grossEarnings} strong />
            </div>
            <div>
              <div className="text-xs font-bold muted mb-2" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>Deductions</div>
              <Row label="Provident Fund" value={p.pf} negative />
              <Row label="Professional Tax" value={p.professionalTax} negative />
              {p.tax > 0 && <Row label="Income Tax (TDS)" value={p.tax} negative />}
              {p.lopDeduction > 0 && <Row label="Loss of Pay" value={p.lopDeduction} negative />}
              {p.otherDeductions > 0 && <Row label="Other" value={p.otherDeductions} negative />}
              <div className="divider" style={{ margin: '8px 0' }} />
              <Row label="Total deductions" value={p.totalDeductions} strong negative />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6" style={{ padding: 18, borderRadius: 14, background: 'var(--gradient)', color: '#fff' }}>
            <div>
              <div className="text-sm" style={{ opacity: 0.9 }}>Net Payable</div>
              <div className="text-xs" style={{ opacity: 0.8 }}>{p.paidAt ? `Paid on ${fmtDate(p.paidAt)}` : 'Amount credited to bank account'}</div>
            </div>
            <div className="text-2xl font-bold">{money(p.netPay)}</div>
          </div>
        </div>
      )}
    </Modal>
  );
}
