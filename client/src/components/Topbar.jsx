import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, User as UserIcon, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useTheme } from '../lib/theme.jsx';
import { NAV_ITEMS, ROLE_LABELS } from '../lib/constants.js';
import { Avatar } from './ui.jsx';
import { fullName } from '../lib/format.js';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/employees': 'Employee Directory',
  '/departments': 'Departments & Organization',
  '/attendance': 'Attendance Management',
  '/leaves': 'Leave Management',
  '/payroll': 'Payroll & Compensation',
  '/performance': 'Performance Reviews',
  '/reports': 'Reports & Analytics',
  '/announcements': 'Company Notice Board',
  '/holidays': 'Holiday Calendar',
  '/settings': 'System Settings',
  '/profile': 'My Account',
};

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const title = PAGE_TITLES[location.pathname] || NAV_ITEMS.find((n) => n.to === location.pathname)?.label || 'PeoplePay';
  const displayName = user.employee ? fullName(user.employee) : user.name;

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <button className="icon-btn icon-btn-ghost hide-md" onClick={onMenu} title="Open Menu">
          <Menu size={18} />
        </button>
        <div className="breadcrumbs">
          <span>EMS</span>
          <span>/</span>
          <span className="breadcrumb-active">{title}</span>
        </div>
      </div>

      <div className="topbar-actions">
        {/* Theme Toggle */}
        <button className="icon-btn icon-btn-ghost" onClick={toggle} title="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User Profile Dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            className="flex items-center gap-2 pointer"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            style={{ background: 'transparent', border: 'none', padding: '4px 6px', borderRadius: 'var(--radius-sm)' }}
          >
            <Avatar name={displayName} src={user.avatar} size={32} />
            <div className="hide-sm" style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div className="text-sm font-semi truncate" style={{ maxWidth: 130 }}>
                {displayName}
              </div>
              <div className="text-xs muted">{ROLE_LABELS[user.role]}</div>
            </div>
            <ChevronDown size={14} className="muted hide-sm" />
          </button>

          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 42,
                width: 200,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-dropdown)',
                padding: 6,
                zIndex: 50,
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <div className="text-sm font-semi truncate">{displayName}</div>
                <div className="text-xs muted truncate">{user.email}</div>
              </div>
              <button
                className="btn btn-ghost w-full"
                style={{ justifyContent: 'flex-start', padding: '7px 10px', fontSize: 13 }}
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/profile');
                }}
              >
                <UserIcon size={15} /> My Profile
              </button>
              <button
                className="btn btn-ghost w-full"
                style={{ justifyContent: 'flex-start', padding: '7px 10px', fontSize: 13, color: 'var(--red)' }}
                onClick={logout}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
