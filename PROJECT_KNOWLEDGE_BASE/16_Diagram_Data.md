# Diagram Data

This document contains structured textual data (actors, entities, relationships, processes, states, transitions) designed to be easily pasted into diagram generation tools (like Mermaid, PlantUML, Draw.io, or ChatGPT) to automatically generate software architecture diagrams.

---

## 1. Entity-Relationship Diagram (ERD) Data

**Entities & Attributes:**
- **User**
  - `_id`: ObjectId (Primary Key)
  - `name`: String
  - `email`: String (Unique)
  - `password`: String (Hashed)
  - `role`: String (Enum: user, admin, moderator)
  - `phone`: String (Optional)
  - `emergencyContacts`: Array (Local Storage/Frontend Object - Name, Relationship, Phone, IsPrimary)
  - `created_at`: Date
- **Incident**
  - `_id`: ObjectId (Primary Key)
  - `title`: String
  - `description`: String
  - `type`: String (Enum: Theft, Harassment, Accident, Suspicious Activity, Other)
  - `severity`: String (Enum: low, medium, high, critical)
  - `status`: String (Enum: reported, investigating, resolved, pending)
  - `location`: String (Textual address)
  - `latitude`: Number
  - `longitude`: Number
  - `images`: Array of Strings (URLs)
  - `user`: ObjectId (Foreign Key -> User._id)
  - `created_at`: Date
  - `resolvedAt`: Date
- **Broadcast** *(Currently Local Storage only)*
  - `id`: String
  - `title`: String
  - `message`: String
  - `type`: String (emergency, warning, info, maintenance)
  - `targetAudience`: String
  - `status`: String (draft, scheduled, sent, expired)
  - `recipients`: Number

**Relationships:**
- A `User` can report zero or many `Incidents` (1:N).
- An `Incident` is reported by exactly one `User` (1:1).

---

## 2. Data Flow Diagram (DFD) Data - Level 1

**External Entities (Actors):**
- Tourist (User)
- System Administrator (Admin)
- External API: OSRM (Routing)
- External API: Nominatim (Geocoding)

**Processes:**
- 1.0 Manage Authentication (Login/Register)
- 2.0 Report Safety Incident
- 3.0 Calculate Safe Route
- 4.0 Manage Incidents (Admin)
- 5.0 Broadcast Notifications
- 6.0 Manage Analytics

**Data Stores:**
- D1: User Database (`users` collection)
- D2: Incident Database (`incidents` collection)
- D3: Local Storage State (Broadcasts, Analytics, Current Route)

**Data Flows:**
- Tourist -> (Credentials) -> 1.0 Manage Authentication -> (JWT Token) -> Tourist
- Tourist -> (Incident Details + Images) -> 2.0 Report Safety Incident
- 2.0 -> (Incident Data) -> D2: Incident Database
- Tourist -> (Origin, Destination, Mode) -> 3.0 Calculate Safe Route
- D2: Incident Database -> (Incident Locations) -> 3.0
- 3.0 -> (Coordinates) -> External API: OSRM
- External API: OSRM -> (Polyline Route) -> 3.0
- 3.0 -> (Optimized/Detoured Route) -> Tourist
- Admin -> (Resolution Data) -> 4.0 Manage Incidents -> D2
- Admin -> (Message Payload) -> 5.0 Broadcast Notifications -> D3 -> Tourist (Notification)

---

## 3. Sequence Diagram Data (Report Incident Flow)

**Actors / Lifelines:**
- Tourist (Client Browser)
- Frontend App (React)
- Backend API (Express)
- Database (MongoDB)

**Sequence:**
1. Tourist fills out Incident Report Form in Frontend App.
2. Tourist clicks "Submit".
3. Frontend App sends `POST /api/incidents` (FormData with Auth Token) to Backend API.
4. Backend API validates JWT Token (Middleware).
5. Backend API parses FormData and handles image upload (Multer).
6. Backend API creates a new Incident object.
7. Backend API saves Incident to Database.
8. Database confirms save.
9. Backend API returns `201 Created` with Incident Data to Frontend App.
10. Frontend App displays Success Message to Tourist.
11. Frontend App updates local state (IncidentHistoryPage) to reflect new incident immediately.

---

## 4. Sequence Diagram Data (Safe Routing Flow)

**Actors / Lifelines:**
- Tourist (Client Browser)
- Frontend App (React/Leaflet)
- Database (MongoDB via API)
- External Service (OSRM)

**Sequence:**
1. Tourist selects Origin and Destination on MapPage.
2. Tourist selects Route Mode ("Safest").
3. Frontend App fetches active incidents from Database.
4. Database returns list of active incidents.
5. Frontend App checks direct path bounding box against high-risk incident coordinates.
6. If path intersects high risk, Frontend App calculates a perpendicular detour waypoint.
7. Frontend App sends coordinates (Origin -> Detour -> Destination) to External Service (OSRM).
8. External Service (OSRM) returns route Polyline data.
9. Frontend App runs `calcSafety(route, incidents)` to assign a Safety Score.
10. Frontend App renders the Route and Safety Score on the Map for the Tourist.

---

## 5. State Diagram Data (Incident Lifecycle)

**States:**
- Reported (Initial State)
- Investigating
- Resolved
- Deleted (Terminal State)

**Transitions:**
- `User submits incident` -> **Reported**
- `Admin views incident and begins work` -> **Investigating**
- `Admin marks incident complete` -> **Resolved**
- `Admin deletes incident` -> **Deleted**
- `User deletes own incident` -> **Deleted**

---

## 6. Component UML Class Diagram Data

**Classes (React Components):**
- **App**: Root component, provides Providers.
- **AuthProvider**: Manages `User` state and JWT.
- **ProtectedRoute**: Wraps private routes, checks auth.
- **UserDashboard**: Renders metric cards, SOS widget.
  - Contains: `EmergencySOSWidget`, `DashboardCard`.
- **MapPage**: Handles geospatial logic.
  - Depends on: `useOperationalData`, Leaflet.
- **ReportIncident**: Form component for new incidents.
- **AdminDashboard**: Container for admin views.
- **AdminIncidentsPage**: Data table for incident management.

**Relationships:**
- `App` *contains* `AuthProvider`
- `App` *routes to* `UserDashboard`, `AdminDashboard`
- `UserDashboard` *uses* `EmergencySOSWidget`
- `AdminIncidentsPage` *depends on* `useOperationalData` hook for state.
