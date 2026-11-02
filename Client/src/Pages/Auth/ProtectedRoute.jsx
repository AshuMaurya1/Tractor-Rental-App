import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const normalizeRole = (role) => {
  const value = String(role || '').toLowerCase();
  if (['user', 'customer'].includes(value)) return 'farmer';
  if (value === 'superadmin' || value === 'super-admin') return 'admin';
  return value || 'farmer';
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, authLoading } = useAppContext();
  const role = normalizeRole(user?.role);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50" role="status" aria-label="Loading account">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'owner') return <Navigate to="/owner" replace />;
    return <Navigate to="/farmer/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
