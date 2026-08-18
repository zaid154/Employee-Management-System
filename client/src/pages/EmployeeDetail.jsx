import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Building2, UserCircle,
  Wallet, CreditCard, ShieldAlert, Pencil,
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { Card, Loader, Badge, Avatar, Button, EmptyState } from '../components/ui.jsx';
import { DonutChart } from '../components/charts.jsx';
import { money, fmtDate, fullName } from '../lib/format.js';
import { isPrivileged, CHART_COLORS } from '../lib/constants.js';
import { useState } from 'react';
import EmployeeForm from '../components/EmployeeForm.jsx';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', color: 'var(--text-3)', flexShrink: 0 }}>
        <Icon size={16} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="text-xs muted">{label}</div>
        <div className="font-semi truncate">{value || '—'}</div>
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
  const [editOpen, setEditOpen] = useState(false);

  if (loading) return <Loader />;
  if (!data?.data) return <Card><EmptyState title="Employee not found" action={<Button onClick={() => navigate('/employees')}>Back</Button>} /></Card>;

  const e = data.data;
  const s = e.salary || {};
  const gross = (s.basic || 0) + (s.hra || 0) + (s.allowances || 0);
  const salaryData = [
    { label: 'Basic', value: s.basic || 0, color: CHART_COLORS[0] },
    { label: 'HRA', value: s.hra || 0, color: CHART_COLORS[1] },
    { label: 'Allowances', value: s.allowances || 0, color: CHART_COLORS[2] },
  ];
  const balance = e.leaveBalance || {};
  const canEdit = isPrivileged(user.role);

  return (
    <>
      <button className="flex items-center gap-2 muted font-semi mb-4 pointer" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none' }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header banner */}
      <Card pad={false} className="mb-4" style={{ overflow: 'hidden' }}>
        <div style={{ height: 90, background: 'var(--gradient)' }} />
        <div className="card-pad" style={{ marginTop: -46 }}>
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div className="flex items-end gap-4">
              <Avatar name={fullName(e)} src={e.avatar} size={92} className="" />
              <div style={{ paddingBottom: 4 }}>
                <h1 className="text-2xl font-bold">{fullName(e)}</h1>
                <div className="text-2 font-semi">{e.designation}</div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge status={e.status}>{e.status}</Badge>
                  <span className="badge gray" style={{ fontFamily: 'monospace' }}>{e.employeeId}</span>
                  {e.department?.name && <span className="badge violet"><Building2 size={11} /> {e.department.name}</span>}
                </div>
              </div>
            </div>
            {canEdit && <Button variant="ghost" icon={Pencil} onClick={() => setEditOpen(true)}>Edit</Button>}
          </div>
        </div>
      </Card>

      <div className="grid-2">
        <div className="flex-col gap-4">
          <Card>
            <div className="card-title mb-4">Personal Information</div>
            <InfoRow icon={Mail} label="Email" value={e.email} />
            <InfoRow icon={Phone} label="Phone" value={e.phone} />
            <InfoRow icon={UserCircle} label="Gender" value={e.gender} />
            <InfoRow icon={Calendar} label="Date of birth" value={e.dateOfBirth ? fmtDate(e.dateOfBirth) : '—'} />
            <InfoRow icon={MapPin} label="Address" value={e.address} />
          </Card>

          <Card>
            <div className="card-title mb-4">Employment</div>
            <InfoRow icon={Briefcase} label="Designation" value={e.designation} />
            <InfoRow icon={Building2} label="Department" value={e.department?.name} />
            <InfoRow icon={UserCircle} label="Reporting to" value={e.manager ? fullName(e.manager) : 'None'} />
            <InfoRow icon={Briefcase} label="Employment type" value={<span className="capitalize">{e.employmentType}</span>} />
            <InfoRow icon={Calendar} label="Joined" value={fmtDate(e.dateOfJoining)} />
          </Card>
        </div>

        <div className="flex-col gap-4">
          <Card>
            <div className="card-header">
              <div className="card-title">Salary Structure</div>
              <span className="badge green"><Wallet size={11} /> {money(gross)}/mo</span>
            </div>
            <DonutChart data={salaryData} centerValue={money(gross)} centerLabel="gross / month" thickness={22} size={170} />
            <div className="divider" />
            <div className="flex justify-between text-sm">
              <span className="muted">PF deduction</span>
              <span className="font-semi">− {money(s.pf)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="muted">Professional tax</span>
              <span className="font-semi">− {money(s.professionalTax)}</span>
            </div>
          </Card>

          <Card>
            <div className="card-title mb-4">Leave Balance</div>
            <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {['casual', 'sick', 'earned'].map((t, i) => (
                <div key={t} style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)', textAlign: 'center' }}>
                  <div className="font-bold text-xl" style={{ color: CHART_COLORS[i] }}>{balance[t] ?? 0}</div>
                  <div className="text-xs muted capitalize">{t}</div>
                </div>
              ))}
            </div>
          </Card>

          {(e.bank?.accountNumber || e.emergencyContact?.name) && (
            <Card>
              <div className="card-title mb-4">Confidential</div>
              {e.bank?.accountNumber && (
                <InfoRow icon={CreditCard} label={`Bank · ${e.bank.bankName || ''}`} value={`${e.bank.accountName} · ${e.bank.accountNumber}`} />
              )}
              {e.emergencyContact?.name && (
                <InfoRow icon={ShieldAlert} label={`Emergency · ${e.emergencyContact.relation || ''}`} value={`${e.emergencyContact.name} · ${e.emergencyContact.phone}`} />
              )}
            </Card>
          )}
        </div>
      </div>

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
