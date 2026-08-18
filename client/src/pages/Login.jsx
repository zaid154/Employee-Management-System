import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Wallet, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { Button, Field, Input } from '../components/ui.jsx';

const DEMO = [
  { role: 'Administrator', email: 'admin@ems.dev', password: 'Admin@12345', color: '#8b5cf6' },
  { role: 'HR Manager', email: 'priya.nair@ems.dev', password: 'Password@123', color: '#06b6d4' },
  { role: 'Team Manager', email: 'aarav.sharma@ems.dev', password: 'Password@123', color: '#f59e0b' },
  { role: 'Employee', email: 'rohan.mehta@ems.dev', password: 'Password@123', color: '#10b981' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}! 👋`);
      navigate('/');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const useDemo = (d) => setForm({ email: d.email, password: d.password });

  return (
    <div className="auth-wrap">
      {/* Visual side */}
      <div className="auth-visual">
        <div className="blob" style={{ width: 300, height: 300, background: '#fff', top: -60, right: -40 }} />
        <div className="blob" style={{ width: 260, height: 260, background: '#c4b5fd', bottom: 40, left: -60 }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="flex items-center gap-3">
            <span style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center' }}>
              <Wallet size={24} />
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>PeoplePay</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ position: 'relative', zIndex: 2 }}
        >
          <h1 style={{ fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Run your people
            <br />
            operations with ease.
          </h1>
          <p style={{ marginTop: 16, fontSize: '1.05rem', opacity: 0.9, maxWidth: 420, lineHeight: 1.6 }}>
            One place for your team&apos;s attendance, leave, payroll, and performance — with role-based access
            for admins, HR, managers, and employees.
          </p>
          <div className="flex gap-5 mt-6 flex-wrap">
            {[
              { icon: Users, label: 'Employee 360°' },
              { icon: TrendingUp, label: 'Payroll & Reports' },
              { icon: ShieldCheck, label: 'Role-based access' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2" style={{ opacity: 0.95 }}>
                <f.icon size={18} />
                <span className="text-sm font-semi">{f.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div style={{ position: 'relative', zIndex: 2, opacity: 0.75, fontSize: '0.82rem' }}>
          © {new Date().getFullYear()} PeoplePay · Built with the MERN stack
        </div>
      </div>

      {/* Form side */}
      <div className="auth-form-side">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Welcome back</h2>
          <p className="muted mt-1 mb-4">Sign in to your PeoplePay workspace</p>

          <form onSubmit={submit} className="flex-col gap-4">
            <Field label="Email address">
              <div className="input-icon">
                <Mail size={16} />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="input-icon">
                <Lock size={16} />
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Button type="submit" disabled={loading} icon={loading ? undefined : ArrowRight} className="btn-block mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="divider" />
          <p className="text-xs muted font-semi" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Try a demo account
          </p>
          <div className="flex-col gap-2 mt-3">
            {DEMO.map((d) => (
              <button key={d.email} className="demo-chip" onClick={() => useDemo(d)} type="button">
                <span className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                  <span className="font-semi">{d.role}</span>
                </span>
                <span className="muted text-xs">{d.email}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
