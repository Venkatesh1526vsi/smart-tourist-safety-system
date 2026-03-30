import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user } = useAuth();

  // Check if user exists and has admin role
  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard/user" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
