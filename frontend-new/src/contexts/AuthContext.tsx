import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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
  logout: () => void;
}

// Create Context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state synchronously from localStorage to prevent redirect loops
  console.log('[AuthContext] Initializing AuthProvider');
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem("token");
    console.log(`[AuthContext] Initial token from localStorage: ${t ? 'exists' : 'null'}`);
    return t;
  });
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    console.log(`[AuthContext] Initial user from localStorage: ${savedUser}`);
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

  // Sync state with localStorage to prevent stale null states after login
  useEffect(() => {
    const syncState = () => {
      console.log('[AuthContext] syncState called');
      const storedToken = localStorage.getItem("token");
      if (storedToken !== token) {
        console.log(`[AuthContext] Token mismatch in syncState, updating. stored: ${storedToken ? 'exists' : 'null'}, current: ${token ? 'exists' : 'null'}`);
        setToken(storedToken);
      }
      
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (JSON.stringify(parsed) !== JSON.stringify(user)) {
            console.log('[AuthContext] User mismatch in syncState, updating.');
            setUser(parsed);
          }
        } catch (e) {
          console.error("Sync parse error:", e);
        }
      } else if (user) {
         console.log('[AuthContext] User missing in storage but exists in state, clearing.');
         setUser(null);
      }
    };

    // Initial sync
    syncState();
    
    window.addEventListener("storage", syncState);

    return () => {
      window.removeEventListener("storage", syncState);
    };
  }, [token, user]);

  // Logout method
  const logout = (): void => {
    console.warn('[AuthContext] LOGOUT CALLED! Clearing local storage and state.');
    console.trace('[AuthContext] Logout stack trace');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token, // Primary check based on token existence
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
