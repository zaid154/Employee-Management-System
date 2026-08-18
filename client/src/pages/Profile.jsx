import { useState } from 'react';
import { Lock, Mail, Shield, Briefcase, Building2, Calendar, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { PageHeader, Card, Button, Badge, Avatar, Field, Input } from '../components/ui.jsx';
import { fullName, fmtDate } from '../lib/format.js';
import { ROLE_LABELS } from '../lib/constants.js';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>
        <Icon size={16} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="text-xs muted">{label}</div>
        <div className="font-semi truncate">{value || '—'}</div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const emp = user.employee;
  const displayName = emp ? fullName(emp) : user.name;

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match');
    if (pw.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await api.patch('/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password updated 🔒');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your account and personal details" />

      <Card pad={false} className="mb-4" style={{ overflow: 'hidden' }}>
        <div style={{ height: 84, background: 'var(--gradient)' }} />
        <div className="card-pad" style={{ marginTop: -42 }}>
          <div className="flex items-end gap-4 flex-wrap">
            <Avatar name={displayName} src={user.avatar} size={88} />
            <div style={{ paddingBottom: 4 }}>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge color="violet" dot={false}>{ROLE_LABELS[user.role]}</Badge>
                {emp && <span className="badge gray" style={{ fontFamily: 'monospace' }}>{emp.employeeId}</span>}
                {emp?.designation && <span className="text-sm text-2">{emp.designation}</span>}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid-2">
        <Card>
          <div className="card-title mb-4">Account Details</div>
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow icon={Shield} label="Role" value={ROLE_LABELS[user.role]} />
          {emp && <InfoRow icon={Briefcase} label="Designation" value={emp.designation} />}
          {emp?.department?.name && <InfoRow icon={Building2} label="Department" value={emp.department.name} />}
          {emp?.dateOfJoining && <InfoRow icon={Calendar} label="Joined" value={fmtDate(emp.dateOfJoining)} />}
          {user.lastLoginAt && <InfoRow icon={KeyRound} label="Last login" value={fmtDate(user.lastLoginAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />}
        </Card>

        <Card>
          <div className="card-title mb-4 flex items-center gap-2"><Lock size={17} /> Change Password</div>
          <form onSubmit={changePw} className="flex-col gap-4">
            <Field label="Current password" required>
              <Input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
            </Field>
            <Field label="New password" required>
              <Input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} placeholder="Min 6 characters" required />
            </Field>
            <Field label="Confirm new password" required>
              <Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
            </Field>
            <Button type="submit" disabled={saving} icon={KeyRound}>{saving ? 'Updating…' : 'Update password'}</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
