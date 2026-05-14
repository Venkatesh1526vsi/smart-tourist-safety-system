import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface Props {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  console.log(`[ProtectedRoute] Render. isHydrated: ${isHydrated}, token: ${token ? 'exists' : 'null'}, user: ${user}`);

  useEffect(() => {
    console.log('[ProtectedRoute] useEffect - setting isHydrated to true');
    // Delay route enforcement by a tick to allow local storage writes
    // and auth state to fully hydrate across the app.
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    console.log('[ProtectedRoute] Not hydrated yet, returning null');
    return null; // Prevent premature redirect
  }

  if (!token) {
    console.warn('[ProtectedRoute] TOKEN IS NULL! Triggering redirect to /login');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] Hydrated and token exists, rendering children');
  return <>{children}</>;
};
