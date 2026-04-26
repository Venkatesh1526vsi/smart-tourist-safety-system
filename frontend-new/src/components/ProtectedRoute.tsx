import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");

  // TASK 1: Only token decides authentication
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
