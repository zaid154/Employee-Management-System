import { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2, Mail, Lock, Eye, EyeOff, LogIn as LogInIcon,
  CheckCircle2, User, Briefcase, ShieldCheck, Wallet, Users,
  ArrowRight, UserPlus, HelpCircle,
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { Button, Field, Input, Modal } from '../components/ui.jsx';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@ems.dev', password: 'Admin@12345', badge: 'Full Access', desc: 'System governance & all modules' },
  { role: 'HR Manager', email: 'priya.nair@ems.dev', password: 'Password@123', badge: 'HR Operations', desc: 'Payroll batch, leave approvals & staff' },
  { role: 'Team Manager', email: 'aarav.sharma@ems.dev', password: 'Password@123', badge: 'Team Lead', desc: 'Direct reports attendance & reviews' },
  { role: 'Employee', email: 'rohan.mehta@ems.dev', password: 'Password@123', badge: 'Staff Portal', desc: 'Personal check-in, leaves & payslips' },
];

export default function Login({ initialTab = 'login' }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: 'admin@ems.dev',
    password: 'Admin@12345',
    remember: true,
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    designation: 'Software Engineer',
    departmentName: 'Engineering',
    agreeTerms: true,
  });

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    const pwd = registerForm.password || '';
    if (!pwd) return { score: 0, label: '', class: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', class: 'weak' };
    if (score <= 3) return { score: 2, label: 'Fair', class: 'fair' };
    return { score: 3, label: 'Strong', class: 'strong' };
  }, [registerForm.password]);

  if (user) return <Navigate to="/" replace />;

  const handleTabChange = (newTab) => {
    setTab(newTab);
    navigate(newTab === 'register' ? '/register' : '/login', { replace: true });
  };

  const executeLogin = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      toast.error('Please enter work email and password');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(cleanEmail, cleanPassword);
      toast.success(`Welcome back, ${loggedInUser.name || 'User'}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    executeLogin(loginForm.email, loginForm.password);
  };

  const handleQuickSignIn = (acc) => {
    setLoginForm((prev) => ({ ...prev, email: acc.email, password: acc.password }));
    executeLogin(acc.email, acc.password);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, role, designation, departmentName, agreeTerms } = registerForm;

    if (!name.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      toast.error('Please accept data policy terms to proceed');
      return;
    }

    setLoading(true);
    try {
      const registeredUser = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        designation: designation.trim() || 'Associate',
        departmentName: departmentName.trim() || 'General',
      });
      toast.success(`Account created successfully! Welcome, ${registeredUser.name}.`);
      navigate('/');
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left Brand Showcase Panel (Desktop) */}
      <div className="auth-showcase-panel">
        <div className="auth-showcase-brand">
          <div className="auth-showcase-logo">
            <Building2 size={24} />
          </div>
          <div>
            <div className="auth-showcase-title">PeoplePay</div>
            <div className="auth-showcase-tagline">Enterprise HR &amp; Payroll Platform</div>
          </div>
        </div>

        <div className="auth-showcase-content">
          <div className="auth-showcase-badge">
            <ShieldCheck size={14} /> SOC 2 Type II &amp; ISO 27001 Certified
          </div>
          <h2 className="auth-showcase-heading">
            The modern operating platform for workforce compensation &amp; talent operations.
          </h2>
          <p className="auth-showcase-subtext">
            Streamline monthly salary batches, tax deductions, shift attendances, and multi-tier leave workflows from a single unified portal.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Wallet size={16} />
              </div>
              <div className="auth-feature-text">
                <h4>Automated Payroll &amp; Compliance</h4>
                <p>Precise gross-to-net computation with statutory PF (12%), PTax, and itemised digital payslips.</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Users size={16} />
              </div>
              <div className="auth-feature-text">
                <h4>Role-Based Access Control</h4>
                <p>Granular data isolation tailored for Administrators, HR Managers, Department Leads, and Staff.</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Building2 size={16} />
              </div>
              <div className="auth-feature-text">
                <h4>Shift Attendance &amp; Leave Quotas</h4>
                <p>Real-time clock-in tracking, automated grace periods, and seamless holiday calendar management.</p>
              </div>
            </div>
          </div>

          <div className="auth-stats-grid">
            <div>
              <div className="auth-stat-value">99.98%</div>
              <div className="auth-stat-label">Platform Uptime</div>
            </div>
            <div>
              <div className="auth-stat-value">4 Roles</div>
              <div className="auth-stat-label">Granular RBAC</div>
            </div>
            <div>
              <div className="auth-stat-value">&lt; 4 min</div>
              <div className="auth-stat-label">Payroll Batch Run</div>
            </div>
          </div>
        </div>

        <div className="auth-showcase-footer">
          <span>&copy; {new Date().getFullYear()} PeoplePay Technologies Inc.</span>
          <span>End-to-End Enterprise Encryption</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          {/* Mobile / Header Brand */}
          <div className="text-center mb-4">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <Building2 size={22} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              {tab === 'login' ? 'Sign in to Workplace' : 'Create Enterprise Account'}
            </h1>
            <p className="muted text-xs mt-1">
              {tab === 'login'
                ? 'Select a demo persona or authenticate with corporate credentials'
                : 'Join your organization workforce portal with immediate access'}
            </p>
          </div>

          {/* Segmented Switcher Tabs */}
          <div className="auth-segmented-tabs">
            <button
              type="button"
              className={`auth-segmented-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-segmented-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabChange('register')}
            >
              Create Account
            </button>
          </div>

          {/* TAB 1: SIGN IN */}
          {tab === 'login' && (
            <div>
              {/* 1-Click Demo Sign-In Grid */}
              <div style={{ marginBottom: 18 }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semi muted uppercase tracking-wide">
                    1-Click Demo Personas
                  </span>
                  <span className="text-xs font-mono muted">Instant Login</span>
                </div>
                <div className="demo-chips" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {DEMO_ACCOUNTS.map((acc) => {
                    const isSelected = loginForm.email === acc.email;
                    return (
                      <button
                        key={acc.role}
                        type="button"
                        className="demo-chip"
                        onClick={() => handleQuickSignIn(acc)}
                        disabled={loading}
                        style={{
                          cursor: 'pointer',
                          padding: '9px 11px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--accent-subtle)' : 'var(--surface)',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <strong style={{ fontSize: 12.5, color: 'var(--text)' }}>{acc.role}</strong>
                          {isSelected ? (
                            <CheckCircle2 size={13} style={{ color: 'var(--accent)' }} />
                          ) : (
                            <span
                              style={{
                                fontSize: 9.5,
                                color: 'var(--text-3)',
                                background: 'var(--bg-subtle)',
                                padding: '1px 5px',
                                borderRadius: 3,
                              }}
                            >
                              {acc.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono muted truncate" style={{ width: '100%', fontSize: 11 }}>
                          {acc.email}
                        </div>
                        <div className="text-xs muted mt-1" style={{ fontSize: 10, lineHeight: 1.2 }}>
                          {acc.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit}>
                <Field label="Work Email Address" required>
                  <div className="input-icon">
                    <Mail size={15} />
                    <Input
                      type="email"
                      placeholder="name@ems.dev"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </Field>

                <Field label="Password" required>
                  <div className="input-icon" style={{ position: 'relative' }}>
                    <Lock size={15} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-3)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                <div className="flex items-center justify-between mb-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={loginForm.remember}
                      onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span className="muted">Remember device</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModal(true)}
                    className="btn-ghost"
                    style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                  icon={LogInIcon}
                  size="lg"
                >
                  Sign In to Workplace
                </Button>
              </form>

              <div className="text-center mt-4 text-xs muted">
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange('register')}
                  style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Create workplace account
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER */}
          {tab === 'register' && (
            <div>
              <form onSubmit={handleRegisterSubmit}>
                <Field label="Full Name" required>
                  <div className="input-icon">
                    <User size={15} />
                    <Input
                      type="text"
                      placeholder="e.g. Vikram Sharma"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                      autoComplete="name"
                      disabled={loading}
                    />
                  </div>
                </Field>

                <Field label="Corporate Work Email" required>
                  <div className="input-icon">
                    <Mail size={15} />
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </Field>

                {/* Role Selection */}
                <div className="field">
                  <label className="field-label">Account Role &amp; Access Tier</label>
                  <div className="role-pill-grid">
                    {[
                      { role: 'employee', label: 'Employee', hint: 'Personal Portal' },
                      { role: 'manager', label: 'Manager', hint: 'Team Reviews' },
                      { role: 'hr', label: 'HR Admin', hint: 'All Operations' },
                    ].map((item) => (
                      <div
                        key={item.role}
                        className={`role-pill ${registerForm.role === item.role ? 'active' : ''}`}
                        onClick={() => setRegisterForm({ ...registerForm, role: item.role })}
                      >
                        <div>{item.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{item.hint}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-grid-2">
                  <Field label="Designation">
                    <div className="input-icon">
                      <Briefcase size={14} />
                      <Input
                        type="text"
                        placeholder="e.g. Product Designer"
                        value={registerForm.designation}
                        onChange={(e) => setRegisterForm({ ...registerForm, designation: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </Field>

                  <Field label="Department">
                    <div className="input-icon">
                      <Building2 size={14} />
                      <Input
                        type="text"
                        placeholder="e.g. Engineering"
                        value={registerForm.departmentName}
                        onChange={(e) => setRegisterForm({ ...registerForm, departmentName: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </Field>
                </div>

                <Field label="Password" required>
                  <div className="input-icon" style={{ position: 'relative' }}>
                    <Lock size={15} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-3)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                {/* Password strength indicator */}
                {registerForm.password && (
                  <div className="password-meter-wrap">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="muted" style={{ fontSize: 11 }}>Password Strength</span>
                      <span className={`font-semi text-xs`} style={{
                        color: passwordStrength.class === 'strong' ? 'var(--green-text)' : passwordStrength.class === 'fair' ? 'var(--amber-text)' : 'var(--red-text)'
                      }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="password-meter">
                      <div className={`password-meter-segment ${passwordStrength.score >= 1 ? passwordStrength.class : ''}`} />
                      <div className={`password-meter-segment ${passwordStrength.score >= 2 ? passwordStrength.class : ''}`} />
                      <div className={`password-meter-segment ${passwordStrength.score >= 3 ? passwordStrength.class : ''}`} />
                    </div>
                  </div>
                )}

                <Field label="Confirm Password" required>
                  <div className="input-icon" style={{ position: 'relative' }}>
                    <Lock size={15} />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      required
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-3)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                <div className="mb-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={registerForm.agreeTerms}
                      onChange={(e) => setRegisterForm({ ...registerForm, agreeTerms: e.target.checked })}
                      style={{ accentColor: 'var(--accent)' }}
                      required
                    />
                    <span className="muted">
                      I agree to the Enterprise Usage Agreement &amp; Data Security Policy
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                  icon={UserPlus}
                  size="lg"
                >
                  Create Work Account &amp; Sign In
                </Button>
              </form>

              <div className="text-center mt-4 text-xs muted">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Sign in to existing account
                </button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11.5, color: 'var(--text-3)' }}>
            &copy; {new Date().getFullYear()} PeoplePay &middot; SOC 2 Type II Certified Workplace Security
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <Modal
          open={forgotModal}
          onClose={() => setForgotModal(false)}
          title="Password Reset Assistance"
          subtitle="Corporate Single Sign-On & Password Policy"
          footer={
            <Button variant="secondary" onClick={() => setForgotModal(false)}>
              Got It
            </Button>
          }
        >
          <div className="flex-col gap-3" style={{ fontSize: 13, lineHeight: 1.6 }}>
            <p>
              In compliance with enterprise identity policy, corporate accounts are administered by the Organization HR Team.
            </p>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <strong>Demo Environment Credentials:</strong>
              <ul style={{ paddingLeft: 18, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Admin: <code>admin@ems.dev</code> / <code>Admin@12345</code></li>
                <li>HR Manager: <code>priya.nair@ems.dev</code> / <code>Password@123</code></li>
                <li>Manager: <code>aarav.sharma@ems.dev</code> / <code>Password@123</code></li>
                <li>Employee: <code>rohan.mehta@ems.dev</code> / <code>Password@123</code></li>
              </ul>
            </div>
            <p className="muted text-xs">
              For custom accounts, an HR Administrator can reset user credentials directly from the Employees management dashboard.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
