import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Stabilize initialization - Step 1
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
      }
    }

    setLoading(false);
  }, []);


  // Login method - Step 3
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await loginService({ email, password });
      const authData = response.data || response;
      const { token, user } = authData;

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        setToken(token);
        setUser(user);
      }
    } catch (error) {
      console.error('[AuthContext] login error:', error);
      throw error;
    }
  };

  // Register method
  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      const response = await registerService({ name, email, password });
      const authData = response.data || response;
      const { token, user } = authData;

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        setToken(token);
        setUser(user);
      }
    } catch (error) {
      console.error('[AuthContext] register error:', error);
      throw error;
    }
  };

  // Logout method
  const logout = (): void => {
    logoutService();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!(token && user),
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
