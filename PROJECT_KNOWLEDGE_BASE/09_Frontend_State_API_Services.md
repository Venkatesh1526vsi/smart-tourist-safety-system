# Frontend State Management, API Services & Utilities

This document covers the frontend API integration layer and utility functions that bridge the React components to the Express backend.

---

## 1. Central API Configuration (`api.ts`)

### Purpose
The primary conduit between the frontend React application and the Express backend. It handles request formatting, global error interception, token injection, and typed data responses.

### Location
`frontend-new/src/services/api.ts`

### Implementation Details

#### Configuration & Interfaces
- **Base URL:** Fetched dynamically via `import.meta.env.VITE_API_URL` with a fallback to the production Render URL.
- **TypeScript Interfaces:** Heavily types all expected backend payloads including `Incident`, `RiskZone`, `SystemHealth`, and `Notification`.

#### Global Request Handlers
- **`buildHeaders()`:** Dynamically injects the `Bearer` token from `localStorage` into every outgoing request. Note: It injects the token unconditionally; the backend determines if a route actually requires it.
- **`handleAuthError()`:** A critical global interceptor. If an API call returns `401 Unauthorized` or `403 Forbidden` (unless hitting the `/login` or `/register` endpoints), this function assumes the session has expired. It aggressively wipes `localStorage` and forces a hard redirect to `/login` via `window.location.href = "/login"`.

#### HTTP Wrappers
- Exposes generic wrapper functions (`apiGet`, `apiPost`, `apiDelete`, `apiPatch`) utilizing the native `fetch` API.
- All wrappers check `!response.ok`, log the error using `response.text()`, invoke `handleAuthError`, and automatically unwrap the nested backend response (`result?.data?.data || result?.data`).

#### Specific API Implementations
- **File Upload (`apiUploadFile`):** Specifically handles `FormData` for incident image uploads. Crucially, it deletes the `Content-Type` header, forcing the browser to automatically set it to `multipart/form-data` with the correct boundaries.
- **Business Logic Exports:** Maps backend routes to frontend functions. Examples include:
  - `loginUser`, `registerUser`
  - `reportIncident(FormData)`, `getAllIncidents(params)`
  - `getAdminDashboardSummary()`, `getAuditLogs()`

---

## 2. Authentication Service (`authService.ts`)

### Purpose
A lightweight abstraction layer specifically for the login/register flows.

### Location
`frontend-new/src/services/authService.ts`

### Implementation Details
- Duplicates some of the base URL logic from `api.ts`, but uses raw `fetch` calls without the heavy interceptor logic. 
- Exposes synchronous helper methods:
  - `getToken()`
  - `isAuthenticated()` (Returns a simple boolean check of the token's existence).
  - `getCurrentUser()` (Safely attempts to parse the `user` string from `localStorage`, returning `null` if the JSON is malformed).

---

## 3. Notification Utility (`notify.ts`)

### Purpose
A wrapper around the `react-hot-toast` library providing standardized, color-coded toast alerts across the application.

### Location
`frontend-new/src/utils/notify.ts`

### Implementation Details
Exposes four semantic notification functions, each with hardcoded branding colors to match the app's dark-mode aesthetic:
- **`notifySuccess(message)`:** Green background (`#16a34a`), 3s duration.
- **`notifyError(message)`:** Red background (`#dc2626`), 4s duration.
- **`notifyWarning(message)`:** Amber background (`#f59e0b`), 3.5s duration, includes "⚠️" icon.
- **`notifyInfo(message)`:** Blue background (`#3b82f6`), 3s duration, includes "ℹ️" icon.
