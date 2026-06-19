# Frontend Pages - Authentication & Dashboards

This document covers the core top-level routing pages used for user authentication and the primary operational dashboards.

---

## 1. Authentication Pages (`Login.tsx` & `Register.tsx`)

### Location
- `frontend-new/src/pages/Login.tsx`
- `frontend-new/src/pages/Register.tsx`

### Implementation Details

#### Shared Features
- Both use `framer-motion` for a smooth entry animation (`opacity: 0` to `opacity: 1`, `scale: 0.96` to `scale: 1`).
- Custom validation for "professional emails" (`validateProfessionalEmail` function):
  - Blocks common test domains like `test.com`, `fake.com`, `demo.com`, `example.com`.
  - Ensures a valid TLD structure.
- State management for form inputs, loading indicators (`lucide-react`'s `Loader2`), and errors.
- Both directly parse the backend response, extracting the token and user data, and store them synchronously via `localStorage.setItem`. They then handle the redirect via `useNavigate()` based on the `user.role`.

#### `Login.tsx` Specifics
- **Security Mechanic - Rate Limiting & Lockout:** 
  - Implements a frontend brute-force deterrent. If a user fails to log in 5 consecutive times (`failedAttempts >= 5`), the component locks the UI for 30 seconds (`lockoutUntil`).
  - Utilizes a `setInterval` to run a countdown timer, disabling all inputs and the submit button until the timer reaches zero.
- **Roles:** Includes a dropdown to select between "tourist" and "admin".
- Includes a trigger for a `ForgotPasswordModal`.

#### `Register.tsx` Specifics
- **Password Strength Meter:** Calculates strength (Weak, Medium, Strong) based on length and regex patterns (uppercase, lowercase, numbers, special characters) and displays a color-coded progress bar.
- **Image Upload:** Supports a profile photo upload preview mechanism using `URL.createObjectURL(file)`.
- **Duplicate Prevention:** Before sending the API request, checks a local cache (`localStorage.getItem('registered_emails')`) to provide instant feedback if an email is already registered locally (in addition to backend validation).

---

## 2. Dashboards (`UserDashboard.tsx` & `AdminDashboard.tsx`)

### Location
- `frontend-new/src/pages/UserDashboard.tsx`
- `frontend-new/src/pages/AdminDashboard.tsx`

### Implementation Details

#### `UserDashboard.tsx`
- **Purpose:** The primary hub for the "Tourist" role.
- **State & Data Fetching:** 
  - Retrieves `user` from `useAuth()`, `notifications` from `useNotificationStore()`, and GPS data from `useGeolocation(true)`.
  - On mount, calls `Promise.all([getMyIncidents(), getRiskZones()])` to populate local state.
- **Layout:** Wrapped in `UserDashboardLayout`.
- **Content:**
  - **Widgets Row:** Renders `EmergencySOSWidget`, `NearbyEmergencyContactsWidget`, `TravelSafetyTipsWidget`, and `RouteSafetySuggestionWidget` at the top.
  - **Live Data:** Renders `PuneWeatherWidget` and `PuneSafetyNewsWidget`.
  - **Dashboard Cards:** 
    1. **Live Operational Location:** Shows GPS status and accuracy.
    2. **Risk Zone Alerts:** Filters `riskZones` for 'high' risk and displays alerts. Falls back to a "Low Risk - All Clear" UI if empty.
    3. **Incident History:** Lists the 3 most recent user-reported incidents.
    4. **Operational Intelligence:** Displays the 3 most recent notifications from the store.

#### `AdminDashboard.tsx`
- **Purpose:** The command center for the "Admin" role.
- **State & Data Fetching:** 
  - Relies entirely on the custom `useOperationalData()` hook to fetch aggregate statistics, a global list of incidents, and analytical data (`analytics.total_users`, `analytics.pending_incidents`, etc.).
- **Filtering:** Maintains a local `dashboardFilter` state (`severity`, `status`) which is passed down to child charts.
- **Layout:** Wrapped in `AdminDashboardLayout`.
- **Content:**
  - **Top Metrics:** Renders `StatsOverviewCards`.
  - **Charts:** Uses `MonthlyTrendChart`, `RiskZoneHeatmap`, and `IncidentCategoryPieChart` for data visualization.
  - **Live Tracking:** Embeds the full `LiveTouristTracking` leaflet map component directly into the page.
  - **Interactive Cards:** 
    - Four large clickable `DashboardCard` elements: "Live User Tracking", "Incident Review", "Broadcast Center", and "User Management".
    - Clicking these cards sets an `activeModal` string state.
  - **Modals:** Renders `LiveTrackingModal`, `IncidentReviewModal`, `BroadcastModal`, `UserManagementModal`, and `SafetyAlertModal`, passing the `activeModal` state to their `open` props.
