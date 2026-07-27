import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TVDisplay from './pages/TVDisplay';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import ChangePassword from './pages/ChangePassword';
import authService from './services/authService';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const mustChange = localStorage.getItem('must_change_password') === 'true';

  if (!token || authService.isTokenExpired(token)) {
    authService.logout();
    return <Navigate to="/login" />;
  }
  if (mustChange) return <Navigate to="/change-password" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const mustChange = localStorage.getItem('must_change_password') === 'true';

  if (!token || authService.isTokenExpired(token)) {
    authService.logout();
    return <Navigate to="/login" />;
  }
  if (mustChange) return <Navigate to="/change-password" />;
  if (username !== 'admin') return <Navigate to="/admin" />;
  return children;
};

const GlobalLoader = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLoading = (e) => {
      setLoading(e.detail);
    };
    window.addEventListener('global-api-loading', handleLoading);
    return () => window.removeEventListener('global-api-loading', handleLoading);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-950/20 z-[9999] overflow-hidden pointer-events-none">
      <div className="animate-loading-bar" />
    </div>
  );
};

function App() {
  return (
    <Router>
      <GlobalLoader />
      <Routes>
        <Route path="/" element={<TVDisplay />} />
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route 
          path="/admin" 
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/logs" 
          element={
            <AdminRoute>
              <AuditLogs />
            </AdminRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
