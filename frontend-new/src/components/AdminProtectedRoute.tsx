import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: Props) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/user-dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
