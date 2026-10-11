import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Building2, UserCircle,
  Wallet, CreditCard, ShieldAlert, Pencil, User, FileText, CheckCircle
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import {
  Card, CardHeader, Loader, Badge, Avatar, Button, EmptyState, Tabs
} from '../components/ui.jsx';
import { DonutChart } from '../components/charts.jsx';
import { money, fmtDate, fullName } from '../lib/format.js';
import { isPrivileged, CHART_COLORS } from '../lib/constants.js';
import EmployeeForm from '../components/EmployeeForm.jsx';

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-3)',
          flexShrink: 0,
        }}
      >
        <Icon size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-xs muted">{label}</div>
        <div className="font-medium text-sm truncate" style={{ color: 'var(--text)', marginTop: 1 }}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, refetch } = useFetch(`/employees/${id}`, [id]);
  const { data: deptData } = useFetch(isPrivileged(user.role) ? '/departments' : null);
  const { data: mgrData } = useFetch(isPrivileged(user.role) ? '/employees/options' : null);

  const [activeTab, setActiveTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);

  if (loading) return <Loader label="Loading employee profile…" />;
  if (!data?.data) {
    return (
      <Card>
        <EmptyState
          title="Employee not found"
          message="The requested employee record does not exist or has been removed."
          action={<Button onClick={() => navigate('/employees')}>Return to Directory</Button>}
        />
      </Card>
    );
  }

  const e = data.data;
  const s = e.salary || {};
  const gross = (s.basic || 0) + (s.hra || 0) + (s.allowances || 0);
  const totalDeductions = (s.pf || 0) + (s.professionalTax || 0);
  const netMonthly = gross - totalDeductions;

  const salaryData = [
    { label: 'Basic Salary', value: s.basic || 0, color: CHART_COLORS[0] },
    { label: 'HRA', value: s.hra || 0, color: CHART_COLORS[1] },
    { label: 'Special Allowances', value: s.allowances || 0, color: CHART_COLORS[2] },
  ];

  const balance = e.leaveBalance || {};
  const canEdit = isPrivileged(user.role);
  const ownId = user.employee?._id || user.employee;
  const isOwn = ownId && String(ownId) === String(e._id);
  const canSeeSalary = canEdit || isOwn;

  const tabs = [
    { id: 'overview', label: 'Overview & Personal', icon: User },
    { id: 'employment', label: 'Job & Role', icon: Briefcase },
    ...(canSeeSalary ? [{ id: 'compensation', label: 'Salary & Banking', icon: Wallet }] : []),
    { id: 'leaves', label: 'Leave Quotas', icon: Calendar },
  ];

  return (
    <>
      {/* Back button */}
      <div className="mb-3">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/employees')}
          style={{ paddingLeft: 0 }}
        >
          <ArrowLeft size={14} /> Back to Directory
        </button>
      </div>

      {/* Header Profile Summary */}
      <Card pad={false} className="mb-4">
        <div className="card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div className="flex items-center gap-4">
            <Avatar name={fullName(e)} src={e.avatar} size={54} />
            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  {fullName(e)}
                </h1>
                <span className="table-cell-mono" style={{ fontSize: 11, padding: '2px 6px', background: 'var(--bg-subtle)', borderRadius: 4 }}>
                  {e.employeeId}
                </span>
                <Badge status={e.status}>{e.status}</Badge>
              </div>
              <div className="text-sm muted mt-1">
                {e.designation} · {e.department?.name || 'General'}
              </div>
            </div>
          </div>

          {canEdit && (
            <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
              Edit Profile
            </Button>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ padding: '0 20px' }}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </Card>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          <Card pad={false}>
            <CardHeader title="Personal Information" subtitle="Contact and identity details" />
            <div className="card-pad">
              <DetailItem icon={Mail} label="Email Address" value={e.email} />
              <DetailItem icon={Phone} label="Phone Number" value={e.phone} />
              <DetailItem icon={UserCircle} label="Gender" value={<span className="capitalize">{e.gender}</span>} />
              <DetailItem icon={Calendar} label="Date of Birth" value={e.dateOfBirth ? fmtDate(e.dateOfBirth) : '—'} />
              <DetailItem icon={MapPin} label="Residential Address" value={e.address} />
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader title="Emergency Contact" subtitle="Next of kin / trusted contact" />
            <div className="card-pad">
              <DetailItem icon={ShieldAlert} label="Contact Name" value={e.emergencyContact?.name} />
              <DetailItem icon={UserCircle} label="Relationship" value={e.emergencyContact?.relation} />
              <DetailItem icon={Phone} label="Emergency Phone" value={e.emergencyContact?.phone} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'employment' && (
        <div className="grid-2">
          <Card pad={false}>
            <CardHeader title="Employment Details" subtitle="Position and reporting structure" />
            <div className="card-pad">
              <DetailItem icon={Briefcase} label="Designation" value={e.designation} />
              <DetailItem icon={Building2} label="Department" value={e.department?.name} />
              <DetailItem icon={UserCircle} label="Reporting Manager" value={e.manager ? fullName(e.manager) : 'None assigned'} />
              <DetailItem icon={Briefcase} label="Employment Type" value={<span className="capitalize">{e.employmentType}</span>} />
              <DetailItem icon={Calendar} label="Date of Joining" value={fmtDate(e.dateOfJoining)} />
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader title="Work Status" subtitle="Current status within company" />
            <div className="card-pad flex-col gap-3">
              <div className="flex justify-between items-center" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm muted">Employment Status</span>
                <Badge status={e.status}>{e.status}</Badge>
              </div>
              <div className="flex justify-between items-center" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm muted">Employee ID</span>
                <span className="table-cell-mono">{e.employeeId}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'compensation' && (
        <div className="grid-2">
          <Card pad={false}>
            <CardHeader
              title="Salary Breakdown"
              subtitle="Monthly earnings and statutory deductions"
              action={<span className="badge green">{money(gross)}/mo gross</span>}
            />
            <div className="card-pad">
              <DonutChart data={salaryData} centerValue={money(gross)} centerLabel="Gross" size={160} />
              <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="muted">Provident Fund (PF)</span>
                  <span className="font-semi font-mono" style={{ color: 'var(--red-text)' }}>
                    − {money(s.pf)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="muted">Professional Tax</span>
                  <span className="font-semi font-mono" style={{ color: 'var(--red-text)' }}>
                    − {money(s.professionalTax)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span>Net Take-Home Pay</span>
                  <span className="font-mono" style={{ color: 'var(--green-text)' }}>
                    {money(netMonthly)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card pad={false}>
            <CardHeader title="Banking &amp; Statutory Details" subtitle="Disbursement account info" />
            <div className="card-pad">
              <DetailItem icon={CreditCard} label="Bank Name" value={e.bank?.bankName} />
              <DetailItem icon={User} label="Account Holder Name" value={e.bank?.accountName} />
              <DetailItem icon={CreditCard} label="Account Number" value={e.bank?.accountNumber} />
              <DetailItem icon={Building2} label="IFSC Code" value={e.bank?.ifscCode} />
              <DetailItem icon={FileText} label="PAN / Tax ID" value={e.bank?.pan} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'leaves' && (
        <Card pad={false}>
          <CardHeader title="Annual Leave Allocation" subtitle="Remaining quota balance for the current calendar year" />
          <div className="card-pad">
            <div className="grid-3">
              {['casual', 'sick', 'earned'].map((t, i) => (
                <div
                  key={t}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    textAlign: 'center',
                  }}
                >
                  <div className="font-bold text-2xl font-mono" style={{ color: CHART_COLORS[i] }}>
                    {balance[t] ?? 0}
                  </div>
                  <div className="text-xs muted capitalize mt-1">{t} Leave Days Left</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Edit Form Modal */}
      {canEdit && (
        <EmployeeForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={refetch}
          employee={e}
          departments={deptData?.data || []}
          managers={mgrData?.data || []}
        />
      )}
    </>
  );
}
