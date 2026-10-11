import { useState, useMemo } from 'react';
import {
  CalendarCheck, LogIn, LogOut, Clock, Plus, RotateCcw,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import {
  PageHeader, Card, CardHeader, Button, Badge, DataTable, UserCell, DateBadge,
  Select, Input, Modal, Field, Segment,
} from '../components/ui.jsx';
import { fmtDate, fmtTime, fullName, fmtDateInput } from '../lib/format.js';
import { canManage, isPrivileged, ATTENDANCE_STATUSES } from '../lib/constants.js';

export default function Attendance() {
  const { user } = useAuth();
  const manage = canManage(user.role);
  const privileged = isPrivileged(user.role);
  const hasEmployee = Boolean(user.employee);

  const [page, setPage] = useState(1);
  const [empFilter, setEmpFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const todayStr = useMemo(() => fmtDateInput(new Date()), []);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const activePreset = useMemo(() => {
    if (!from && !to) return 'all';
    if (from === todayStr && to === todayStr) return 'today';
    const now = new Date();
    const day = now.getDay();
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(new Date().setDate(diffToMon));
    const monStr = fmtDateInput(mon);
    if (from === monStr && to === todayStr) return 'week';
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstStr = fmtDateInput(first);
    if (from === firstStr && to === todayStr) return 'month';
    return 'custom';
  }, [from, to, todayStr]);

  const handlePreset = (type) => {
    const now = new Date();
    if (type === 'today') {
      setFrom(todayStr);
      setTo(todayStr);
    } else if (type === 'week') {
      const day = now.getDay();
      const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(new Date().setDate(diffToMon));
      setFrom(fmtDateInput(mon));
      setTo(todayStr);
    } else if (type === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setFrom(fmtDateInput(first));
      setTo(todayStr);
    } else if (type === 'all') {
      setFrom('');
      setTo('');
    }
    setPage(1);
  };

  const query = new URLSearchParams({
    page,
    limit: 15,
    ...(empFilter && { employee: empFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(from && { from }),
    ...(to && { to }),
  }).toString();

  const { data, loading, refetch } = useFetch(`/attendance?${query}`, [query]);
  const { data: today, refetch: refetchToday } = useFetch(hasEmployee ? '/attendance/today' : null);
  const { data: summary, refetch: refetchSummary } = useFetch(hasEmployee ? '/attendance/summary' : null);
  const { data: options } = useFetch(privileged ? '/employees/options' : null);

  const [busy, setBusy] = useState(false);
  const [markOpen, setMarkOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    employeeId: '',
    date: fmtDateInput(new Date()),
    status: 'present',
    checkInTime: '09:00',
    checkOutTime: '18:00',
  });

  const handlePunch = async (type) => {
    setBusy(true);
    try {
      await api.post(`/attendance/${type}`);
      toast.success(type === 'check-in' ? 'Check-in recorded successfully' : 'Check-out recorded successfully');
      refetchToday();
      refetchSummary();
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (manualForm.date > todayStr) {
      toast.error('Attendance date cannot be in the future');
      return;
    }
    setBusy(true);
    try {
      let checkIn = null;
      let checkOut = null;
      if (manualForm.checkInTime) {
        checkIn = new Date(`${manualForm.date}T${manualForm.checkInTime}:00`);
      }
      if (manualForm.checkOutTime) {
        checkOut = new Date(`${manualForm.date}T${manualForm.checkOutTime}:00`);
      }
      await api.post('/attendance/mark', {
        employee: manualForm.employeeId,
        date: manualForm.date,
        status: manualForm.status,
        checkIn: checkIn ? checkIn.toISOString() : null,
        checkOut: checkOut ? checkOut.toISOString() : null,
      });
      toast.success('Attendance record logged successfully');
      setMarkOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to record attendance');
    } finally {
      setBusy(false);
    }
  };

  const resetFilters = () => {
    setEmpFilter('');
    setStatusFilter('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(empFilter || statusFilter || from || to);

  const att = today?.data;
  const sm = summary?.data;
  const records = data?.data || [];
  const totalRecords = data?.pagination?.total ?? 0;

  // Define Table Columns
  const columns = useMemo(() => {
    const cols = [];

    if (privileged) {
      cols.push({
        header: 'Employee',
        key: 'employee',
        minWidth: 200,
        render: (r) => {
          const empName = fullName(r.employee) || 'Employee';
          const empDept = r.employee?.department?.name || '';
          const empId = r.employee?.employeeId || '';
          const sub = [empId, empDept].filter(Boolean).join(' · ');
          return <UserCell name={empName} avatar={r.employee?.avatar} subtitle={sub} />;
        },
      });
    }

    cols.push(
      {
        header: 'Date',
        key: 'date',
        minWidth: 140,
        render: (r) => <DateBadge date={r.date} />,
      },
      {
        header: 'Check In',
        key: 'checkIn',
        minWidth: 110,
        className: 'table-cell-mono',
        render: (r) =>
          r.checkIn ? (
            <span style={{ color: 'var(--text)' }}>{fmtTime(r.checkIn)}</span>
          ) : (
            <span className="text-3">—:—</span>
          ),
      },
      {
        header: 'Check Out',
        key: 'checkOut',
        minWidth: 110,
        className: 'table-cell-mono',
        render: (r) =>
          r.checkOut ? (
            <span style={{ color: 'var(--text)' }}>{fmtTime(r.checkOut)}</span>
          ) : (
            <span className="text-3">—:—</span>
          ),
      },
      {
        header: 'Work Hours',
        key: 'workHours',
        width: 110,
        align: 'center',
        render: (r) => (
          <span className="table-days-pill font-mono">
            {r.workHours != null ? `${r.workHours}h` : '0h'}
          </span>
        ),
      },
      {
        header: 'Status',
        key: 'status',
        width: 120,
        render: (r) => <Badge status={r.status}>{r.status}</Badge>,
      }
    );

    return cols;
  }, [privileged]);

  return (
    <>
      <PageHeader
        title="Attendance & Time Tracking"
        subtitle="Daily shift punch logs, monthly attendance summaries, and work hours"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={() => {
                refetch();
                if (hasEmployee) {
                  refetchToday();
                  refetchSummary();
                }
              }}
              title="Refresh Data"
            >
              Refresh
            </Button>
            {manage && (
              <Button icon={Plus} onClick={() => setMarkOpen(true)}>
                Record Attendance
              </Button>
            )}
          </div>
        }
      />

      {/* Individual Employee Live Punch Card + Monthly Summary */}
      {hasEmployee && (
        <div className="grid-2 mb-4">
          <Card pad={false}>
            <CardHeader
              title={`Shift Status · Today, ${fmtDate(new Date())}`}
              subtitle="Real-time check-in / check-out tracker"
              action={<Clock size={16} className="text-3" />}
            />
            <div className="card-pad flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-6">
                <div>
                  <div className="text-xs text-3 font-medium">Check-In Time</div>
                  <div className="font-bold text-lg font-mono mt-0.5">
                    {att?.checkIn ? fmtTime(att.checkIn) : '—:—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-3 font-medium">Check-Out Time</div>
                  <div className="font-bold text-lg font-mono mt-0.5">
                    {att?.checkOut ? fmtTime(att.checkOut) : '—:—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-3 font-medium mb-1">Status</div>
                  {att ? <Badge status={att.status}>{att.status}</Badge> : <span className="text-xs text-3">Not recorded</span>}
                </div>
              </div>
              <div>
                {!att?.checkIn ? (
                  <Button icon={LogIn} onClick={() => handlePunch('check-in')} loading={busy}>
                    Check In Now
                  </Button>
                ) : !att?.checkOut ? (
                  <Button variant="secondary" icon={LogOut} onClick={() => handlePunch('check-out')} loading={busy}>
                    Check Out
                  </Button>
                ) : (
                  <Badge status="approved">Shift Completed ({att.workHours}h)</Badge>
                )}
              </div>
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader
              title="This Month's Summary"
              subtitle="Cumulative monthly attendance counts"
            />
            <div className="card-pad">
              {sm ? (
                <div className="grid-3">
                  <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)' }}>
                    <div className="text-lg font-bold font-mono" style={{ color: 'var(--green-text)' }}>
                      {sm.present ?? 0}
                    </div>
                    <div className="text-xs text-3">Days Present</div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)' }}>
                    <div className="text-lg font-bold font-mono" style={{ color: 'var(--amber-text)' }}>
                      {sm.late ?? 0}
                    </div>
                    <div className="text-xs text-3">Late Arrivals</div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)' }}>
                    <div className="text-lg font-bold font-mono text-primary">
                      {sm.totalHours ?? 0}h
                    </div>
                    <div className="text-xs text-3">Total Work Hours</div>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-3">No monthly summary records available</span>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Enhanced Filter Bar */}
      <div className="filter-bar-enterprise">
        <div className="filter-row-top">
          <Segment
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'present', label: 'Present' },
              { value: 'late', label: 'Late Arrival' },
              { value: 'half-day', label: 'Half Day' },
              { value: 'absent', label: 'Absent' },
              { value: 'on-leave', label: 'On Leave' },
            ]}
          />

          {hasActiveFilters && (
            <button
              className="btn btn-ghost btn-sm text-xs text-3"
              onClick={resetFilters}
              type="button"
            >
              <RotateCcw size={13} />
              Reset Filters
            </button>
          )}
        </div>

        <div className="filter-row-controls">
          {privileged && (
            <div className="filter-select" style={{ minWidth: 220 }}>
              <Select
                value={empFilter}
                onChange={(e) => {
                  setEmpFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Employees</option>
                {(options?.data || []).map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.firstName} {m.lastName} ({m.employeeId})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Quick Date Presets */}
          <div className="date-presets-group">
            <button
              type="button"
              className={`date-preset-btn ${activePreset === 'all' ? 'active' : ''}`}
              onClick={() => handlePreset('all')}
            >
              All Time
            </button>
            <button
              type="button"
              className={`date-preset-btn ${activePreset === 'today' ? 'active' : ''}`}
              onClick={() => handlePreset('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={`date-preset-btn ${activePreset === 'week' ? 'active' : ''}`}
              onClick={() => handlePreset('week')}
            >
              This Week
            </button>
            <button
              type="button"
              className={`date-preset-btn ${activePreset === 'month' ? 'active' : ''}`}
              onClick={() => handlePreset('month')}
            >
              This Month
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-3 font-medium">From:</span>
            <Input
              type="date"
              value={from}
              max={to || todayStr}
              onChange={(e) => {
                const val = e.target.value;
                if (val && val > todayStr) {
                  toast.error('Attendance dates cannot be in the future');
                  setFrom(todayStr);
                } else {
                  setFrom(val);
                }
                setPage(1);
              }}
              style={{ width: 145 }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-3 font-medium">To:</span>
            <Input
              type="date"
              value={to}
              min={from || undefined}
              max={todayStr}
              onChange={(e) => {
                const val = e.target.value;
                if (val && val > todayStr) {
                  toast.error('Attendance dates cannot be in the future');
                  setTo(todayStr);
                } else if (from && val < from) {
                  toast.error('"To" date cannot be before "From" date');
                  setTo(from);
                } else {
                  setTo(val);
                }
                setPage(1);
              }}
              style={{ width: 145 }}
            />
          </div>
        </div>
      </div>

      {/* Informative Results Summary Banner */}
      <div className="attendance-filter-summary">
        <div>
          Showing <strong>{totalRecords}</strong> attendance {totalRecords === 1 ? 'record' : 'records'}
          {from || to ? (
            <span>
              {' '}· Date Filter: <strong>{from ? fmtDate(from) : 'Beginning'}</strong> to <strong>{to ? fmtDate(to) : 'Today'}</strong>
            </span>
          ) : (
            <span> · All dates (sorted newest first)</span>
          )}
          {statusFilter && <span> · Status: <span className="capitalize font-semibold">{statusFilter}</span></span>}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            className="attendance-clear-btn"
            onClick={resetFilters}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Unified Enterprise DataTable */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        emptyIcon={CalendarCheck}
        emptyTitle="No attendance records found"
        emptyMessage={
          hasActiveFilters
            ? 'No attendance records match your current filter settings. Try clearing active filters.'
            : 'Attendance logs will appear here automatically when employees punch in or shifts are recorded.'
        }
        emptyAction={
          hasActiveFilters ? (
            <Button variant="secondary" icon={RotateCcw} onClick={resetFilters}>
              Reset Filters
            </Button>
          ) : null
        }
        pagination={{
          page: data?.pagination?.page || 1,
          pages: data?.pagination?.pages || 1,
          total: totalRecords,
          limit: 15,
          onPage: setPage,
        }}
      />

      {/* Manual Entry Modal */}
      {markOpen && (
        <Modal
          open={markOpen}
          onClose={() => setMarkOpen(false)}
          title="Record Manual Attendance"
          subtitle="Add or adjust employee attendance record for any date"
          footer={
            <>
              <Button variant="secondary" onClick={() => setMarkOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleManualSubmit} loading={busy}>
                Save Record
              </Button>
            </>
          }
        >
          <form onSubmit={handleManualSubmit}>
            <Field label="Employee" required>
              <Select
                value={manualForm.employeeId}
                onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
                required
              >
                <option value="">Select Employee</option>
                {(options?.data || []).map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.firstName} {m.lastName} ({m.employeeId})
                  </option>
                ))}
              </Select>
            </Field>

            <div className="form-grid-2">
              <Field label="Date" required>
                <Input
                  type="date"
                  value={manualForm.date}
                  max={todayStr}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  required
                />
              </Field>
              <Field label="Attendance Status" required>
                <Select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                >
                  {ATTENDANCE_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="form-grid-2">
              <Field label="Check-In Time">
                <Input
                  type="time"
                  value={manualForm.checkInTime}
                  onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
                />
              </Field>
              <Field label="Check-Out Time">
                <Input
                  type="time"
                  value={manualForm.checkOutTime}
                  onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
                />
              </Field>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
