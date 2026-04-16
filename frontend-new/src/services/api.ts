// API Service for SAFEYATRA
const BASE_URL = import.meta.env.VITE_API_URL;

// TypeScript Interfaces for API Responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  user: {
    name: string;
    email: string;
  };
  token: string;
}

export interface RegisterResponse {
  user: {
    name: string;
    email: string;
  };
  token: string;
}

export interface UserProfile {
  name: string;
  email: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: string;
}

export interface Incident {
  _id: string;
  userId: string;
  type: string;
  category?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  latitude: number;
  longitude: number;
  evidence_image?: string;
  images?: string[];
  created_at: string;
}

export interface Notification {
  _id: string;
  recipientId: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface RiskZone {
  _id: string;
  name: string;
  riskLevel: 'low' | 'medium' | 'high';
  latitude: number;
  longitude: number;
  radius: number;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  response_time_ms: number;
  uptime: number;
  services: {
    database: {
      status: string;
      collections: {
        users: number;
        incidents: number;
        locations: number;
      };
    };
    websocket: {
      status: string;
      connected_clients: number;
    };
    api: {
      status: string;
      version: string;
    };
  };
}

// Helper to get token from localStorage
const getToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    return null;
  }
};

// Build headers with optional Authorization
const buildHeaders = (includeContentType = true, includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {};
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Only attach Authorization if explicitly requested and token exists
  if (includeAuth) {
    const token = getToken();
    console.log('[buildHeaders] Token from getToken():', token);
    console.log('[buildHeaders] Token type:', typeof token);
    if (token && token !== 'undefined' && token !== 'null') {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[buildHeaders] Added Authorization header');
    } else {
      console.log('[buildHeaders] No valid token found');
    }
  }
  
  return headers;
};

// Generic API POST request
export const apiPost = async <T>(endpoint: string, data: unknown): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;
  
  console.log('[API POST]', url, data);
  console.log('[API POST] Headers:', buildHeaders());
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `POST ${endpoint} failed: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        // Use text as-is if not JSON
        if (errorText) errorMessage = errorText;
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error) {
    console.error('[API POST] Fetch error:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to backend at ${BASE_URL}. Please ensure:
1. Backend server is running on port 3001
2. CORS is configured to allow http://localhost:5173
3. No firewall is blocking the connection`);
    }
    throw error;
  }
};

