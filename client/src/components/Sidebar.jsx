import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, CalendarCheck, CalendarDays, Wallet,
  TrendingUp, PieChart, Megaphone, Calendar, X, Settings
} from 'lucide-react';
import { NAV_ITEMS } from '../lib/constants.js';
import { useAuth } from '../lib/auth.jsx';

const ICONS = {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarDays,
  Wallet,
  TrendingUp,
  PieChart,
  Megaphone,
  Calendar,
  Settings,
};

export default function Sidebar({ open, onClose, badges = {} }) {
  const { user } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.length === 0 || item.roles.includes(user.role));

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon" style={{ overflow: 'hidden', padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <img
              src="/logo.png"
              alt="PeoplePay"
              style={{
                width: 44,
                height: 44,
                objectFit: 'cover',
                objectPosition: 'top center',
                display: 'block',
                borderRadius: 6,
              }}
            />
          </div>
          <div className="brand-info">
            <div className="brand-title">PeoplePay</div>
            <div className="brand-tagline">HR &amp; Payroll</div>
          </div>
          <button
            className="icon-btn icon-btn-ghost hide-md"
            onClick={onClose}
            style={{ marginLeft: 'auto', color: 'var(--sidebar-text)' }}
          >
            <X size={16} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {visibleItems.map((item) => {
            const Icon = ICONS[item.icon] || LayoutDashboard;
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            const labelText = typeof item.label === 'function' ? item.label(user?.role) : item.label;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={16} className="nav-icon" />
                <span>{labelText}</span>
                {badge > 0 && <span className="nav-badge">{badge}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span>Enterprise Edition</span>
          <span>v1.0</span>
        </div>
      </aside>
    </>
  );
}
