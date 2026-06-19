# Frontend Pages - Management, History, and Settings

This document covers the pages related to incident reporting, history tracking, administrative oversight, system analytics, broadcasts, notifications, and user settings.

---

## 1. Report Incident Page
**Location:** `frontend-new/src/pages/ReportIncident.tsx`

### Purpose
Allows users to report new incidents, emergencies, or safety concerns directly to the system.

### Implementation Details
- **State:** `formData` (title, description, location, type, dateTime), `severity`, `isEmergency`, `images`.
- **Location Processing:** Supports automatic geolocation via `navigator.geolocation` combined with OpenStreetMap Nominatim reverse geocoding to resolve coordinates into human-readable locations.
- **API Interaction:** Posts a `multipart/form-data` payload containing text data and image files to `/api/incidents`.
- **Validation:** Enforces required fields (title, description, location, type, severity).

---

## 2. Incident History Page
**Location:** `frontend-new/src/pages/IncidentHistoryPage.tsx`

### Purpose
Acts as the user's "Tactical Incident Operations" center. It shows the user's past reports and active safety advisories near them.

### Implementation Details
- **Layout:** `UserDashboardLayout` with a two-column design:
  - Left Column: `IncidentReportForm` component (inline reporting).
  - Right Column: Personal active reports and global advisories.
- **Data Fetching:** Combines backend data via `getMyIncidents()` and local data from `localStorage` (`op_created_incidents`), deduplicating based on `_id`.
- **Notifications:** Fires a `useNotificationStore` notification upon successful inline report creation.
- **Global Advisories:** Filters global `incidents` from `useOperationalData` to show only `critical` or `high` severity active incidents to the user.

---

## 3. Admin Incidents Page
**Location:** `frontend-new/src/pages/AdminIncidentsPage.tsx`

### Purpose
Provides administrators with a comprehensive table to view, filter, edit, resolve, and delete all user-reported incidents.

### Implementation Details
- **Stats Cards:** Total, Critical, Resolved, Deleted.
- **Filtering:** Search by description and filter by severity.
- **Table:** Displays incident type, reporter info, severity, status, date, and actions.
- **Interactivity:**
  - Clicking a row expands it to show full details (coordinates, status dropdown, evidence images).
  - Edit modal allows modifying description and severity via `updateIncidentOp`.

---

## 4. Admin Analytics Page
**Location:** `frontend-new/src/pages/AdminAnalyticsPage.tsx`

### Purpose
Visualizes system performance, incident trends, and user activity using real-time data metrics.

### Implementation Details
- **Time Filtering:** Filters incidents based on the selected timeframe (7, 30, 90 days, or All Time).
- **Computed Metrics:** Total Incidents, Resolution Rate, Critical Cases, and Avg Resolution Time (calculated using `created_at` and `resolved_at`).
- **Data Visualization (HTML/CSS Based):**
  - Custom progress-bar-style charts for "Incidents by Type" and "Severity Distribution".
  - Bar-chart-style visualizations for "Monthly Incident Trend" and "User Activity Metrics".
- **Export:** Converts analytics data into a JSON Blob and triggers a download.

---

## 5. Admin Broadcast Page
**Location:** `frontend-new/src/pages/AdminBroadcastPage.tsx`

### Purpose
Allows admins to push system-wide alerts, emergency warnings, or general information to users.

### Implementation Details
- **Stats:** Shows counts for Sent, Scheduled, Recipients Reached, and Emergency Alerts.
- **Creation Form:** Admins input title, type, message, target audience, and scheduling options.
- **Submission:** Submits payload via `saveBroadcastOp()`, instantly appending it to the global broadcasts array.
- **List View:** Displays recent broadcasts with expandable details and filter functionality.

---

## 6. Admin Users Page
**Location:** `frontend-new/src/pages/AdminUsersPage.tsx`

### Purpose
Provides admins with a dashboard to manage user accounts, roles, and statuses.

### Implementation Details
- **Data Source:** Pulls users from `useOperationalData`.
- **Features:** Search, role filtering, pagination (10 items per page).
- **CRUD Operations:**
  - **Add User:** Modal form, calls `apiPost("/api/admin/users")`.
  - **Edit User:** Modal form, updates name, email, role via `apiPatch`.
  - **Delete User:** Deletes via `deleteUserOp`.

---

## 7. Notifications Page
**Location:** `frontend-new/src/pages/NotificationsPage.tsx`

### Purpose
A central inbox for users to view system alerts, advisories, and emergency broadcasts.

### Implementation Details
- **State Hook:** Uses `useNotificationStore` (Zustand) for global notification management.
- **Filtering:** Filter by type (Info, Warning, Emergency) or "Unread Only".
- **Actions:** "Read All", "Clear", or click individual notifications to mark as read.
- **Animation:** Uses `framer-motion` for smooth list entry/exit animations.

---

## 8. Settings Page
**Location:** `frontend-new/src/pages/SettingsPage.tsx`

### Purpose
Allows users to manage their profile, password, emergency contacts, notification preferences, and privacy settings.

### Implementation Details
- **Profile:** Updates display name and phone number via `useAuth().updateUser()`.
- **Emergency Contacts:** Users can add up to 5 contacts. The first contact added defaults to `isPrimary`. Supports setting primary and removing contacts.
- **Account Deletion:** Contains a "Danger Zone" requiring the user to type "DELETE" to permanently terminate the account via `logout()`.
