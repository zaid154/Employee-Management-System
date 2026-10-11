import { Link } from 'react-router-dom';
import {
  Users, UserCheck, CalendarClock, Wallet, Building2, TrendingUp, Clock,
  LogIn, LogOut, ArrowRight, CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import { Card, CardHeader, Loader, Badge, Avatar, EmptyState, Button, Progress } from '../components/ui.jsx';
import { DonutChart } from '../components/charts.jsx';
import { money, compactMoney, fmtDay, fmtTime, fullName } from '../lib/format.js';
import { canManage, CHART_COLORS } from '../lib/constants.js';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, refetch } = useFetch('/dashboard');

  if (loading) return <DashboardSkeleton />;
  if (!data?.data) return <EmptyState title="No dashboard data" />;

  return canManage(user.role) ? (
    <ManagerDashboard d={data.data} />
  ) : (
    <EmployeeDashboard d={data.data} onRefresh={refetch} />
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="metric-strip">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="metric-card" style={{ gap: 8 }}>
            <div className="flex justify-between items-center">
              <div className="skeleton" style={{ width: 100, height: 12 }} />
              <div className="skeleton skeleton-circle" style={{ width: 16, height: 16 }} />
            </div>
            <div className="skeleton" style={{ width: 70, height: 28, marginTop: 4 }} />
            <div className="skeleton" style={{ width: 120, height: 12 }} />
          </div>
        ))}
      </div>

      <div className="grid-2 mb-4">
        <Card pad={false}>
          <div className="card-header">
            <div className="skeleton" style={{ width: 140, height: 16 }} />
          </div>
          <div className="card-pad flex justify-center items-center" style={{ height: 220 }}>
            <div className="skeleton skeleton-circle" style={{ width: 160, height: 160 }} />
          </div>
        </Card>

        <Card pad={false}>
          <div className="card-header">
            <div className="skeleton" style={{ width: 140, height: 16 }} />
          </div>
          <div className="card-pad flex justify-center items-center" style={{ height: 220 }}>
            <div className="skeleton skeleton-circle" style={{ width: 160, height: 160 }} />
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card pad={false}>
          <div className="card-header">
            <div className="skeleton" style={{ width: 130, height: 16 }} />
          </div>
          <div className="card-pad flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="skeleton skeleton-circle" style={{ width: 34, height: 34 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: 120, height: 13, marginBottom: 4 }} />
                  <div className="skeleton" style={{ width: 90, height: 11 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card pad={false}>
          <div className="card-header">
            <div className="skeleton" style={{ width: 130, height: 16 }} />
          </div>
          <div className="card-pad flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 6 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: 140, height: 13, marginBottom: 4 }} />
                  <div className="skeleton" style={{ width: 80, height: 11 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function ManagerDashboard({ d }) {
  const s = d.stats;
  const deptData = d.byDepartment.map((x, i) => ({
    label: x.name || 'Unassigned',
    value: x.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const statusColors = {
    active: '#16a34a',
    probation: '#d97706',
    'on-leave': '#2563eb',
    resigned: '#64748b',
    terminated: '#dc2626',
  };

  const statusData = d.byStatus.map((x) => ({
    label: x.status,
    value: x.count,
    color: statusColors[x.status] || '#2563eb',
  }));

  return (
    <>
      {/* Metric Strips */}
      <div className="metric-strip">
        <div className="metric-card">
          <div className="metric-header">
            <span>Total Employees</span>
            <Users size={16} />
          </div>
          <div className="metric-value">{s.totalEmployees}</div>
          <div className="metric-meta">
            <span style={{ color: 'var(--green-text)', fontWeight: 600 }}>{s.activeEmployees}</span> active
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Present Today</span>
            <UserCheck size={16} />
          </div>
          <div className="metric-value">{s.presentToday}</div>
          <div className="metric-meta">
            <span style={{ color: 'var(--blue-text)', fontWeight: 600 }}>{s.attendanceRate}%</span> attendance rate
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Pending Leaves</span>
            <CalendarClock size={16} />
          </div>
          <div className="metric-value">{s.pendingLeaves}</div>
          <div className="metric-meta">
            <span>Requires HR review</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Monthly Payroll</span>
            <Wallet size={16} />
          </div>
          <div className="metric-value">{compactMoney(s.monthlyPayroll)}</div>
          <div className="metric-meta">
            <span>{s.payslipsThisMonth} payslips this month</span>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid-2 mb-4">
        <Card pad={false}>
          <CardHeader
            title="Headcount by Department"
            subtitle="Workforce allocation across departments"
            action={<Building2 size={16} className="muted" />}
          />
          <div className="card-pad">
            <DonutChart data={deptData} centerLabel="Total" centerValue={s.totalEmployees} />
          </div>
        </Card>

        <Card pad={false}>
          <CardHeader
            title="Employment Status"
            subtitle="Active vs probation breakdown"
            action={<TrendingUp size={16} className="muted" />}
          />
          <div className="card-pad">
            <DonutChart data={statusData} centerLabel="Employees" />
          </div>
        </Card>
      </div>

      {/* Recent Hires & Upcoming Holidays */}
      <div className="grid-2">
        <Card pad={false}>
          <CardHeader
            title="Recent Onboardings"
            subtitle="Latest additions to the organisation"
            action={
              <Link to="/employees" className="text-xs font-semi flex items-center gap-1">
                View Directory <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="card-pad">
            {d.recentHires.length === 0 ? (
              <EmptyState title="No recent hires" />
            ) : (
              <div className="flex-col gap-2">
                {d.recentHires.map((e) => (
                  <Link
                    to={`/employees/${e._id}`}
                    key={e._id}
                    className="flex items-center gap-3"
                    style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  >
                    <Avatar name={fullName(e)} src={e.avatar} size={36} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="font-semi text-sm truncate" style={{ color: 'var(--text)' }}>
                        {fullName(e)}
                      </div>
                      <div className="text-xs muted truncate">
                        {e.designation} · {e.department?.name || 'General'}
                      </div>
                    </div>
                    <div className="text-xs muted font-mono">{fmtDay(e.dateOfJoining)}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card pad={false}>
          <CardHeader
            title="Upcoming Holidays"
            subtitle="Official calendar days off"
            action={<CalendarDays size={16} className="muted" />}
          />
          <div className="card-pad">
            {d.upcomingHolidays.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No upcoming holidays scheduled" />
            ) : (
              <div className="flex-col gap-2">
                {d.upcomingHolidays.map((h) => (
                  <div
                    key={h._id}
                    className="flex items-center gap-3"
                    style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  >
                    <div
                      style={{
                        width: 44,
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '4px 0',
                      }}
                    >
                      <div className="font-bold text-sm" style={{ lineHeight: 1 }}>
                        {new Date(h.date).getDate()}
                      </div>
                      <div className="text-xs muted">
                        {new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <div className="font-semi text-sm truncate">{h.name}</div>
                      <div className="text-xs muted capitalize">{h.type} holiday</div>
                    </div>
                    <Badge status={h.type === 'company' ? 'processed' : 'approved'}>{h.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function EmployeeDashboard({ d, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const att = d.todayAttendance;
  const ma = d.monthlyAttendance || { present: 0, late: 0, absent: 0, onLeave: 0 };

  const handlePunch = async (type) => {
    setBusy(true);
    try {
      await api.post(`/attendance/${type}`);
      toast.success(type === 'check-in' ? 'Check-in recorded' : 'Check-out recorded');
      onRefresh();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const balanceEntries = Object.entries(d.leaveBalance || {}).filter(([k]) =>
    ['casual', 'sick', 'earned'].includes(k)
  );

  return (
    <>
      <div className="grid-2 mb-4">
        {/* Attendance punch widget */}
        <Card pad={false}>
          <CardHeader
            title="Today's Attendance"
            subtitle="Log daily check-in and check-out"
            action={<Clock size={16} className="muted" />}
          />
          <div className="card-pad">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div>
                <div className="text-xs muted">Check-In Time</div>
                <div className="font-bold text-lg font-mono">
                  {att?.checkIn ? fmtTime(att.checkIn) : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs muted">Check-Out Time</div>
                <div className="font-bold text-lg font-mono">
                  {att?.checkOut ? fmtTime(att.checkOut) : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs muted mb-1">Status</div>
                {att ? <Badge status={att.status}>{att.status}</Badge> : <span className="muted text-sm">Not marked</span>}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {!att?.checkIn ? (
                <Button icon={LogIn} onClick={() => handlePunch('check-in')} loading={busy}>
                  Check In
                </Button>
              ) : !att?.checkOut ? (
                <Button variant="secondary" icon={LogOut} onClick={() => handlePunch('check-out')} loading={busy}>
                  Check Out
                </Button>
              ) : (
                <Badge status="approved">Shift Complete ({att.workHours}h)</Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Monthly attendance breakdown */}
        <Card pad={false}>
          <CardHeader
            title="Monthly Attendance Summary"
            subtitle="Working day statistics for the current month"
            action={<CalendarDays size={16} className="muted" />}
          />
          <div className="card-pad">
            <div className="grid-2">
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)' }}>
                <div className="text-xl font-bold font-mono" style={{ color: 'var(--green-text)' }}>
                  {ma.present}
                </div>
                <div className="text-xs muted">Days Present</div>
              </div>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)' }}>
                <div className="text-xl font-bold font-mono" style={{ color: 'var(--amber-text)' }}>
                  {ma.late}
                </div>
                <div className="text-xs muted">Late Arrivals</div>
              </div>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)' }}>
                <div className="text-xl font-bold font-mono" style={{ color: 'var(--red-text)' }}>
                  {ma.absent}
                </div>
                <div className="text-xs muted">Days Absent</div>
              </div>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)' }}>
                <div className="text-xl font-bold font-mono" style={{ color: 'var(--blue-text)' }}>
                  {ma.onLeave}
                </div>
                <div className="text-xs muted">On Leave</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid-2">
        {/* Leave quota tracker */}
        <Card pad={false}>
          <CardHeader
            title="Leave Balances"
            subtitle="Available leave days remaining"
            action={
              <Link to="/leaves" className="text-xs font-semi flex items-center gap-1">
                Apply Leave <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="card-pad flex-col gap-4">
            {balanceEntries.map(([type, val]) => (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-medium">{type} Leave</span>
                  <span className="muted font-mono">{val} days left</span>
                </div>
                <Progress value={val} max={type === 'earned' ? 15 : 12} />
              </div>
            ))}
          </div>
        </Card>

        {/* Recent payslips */}
        <Card pad={false}>
          <CardHeader
            title="Recent Payslips"
            subtitle="Salary statements and disbursements"
            action={
              <Link to="/payroll" className="text-xs font-semi flex items-center gap-1">
                All Payslips <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="card-pad">
            {d.recentPayslips.length === 0 ? (
              <EmptyState icon={Wallet} title="No payslips generated yet" />
            ) : (
              <div className="flex-col gap-2">
                {d.recentPayslips.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between"
                    style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  >
                    <div>
                      <div className="font-semi text-sm">
                        {new Date(p.year, p.month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-xs muted">Net Salary</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm font-mono">{money(p.netPay)}</div>
                      <Badge status={p.status}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
