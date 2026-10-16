import { useState, useMemo } from 'react';
import {
  CalendarDays, Plus, Check, X, Ban, Calendar, Search, RotateCcw,
  RefreshCw, Eye, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Button, Badge, DataTable, UserCell, DateRangeBadge, DaysPill,
  Select, Input, Textarea, Modal, Field, Segment, ConfirmDialog,
} from '../components/ui.jsx';
import { fmtDate, fmtDateRange, fullName, fmtDateInput } from '../lib/format.js';
import { canManage, LEAVE_TYPES } from '../lib/constants.js';

const METRIC_CARDS = [
  { key: 'casual', label: 'Casual Leave', desc: 'Routine time-off', color: 'var(--blue)' },
  { key: 'sick', label: 'Sick Leave', desc: 'Medical recovery', color: 'var(--red)' },
  { key: 'earned', label: 'Earned Leave', desc: 'Accrued annual leave', color: 'var(--green)' },
  { key: 'unpaid', label: 'Unpaid Leave', desc: 'Loss of pay leaves', color: 'var(--amber)' },
];

const newApplyForm = () => ({
  type: 'casual',
  startDate: fmtDateInput(new Date()),
  endDate: fmtDateInput(new Date()),
  reason: '',
});

export default function Leaves() {
  const { user } = useAuth();
  const manage = canManage(user.role);
  const hasEmployee = Boolean(user.employee);

  const [statusTab, setStatusTab] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);

  const query = new URLSearchParams({
    page,
    limit: 12,
    ...(statusTab && { status: statusTab }),
    ...(typeFilter && { type: typeFilter }),
    ...(deptFilter && { department: deptFilter }),
    ...(search && { search }),
  }).toString();

  const { data, loading, refetch } = useFetch(`/leaves?${query}`, [query]);
  const { data: balance, refetch: refetchBalance } = useFetch(hasEmployee ? '/leaves/balance' : null);
  const { data: deptsData } = useFetch('/departments');

  const [applyOpen, setApplyOpen] = useState(false);
  const [review, setReview] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [detailLeave, setDetailLeave] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [applyForm, setApplyForm] = useState(newApplyForm);

  const runAction = async (actionFn, successMsg) => {
    setBusy(true);
    try {
      await actionFn();
      toast.success(successMsg);
      refetch();
      if (hasEmployee) refetchBalance();
      return true;
    } catch (err) {
      toast.error(err.friendlyMessage || 'Action failed');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    const ok = await runAction(() => api.post('/leaves', applyForm), 'Leave application submitted successfully');
    if (ok) {
      setApplyOpen(false);
      setApplyForm(newApplyForm());
    }
  };

  const handleReview = async () => {
    if (!review) return;
    const ok = await runAction(
      () => api.patch(`/leaves/${review.leave._id}/review`, { status: review.action, reviewNote }),
      `Leave request ${review.action} successfully`
    );
    if (ok) {
      setReview(null);
      setReviewNote('');
    }
  };

  const handleCancel = async () => {
    const ok = await runAction(() => api.patch(`/leaves/${cancelId}/cancel`), 'Leave request withdrawn');
    if (ok) setCancelId(null);
  };

  const resetFilters = () => {
    setStatusTab('');
    setSearch('');
    setTypeFilter('');
    setDeptFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(statusTab || search || typeFilter || deptFilter);
  const leaves = data?.data || [];
  const counts = data?.counts || {};
  const bal = balance?.data || {};
  const totalLeaves = data?.pagination?.total ?? 0;
  const departments = deptsData?.data || [];

  const columns = useMemo(
    () => [
      {
        header: 'Employee',
        key: 'employee',
        minWidth: 190,
        render: (l) => {
          const empName = fullName(l.employee) || 'Employee';
          const sub = [l.employee?.employeeId, l.employee?.department?.name].filter(Boolean).join(' · ');
          return <UserCell name={empName} avatar={l.employee?.avatar} subtitle={sub} />;
        },
      },
      {
        header: 'Leave Type',
        key: 'type',
        width: 125,
        render: (l) => <span className={`leave-chip ${l.type || 'casual'}`}>{l.type || 'casual'}</span>,
      },
      {
        header: 'Duration',
        key: 'duration',
        minWidth: 160,
        render: (l) => <DateRangeBadge start={l.startDate} end={l.endDate} />,
      },
      {
        header: 'Days',
        key: 'days',
        width: 80,
        align: 'center',
        render: (l) => <DaysPill days={l.days} />,
      },
      {
        header: 'Reason',
        key: 'reason',
        minWidth: 160,
        render: (l) => (
          <span className="text-sm truncate" style={{ maxWidth: 220, display: 'inline-block' }} title={l.reason}>
            {l.reason}
          </span>
        ),
      },
      {
        header: 'Status',
        key: 'status',
        width: 110,
        render: (l) => <Badge status={l.status}>{l.status}</Badge>,
      },
      {
        header: 'Actions',
        key: 'actions',
        width: 150,
        align: 'right',
        render: (l) => {
          const ownEmpId = user?.employee?._id || user?.employee;
          const isOwn = ownEmpId && String(l.employee?._id || l.employee) === String(ownEmpId);

          return (
            <div className="table-actions-group">
              {manage && !isOwn && l.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    className="btn-action-approve"
                    onClick={(e) => { e.stopPropagation(); setReview({ leave: l, action: 'approved' }); }}
                    title="Approve Leave Request"
                  >
                    <Check size={13} />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    className="btn-action-reject"
                    onClick={(e) => { e.stopPropagation(); setReview({ leave: l, action: 'rejected' }); }}
                    title="Reject Leave Request"
                  >
                    <X size={13} />
                    <span>Reject</span>
                  </button>
                </>
              ) : isOwn && l.status === 'pending' ? (
                <button
                  type="button"
                  className="btn-action-reject"
                  onClick={(e) => { e.stopPropagation(); setCancelId(l._id); }}
                  title="Withdraw Leave Request"
                >
                  <Ban size={13} />
                  <span>Withdraw</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-action-view"
                  onClick={(e) => { e.stopPropagation(); setDetailLeave(l); }}
                  title="View Application Details"
                >
                  <Eye size={13} />
                  <span>Details</span>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [manage, user?.employee]
  );

  return (
    <>
      <PageHeader
        title="Leave Management"
        subtitle={manage ? 'Review, approve, and track employee time-off applications' : 'Submit and monitor your personal leave requests and balance'}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={() => { refetch(); if (hasEmployee) refetchBalance(); }}
              title="Refresh Data"
            >
              Refresh
            </Button>
            {hasEmployee && (
              <Button icon={Plus} onClick={() => setApplyOpen(true)}>
                Apply for Leave
              </Button>
            )}
          </div>
        }
      />

      {hasEmployee && (
        <div className="metric-strip">
          {METRIC_CARDS.map(({ key, label, desc, color }) => (
            <div key={key} className="metric-card">
              <div className="metric-header">
                <span className="font-semi">{label}</span>
                <Calendar size={15} style={{ color }} />
              </div>
              <div className="metric-value font-mono">
                {bal[key] ?? 0}
                <span className="text-xs text-3 font-normal ml-1.5">days</span>
              </div>
              <div className="metric-meta">{desc}</div>
            </div>
          ))}
        </div>
      )}

      <div className="filter-bar-enterprise">
        <div className="filter-row-top">
          <Segment
            value={statusTab}
            onChange={(v) => { setStatusTab(v); setPage(1); }}
            options={[
              { value: '', label: 'All Requests', count: counts.all ?? totalLeaves },
              { value: 'pending', label: 'Pending Review', count: counts.pending ?? 0 },
              { value: 'approved', label: 'Approved', count: counts.approved ?? 0 },
              { value: 'rejected', label: 'Rejected', count: counts.rejected ?? 0 },
            ]}
          />
          {hasActiveFilters && (
            <button className="btn btn-ghost btn-sm text-xs text-3" onClick={resetFilters} type="button">
              <RotateCcw size={13} /> Reset Filters
            </button>
          )}
        </div>

        <div className="filter-row-controls">
          <div className="input-icon filter-search-box">
            <Search size={15} />
            <input
              type="text"
              className="input"
              placeholder="Search by employee name, ID, or leave reason…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="filter-select">
            <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="">All Leave Types</option>
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t.charAt(0).toUpperCase() + t.slice(1)} Leave
                </option>
              ))}
            </Select>
          </div>

          {manage && (
            <div className="filter-select">
              <Select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={leaves}
        loading={loading}
        emptyIcon={CalendarDays}
        emptyTitle="No leave requests found"
        emptyMessage={
          hasActiveFilters
            ? 'No leave requests match your search criteria. Try adjusting or clearing your filters.'
            : hasEmployee
            ? 'You have not submitted any leave requests yet.'
            : 'No employee leave applications currently require action.'
        }
        emptyAction={
          hasActiveFilters ? (
            <Button variant="secondary" icon={RotateCcw} onClick={resetFilters}>Clear Active Filters</Button>
          ) : hasEmployee ? (
            <Button icon={Plus} onClick={() => setApplyOpen(true)}>Apply for Leave</Button>
          ) : null
        }
        pagination={{
          page: data?.pagination?.page || 1,
          pages: data?.pagination?.pages || 1,
          total: totalLeaves,
          limit: 12,
          onPage: setPage,
        }}
      />

      {detailLeave && (
        <Modal
          open={Boolean(detailLeave)}
          onClose={() => setDetailLeave(null)}
          title="Leave Application Details"
          subtitle={`Application Reference #${detailLeave._id.slice(-6).toUpperCase()}`}
          footer={<Button variant="secondary" onClick={() => setDetailLeave(null)}>Close</Button>}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3" style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <UserCell
                name={fullName(detailLeave.employee)}
                avatar={detailLeave.employee?.avatar}
                subtitle={`${detailLeave.employee?.employeeId || ''} · ${detailLeave.employee?.department?.name || 'Operations'}`}
              />
              <Badge status={detailLeave.status}>{detailLeave.status}</Badge>
            </div>

            <div className="form-grid-2" style={{ fontSize: 13 }}>
              <div>
                <span className="text-xs text-3 font-medium block">Leave Category</span>
                <span className="font-semi capitalize mt-0.5 block">{detailLeave.type} Leave</span>
              </div>
              <div>
                <span className="text-xs text-3 font-medium block">Total Duration</span>
                <span className="font-semi font-mono mt-0.5 block">
                  {fmtDateRange(detailLeave.startDate, detailLeave.endDate)} ({detailLeave.days} working day{detailLeave.days === 1 ? '' : 's'})
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-3 font-medium block">Application Reason</span>
              <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: 'var(--radius-xs)', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13.5, lineHeight: 1.5 }}>
                {detailLeave.reason}
              </div>
            </div>

            {detailLeave.reviewedBy && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 12.5 }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />
                  <span className="font-semi text-xs">Reviewed by {detailLeave.reviewedBy.name || 'Supervisor'}</span>
                </div>
                {detailLeave.reviewNote && <p className="text-xs text-2 mt-1 italic">&ldquo;{detailLeave.reviewNote}&rdquo;</p>}
                {detailLeave.reviewedAt && <span className="text-xs text-3 block mt-1 font-mono">Decision Date: {fmtDate(detailLeave.reviewedAt)}</span>}
              </div>
            )}
          </div>
        </Modal>
      )}

      {applyOpen && (
        <Modal
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          title="Apply for Leave"
          subtitle="Submit a formal time-off request for review"
          footer={
            <>
              <Button variant="secondary" onClick={() => setApplyOpen(false)} disabled={busy}>Cancel</Button>
              <Button onClick={handleApply} loading={busy}>Submit Request</Button>
            </>
          }
        >
          <form onSubmit={handleApply}>
            <Field label="Leave Category" required>
              <Select value={applyForm.type} onChange={(e) => setApplyForm({ ...applyForm, type: e.target.value })}>
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t.charAt(0).toUpperCase() + t.slice(1)} Leave ({bal[t] ?? 0} days remaining)
                  </option>
                ))}
              </Select>
            </Field>

            <div className="form-grid-2">
              <Field label="Start Date" required>
                <Input
                  type="date"
                  value={applyForm.startDate}
                  onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                  required
                />
              </Field>
              <Field label="End Date" required>
                <Input
                  type="date"
                  value={applyForm.endDate}
                  onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                  required
                />
              </Field>
            </div>

            <Field label="Reason for Leave" required>
              <Textarea
                value={applyForm.reason}
                onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                placeholder="Explain the purpose of your time-off request…"
                required
              />
            </Field>
          </form>
        </Modal>
      )}

      {review && (
        <Modal
          open={Boolean(review)}
          onClose={() => setReview(null)}
          title={`${review.action === 'approved' ? 'Approve' : 'Reject'} Leave Request`}
          subtitle={`Employee: ${fullName(review.leave.employee)} · Duration: ${fmtDateRange(
            review.leave.startDate,
            review.leave.endDate
          )} (${review.leave.days} day${review.leave.days === 1 ? '' : 's'})`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setReview(null)} disabled={busy}>Cancel</Button>
              <Button variant={review.action === 'approved' ? 'accent' : 'danger'} onClick={handleReview} loading={busy}>
                Confirm {review.action === 'approved' ? 'Approval' : 'Rejection'}
              </Button>
            </>
          }
        >
          <div className="mb-3 text-sm text-2">
            <p><strong>Reason stated:</strong> {review.leave.reason}</p>
          </div>
          <Field label="Review Notes / Condition (Optional)">
            <Textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Add optional reviewer feedback or conditions…"
            />
          </Field>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(cancelId)}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Withdraw Leave Request"
        message="Are you sure you want to withdraw this pending leave request?"
        confirmText="Withdraw Request"
        confirmVariant="danger"
        loading={busy}
      />
    </>
  );
}
