import { createContext, useContext, useState, type ReactNode } from 'react';
import { login as loginService, register as registerService, logout as logoutService } from '@/services/authService';

// TypeScript Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create Context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state synchronously from localStorage to prevent redirect loops
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
        return null;
      }
    }
    return null;
  });
  const loading = false; // Synchronous initialization means we're never in a "loading" state

  // Login method
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await loginService({ email, password });
      console.log("🔥 LOGIN RESPONSE RAW:", JSON.stringify(response, null, 2));
      
      const newToken = (response as any)?.token;
      const newUser = (response as any)?.user;

      if (!newToken) {
        console.error("Token missing:", response);
        return;
      }

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('[AuthContext] login error:', error);
      throw error;
    }
  };

  // Register method
  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      const response = await registerService({ name, email, password });
      console.log("FULL REGISTER RESPONSE:", response);
      
      const newToken = (response as any)?.data?.token;
      const newUser = (response as any)?.data?.user;

      if (!newToken) {
        console.error("🚨 TOKEN NOT FOUND (REGISTER):", response);
        return;
      }

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('[AuthContext] register error:', error);
      throw error;
    }
  };

  // Logout method
  const logout = (): void => {
    logoutService();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token, // Primary check based on token existence
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
