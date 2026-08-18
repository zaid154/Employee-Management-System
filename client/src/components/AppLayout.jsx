import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { canManage } from '../lib/constants.js';

export default function AppLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState({});

  // Live count of pending leave requests for the nav badge (management only).
  useEffect(() => {
    if (!canManage(user.role)) return;
    api
      .get('/leaves', { params: { status: 'pending', limit: 1 } })
      .then(({ data }) => setBadges({ pendingLeaves: data.pagination?.total || 0 }))
      .catch(() => {});
  }, [user.role]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} badges={badges} />
      <div className="main">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
