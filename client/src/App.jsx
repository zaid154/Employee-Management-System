import { Routes, Route } from 'react-router-dom';
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
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

const mgmt = [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER];
const adminHr = [ROLES.ADMIN, ROLES.HR];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login initialTab="login" />} />
      <Route path="/register" element={<Login initialTab="register" />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route
          path="departments"
          element={
            <ProtectedRoute roles={mgmt}>
              <Departments />
            </ProtectedRoute>
          }
        />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="performance" element={<Performance />} />
        <Route
          path="reports"
          element={
            <ProtectedRoute roles={mgmt}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route path="announcements" element={<Announcements />} />
        <Route path="holidays" element={<Holidays />} />
        <Route path="profile" element={<Profile />} />
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={adminHr}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
