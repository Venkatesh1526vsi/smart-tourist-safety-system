import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Check if user exists and has admin role
  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard/user" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
