# Frontend Components - Feature Modules & Widgets

This document details the modular React components that drive the core features of the SAFEYATRA frontend, organized by their respective domain directories.

---

## 1. UI Foundation (`/ui`)
**Location:** `frontend-new/src/components/ui/`

### Purpose
The base building blocks of the design system. These are heavily inspired by `shadcn/ui` and are built using Radix UI primitives and Tailwind CSS. They are meant to be highly reusable, accessible, and stateless.

### Key Components
- **Inputs & Forms:** `input.tsx`, `textarea.tsx`, `select.tsx`, `switch.tsx`, `label.tsx`.
- **Layout & Presentation:** `card.tsx`, `badge.tsx`, `button.tsx`, `separator.tsx`, `scroll-area.tsx`, `table.tsx`.
- **Overlays:** `dialog.tsx`, `alert-dialog.tsx`, `alert.tsx`.

---

## 2. Landing Page Elements (`/landing`)
**Location:** `frontend-new/src/components/landing/`

### Purpose
Components dedicated exclusively to the public-facing marketing and informational homepage.

### Key Components
- `HeroSection.tsx` / `Hero.jsx`: The main call-to-action banner.
- `FeaturesSection.tsx` / `Features.jsx`: Highlights platform capabilities.
- `HowItWorks.tsx` / `HowItWorks.jsx`: Step-by-step usage guide.
- `AboutSection.tsx` / `About.jsx`: Project background.
- `Footer.tsx`: Standard page footer.

*(Note: There is a mix of `.jsx` and `.tsx` files here, suggesting a migration from pure React/JavaScript to TypeScript is in progress or completed via the `.tsx` counterparts).*

---

## 3. Incident Management (`/incident`)
**Location:** `frontend-new/src/components/incident/`

### Purpose
Components handling the reporting, display, and management of safety incidents.

### Key Components
- **`IncidentReportingModal.tsx`**: 
  - A complex, multi-step form built into a Dialog. 
  - **Steps:** Category Selection -> Details (Location/Description/Severity) -> Evidence Upload -> Review.
  - **Location Logic:** Uses `navigator.geolocation` with a fallback to manual entry, and utilizes the Nominatim OpenStreetMap API for reverse geocoding to get city names.
  - **API Submission:** Constructs a `FormData` object to handle image uploads (`evidence`) alongside text data, sending it via POST to `/api/incidents`.
- **`IncidentDetailDrawer.tsx`**: A slide-out panel for viewing the full specifics of an incident (used heavily in the Admin Dashboard).
- **`IncidentTable.tsx`**: A data grid for listing incidents, supporting sorting and status badges.
- **`EvidenceUploadSection.tsx`**: A specific sub-component handling the drag-and-drop or file selection for incident photos.

---

## 4. Map & Geospatial (`/map`)
**Location:** `frontend-new/src/components/map/`

### Purpose
Components related to Leaflet map integrations, distinct from the larger tracking widgets.

### Key Components
- **`MapControlPanel.tsx`**: Overlays for toggling map layers (e.g., heatmaps, risk zones).
- **`RiskZonePopupCard.tsx`**: The UI rendered when a user clicks on a Risk Zone circle on the map, displaying the zone's danger level and active incidents.

---

## 5. Dashboard Widgets (`/widgets`)
**Location:** `frontend-new/src/components/widgets/`

### Purpose
Highly interactive, stateful components that plug into the User and Admin dashboards. They often consume Context data or ping specific API endpoints.

### Key Components

#### Emergency & Tracking
- **`EmergencySOSWidget.tsx`**:
  - A critical safety feature. Implements a "Press & Hold" to activate mechanic (to prevent accidental triggers) using `onMouseDown`/`onTouchStart` and a timer.
  - Features a visual countdown ring and an escalation simulation (Signal Transmitted -> Authorities Notified -> Patrol Assigned -> Live Location Shared).
  - Integrates with the user's `emergencyContacts` from the `AuthContext`.
- **`LiveTouristTracking.tsx`**:
  - An Admin-facing Leaflet map utilizing `react-leaflet`.
  - **Simulation Engine:** Since real-time live GPS feeds are hard to guarantee, this component cleverly merges real users from `localStorage` with generated "fallback" users (`F-1`, `F-2`, etc.) who randomly walk around predefined risk zones in Pune.
  - **Risk Evaluation:** Computes proximity to `RISK_ZONES` via the Haversine formula. Automatically escalates a user's risk level and triggers UI alerts if they loiter in a "Critical" zone for >30s or >60s.
  - Generates a "Live Operations Feed" to simulate a bustling command center.

#### Data Visualization
- **`IncidentCategoryPieChart.tsx`**: Visualizes the breakdown of incident types.
- **`MonthlyTrendChart.tsx`**: A line/bar chart showing incident frequency over time.
- **`RiskZoneHeatmap.tsx`**: Renders intensity maps based on incident density.

#### Information & Utility
- **`PuneWeatherWidget.tsx`**: Fetches and displays current weather and alerts via the external weather API proxy.
- **`PuneSafetyNewsWidget.tsx`**: Displays recent security/safety news for the region.
- **`NearbyEmergencyContactsWidget.tsx`**: Lists local police, hospitals, and fire stations.
- **`TravelSafetyTipsWidget.tsx`**: Contextual advice for tourists.
- **`RouteSafetySuggestionWidget.tsx`**: Suggests safer alternatives for travel paths based on risk zones.
