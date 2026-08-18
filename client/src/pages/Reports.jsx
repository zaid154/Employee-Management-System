import { useState } from 'react';
import { PieChart, Users, CalendarCheck, Wallet, CalendarDays } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { PageHeader, Card, Loader, Select, EmptyState } from '../components/ui.jsx';
import { DonutChart, BarChart, AreaChart, RankBars } from '../components/charts.jsx';
import { money, compactMoney } from '../lib/format.js';
import { isPrivileged, CHART_COLORS } from '../lib/constants.js';

const now = new Date();
const YEARS = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

export default function Reports() {
  const { user } = useAuth();
  const showPayroll = isPrivileged(user.role);
  const [year, setYear] = useState(now.getFullYear());

  const { data: headcount, loading: l1 } = useFetch('/reports/headcount');
  const { data: attendance, loading: l2 } = useFetch(`/reports/attendance?year=${year}`, [year]);
  const { data: leaves, loading: l3 } = useFetch(`/reports/leaves?year=${year}`, [year]);
  const { data: payroll, loading: l4 } = useFetch(showPayroll ? `/reports/payroll?year=${year}` : null, [year]);

  const hc = headcount?.data;
  const deptBars = (hc?.byDepartment || []).map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }));
  const typeData = (hc?.byType || []).map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }));
  const leaveTypeBars = (leaves?.data?.byType || []).map((d, i) => ({ label: d.label, value: d.days, color: CHART_COLORS[i % CHART_COLORS.length] }));

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Workforce, attendance, payroll & leave insights"
        actions={
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ minWidth: 120 }}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        }
      />

      <div className="grid-2 mb-4">
        <Card>
          <div className="card-header">
            <div className="card-title flex items-center gap-2"><Users size={17} /> Headcount by Department</div>
          </div>
          {l1 ? <Loader /> : deptBars.length ? <RankBars data={deptBars} /> : <EmptyState title="No data" />}
        </Card>

        <Card>
          <div className="card-header">
            <div className="card-title flex items-center gap-2"><PieChart size={17} /> Employment Type</div>
          </div>
          {l1 ? <Loader /> : <DonutChart data={typeData} centerLabel="employees" />}
        </Card>
      </div>

      <Card className="mb-4">
        <div className="card-header">
          <div className="card-title flex items-center gap-2"><CalendarCheck size={17} /> Attendance Trend · {year}</div>
          <div className="flex gap-3 text-xs flex-wrap">
            {[['Present', '#10b981'], ['Late', '#f59e0b'], ['Absent', '#ef4444'], ['On leave', '#3b82f6']].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1"><span style={{ width: 9, height: 9, borderRadius: 2, background: c }} /> {l}</span>
            ))}
          </div>
        </div>
        {l2 ? (
          <Loader />
        ) : (
          <BarChart
            data={attendance?.data || []}
            keys={['present', 'late', 'absent', 'on-leave']}
            colors={['#10b981', '#f59e0b', '#ef4444', '#3b82f6']}
            height={240}
          />
        )}
      </Card>

      {showPayroll && (
        <Card className="mb-4">
          <div className="card-header">
            <div className="card-title flex items-center gap-2"><Wallet size={17} /> Payroll Cost · {year}</div>
            {payroll?.data?.totals && (
              <div className="flex gap-4 text-sm">
                <span><span className="muted">Net: </span><span className="font-bold">{money(payroll.data.totals.net)}</span></span>
                <span className="hide-sm"><span className="muted">Deductions: </span><span className="font-bold">{money(payroll.data.totals.deductions)}</span></span>
              </div>
            )}
          </div>
          {l4 ? (
            <Loader />
          ) : (
            <AreaChart data={payroll?.data?.byMonth || []} dataKey="net" color="#8b5cf6" height={230} valueFormat={compactMoney} />
          )}
        </Card>
      )}

      <div className="grid-2">
        <Card>
          <div className="card-header">
            <div className="card-title flex items-center gap-2"><CalendarDays size={17} /> Leave Usage by Type</div>
          </div>
          {l3 ? <Loader /> : leaveTypeBars.length ? <RankBars data={leaveTypeBars} valueFormat={(v) => `${v} days`} /> : <EmptyState title="No leave data" />}
        </Card>

        <Card>
          <div className="card-header">
            <div className="card-title flex items-center gap-2"><PieChart size={17} /> Leave Requests by Status</div>
          </div>
          {l3 ? (
            <Loader />
          ) : (
            <DonutChart
              data={(leaves?.data?.byStatus || []).map((d) => ({
                label: d.label,
                value: d.count,
                color: { approved: '#10b981', pending: '#f59e0b', rejected: '#ef4444', cancelled: '#94a3b8' }[d.label] || '#8b5cf6',
              }))}
              centerLabel="requests"
            />
          )}
        </Card>
      </div>
    </>
  );
}