// Generic API GET request
export const apiGet = async <T>(endpoint: string): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;
  
  console.log('[API GET]', url);
  
  const headers = buildHeaders();
  console.log('[API GET] Built headers:', headers);
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `GET ${endpoint} failed: ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || errorMessage;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// Generic API PATCH request
export const apiPatch = async <T>(endpoint: string, data: unknown): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;
  
  console.log('[API PATCH]', url, data);
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `PATCH ${endpoint} failed: ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || errorMessage;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// File upload with multipart/form-data (for incident images)
export const apiUploadFile = async <T>(
  endpoint: string, 
  formData: FormData
): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;
  
  console.log('[API UPLOAD]', url);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken() || ''}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${errorText}`);
  }
  
  return response.json();
};

// Specific API Functions
// Login - NO auth header (we don't have a token yet)
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const url = `${BASE_URL}/api/login`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    const errorMessage = responseData.message || responseData.error || `Login failed: ${response.status}`;
    throw new Error(errorMessage);
  }
  
  // Backend wraps response in { success, message, data: { user, token } }
  // We need to return data.data which contains { user, token }
  if (responseData.data && responseData.data.token) {
    return responseData.data;
  }
  
  // Fallback: if data is directly in response
  if (responseData.token) {
    return responseData;
  }
  
  throw new Error('Invalid response format from server');
};

// Register - NO auth header (we don't have a token yet)
export const registerUser = async (name: string, email: string, password: string): Promise<RegisterResponse> => {
  const url = `${BASE_URL}/api/register`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    const errorMessage = responseData.message || responseData.error || `Registration failed: ${response.status}`;
    throw new Error(errorMessage);
  }
  
  // Backend wraps response in { success, message, data: { user, token } }
  if (responseData.data && responseData.data.token) {
    return responseData.data;
  }
  
  // Fallback: if data is directly in response
  if (responseData.token) {
    return responseData;
  }
  
  throw new Error('Invalid response format from server');
};

export const getProfile = () => 
  apiGet<UserProfile>('/profile');

export const updateProfile = (data: Partial<UserProfile>) => 
  apiPatch<UserProfile>('/profile', data);

export const updateLocation = (latitude: number, longitude: number) => 
  apiPost<ApiResponse<LocationData>>('/location/update', { latitude, longitude });

export const getMyLocation = () => 
  apiGet<ApiResponse<LocationData>>('/location/me');

// Incident APIs - Aligned with backend routes
export const reportIncident = (data: { 
  type: string; 
  description: string; 
  severity: string; 
  category: string;
  latitude?: number;
  longitude?: number;
  locationId?: string;
}) => 
  apiPost<ApiResponse<Incident>>('/api/incidents', data);

export const getAllIncidents = (params?: { status?: string; severity?: string; category?: string }) => {
  const queryParams = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiGet<{ success: boolean; data: Incident[]; count: number; total: number }>(`/api/incidents${queryParams}`);
};

export const getIncidentById = (id: string) => 
  apiGet<{ success: boolean; data: Incident }>(`/api/incidents/${id}`);

export const updateIncident = (id: string, data: { status?: string; severity?: string; category?: string; resolution_notes?: string }) => 
  apiPatch<{ success: boolean; data: Incident }>(`/api/incidents/${id}/update-severity`, data);

export const closeIncident = (id: string, resolution_notes?: string) => 
  apiPatch<{ success: boolean; data: Incident }>(`/api/incidents/${id}/close`, { resolution_notes });

export const assignIncident = (id: string, assigned_officer: string) => 
  apiPatch<{ success: boolean; data: Incident }>(`/api/incidents/${id}/assign`, { assigned_officer });

export const getIncidentStats = () => 
  apiGet<{ success: boolean; stats: { total: number; by_status: Record<string, number>; by_severity: Record<string, number>; by_category: Record<string, number> } }>('/api/incidents/stats/summary');

export const getHeatmapData = () => 
  apiGet<{ success: boolean; data: Array<{ zone_id: string; zone_name: string; latitude: number; longitude: number; total_incidents: number }> }>('/api/incidents/heatmap/data');

// Legacy alias for backward compatibility
export const getMyIncidents = () => 
  apiGet<{ success: boolean; data: Incident[] }>('/api/incidents').then(res => res.data);

export const getNotifications = () => 
  apiGet<Notification[]>('/notifications');

export const getRiskZones = () => 
  apiGet<RiskZone[]>('/api/risk-zones');

export const getSystemHealth = () => 
  apiGet<{ health: SystemHealth }>('/health');

// Admin APIs
// Admin Dashboard APIs
export const getAdminDashboardSummary = () => 
  apiGet<{ success: boolean; summary: { total_users: number; total_incidents: number; active_incidents: number; resolved_today: number; new_users_this_week: number; critical_incidents: number } }>('/api/admin/dashboard/summary');

export const getAdminUsers = (params?: { role?: string; page?: number; limit?: number; search?: string }) => {
  const queryParams = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiGet<{ success: boolean; data: Array<{ _id: string; name: string; email: string; role: string }>; count: number; total: number }>(`/api/admin/users${queryParams}`);
};

export const createUser = (data: { name: string; email: string; password: string; role: string }) => 
  apiPost<{ success: boolean; data: { _id: string; name: string; email: string; role: string } }>('/api/admin/users', data);

export const updateUser = (id: string, data: { name?: string; email?: string; role?: string }) => 
  apiPatch<{ success: boolean; data: { _id: string; name: string; email: string; role: string } }>(`/api/admin/users/${id}`, data);

export const deleteUser = (id: string) => 
  apiPatch<{ success: boolean; message: string }>(`/api/admin/users/${id}/role`, { role: 'deleted' });

export const getAuditLogs = (params?: { page?: number; limit?: number }) => {
  const queryParams = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiGet<{ success: boolean; data: Array<{ action: string; resource_type: string; created_at: string }> }>(`/api/admin/audit-logs${queryParams}`);
};

// External Data APIs (proxied through backend)
export const getPuneWeather = () => 
  apiGet<{ success: boolean; data: { temperature: number; condition: string; humidity: number; windSpeed: number; rainProbability: number; alert?: string } }>('/api/external/weather');

export const getPuneSafetyNews = () => 
  apiGet<{ success: boolean; data: Array<{ title: string; description: string; url: string; publishedAt: string; source: string }> }>('/api/external/news');

// Legacy aliases for backward compatibility
export const getAllUsers = getAdminUsers;
export const updateIncidentStatus = updateIncident;
