import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user, token } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] Render - isAuthenticated:', isAuthenticated, 'loading:', loading);
  console.log('[ProtectedRoute] user:', user, 'token:', token ? 'exists' : 'null');

  // Use direct localStorage check as a fail-safe for authentication persistence
  const storedToken = localStorage.getItem("token");

  if (!storedToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // Admin access check
  if (location.pathname.startsWith('/dashboard/admin') && user?.role !== 'admin') {
    console.log('[ProtectedRoute] ACCESS DENIED - User is not an admin, redirecting to user dashboard');
    return <Navigate to="/dashboard/user" replace />;
  }

  console.log('[ProtectedRoute] Authenticated - Rendering children');
  return <>{children}</>;
};
