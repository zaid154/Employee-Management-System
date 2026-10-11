import { useState } from 'react';
import { Lock, Mail, Shield, Briefcase, Building2, Calendar, KeyRound, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { PageHeader, Card, CardHeader, Button, Badge, Avatar, Field, Input } from '../components/ui.jsx';
import { fullName, fmtDate } from '../lib/format.js';
import { ROLE_LABELS } from '../lib/constants.js';

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
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

export default function Profile() {
  const { user } = useAuth();
  const emp = user.employee;
  const displayName = emp ? fullName(emp) : user.name;

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pw.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/auth/password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      toast.success('Password updated successfully');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My Account"
        subtitle="Manage your profile settings and authentication credentials"
      />

      <Card pad={false} className="mb-4">
        <div className="card-pad flex items-center gap-4">
          <Avatar name={displayName} src={user.avatar} size={54} />
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {displayName}
              </h1>
              <Badge color="blue" dot={false}>{ROLE_LABELS[user.role]}</Badge>
              {emp && <span className="table-cell-mono" style={{ fontSize: 11, padding: '2px 6px', background: 'var(--bg-subtle)', borderRadius: 4 }}>{emp.employeeId}</span>}
            </div>
            <div className="text-xs muted mt-1">{user.email}</div>
          </div>
        </div>
      </Card>

      <div className="grid-2">
        <Card pad={false}>
          <CardHeader title="Account Details" subtitle="Primary organizational identity" />
          <div className="card-pad">
            <InfoItem icon={Mail} label="Email Address" value={user.email} />
            <InfoItem icon={Shield} label="System Access Role" value={ROLE_LABELS[user.role]} />
            {emp && <InfoItem icon={Briefcase} label="Job Title" value={emp.designation} />}
            {emp?.department?.name && <InfoItem icon={Building2} label="Department" value={emp.department.name} />}
            {emp?.dateOfJoining && <InfoItem icon={Calendar} label="Date of Joining" value={fmtDate(emp.dateOfJoining)} />}
            {user.lastLoginAt && (
              <InfoItem
                icon={KeyRound}
                label="Last Authenticated"
                value={fmtDate(user.lastLoginAt, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            )}
          </div>
        </Card>

        <Card pad={false}>
          <CardHeader title="Security &amp; Password" subtitle="Update your account password" />
          <div className="card-pad">
            <form onSubmit={changePw}>
              <Field label="Current Password" required>
                <Input
                  type="password"
                  value={pw.currentPassword}
                  onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                  required
                />
              </Field>

              <Field label="New Password" required>
                <Input
                  type="password"
                  value={pw.newPassword}
                  onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                  placeholder="Minimum 6 characters"
                  required
                />
              </Field>

              <Field label="Confirm New Password" required>
                <Input
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  required
                />
              </Field>

              <Button type="submit" loading={saving} icon={Lock}>
                Update Password
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}
