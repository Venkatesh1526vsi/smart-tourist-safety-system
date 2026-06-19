# Frontend Components - Layout & Core

This document outlines the core structural components and layout wrappers used across the frontend application.

---

## 1. Authentication Guards (`ProtectedRoute.tsx` & `AdminProtectedRoute.tsx`)

### Purpose
Acts as security gateways to prevent unauthorized access to specific React routes.

### Location
- `frontend-new/src/components/ProtectedRoute.tsx`
- `frontend-new/src/components/AdminProtectedRoute.tsx`

### Implementation Details
- **`ProtectedRoute`**: 
  - Checks for the existence of `localStorage.getItem("token")`.
  - Implements a crucial "hydration delay" (`isHydrated` state). It renders `null` on the very first React tick, then checks the token on the second tick. This prevents premature redirects to `/login` when the app is still booting up and pulling state from local storage.
  - If no token exists, returns `<Navigate to="/login" replace />`. Otherwise, renders `children`.
- **`AdminProtectedRoute`**:
  - Similar logic, but also parses `localStorage.getItem("user")`.
  - If the parsed user object does not have `role === "admin"`, it redirects to `<Navigate to="/user-dashboard" replace />`.

---

## 2. Navigation (`Navbar.tsx` & `Logo.tsx`)

### Purpose
The global top-level navigation bar for the public-facing and dashboard pages.

### Location
- `frontend-new/src/components/Navbar.tsx`
- `frontend-new/src/components/Logo.tsx`

### Implementation Details
- **`Navbar.tsx`**:
  - Uses `framer-motion` for smooth mobile menu animations (`AnimatePresence`, `motion.div`).
  - Conditionally renders anchor links (`#about`, `#features`) only if `isLanding` (`location.pathname === "/"`) is true.
  - Fully responsive: uses a hamburger menu (`lucide-react` `Menu` / `X` icons) on mobile and inline buttons on desktop.
- **`Logo.tsx`**:
  - A composed SVG component using `Globe` and `Navigation` icons from `lucide-react`.
  - Accepts a `size` prop (`"default" | "lg"`) to scale dynamically for the navbar vs. the login screen.
  - Hardcoded "SAFEYATRA" typography with primary color highlighting.

---

## 3. Theme Management (`ThemeProvider.tsx` & `ThemeToggle.tsx`)

### Purpose
Handles the application-wide Light/Dark mode state and persists user preferences.

### Location
- `frontend-new/src/components/ThemeProvider.tsx`
- `frontend-new/src/components/ThemeToggle.tsx`

### Implementation Details
- **`ThemeProvider.tsx`**:
  - Exposes a React Context providing `theme` ("light", "dark", or "system"), `resolvedTheme` ("light" or "dark"), and `setTheme`.
  - In `useEffect`, it interacts directly with the DOM: `window.document.documentElement.classList.add(resolved)`.
  - Persists the choice to `localStorage.getItem("safeyatra-theme")`.
  - Listens to OS-level theme changes (`window.matchMedia("(prefers-color-scheme: dark)").addEventListener`) if the user selects "system".
- **`ThemeToggle.tsx`**:
  - A simple icon button (Sun/Moon) that toggles the state via `useTheme()`.

---

## 4. Progressive Web App (PWA) (`InstallButton.tsx`)

### Purpose
Provides a native-feeling UI button to trigger the browser's "Add to Home Screen" prompt.

### Location
`frontend-new/src/components/InstallButton.tsx`

### Implementation Details
- Polls `window.pwaInstall` every 1000ms. If the global PWA install function (injected by `main.tsx`) becomes available, it renders the button.
- If clicked, invokes `await window.pwaInstall()`.
- Unmounts/hides itself if the app is already installed or the prompt is unavailable.

---

## 5. Loaders (`PageLoader.tsx`)

### Purpose
A full-screen loading spinner used during React `<Suspense>` transitions.

### Location
`frontend-new/src/components/PageLoader.tsx`

### Implementation Details
- A simple, centered `min-h-screen` flexbox layout.
- Uses the `Loader2` icon from `lucide-react` with a CSS `animate-spin` class.
- Styled explicitly to support both light and dark modes (`bg-white dark:bg-slate-900`).
