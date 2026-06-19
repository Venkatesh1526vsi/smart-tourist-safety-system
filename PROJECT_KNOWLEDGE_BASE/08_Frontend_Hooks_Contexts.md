# Frontend Hooks & Contexts

This document details the global state contexts and custom React hooks used in the frontend of the Smart Tourist Safety System, located in `src/contexts/` and `src/hooks/`.

---

## 1. Authentication Context (`AuthContext.tsx`)

### Purpose
Provides global user session state and authentication methods (`login`, `logout`, `updateUser`) across the entire React application.

### Location
`frontend-new/src/contexts/AuthContext.tsx`

### Implementation Details
- **State Initialization:** Uses synchronous `localStorage.getItem("token")` and `localStorage.getItem("user")` directly within the `useState` initialization functions. This is crucial to prevent the application from temporarily thinking the user is logged out on hard refreshes (which causes jarring redirects).
- **Cross-Tab Synchronization:** Uses a `useEffect` to attach a `window.addEventListener("storage", syncState)`. If the user logs out in one browser tab, `syncState` clears the token in all other tabs simultaneously.
- **`logout()`:** Thoroughly wipes `localStorage` and nullifies state.
- **`updateUser(updates)`:** Uses a spread operator to merge partial profile updates into the global user object and pushes the result back to `localStorage`.
- **`useAuth()`:** A custom hook wrapper around `useContext(AuthContext)` that throws a clear error if used outside of an `<AuthProvider>`.

---

## 2. Geolocation Hook (`useGeolocation.ts`)

### Purpose
Tracks the user's physical coordinates and performs reverse geocoding to resolve coordinates into human-readable locations (e.g., "Koregaon Park, Pune").

### Location
`frontend-new/src/hooks/useGeolocation.ts`

### Implementation Details
- **Browser API:** Leverages `navigator.geolocation.getCurrentPosition()`.
- **Reverse Geocoding:** Uses the free OpenStreetMap Nominatim API (`https://nominatim.openstreetmap.org/reverse`).
- **Safety Measures:** 
  - Uses an `AbortController` combined with a `setTimeout` of 5000ms. If the OSM API hangs or takes too long, it aborts the fetch request so the app doesn't stall.
  - Wraps the geocoding in a try/catch block. If it fails, coordinates are still returned successfully.
- **Configuration:** Employs `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }` to force GPS usage over Wi-Fi triangulation when available, caching the location for 60 seconds to save battery.

---

## 3. Operational Data Hook (`useOperationalData.ts`)

### Purpose
The backbone of the application's data layer. It manages real database data, synthetic mock data, and local cache overrides to provide a seamless "always-online" feel, particularly vital for the Admin Dashboard metrics.

### Location
`frontend-new/src/hooks/useOperationalData.ts`

### Implementation Details
- **Synthetic Data Generation:** Generates 130 synthetic users and 75 synthetic incidents at runtime using randomized arrays of names and Pune-specific coordinates (e.g., FC Road, Swargate). This allows the UI to look "alive" even with an empty database.
- **Data Merging Strategy:** 
  1. Fetches real data via `getAllIncidents()` and `getAdminUsers()`.
  2. Pulls local overrides from `localStorage` (simulating offline mutations).
  3. Uses a sophisticated `Map` structure to deduplicate identical IDs, preferring Real Data > Local Overrides > Synthetic Data.
- **Broadcast Polling:** Sets a `setInterval` to poll every 10 seconds. It checks the `broadcasts` array for scheduled broadcasts where `scheduledFor <= Date.now()` and dynamically updates their status to `sent`.
- **Computed Analytics:** Uses `useMemo` to crunch the massive merged array into calculated metrics (e.g., `critical_incidents`, `active_users`) for the dashboards.

---

## 4. Notification Store (`useNotificationStore.ts`)

### Purpose
A highly optimized, context-free global store for managing the in-app notification feed (bell icon).

### Location
`frontend-new/src/hooks/useNotificationStore.ts`

### Implementation Details
- **`useSyncExternalStore`:** Rather than relying on React Context (which causes re-renders across the whole tree), this uses React 18's `useSyncExternalStore`. Listeners are stored in a `Set`.
- **Standalone Methods:** Exposes global functions `addNotification`, `markAsRead`, and `clearAll` that can be imported and executed in vanilla JavaScript functions outside of React components.
- **ID Generation:** Attempts to use the native `crypto.randomUUID()`. If unavailable (older browsers), falls back to a timestamp/math-random combo.

---

## 5. Safety Simulation Hook (`useSafetySimulation.ts`)

### Purpose
Listens to the `useOperationalData` output and dynamically triggers notifications and toast alerts when new emergencies or broadcasts arrive.

### Location
`frontend-new/src/hooks/useSafetySimulation.ts`

### Implementation Details
- **Mount Throttling:** Uses a `useRef` flag (`initialLoadDone`) to silently mark all existing incidents as "processed" on initial mount. This prevents the user from being spammed with 50 toasts about old incidents when they first open the app.
- **Silent Population:** On mount, silently pushes generic "Environmental Intelligence" logs to ensure the notification panel isn't completely empty.
- **Event Processing:** 
  - Iterates over active threats.
  - If a threat is `critical` and its `created_at` timestamp is within the last 5 minutes, it fires an aggressive UI toast using `notifyWarning`.
  - Also detects incidents that transitioned to `resolved` and pushes a reassuring "Area normalized" info-level notification.

---

## 6. PWA Installation Hook (`usePWAInstall.ts`)

### Purpose
Provides a clean React interface to the PWA installation logic initialized in `main.tsx`.

### Location
`frontend-new/src/hooks/usePWAInstall.ts`

### Implementation Details
- Checks `window.matchMedia('(display-mode: standalone)').matches` to determine if the app is currently running as an installed application rather than inside a browser tab.
- Sets a 1000ms polling interval to check if `window.pwaInstall` has been attached to the global scope yet by the bootstrapper.
- Returns a simple `install()` promise that triggers the native OS installation dialog.
