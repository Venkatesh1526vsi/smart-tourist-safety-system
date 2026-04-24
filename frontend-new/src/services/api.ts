// API Service for SAFEYATRA
const BASE_URL = import.meta.env.VITE_API_URL || "https://smart-tourist-safety-system-l724.onrender.com";

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

const handleAuthError = (status: number, endpoint?: string) => {
  const isPublicEndpoint =
    endpoint?.includes("/external/") ||
    endpoint?.includes("/login") ||
    endpoint?.includes("/register");

  if (status === 401 || (status === 403 && !isPublicEndpoint)) {
    console.warn("Invalid or expired token — clearing session");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

// Build headers with optional Authorization - Step 1
const buildHeaders = (endpoint?: string) => {
  const headers: any = {
    "Content-Type": "application/json"
  };

  const token = getToken();

  // Public endpoints that don't need auth
  const isPublic =
    endpoint?.includes("/external/") ||
    endpoint?.includes("/login") ||
    endpoint?.includes("/register");

  if (token && !isPublic) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Generic API POST request
export const apiPost = async <T>(endpoint: string, data: unknown): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(endpoint),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error [POST ${endpoint}]:`, response.status, errorText);
      handleAuthError(response.status, endpoint);
      throw new Error(errorText || `POST ${endpoint} failed: ${response.status}`);
    }

    const result = await response.json();
    return result?.data?.data || result?.data || result;
  } catch (error) {
    console.error('[API POST] Fetch error:', error);
    throw error;
  }
};

// Generic API GET request
export const apiGet = async <T>(endpoint: string): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(endpoint),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error [GET ${endpoint}]:`, response.status, errorText);
    handleAuthError(response.status, endpoint);
    throw new Error(errorText || `GET ${endpoint} failed: ${response.status}`);
  }

  const result = await response.json();
  return result?.data?.data || result?.data || result;
};

// Generic API DELETE request
export const apiDelete = async <T>(endpoint: string): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(endpoint),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error [DELETE ${endpoint}]:`, response.status, errorText);
    handleAuthError(response.status, endpoint);
    throw new Error(errorText || `DELETE ${endpoint} failed: ${response.status}`);
  }

  const result = await response.json();
  return result?.data?.data || result?.data || result;
};

// Generic API PATCH request
export const apiPatch = async <T>(endpoint: string, data: unknown): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: buildHeaders(endpoint),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error [PATCH ${endpoint}]:`, response.status, errorText);
    handleAuthError(response.status, endpoint);
    throw new Error(errorText || `PATCH ${endpoint} failed: ${response.status}`);
  }

  const result = await response.json();
  return result?.data?.data || result?.data || result;
};

// File upload with multipart/form-data (for incident images)
export const apiUploadFile = async <T>(
  endpoint: string,
  formData: FormData
): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;

  const headers = buildHeaders(endpoint);
  delete headers["Content-Type"]; // browser will set it correctly for FormData

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error [UPLOAD ${endpoint}]:`, response.status, errorText);
    handleAuthError(response.status, endpoint);
    throw new Error(errorText || `Upload failed: ${response.status}`);
  }

  const result = await response.json();
  return result?.data?.data || result?.data || result;
};

// Specific API Functions
// Login - Step 1/2
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  return apiPost<LoginResponse>('/api/login', { email, password });
};

// Register - Step 1/2
export const registerUser = async (name: string, email: string, password: string): Promise<RegisterResponse> => {
  return apiPost<RegisterResponse>('/api/register', { name, email, password });
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
export const reportIncident = async (formData: FormData): Promise<ApiResponse<Incident>> => {
  return apiUploadFile<ApiResponse<Incident>>('/api/incidents', formData);
};

export const getAllIncidents = (params?: { status?: string; severity?: string; category?: string }) => {
  const queryParams = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiGet<{ success: boolean; data: Incident[]; count: number; total: number }>(`/api/incidents${queryParams}`);
};

export const getIncidentById = (id: string) =>
  apiGet<{ success: boolean; data: Incident }>(`/api/incidents/${id}`);

export const updateIncident = (id: string, data: any) =>
  apiPatch(`/api/incidents/${id}`, data);

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
  apiGet<Incident[]>('/api/incidents');

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
  apiDelete<{ success: boolean; message: string }>(`/api/admin/users/${id}`);

export const deleteIncident = (id: string) =>
  apiDelete<{ success: boolean; message: string }>(`/api/incidents/${id}`);

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
