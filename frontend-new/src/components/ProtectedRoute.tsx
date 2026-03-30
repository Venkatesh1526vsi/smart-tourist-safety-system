import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user, token } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] Render - isAuthenticated:', isAuthenticated, 'loading:', loading);
  console.log('[ProtectedRoute] user:', user, 'token:', token ? 'exists' : 'null');

  if (loading) {
    console.log('[ProtectedRoute] Showing loading state...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] NOT AUTHENTICATED - Redirecting to login');
    console.log('[ProtectedRoute] Location state:', location.state);
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
