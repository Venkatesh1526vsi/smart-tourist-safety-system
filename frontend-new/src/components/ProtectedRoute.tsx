import { useState, useEffect } from "react";
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setHasToken(!!token);
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null; // prevent premature redirect
  }

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
