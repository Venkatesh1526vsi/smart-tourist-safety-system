# Project Synthesis and Mappings

This document provides high-level mappings to connect features, APIs, and databases to their respective source code files, providing a comprehensive index of the Smart Tourist Safety System.

---

## 1. Feature-to-File Mapping

| Feature | Primary Location (Frontend) | Primary Location (Backend) |
| :--- | :--- | :--- |
| **Authentication (Register/Login)** | `frontend-new/src/pages/Login.tsx`, `Register.tsx` | `backend/controllers/authController.js`, `routes/authRoutes.js` |
| **Incident Reporting** | `frontend-new/src/pages/ReportIncident.tsx`, `IncidentReportingModal.tsx` | `backend/controllers/incidentController.js`, `routes/incidentRoutes.js` |
| **Interactive Map & Safe Routing** | `frontend-new/src/pages/MapPage.tsx` | N/A (Client-side OpenStreetMap/OSRM integration) |
| **Emergency SOS** | `frontend-new/src/components/EmergencySOSWidget.tsx` | `backend/controllers/incidentController.js` (Creates Critical Incident) |
| **Live Tourist Tracking** | `frontend-new/src/components/LiveTouristTracking.tsx`, `LiveTrackingPage.tsx` | N/A (Simulated/Local Storage currently) |
| **Admin Incident Management** | `frontend-new/src/pages/AdminIncidentsPage.tsx` | `backend/controllers/adminController.js`, `routes/adminRoutes.js` |
| **System Analytics** | `frontend-new/src/pages/AdminAnalyticsPage.tsx` | N/A (Aggregated client-side via `useOperationalData`) |
| **System Broadcasts** | `frontend-new/src/pages/AdminBroadcastPage.tsx` | N/A (Managed via `useOperationalData` / `localStorage`) |
| **User Notifications** | `frontend-new/src/pages/NotificationsPage.tsx`, `useNotificationStore.ts` | N/A (Client-side Zustand store) |

---

## 2. API-to-Controller Mapping

| API Endpoint (Route) | HTTP Method | Controller Function | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | `registerUser` | Registers a new user |
| `/api/auth/login` | POST | `loginUser` | Authenticates user & returns JWT |
| `/api/auth/me` | GET | `getUserProfile` | Retrieves current logged-in user profile |
| `/api/incidents` | POST | `createIncident` | Creates a new incident (handles image upload) |
| `/api/incidents` | GET | `getIncidents` | Retrieves all incidents (supports filtering) |
| `/api/incidents/:id` | GET | `getIncidentById` | Retrieves a specific incident by ID |
| `/api/incidents/:id` | PUT | `updateIncident` | Updates an incident (Admin/Owner) |
| `/api/incidents/:id` | DELETE | `deleteIncident` | Deletes an incident (Admin/Owner) |
| `/api/admin/incidents` | GET | `getAllIncidents` | Retrieves all incidents for Admin dashboard |
| `/api/admin/users` | GET | `getAllUsers` | Retrieves all registered users |
| `/api/admin/users/:id` | PUT | `updateUserRole` | Updates user role/status |

---

## 3. Database-to-Model Mapping

| MongoDB Collection | Mongoose Model | File Location | Key Fields |
| :--- | :--- | :--- | :--- |
| `users` | `User` | `backend/models/User.js` | `name`, `email`, `password`, `role` (user/admin/moderator) |
| `incidents` | `Incident` | `backend/models/Incident.js` | `title`, `description`, `type`, `severity`, `status`, `location`, `images`, `user` (Ref: User) |

*(Note: Additional data like Broadcasts, Analytics, and Notifications are currently managed in LocalStorage on the frontend and do not have dedicated backend Mongoose models yet.)*

---

## 4. Component Hierarchy (Frontend)

```text
App (Root)
 ├── ThemeProvider
 ├── AuthProvider
 └── Router
      ├── Public Routes
      │    ├── Login Page
      │    └── Register Page
      └── Protected Routes (ProtectedRoute Wrapper)
           ├── User Dashboard Layout
           │    ├── Sidebar (Navigation)
           │    ├── Navbar (ThemeToggle, User Menu)
           │    ├── User Dashboard Page
           │    │    ├── Metric Cards
           │    │    ├── Map Preview
           │    │    └── Emergency SOS Widget
           │    ├── Map Page (Tourist Routing)
           │    ├── Report Incident Page
           │    ├── Incident History Page
           │    ├── Notifications Page
           │    └── Settings Page
           └── Admin Dashboard Layout
                ├── Sidebar (Admin Navigation)
                ├── Navbar (ThemeToggle, Admin Menu)
                ├── Admin Dashboard Page
                │    ├── Analytics Summary
                │    ├── Admin Incident List Preview
                │    └── Live Tourist Tracking Widget
                ├── Admin Incidents Page
                ├── Live Tracking Page (Global Map)
                ├── Admin Analytics Page
                ├── Admin Broadcast Page
                └── Admin Users Page
```

---

## 5. Directory Structure (Architecture Overview)

```text
Smart Tourist Safety System
│
├── backend/
│   ├── config/          # Database configuration (db.js)
│   ├── controllers/     # Business logic (auth, incident, admin)
│   ├── middlewares/     # Auth verification, Error handling, Multer
│   ├── models/          # Mongoose Schemas (User, Incident)
│   ├── routes/          # Express Routers
│   ├── uploads/         # Local storage for incident evidence images
│   └── server.js        # Express application entry point
│
└── frontend-new/
    ├── public/          # Static assets, Manifest for PWA
    ├── src/
    │   ├── components/  # Reusable UI elements
    │   │   ├── dashboard/ # Layout wrappers (Sidebar, Navbar)
    │   │   ├── forms/     # Form components (IncidentReportForm)
    │   │   └── ui/        # Base UI components (Buttons, Inputs, Cards)
    │   ├── contexts/    # React Contexts (AuthContext)
    │   ├── hooks/       # Custom React Hooks (useOperationalData, useSafetySimulation)
    │   ├── lib/         # Utility functions (Tailwind class merging)
    │   ├── pages/       # React Router Page Components (Login, MapPage, AdminDash)
    │   ├── services/    # Axios API client (api.ts)
    │   ├── App.tsx      # Main application routing
    │   ├── index.css    # Global Tailwind styles
    │   └── main.tsx     # React DOM rendering
    ├── package.json     # Frontend dependencies
    ├── tailwind.config.js # Tailwind configuration
    ├── tsconfig.json    # TypeScript configuration
    └── vite.config.ts   # Vite bundler configuration
```
