# AI Context & Master Project Documentation Index

**Project Name:** Smart Tourist Safety System
**Stack:** React + Vite + TypeScript + Tailwind CSS (Frontend), Node.js + Express + MongoDB (Backend)
**Status:** MVP / Core System Functional. (Heavy reliance on simulated state & localStorage for operational data in the frontend).

## What is this document?
This is the master index of the `PROJECT_KNOWLEDGE_BASE`. It is designed to be fed into LLMs or provided to incoming developers to instantly impart a comprehensive, source-code-level understanding of the entire Smart Tourist Safety System.

## Documentation Index

The knowledge base is broken down into the following files, ordered logically from backend infrastructure up to the frontend UI and synthesis.

### Part 1: Backend Infrastructure & Logic
- **`01_Backend_Infrastructure.md`**
  - Details `server.js` and `config/db.js`.
  - Explains Express initialization, CORS, Middleware stack, and MongoDB connection logic.
- **`02_Backend_Models.md`**
  - Details the Mongoose schemas in `models/User.js` and `models/Incident.js`.
- **`03_Backend_Middlewares.md`**
  - Details custom middleware: `authMiddleware.js`, `errorMiddleware.js`, and `uploadMiddleware.js` (Multer).
- **`04_Backend_Controllers.md`**
  - Deep dive into `authController.js`, `incidentController.js`, and `adminController.js`.
  - Maps out the exact business logic for registration, login, reporting, and administration.
- **`05_Backend_Routes.md`**
  - Details the Express routers: `authRoutes.js`, `incidentRoutes.js`, and `adminRoutes.js`.

### Part 2: Frontend Architecture & Core Logic
- **`06_Frontend_Core_Config.md`**
  - Covers build configurations: `package.json`, `vite.config.ts`, `tailwind.config.js`, and `tsconfig.json`.
- **`07_Frontend_State_Services.md`**
  - Details the central `api.ts` Axios configuration and core React contexts (`AuthContext.tsx`, `ThemeProvider.tsx`).
- **`08_Frontend_Hooks.md`**
  - Documents complex custom hooks: `useOperationalData.ts`, `useSafetySimulation.ts`, `useTheme.ts`, `useNotificationStore.ts`.
- **`09_Frontend_Routing_Root.md`**
  - Maps `App.tsx`, `main.tsx`, and the `ProtectedRoute.tsx` logic.

### Part 3: Frontend Components & Layouts
- **`10_Frontend_Components_Layout.md`**
  - Covers navigational structures: `AdminDashboardLayout`, `UserDashboardLayout`, `Navbar`, and `Sidebar`.
- **`11_Frontend_Components_Feature.md`**
  - Details functional modules: `EmergencySOSWidget`, `LiveTouristTracking`, `IncidentReportingModal`, `IncidentReportForm`, and `DashboardCard`.

### Part 4: Frontend Pages
- **`12_Frontend_Pages_Auth_Dashboards.md`**
  - Documents `Login.tsx`, `Register.tsx`, `AdminDashboard.tsx`, and `UserDashboard.tsx`.
- **`13_Frontend_Pages_Maps_Tracking.md`**
  - Explains the highly complex geospatial logic within `MapPage.tsx` (OSRM safe routing, detour algorithms, Leaflet integration) and `LiveTrackingPage.tsx`.
- **`14_Frontend_Pages_Management.md`**
  - Documents the remaining forms and management tables: `AdminIncidentsPage.tsx`, `AdminAnalyticsPage.tsx`, `AdminBroadcastPage.tsx`, `AdminUsersPage.tsx`, `ReportIncident.tsx`, `IncidentHistoryPage.tsx`, `NotificationsPage.tsx`, and `SettingsPage.tsx`.

### Part 5: Synthesis & Automated Diagram Generation
- **`15_Synthesis_And_Mappings.md`**
  - Provides tabular mappings connecting Features -> Files, APIs -> Controllers, and Database Collections -> Mongoose Models. Shows the component hierarchy tree.
- **`16_Diagram_Data.md`**
  - Structured text datasets containing Entities, Attributes, Relationships, Actors, Processes, and Data Flows. This data can be directly copied into an LLM to generate Mermaid/UML code for ERDs, DFDs, Sequence Diagrams, and State Diagrams.

## How to use this knowledge base to generate IEEE Reports/PPTs
To generate a comprehensive report:
1. Provide the LLM with `15_Synthesis_And_Mappings.md` to establish the overarching architecture.
2. Provide `04_Backend_Controllers.md` and `13_Frontend_Pages_Maps_Tracking.md` to explain the core algorithms (like the Haversine safety checking and OSRM integration).
3. Use `16_Diagram_Data.md` to generate the required architectural diagrams.
