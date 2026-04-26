import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Admin access check
  if (location.pathname.startsWith('/dashboard/admin') && user?.role !== 'admin') {
    return <Navigate to="/dashboard/user" replace />;
  }

  return <>{children}</>;
};
