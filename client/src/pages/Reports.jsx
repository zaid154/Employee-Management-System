import { useState } from 'react';
import { PieChart, Users, Wallet, CalendarDays, Download } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { PageHeader, Card, CardHeader, Loader, Select, EmptyState, Button } from '../components/ui.jsx';
import { DonutChart, DistributionBarChart } from '../components/charts.jsx';
import { money } from '../lib/format.js';
import { isPrivileged, CHART_COLORS } from '../lib/constants.js';

const now = new Date();
const YEARS = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

export default function Reports() {
  const { user } = useAuth();
  const showPayroll = isPrivileged(user.role);
  const [year, setYear] = useState(now.getFullYear());

  const { data: headcount, loading: l1 } = useFetch('/reports/headcount');
  const { data: leaves, loading: l3 } = useFetch(`/reports/leaves?year=${year}`, [year]);
  const { data: payroll, loading: l4 } = useFetch(showPayroll ? `/reports/payroll?year=${year}` : null, [year]);

  const hc = headcount?.data;
  const deptBars = (hc?.byDepartment || []).map((d, i) => ({
    label: d.name || 'Unassigned',
    value: d.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const typeData = (hc?.byType || []).map((d, i) => ({
    label: d.type || d.label,
    value: d.count || d.value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const leaveTypeBars = (leaves?.data?.byType || []).map((d, i) => ({
    label: `${d.label || d.type} Leave`,
    value: d.days || d.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const exportCSV = () => {
    if (!deptBars.length) return;
    const rows = [
      ['Department', 'Headcount'],
      ...deptBars.map((d) => [d.label, d.value]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `headcount_report_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Workforce headcount, attendance metrics, and leave trends"
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ minWidth: 120 }}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Button variant="secondary" icon={Download} onClick={exportCSV}>
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid-2 mb-4">
        <Card pad={false}>
          <CardHeader
            title="Headcount by Department"
            subtitle="Current organizational distribution"
            action={<Users size={16} className="muted" />}
          />
          <div className="card-pad">
            {l1 ? <Loader label="" size={24} /> : deptBars.length ? <DistributionBarChart data={deptBars} /> : <EmptyState title="No headcount data" />}
          </div>
        </Card>

        <Card pad={false}>
          <CardHeader
            title="Employment Types"
            subtitle="Full-time vs contract breakdown"
            action={<PieChart size={16} className="muted" />}
          />
          <div className="card-pad">
            {l1 ? <Loader label="" size={24} /> : <DonutChart data={typeData} centerLabel="Total" />}
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card pad={false}>
          <CardHeader
            title="Leave Utilization by Category"
            subtitle={`Total days consumed in ${year}`}
            action={<CalendarDays size={16} className="muted" />}
          />
          <div className="card-pad">
            {l3 ? <Loader label="" size={24} /> : leaveTypeBars.length ? <DistributionBarChart data={leaveTypeBars} /> : <EmptyState title="No leave data" />}
          </div>
        </Card>

        {showPayroll && (
          <Card pad={false}>
            <CardHeader
              title={`Annual Payroll Cost · ${year}`}
              subtitle="Aggregated salary expenditure"
              action={<Wallet size={16} className="muted" />}
            />
            <div className="card-pad">
              {l4 ? (
                <Loader label="" size={24} />
              ) : payroll?.data?.totals ? (
                <div className="flex-col gap-4">
                  <div style={{ padding: 16, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)' }}>
                    <div className="text-xs muted mb-1">Total Net Disbursed</div>
                    <div className="text-2xl font-bold font-mono" style={{ color: 'var(--green-text)' }}>
                      {money(payroll.data.totals.net)}
                    </div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)' }}>
                    <div className="text-xs muted mb-1">Total Statutory Deductions</div>
                    <div className="text-xl font-bold font-mono" style={{ color: 'var(--red-text)' }}>
                      {money(payroll.data.totals.deductions)}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState title="No payroll data for this year" />
              )}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
