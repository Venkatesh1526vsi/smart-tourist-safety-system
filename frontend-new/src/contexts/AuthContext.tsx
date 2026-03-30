import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { login as loginService, register as registerService, logout as logoutService, getToken } from '@/services/authService';

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

  // Check for existing token and user on mount
  useEffect(() => {
    const initAuth = () => {
      console.log('[AuthContext] Initializing auth...');
      const storedToken = getToken();
      const storedUser = localStorage.getItem('user');

      console.log('[AuthContext] storedToken:', storedToken);
      console.log('[AuthContext] storedUser:', storedUser);

      if (storedToken) {
        setToken(storedToken);
        console.log('[AuthContext] Token set in state');
      }

      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          setUser(userObj);
          console.log('[AuthContext] User set in state:', userObj);
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e);
          // Clear invalid user data
          localStorage.removeItem('user');
        }
      }

      console.log('[AuthContext] Setting loading to false');
      setLoading(false);
    };

    initAuth();
  }, []);

  // Monitor authentication state changes
  useEffect(() => {
    console.log('[AuthContext] State changed - token:', token, 'user:', user, 'isAuthenticated:', !!(token && user));
  }, [token, user]);

  // Login method
  const login = async (email: string, password: string): Promise<void> => {
    console.log('[AuthContext] login() called with:', { email });
    try {
      const response = await loginService({ email, password });
      console.log('[AuthContext] loginService response:', response);

      // Extract token and user from response.data (backend wraps response)
      const authData = response.data || response;
      const { token, user } = authData;

      setToken(token);
      setUser(user);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('[AuthContext] After setting state - token:', token?.substring(0, 20) + '...');
      console.log('[AuthContext] After setting state - user:', user);
    } catch (error) {
      console.error('[AuthContext] login error:', error);
      throw error;
    }
  };

  // Register method
  const register = async (name: string, email: string, password: string): Promise<void> => {
    console.log('[AuthContext] register() called with:', { name, email });
    try {
      const response = await registerService({ name, email, password });
      console.log('[AuthContext] registerService response:', response);

      // Extract token and user from response.data (backend wraps response)
      const authData = response.data || response;
      const { token, user } = authData;

      setToken(token);
      setUser(user);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('[AuthContext] After setting state - token:', token?.substring(0, 20) + '...');
      console.log('[AuthContext] After setting state - user:', user);
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
    isAuthenticated: !!(token && user && getToken()),
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
