import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth.jsx';
import { useTheme } from '../lib/theme.jsx';
import { NAV_ITEMS, ROLE_LABELS } from '../lib/constants.js';
import { Avatar } from './ui.jsx';
import { fullName } from '../lib/format.js';

const TITLES = {
  '/': { title: 'Dashboard', sub: "Here's what's happening across your team" },
  '/profile': { title: 'My Profile', sub: 'Your account & personal details' },
};

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const navMatch = NAV_ITEMS.find((n) => n.to === location.pathname);
  const meta = TITLES[location.pathname] || { title: navMatch?.label || 'PeoplePay', sub: '' };
  const displayName = user.employee ? fullName(user.employee) : user.name;

  return (
    <header className="topbar">
      <button className="icon-btn menu-toggle" onClick={onMenu}>
        <Menu size={20} />
      </button>
      <div className="flex-1" style={{ minWidth: 0 }}>
        <div className="page-title truncate">{meta.title}</div>
        {meta.sub && <div className="page-sub truncate hide-sm">{meta.sub}</div>}
      </div>

      <button className="icon-btn" onClick={toggle} title="Toggle theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div ref={ref} style={{ position: 'relative' }}>
        <button
          className="flex items-center gap-2 pointer"
          onClick={() => setMenuOpen((o) => !o)}
          style={{ background: 'transparent', border: 'none', padding: 4 }}
        >
          <Avatar name={displayName} src={user.avatar} size={38} />
          <div className="hide-sm text-right" style={{ lineHeight: 1.2 }}>
            <div className="text-sm font-bold truncate" style={{ maxWidth: 140 }}>{displayName}</div>
            <div className="text-xs muted">{ROLE_LABELS[user.role]}</div>
          </div>
          <ChevronDown size={15} className="muted hide-sm" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="card"
              style={{ position: 'absolute', right: 0, top: 52, width: 220, padding: 8, zIndex: 50 }}
            >
              <div style={{ padding: '8px 10px' }}>
                <div className="text-sm font-bold truncate">{displayName}</div>
                <div className="text-xs muted truncate">{user.email}</div>
              </div>
              <div className="divider" style={{ margin: '6px 0' }} />
              <button className="nav-item w-full" style={{ margin: 0 }} onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                <UserIcon size={17} /> My Profile
              </button>
              <button
                className="nav-item w-full"
                style={{ margin: 0, color: 'var(--red)' }}
                onClick={logout}
              >
                <LogOut size={17} /> Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
