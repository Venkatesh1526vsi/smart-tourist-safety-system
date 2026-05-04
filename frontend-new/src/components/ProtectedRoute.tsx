import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const token = localStorage.getItem("token");

  // 🔥 SINGLE SOURCE OF TRUTH
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
