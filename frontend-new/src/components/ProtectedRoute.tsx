import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface Props {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Delay route enforcement by a tick to allow local storage writes
    // and auth state to fully hydrate across the app.
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null; // Prevent premature redirect
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
