/* eslint-disable react/prop-types */
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import Dashboard from './components/Dashboard/Dashboard';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import MyRequest from './components/MyRequest/MyRequest';
import Calendar from './components/Calendar/Calendar';
import Profile from './components/Profile/Profile';
import { sessionState } from './service/sessionState';

function RequireAuth({ children }) {
  const token = sessionState.getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RequireRole({ children, role, allowAdminAccess = false }) {
  const token = sessionState.getToken();
  const userRole = sessionState.getUserRole() || 'student';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== role && !(allowAdminAccess && role === 'student' && userRole === 'admin')) {
    return <Navigate to={role === 'admin' ? '/dashboard' : '/admin/dashboard'} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <RequireRole role="student" allowAdminAccess>
              <Dashboard />
            </RequireRole>
          }
        />
        <Route
          path="/book-approval"
          element={
            <RequireRole role="student" allowAdminAccess>
              <Dashboard />
            </RequireRole>
          }
        />
        <Route
          path="/request-blocked"
          element={
            <RequireRole role="student">
              <MyRequest />
            </RequireRole>
          }
        />
        <Route path="/my-request" element={<Navigate to="/request-blocked" replace />} />
        <Route
          path="/calendar"
          element={
            <RequireRole role="student">
              <Calendar />
            </RequireRole>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RequireRole role="admin">
              <AdminDashboard />
            </RequireRole>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
