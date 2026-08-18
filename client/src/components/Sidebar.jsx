import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, CalendarCheck, CalendarDays, Wallet,
  TrendingUp, PieChart, Megaphone, Palmtree, X,
} from 'lucide-react';
import { NAV_ITEMS } from '../lib/constants.js';
import { useAuth } from '../lib/auth.jsx';

const ICONS = {
  LayoutDashboard, Users, Building2, CalendarCheck, CalendarDays, Wallet,
  TrendingUp, PieChart, Megaphone, Palmtree,
};

export default function Sidebar({ open, onClose, badges = {} }) {
  const { user } = useAuth();

  const items = NAV_ITEMS.filter((item) => item.roles.length === 0 || item.roles.includes(user.role));

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">
            <Wallet size={22} />
          </span>
          <div>
            <div className="brand-name">PeoplePay</div>
            <div className="brand-sub">HR &amp; Payroll</div>
          </div>
          <button className="icon-btn menu-toggle" onClick={onClose} style={{ marginLeft: 'auto' }}>
            <X size={18} />
          </button>
        </div>

        <nav className="nav">
          <div className="nav-label">Workspace</div>
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {badge > 0 && <span className="nav-badge">{badge}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          <div className="card" style={{ background: 'var(--gradient-soft)', border: 'none', padding: 14 }}>
            <div className="text-sm font-bold">Need help?</div>
            <div className="text-xs muted mt-1" style={{ lineHeight: 1.5 }}>
              Explore attendance, leave &amp; payslips from your dashboard.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
