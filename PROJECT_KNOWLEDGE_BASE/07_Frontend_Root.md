# Frontend Root & Entry Points

This document details the implementation of the core entry points for the React frontend, handling initialization, global routing, and fundamental providers.

---

## 1. HTML Entry Point (`frontend-new/index.html`)

### Purpose
The fundamental HTML shell that loads the Vite/React application and provides initial meta tags for mobile optimization and PWA configuration.

### Location
`frontend-new/index.html`

### Implementation Details
- Standard HTML5 boilerplate.
- Includes `<meta name="theme-color" content="#0f172a" />` matching the dark mode slate-900 color for mobile browser headers.
- Apple specific PWA meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`).
- The React app is injected into `<div id="root"></div>`.
- Vite loads the main script via `<script type="module" src="/src/main.tsx"></script>`.

---

## 2. React Bootstrapper (`frontend-new/src/main.tsx`)

### Purpose
Initializes the React DOM, sets up global error tracking, handles PWA installation prompts, injects theme classes, and wraps the application in global providers.

### Location
`frontend-new/src/main.tsx`

### Imports
- `react-hot-toast` (`Toaster`): Global notification system.
- `react-dom/client` (`createRoot`).
- `leaflet/dist/leaflet.css`: Required for the mapping components.
- `./contexts/AuthContext` (`AuthProvider`): Global state for user sessions.

### Implementation Details

#### Global Error Trapping
- Overrides `window.onerror` and `window.onunhandledrejection` to catch and `console.error` all runtime crashes with heavy "🚨" emojis to make them highly visible during debugging.

#### Progressive Web App (PWA) Handling
- Intercepts the `beforeinstallprompt` event and prevents the default browser prompt, saving the event to a `deferredPrompt` variable.
- Exposes a global method `window.pwaInstall()` that components can call to manually trigger the PWA installation dialog at an appropriate time.
- *Developer Note:* The actual Service Worker registration (`navigator.serviceWorker.register`) is currently commented out and actively unregisters existing workers. This was likely done to clear stale caches during active development.

#### Theme Initialization
- Before React even renders, it executes synchronous JavaScript to check `localStorage.getItem("safeyatra-theme")`. If set to 'dark', or if not set but the OS prefers dark mode (`window.matchMedia("(prefers-color-scheme: dark)")`), it immediately injects the `dark` class into `document.documentElement`. This prevents a white flash on initial load for dark mode users.

#### Providers
- Wraps the `<App />` in `<StrictMode>` and `<AuthProvider>`.
- Renders the global `<Toaster />` component, configured with a custom dark theme (`background: '#1f2937'`) and 4-second duration.

---

## 3. Application Router (`frontend-new/src/App.tsx`)

### Purpose
Defines the client-side routing architecture, handling route protection, layout wrappers, and lazy-loading of heavy dashboard modules.

### Location
`frontend-new/src/App.tsx`

### Implementation Details

#### Eager vs. Lazy Loading
- **Eager Loading:** Critical public pages (`Index`, `Login`, `Register`, `NotFound`) and highly accessed protected pages (`SettingsPage`, `IncidentHistoryPage`) are imported synchronously. They are included in the initial JS bundle.
- **Lazy Loading:** Massive, dependency-heavy components like `MapPage` (loads Leaflet), `AdminAnalyticsPage` (loads Recharts), and the Dashboards are imported via `React.lazy()`. This drastically shrinks the initial page load time.

#### ProtectedRoute & Suspense Wrapper
- Implements a custom functional component `<ProtectedLazyRoute>` which nests `React.Suspense` (with a `<PageLoader />` fallback) *inside* the `<ProtectedRoute>`. 
- This ensures that if an unauthenticated user hits `/dashboard`, the router doesn't waste bandwidth downloading the lazy-loaded chunk before the `<ProtectedRoute>` kicks them back to `/login`.

#### Route Hierarchy
1. **Public Routes:** `/`, `/login`, `/register`.
2. **Dashboard Redirects:** Explicit `/user-dashboard` and `/admin-dashboard` routes exist.
3. **User Workspace:** `/dashboard/user/settings`, `/dashboard/user/incidents`, `/dashboard/user/map`, `/dashboard/user/notifications`. A catch-all `/dashboard/user/*` redirects back to the main user dashboard.
4. **Admin Workspace:** `/dashboard/admin/users`, `/dashboard/admin/incidents`, `/dashboard/admin/broadcast`, `/dashboard/admin/analytics`. Catch-all `/dashboard/admin/*` redirects to admin dashboard.

### Developer Notes
- The ordering of routes is critical. Specific routes like `/dashboard/admin/users` must be defined *before* the wildcard catch-all `/dashboard/admin/*`.
- The `<ThemeProvider>` wrapper (which manages shadcn/ui theming) wraps the `BrowserRouter`, ensuring theme context is available to all routes.
