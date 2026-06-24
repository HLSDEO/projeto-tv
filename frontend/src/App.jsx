import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TVDisplay from './pages/TVDisplay';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import ChangePassword from './pages/ChangePassword';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const mustChange = localStorage.getItem('must_change_password') === 'true';

  if (!token) return <Navigate to="/login" />;
  if (mustChange) return <Navigate to="/change-password" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const mustChange = localStorage.getItem('must_change_password') === 'true';

  if (!token) return <Navigate to="/login" />;
  if (mustChange) return <Navigate to="/change-password" />;
  if (username !== 'admin') return <Navigate to="/admin" />;
  return children;
};

function App() {
  return (
    <Router>
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
