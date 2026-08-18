import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import { ROLES } from './lib/constants.js';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import EmployeeDetail from './pages/EmployeeDetail.jsx';
import Departments from './pages/Departments.jsx';
import Attendance from './pages/Attendance.jsx';
import Leaves from './pages/Leaves.jsx';
import Payroll from './pages/Payroll.jsx';
import Performance from './pages/Performance.jsx';
import Reports from './pages/Reports.jsx';
import Announcements from './pages/Announcements.jsx';
import Holidays from './pages/Holidays.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

// Fade/slide wrapper so page transitions feel smooth.
function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

const mgmt = [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER];

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Page><Dashboard /></Page>} />
          <Route path="employees" element={<Page><Employees /></Page>} />
          <Route path="employees/:id" element={<Page><EmployeeDetail /></Page>} />
          <Route
            path="departments"
            element={<ProtectedRoute roles={mgmt}><Page><Departments /></Page></ProtectedRoute>}
          />
          <Route path="attendance" element={<Page><Attendance /></Page>} />
          <Route path="leaves" element={<Page><Leaves /></Page>} />
          <Route path="payroll" element={<Page><Payroll /></Page>} />
          <Route path="performance" element={<Page><Performance /></Page>} />
          <Route
            path="reports"
            element={<ProtectedRoute roles={mgmt}><Page><Reports /></Page></ProtectedRoute>}
          />
          <Route path="announcements" element={<Page><Announcements /></Page>} />
          <Route path="holidays" element={<Page><Holidays /></Page>} />
          <Route path="profile" element={<Page><Profile /></Page>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}
