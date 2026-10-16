import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2, Mail, Lock, Eye, EyeOff, LogIn as LogInIcon,
  CheckCircle2, User, ShieldCheck, Wallet, Users,
  UserPlus, KeyRound, Sparkles, Check, Phone, Clock,
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { Button, Field, Input, Modal } from '../components/ui.jsx';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@ems.dev', password: 'Admin@12345' },
  { role: 'HR Manager', email: 'priya.nair@ems.dev', password: 'Password@123' },
  { role: 'Manager', email: 'aarav.sharma@ems.dev', password: 'Password@123' },
  { role: 'Employee', email: 'rohan.mehta@ems.dev', password: 'Password@123' },
];

const SHOWCASE_FEATURES = [
  { icon: Wallet, title: 'Automated Payroll & Compliance', desc: 'Gross-to-net computation with statutory PF (12%), PTax, and itemised digital payslips.' },
  { icon: Users, title: 'Enterprise Role Governance', desc: 'Granular RBAC isolation tailored for Admins, HR Managers, Department Leads, and Staff.' },
  { icon: Building2, title: 'Shift Attendance & Quotas', desc: 'Real-time clock-in tracking, automated grace periods, and leave balances.' },
];

function IconInput({ icon: Icon, type = 'text', showToggle, isShown, onToggle, ...props }) {
  return (
    <div className={`input-icon ${showToggle ? 'has-action-right' : ''}`}>
      <Icon size={15} />
      <Input type={showToggle ? (isShown ? 'text' : 'password') : type} {...props} />
      {showToggle && (
        <button type="button" className="input-action-btn" onClick={onToggle} title={isShown ? 'Hide password' : 'Show password'}>
          {isShown ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  );
}

export default function Login({ initialTab = 'login' }) {
  const { user, login, register, verifyEmail, resendVerification, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState('auth');
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Email verification state
  const [verifyEmailAddress, setVerifyEmailAddress] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Admin approval modal
  const [approvalModal, setApprovalModal] = useState({ open: false, msg: '' });

  // Password recovery modal state
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [devResetCode, setDevResetCode] = useState(null);

  // Forms
  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: true });
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', agreeTerms: true });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (user) return <Navigate to="/" replace />;

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setView('auth');
    navigate(newTab === 'register' ? '/register' : '/login', { replace: true });
  };

  const executeLogin = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    if (!cleanEmail || !cleanPassword) return toast.error('Please enter corporate work email and password');

    setLoading(true);
    try {
      const loggedIn = await login(cleanEmail, cleanPassword);
      toast.success(`Welcome back, ${loggedIn.name || 'User'}!`);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.requiresVerification) {
        setVerifyEmailAddress(cleanEmail);
        setDevCode(data.devCode || null);
        setView('verify');
        setResendCooldown(30);
        toast.error(data.message || 'Email verification is required.');
      } else if (err.response?.status === 403 && (data?.pendingApproval || data?.rejected)) {
        setApprovalModal({
          open: true,
          msg: data.message || (data.rejected ? 'Your application was rejected.' : 'Your account is pending administrative review.'),
        });
      } else {
        toast.error(err.friendlyMessage || data?.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, confirmPassword, agreeTerms } = regForm;
    if (!name.trim() || !email.trim() || !password) return toast.error('Please fill in all required fields');
    const cleanPhone = (phone || '').trim();
    if (cleanPhone.replace(/\D/g, '').length < 10) return toast.error('Please provide a valid contact number (10+ digits)');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (!agreeTerms) return toast.error('Please accept data policy terms');

    setLoading(true);
    try {
      const resp = await register({ name: name.trim(), email: email.trim().toLowerCase(), phone: cleanPhone, password });
      setVerifyEmailAddress(email.trim().toLowerCase());
      setDevCode(resp.devCode || null);
      setView('verify');
      setResendCooldown(30);
      toast.success('Account created! A 6-digit code has been sent to your email.');
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const code = verifyCode.trim();
    if (code.length < 6) return toast.error('Please enter the full 6-digit code');

    setLoading(true);
    try {
      const resp = await verifyEmail(verifyEmailAddress, code);
      if (resp.pendingApproval) {
        setApprovalModal({ open: true, msg: resp.message || 'Email verified! Your account is pending admin approval.' });
        setView('auth');
        setTab('login');
      } else {
        toast.success(resp.message || 'Email verified! Welcome.');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.friendlyMessage || 'Verification failed. Please check code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const resp = await resendVerification(verifyEmailAddress);
      setDevCode(resp.devCode || null);
      setResendCooldown(30);
      toast.success('A new 6-digit code has been generated!');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return toast.error('Please enter your work email');
    setLoading(true);
    try {
      const resp = await forgotPassword(forgotEmail.trim().toLowerCase());
      setDevResetCode(resp.devCode || null);
      setForgotStep(2);
      toast.success('Reset code sent to your email.');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to request reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (forgotCode.trim().length < 6) return toast.error('Please enter the 6-digit code');
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (newPassword !== confirmNewPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await resetPassword(forgotEmail.trim().toLowerCase(), forgotCode.trim(), newPassword);
      toast.success('Password updated successfully! Please sign in.');
      setForgotModal(false);
      setForgotStep(1);
      setLoginForm((p) => ({ ...p, email: forgotEmail, password: newPassword }));
    } catch (err) {
      toast.error(err.friendlyMessage || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Brand Showcase Panel */}
      <div className="auth-showcase-panel">
        <div className="auth-showcase-brand">
          <div className="auth-showcase-logo">
            <img src="/logo.png" alt="PeoplePay" style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 8 }} />
          </div>
          <div>
            <div className="auth-showcase-title">PeoplePay</div>
            <div className="auth-showcase-tagline">Enterprise Workforce &amp; Payroll Platform</div>
          </div>
        </div>

        <div className="auth-showcase-content">
          <div className="auth-showcase-badge"><ShieldCheck size={12} /> SOC 2 Type II &amp; Statutory Compliant</div>
          <h2 className="auth-showcase-heading">The modern operating platform for workforce compensation &amp; talent.</h2>
          <p className="auth-showcase-subtext">Streamline monthly salary batches, statutory tax deductions, shift attendances, and multi-tier leave approvals.</p>

          <div className="auth-feature-list">
            {SHOWCASE_FEATURES.map((feat, idx) => (
              <div key={idx} className="auth-feature-item">
                <div className="auth-feature-icon"><feat.icon size={14} /></div>
                <div className="auth-feature-text">
                  <h4>{feat.title}</h4>
                  <p>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-stats-grid">
            <div><div className="auth-stat-value">99.98%</div><div className="auth-stat-label">Uptime</div></div>
            <div><div className="auth-stat-value">4 Tiers</div><div className="auth-stat-label">RBAC Scoping</div></div>
            <div><div className="auth-stat-value">&lt; 4 min</div><div className="auth-stat-label">Payroll Batch</div></div>
          </div>
        </div>

        <div className="auth-showcase-footer">
          <span>&copy; {new Date().getFullYear()} PeoplePay Technologies Inc.</span>
          <span>End-to-End Enterprise Encryption</span>
        </div>
      </div>

      {/* Auth Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="text-center mb-3">
            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <img src="/logo.png" alt="PeoplePay" style={{ width: 44, height: 44, objectFit: 'cover', objectPosition: 'top center' }} />
            </div>
            <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              {view === 'verify' ? 'Verify Corporate Email' : tab === 'login' ? 'Sign in to Workplace' : 'Create Work Account'}
            </h1>
            <p className="muted text-xs mt-1">
              {view === 'verify'
                ? `Enter 6-digit verification code sent to ${verifyEmailAddress || 'your email'}`
                : tab === 'login' ? 'Authenticate with corporate credentials' : 'Join your organization workforce portal'}
            </p>
          </div>

          {/* VIEW: EMAIL OTP VERIFICATION */}
          {view === 'verify' ? (
            <div>
              {devCode && (
                <div className="auth-dev-callout">
                  <Sparkles size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Dev Code:</strong>{' '}
                    <span className="auth-dev-badge" onClick={() => setVerifyCode(devCode)} title="Click to fill">
                      {devCode} <Check size={11} />
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleVerifySubmit}>
                <div className="field mb-3">
                  <label className="field-label" style={{ textAlign: 'center', display: 'block' }}>Enter 6-Digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="••••••"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    className="auth-otp-input"
                    autoFocus
                    required
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="muted">Didn&apos;t receive code?</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? 'var(--text-3)' : 'var(--accent)', fontWeight: 600, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', padding: 0 }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>

                <Button type="submit" variant="primary" className="w-full mb-2" loading={loading} icon={CheckCircle2} size="lg">
                  Verify &amp; Submit Application
                </Button>
                <Button type="button" variant="secondary" className="w-full" onClick={() => { setView('auth'); setTab('login'); }} disabled={loading} size="sm">
                  Back to Sign In
                </Button>
              </form>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="auth-segmented-tabs">
                <button type="button" className={`auth-segmented-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => handleTabChange('login')}>
                  Sign In
                </button>
                <button type="button" className={`auth-segmented-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => handleTabChange('register')}>
                  Create Account
                </button>
              </div>

              {/* SIGN IN */}
              {tab === 'login' ? (
                <form onSubmit={(e) => { e.preventDefault(); executeLogin(loginForm.email, loginForm.password); }}>
                  <Field label="Work Email Address" required>
                    <IconInput icon={Mail} type="email" placeholder="name@ems.dev" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required autoComplete="email" disabled={loading} />
                  </Field>

                  <Field label="Password" required>
                    <IconInput icon={Lock} showToggle isShown={showPass} onToggle={() => setShowPass(!showPass)} placeholder="••••••••" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required autoComplete="current-password" disabled={loading} />
                  </Field>

                  <div className="flex items-center justify-between mb-3 mt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ userSelect: 'none' }}>
                      <input type="checkbox" checked={loginForm.remember} onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
                      <span className="muted" style={{ fontSize: 11.5 }}>Remember device</span>
                    </label>
                    <button type="button" onClick={() => { setForgotEmail(loginForm.email); setForgotStep(1); setDevResetCode(null); setForgotModal(true); }} style={{ fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Forgot Password?
                    </button>
                  </div>

                  <Button type="submit" variant="primary" className="w-full" loading={loading} icon={LogInIcon} size="lg">
                    Sign In to Workplace
                  </Button>

                  {/* Demo Personas */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div className="text-xs muted mb-1.5" style={{ fontSize: 11, textAlign: 'center' }}>Quick Demo Access:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                      {DEMO_ACCOUNTS.map((acc) => (
                        <button key={acc.role} type="button" className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '4px 6px', textAlign: 'center', justifyContent: 'center' }} onClick={() => { setLoginForm((p) => ({ ...p, email: acc.email, password: acc.password })); executeLogin(acc.email, acc.password); }}>
                          {acc.role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-center mt-3 text-xs muted" style={{ fontSize: 11.5 }}>
                    Don&apos;t have an account yet?{' '}
                    <button type="button" onClick={() => handleTabChange('register')} style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Create workplace account
                    </button>
                  </div>
                </form>
              ) : (
                /* REGISTER */
                <form onSubmit={handleRegisterSubmit}>
                  <Field label="Full Legal Name" required>
                    <IconInput icon={User} placeholder="e.g. Vikram Sharma" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} required autoComplete="name" disabled={loading} />
                  </Field>

                  <Field label="Corporate Work Email" required>
                    <IconInput icon={Mail} type="email" placeholder="name@company.com" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} required autoComplete="email" disabled={loading} />
                  </Field>

                  <Field label="Mobile Number" required>
                    <IconInput icon={Phone} type="tel" placeholder="+91 98765 43210" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} required autoComplete="tel" disabled={loading} />
                  </Field>

                  <Field label="Password" required>
                    <IconInput icon={Lock} showToggle isShown={showPass} onToggle={() => setShowPass(!showPass)} placeholder="At least 6 characters" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} required autoComplete="new-password" disabled={loading} />
                  </Field>

                  <Field label="Confirm Password" required>
                    <IconInput icon={Lock} showToggle isShown={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} placeholder="Re-enter password" value={regForm.confirmPassword} onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })} required autoComplete="new-password" disabled={loading} />
                  </Field>

                  <div className="mb-3 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ userSelect: 'none' }}>
                      <input type="checkbox" checked={regForm.agreeTerms} onChange={(e) => setRegForm({ ...regForm, agreeTerms: e.target.checked })} style={{ accentColor: 'var(--accent)' }} required />
                      <span className="muted" style={{ fontSize: 11.5 }}>I agree to the Enterprise Usage Agreement &amp; Security Policy</span>
                    </label>
                  </div>

                  <Button type="submit" variant="primary" className="w-full" loading={loading} icon={UserPlus} size="lg">
                    Create Work Account
                  </Button>

                  <div className="text-center mt-3 text-xs muted" style={{ fontSize: 11.5 }}>
                    Already registered?{' '}
                    <button type="button" onClick={() => handleTabChange('login')} style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Sign in to existing account
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'var(--text-3)' }}>
            &copy; {new Date().getFullYear()} PeoplePay &middot; SOC 2 Type II Workplace Security
          </div>
        </div>
      </div>

      {/* Approval Notice Modal */}
      {approvalModal.open && (
        <Modal open={approvalModal.open} onClose={() => setApprovalModal({ open: false, msg: '' })} title="Account Onboarding Status" subtitle="Corporate Governance & Access Approval">
          <div style={{ padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', border: '1.5px solid rgba(59, 130, 246, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: 12 }}>
              <Clock size={24} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>Registration Under Administrative Review</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 16, maxWidth: 420, margin: '0 auto 16px' }}>{approvalModal.msg}</p>
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', textAlign: 'left', fontSize: 12, color: 'var(--text-3)', marginBottom: 18 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Next Steps for Account Activation:</div>
              <ul style={{ paddingLeft: 16, lineHeight: 1.5, margin: 0 }}>
                <li>Organization Admin reviews and verifies your submitted credentials.</li>
                <li>Your designated Department, Role, and initial compensation will be assigned.</li>
                <li>You will receive an activation email once sign-in is unlocked.</li>
              </ul>
            </div>
            <Button variant="primary" className="w-full" onClick={() => { setApprovalModal({ open: false, msg: '' }); setView('auth'); setTab('login'); }}>
              Understood, Return to Sign In
            </Button>
          </div>
        </Modal>
      )}

      {/* Forgot Password Modal */}
      {forgotModal && (
        <Modal open={forgotModal} onClose={() => setForgotModal(false)} title="Password Recovery" subtitle="Reset credentials with secure email verification">
          {forgotStep === 1 ? (
            <form onSubmit={handleForgotRequest}>
              <p className="text-xs muted mb-3">Enter your registered work email. A 6-digit verification code will be dispatched to safely reset your password.</p>
              <Field label="Registered Work Email" required>
                <IconInput icon={Mail} type="email" placeholder="name@company.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required autoFocus />
              </Field>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setForgotModal(false)} type="button">Cancel</Button>
                <Button type="submit" variant="primary" loading={loading} icon={KeyRound}>Send Reset Code</Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit}>
              {devResetCode && (
                <div className="auth-dev-callout mb-3">
                  <Sparkles size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div><strong>Dev Code:</strong> <span className="auth-dev-badge" onClick={() => setForgotCode(devResetCode)}>{devResetCode} <Check size={11} /></span></div>
                </div>
              )}
              <Field label="6-Digit Reset Code" required>
                <Input type="text" maxLength={6} placeholder="Enter code" value={forgotCode} onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))} required autoFocus />
              </Field>
              <Field label="New Password" required>
                <Input type="password" placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </Field>
              <Field label="Confirm New Password" required>
                <Input type="password" placeholder="Confirm new password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
              </Field>
              <div className="flex justify-between items-center mt-4">
                <button type="button" onClick={() => setForgotStep(1)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                  &larr; Back to Email
                </button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setForgotModal(false)} type="button">Cancel</Button>
                  <Button type="submit" variant="primary" loading={loading}>Update Password</Button>
                </div>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
