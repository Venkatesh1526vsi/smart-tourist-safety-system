// TypeScript interfaces for authentication
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface WrappedAuthResponse {
  success: boolean;
  data: AuthResponse;
  message?: string;
}

// Backend configuration
const BASE_URL = import.meta.env.VITE_API_URL || "https://smart-tourist-safety-system-l724.onrender.com";

// Authentication service functions
export async function login(data: LoginRequest): Promise<WrappedAuthResponse> {
  // Frontend-only realism enhancement: Intercept login for locally reset passwords
  try {
    const localUserStr = localStorage.getItem('user');
    if (localUserStr) {
      const localUser = JSON.parse(localUserStr);
      // Only intercept if the user has a mock password (from reset) and it matches
      if (localUser.email === data.email && localUser.password && localUser.password === data.password) {
        console.log('[SafeYatra Auth] Local mock intercept: using reset password');
        return {
          success: true,
          data: {
            token: localStorage.getItem('token') || 'mock-reset-token',
            user: { id: localUser.id, name: localUser.name, email: localUser.email, role: localUser.role || 'tourist' }
          }
        };
      }
    }
  } catch (e) {
    console.error("Local mock login check failed", e);
  }

  const response = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }));
    throw new Error(errorData.message || 'Login failed');
  }

  return response.json();
}

export async function register(data: RegisterRequest): Promise<WrappedAuthResponse> {
  const response = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(errorData.message || 'Registration failed');
  }

  return response.json();
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}