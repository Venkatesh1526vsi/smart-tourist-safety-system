# Frontend Pages - Maps & Tracking

This document covers the map-based pages used by tourists for safe routing and by admins for live incident tracking.

---

## 1. Map Page (Tourist)
**Location:** `frontend-new/src/pages/MapPage.tsx`

### Purpose
Provides tourists with an interactive map to plan safe trips, view active safety incidents, and explore recommendations. It implements a fully functioning routing system using Leaflet, OSRM (Open Source Routing Machine), and Nominatim for geocoding.

### Implementation Details
- **Libraries:** Built heavily on `react-leaflet` and `leaflet`. Integrates `leaflet-gesture-handling` for better mobile interactions.
- **State Management:**
  - Persists trip parameters (origin, destination, stops, selected categories) to `localStorage` (`tourist_map_plan`).
  - Maintains `tripMode`: "planned", "explore", or "neutral".
  - Maintains highly complex state for waypoints, routing polygons, safety breakdown metrics, and itinerary places.
- **Geolocation & Mapping:**
  - `navigator.geolocation` is used to get the user's current coordinates.
  - Reverse geocoding via `nominatim.openstreetmap.org` translates coordinates into human-readable locations.
- **Incidents & Risk Zones:**
  - Fetches all incidents via `getAllIncidents()`.
  - Fallbacks to hardcoded `fallbackIncidents()` and predefined `PUNE_ZONES` if the API fails.
  - Dynamically renders incidents as glowing, pulsing markers using custom `L.divIcon` HTML, color-coded by severity.
- **Routing Engine (`handleGetRoute`):**
  - Sends waypoint coordinates to `router.project-osrm.org`.
  - Includes a `buildDetourWaypoints` algorithm:
    - If the user selects "Safest" or "Balanced", the algorithm checks if the direct route segments pass within 1000m-1500m of high-risk zones or critical incidents.
    - If so, it artificially pushes a detour waypoint perpendicularly away from the danger zone before calling OSRM.
- **Safety Calculation (`calcSafety`):**
  - Analyzes the returned OSRM polyline against known incidents and high-risk zones using the Haversine formula.
  - Applies penalties for crossing risk zones, high-risk areas, and nearby incidents.
  - Applies a time-of-day penalty if it's nighttime (10 PM to 6 AM).
  - Calculates realistic time delays based on urban congestion multipliers and stop types (e.g., adding 90 minutes to the ETA if stopping at a mall).
- **Optimization (`optimizeOrder`):**
  - Implements a greedy nearest-neighbor algorithm to reorder multiple "stops" into the most efficient path.

---

## 2. Live Tracking Page (Admin)
**Location:** `frontend-new/src/pages/LiveTrackingPage.tsx`

### Purpose
An admin-facing page displaying a broad geographical overview of all incidents.

### Implementation Details
- **Layout:** Wrapped in `AdminDashboardLayout`.
- **Data Source:** Currently pulls data from `localStorage.getItem("incidents")`. *(Note: This appears to be a lightweight implementation compared to the dashboard widgets, relying on data hydrated elsewhere).*
- **Map:**
  - Uses `react-leaflet` (`MapContainer`, `TileLayer`, `Marker`, `Popup`).
  - Fetches external marker images from a GitHub raw URL (`leaflet-color-markers`) to provide color-coded pins based on incident severity:
    - Critical = Red
    - High = Orange
    - Medium = Yellow
    - Low = Green
- **Interaction:**
  - Clicking a marker updates the `selectedIncident` state.
  - This conditionally renders a detail card below the map showing the Incident ID, Type, Severity, Status, Date, Coordinates, and Description.
