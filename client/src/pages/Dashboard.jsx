import { Link } from 'react-router-dom';
import {
  Users, UserCheck, CalendarClock, Wallet, Building2, TrendingUp, Clock,
  LogIn, LogOut, Palmtree, ArrowUpRight, CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import { Card, Loader, Badge, Avatar, EmptyState, Button, Progress } from '../components/ui.jsx';
import { DonutChart } from '../components/charts.jsx';
import { money, compactMoney, fmtDate, fmtDay, fmtTime, fullName } from '../lib/format.js';
import { canManage, CHART_COLORS } from '../lib/constants.js';

function StatCard({ icon: Icon, label, value, color, sub, to }) {
  const inner = (
    <Card className="stat-card card-hover" pad={false}>
      <div className="card-pad">
        <div className="stat-glow" style={{ background: color }} />
        <div className="stat-icon" style={{ background: color }}>
          <Icon size={22} />
        </div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-trend" style={{ color: 'var(--text-3)' }}>{sub}</div>}
      </div>
    </Card>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, refetch } = useFetch('/dashboard');

  if (loading) return <Loader />;
  if (!data) return <EmptyState title="No dashboard data" />;

  return canManage(user.role) ? (
    <ManagerDashboard d={data.data} />
  ) : (
    <EmployeeDashboard d={data.data} onRefresh={refetch} />
  );
}

/* ============================================================
   Management dashboard
   ============================================================ */
function ManagerDashboard({ d }) {
  const s = d.stats;
  const deptData = d.byDepartment.map((x, i) => ({ label: x.name || 'Unassigned', value: x.count, color: CHART_COLORS[i % CHART_COLORS.length] }));
  const statusColors = { active: '#10b981', probation: '#f59e0b', 'on-leave': '#3b82f6', resigned: '#94a3b8', terminated: '#ef4444' };
  const statusData = d.byStatus.map((x) => ({ label: x.status, value: x.count, color: statusColors[x.status] || '#8b5cf6' }));

  return (
    <>
      <div className="grid-stats mb-4">
        <StatCard icon={Users} label="Total Employees" value={s.totalEmployees} color="#6366f1" sub={`${s.activeEmployees} active`} to="/employees" />
        <StatCard icon={UserCheck} label="Present Today" value={s.presentToday} color="#10b981" sub={`${s.attendanceRate}% attendance`} to="/attendance" />
        <StatCard icon={CalendarClock} label="Pending Leaves" value={s.pendingLeaves} color="#f59e0b" sub="Awaiting review" to="/leaves" />
        <StatCard icon={Wallet} label="Monthly Payroll" value={compactMoney(s.monthlyPayroll)} color="#8b5cf6" sub={`${s.payslipsThisMonth} payslips`} to="/payroll" />
      </div>

      <div className="grid-2 mb-4">
        <Card>
          <div className="card-header">
            <div>
              <div className="card-title">Headcount by Department</div>
              <div className="page-sub">Active workforce distribution</div>
            </div>
            <Building2 size={18} className="muted" />
          </div>
          <DonutChart data={deptData} centerLabel="employees" centerValue={s.totalEmployees} />
        </Card>

        <Card>
          <div className="card-header">
            <div>
              <div className="card-title">Employment Status</div>
              <div className="page-sub">Across the organisation</div>
            </div>
            <TrendingUp size={18} className="muted" />
          </div>
          <DonutChart data={statusData} centerLabel="total" />
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <div className="card-header">
            <div className="card-title">Recent Hires</div>
            <Link to="/employees" className="text-sm font-semi gradient-text flex items-center gap-1">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {d.recentHires.length === 0 ? (
            <EmptyState title="No employees yet" />
          ) : (
            <div className="flex-col gap-1">
              {d.recentHires.map((e) => (
                <Link to={`/employees/${e._id}`} key={e._id} className="flex items-center gap-3" style={{ padding: '10px 8px', borderRadius: 12 }}>
                  <Avatar name={fullName(e)} src={e.avatar} size={40} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="font-semi truncate">{fullName(e)}</div>
                    <div className="text-xs muted truncate">{e.designation} · {e.department?.name}</div>
                  </div>
                  <div className="text-xs muted">{fmtDay(e.dateOfJoining)}</div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="card-header">
            <div className="card-title">Upcoming Holidays</div>
            <Palmtree size={18} className="muted" />
          </div>
          {d.upcomingHolidays.length === 0 ? (
            <EmptyState icon={Palmtree} title="No upcoming holidays" />
          ) : (
            <div className="flex-col gap-2">
              {d.upcomingHolidays.map((h) => (
                <div key={h._id} className="flex items-center gap-3" style={{ padding: '8px 4px' }}>
                  <div style={{ width: 46, textAlign: 'center', background: 'var(--gradient-soft)', borderRadius: 10, padding: '6px 0' }}>
                    <div className="font-bold" style={{ fontSize: '1.1rem', lineHeight: 1 }}>{new Date(h.date).getDate()}</div>
                    <div className="text-xs muted">{new Date(h.date).toLocaleDateString('en-IN', { month: 'short' })}</div>
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="font-semi truncate">{h.name}</div>
                    <div className="text-xs muted capitalize">{h.type} holiday</div>
                  </div>
                  <Badge status={h.type === 'company' ? 'processed' : 'approved'}>{h.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

/* ============================================================
   Employee self-service dashboard
   ============================================================ */
function EmployeeDashboard({ d, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const att = d.todayAttendance;
  const ma = d.monthlyAttendance;

  const action = async (type) => {
    setBusy(true);
    try {
      await api.post(`/attendance/${type}`);
      toast.success(type === 'check-in' ? 'Checked in ✅' : 'Checked out 👋');
      onRefresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const balanceEntries = Object.entries(d.leaveBalance || {}).filter(([k]) => ['casual', 'sick', 'earned'].includes(k));

  return (
    <>
      <div className="grid-2 mb-4">
        {/* Attendance / check-in card */}
        <Card>
          <div className="card-header">
            <div className="card-title">Today&apos;s Attendance</div>
            <Clock size={18} className="muted" />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div style={{ flex: 1, minWidth: 180 }}>
              <div className="flex gap-4 mb-4">
                <div>
                  <div className="text-xs muted">Check in</div>
                  <div className="font-bold text-lg">{att?.checkIn ? fmtTime(att.checkIn) : '—'}</div>
                </div>
                <div>
                  <div className="text-xs muted">Check out</div>
                  <div className="font-bold text-lg">{att?.checkOut ? fmtTime(att.checkOut) : '—'}</div>
                </div>
                <div>
                  <div className="text-xs muted">Status</div>
                  {att ? <Badge status={att.status}>{att.status}</Badge> : <span className="muted">Not marked</span>}
                </div>
              </div>
              {!att?.checkIn ? (
                <Button icon={LogIn} onClick={() => action('check-in')} disabled={busy}>
                  Check in now
                </Button>
              ) : !att?.checkOut ? (
                <Button icon={LogOut} variant="ghost" onClick={() => action('check-out')} disabled={busy}>
                  Check out
                </Button>
              ) : (
                <Badge status="approved">Day complete · {att.workHours}h logged</Badge>
              )}
            </div>
          </div>
        </Card>

        {/* This month summary */}
        <Card>
          <div className="card-header">
            <div className="card-title">This Month</div>
            <CalendarDays size={18} className="muted" />
          </div>
          <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { label: 'Present', value: ma.present, color: '#10b981' },
              { label: 'Late', value: ma.late, color: '#f59e0b' },
              { label: 'Absent', value: ma.absent, color: '#ef4444' },
              { label: 'On Leave', value: ma.onLeave, color: '#3b82f6' },
            ].map((x) => (
              <div key={x.label} style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)' }}>
                <div className="font-bold text-xl" style={{ color: x.color }}>{x.value}</div>
                <div className="text-xs muted">{x.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid-2">
        {/* Leave balance */}
        <Card>
          <div className="card-header">
            <div className="card-title">Leave Balance</div>
            <Link to="/leaves" className="text-sm font-semi gradient-text flex items-center gap-1">
              Apply <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="flex-col gap-4">
            {balanceEntries.map(([type, val]) => (
              <div key={type}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="capitalize font-semi">{type} leave</span>
                  <span className="muted">{val} days left</span>
                </div>
                <Progress value={val} max={type === 'earned' ? 15 : 12} />
              </div>
            ))}
            {d.pendingLeaves > 0 && (
              <div className="flex items-center gap-2 text-sm" style={{ padding: 10, borderRadius: 10, background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' }}>
                <CalendarClock size={16} /> You have {d.pendingLeaves} pending leave request(s)
              </div>
            )}
          </div>
        </Card>

        {/* Recent payslips */}
        <Card>
          <div className="card-header">
            <div className="card-title">Recent Payslips</div>
            <Link to="/payroll" className="text-sm font-semi gradient-text flex items-center gap-1">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {d.recentPayslips.length === 0 ? (
            <EmptyState icon={Wallet} title="No payslips yet" message="Your payslips will appear here once processed." />
          ) : (
            <div className="flex-col gap-2">
              {d.recentPayslips.map((p) => (
                <div key={p._id} className="flex items-center gap-3" style={{ padding: '10px 4px' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--gradient-soft)', display: 'grid', placeItems: 'center', color: 'var(--brand-2)' }}>
                    <Wallet size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semi">{fmtDate(new Date(p.year, p.month - 1), { month: 'long', year: 'numeric' })}</div>
                    <div className="text-xs muted">Net pay</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{money(p.netPay)}</div>
                    <Badge status={p.status}>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
