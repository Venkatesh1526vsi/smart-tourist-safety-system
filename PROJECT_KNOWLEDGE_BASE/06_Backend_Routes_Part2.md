# Backend Routes & Controllers (Part 2)

This document covers the implementation-level details of the core administrative and incident management Express routers within the Smart Tourist Safety System.

---

## 1. Admin Router (`routes/admin.js`)

### Purpose
Provides comprehensive administrative controls over users, incidents, risk zones, audit logs, and system health. Most endpoints in this router are protected by the `isAdmin` middleware.

### Location
`backend-api/routes/admin.js`

### Implementation Details & Key Endpoints

#### User Management
- **`GET /users`**: Fetches paginated users. Supports filtering by `role` and search by `name` or `email` via regex.
- **`POST /users` (Bulk Create)**: Accepts an array of users or a single user. Hashes passwords, checks for existing emails, and saves records. Crucially, it logs a `user_create` action to the `AuditLog`.
- **`PATCH /users/:id` & `DELETE /users/:id` & `PATCH /users/:id/role`**: Standard CRUD operations wrapped with robust audit logging. Every change records the exact `before` and `after` state in the audit log payload.

#### Audit Logging
- **`GET /audit-logs`**: Fetches paginated audit logs. Filters by `action`, `admin_id`, and a rolling date window (default 30 days). Used to populate the Admin Dashboard activity feed.

#### Health & Dashboard
- **`GET /health`**: Calculates system response time by pinging database collections. Returns JSON with uptime (`process.uptime()`) and connected statuses.
- **`GET /dashboard/summary` & `GET /dashboard/activity`**: Heavily utilizes MongoDB's `countDocuments` and `find().limit()` to aggregate high-level metrics (e.g., incidents by severity, active risk zones) required to render the admin dashboard UI.

#### Advanced Admin Actions
- **`GET /analytics/overview`**: Uses MongoDB aggregation pipelines (`$group`, `$match`, `$lookup`) to calculate the top admins (by action count) and top system actions over the last 30 days.
- **`POST /actions`**: A crucial endpoint that interacts directly with the `WebSocketServer` instance attached to the Express `app` (`req.app.get('webSocketServer')`).
  - Accepts `action: 'broadcast_emergency'`. Broadcasts to the `notifications_room` (all users) and logs the action.

---

## 2. Advanced Router (`routes/advanced.js`)

### Purpose
Handles complex geospatial calculations, predictive risk analysis, reporting exports, and analytical pattern matching.

### Location
`backend-api/routes/advanced.js`

### Implementation Details & Key Endpoints

#### Geospatial Utilities
The file includes manual mathematical implementations of geospatial concepts:
- **`calculateDistance`**: Implements the Haversine formula to calculate the distance between two lat/lng coordinates in kilometers.
- **`isPointInPolygon`**: Implements a standard ray-casting algorithm to determine if a coordinate falls inside an irregular polygon shape.

#### Zone Search & Geofencing
- **`POST /zones/search`**: Advanced search combining text regex (`keyword`), exact matches (`riskLevel`), numeric ranges (`minIncidents`), and Haversine distance filtering (if `latitude`/`longitude`/`radiusKm` are provided).
- **`POST /zones/geofence-check`**: Compares a user's coordinate against all zones. Categorizes zones into `insideZones` (distance <= zone.radius) and `nearbyZones` (distance <= 5km). Generates explicit critical/high alert payloads if the user breaches a high-risk zone.

#### Reporting & Export
- **`POST /reports/generate`**: Aggregates incidents based on multiple complex filters (date range, zone, severity, status). Calculates `average_priority_score` and `response_time_avg_hours`.
- **`POST /reports/export`**: Reuses the aggregation logic but formats the output.
  - If `format === 'csv'`: Uses a local helper function `generateCSV()` to map incident data to a comma-separated string, setting appropriate HTTP headers (`Content-Disposition: attachment`).
  - If `format === 'pdf'`: Returns JSON instructing the frontend to render the PDF client-side using a library like `pdfkit`.

#### Predictive Analytics
- **`GET /predictions/risk-trend`**: Groups incidents by date (`toISOString().split('T')[0]`). Calculates a simple trend prediction ("increasing", "stable", "decreasing") based on the average incidents per day.
- **`GET /analytics/pattern-analysis`**: Aggregates incidents by **Time of Day** (0-23 hours) and **Day of Week** (Sunday-Saturday) to identify peak danger periods. Also calculates the most common incident category.

---

## 3. Incidents Router (`routes/incidents.js`)

### Purpose
Handles the reporting, assignment, resolution, and visualization of safety incidents. Includes robust file upload handling for photographic evidence.

### Location
`backend-api/routes/incidents.js`

### Implementation Details & Key Endpoints

#### Image Upload Configuration
- Uses `multer` for multipart/form-data.
- **Storage:** `multer.diskStorage` points to `../uploads/incident-images`. It synchronously attempts to create the directory if it doesn't exist (`fs.mkdirSync`).
- **Filenames:** Generated using `Date.now() + randomSuffix` to prevent collisions.
- **Limits:** Max file size 5MB, strictly filters for `image/*` MIME types.

#### Core CRUD operations
- **`GET /` & `GET /:id`**: Fetches incidents. Includes data population for the reporter, assigned officer, resolved by, and risk zone. Maps the stored file paths to full absolute URLs using `req.protocol + '://' + req.get('host')`.
- **`POST /`**: Handles incident creation. Accepts the `uploadImages` middleware (max 5 images). Employs defensive programming techniques (checking `req.body` safety, explicitly casting `latitude/longitude` to `Number`) to prevent crashes from malformed client payloads.

#### Incident Lifecycle Management (Admin Only)
- **`PATCH /:id/assign`**: Assigns an incident to an officer, updates `status` to 'investigating', and sets `assigned_at`.
- **`PATCH /:id/close`**: Closes the incident, sets `resolved_at`, logs the `resolved_by` user, and saves `resolution_notes`.
- **`PATCH /:id/update-severity`**: Allows admins to recalculate the `priority_score` of an incident if it was miscategorized. Uses a local helper function `calculatePriority` (e.g., critical=40 + assault=30 -> score=70).

#### Advanced Incident Views
- **`GET /heatmap/data`**: Specifically formats incident data for map heatmaps. Groups incidents by their assigned `risk_zone_id` and aggregates counts by severity and category for optimized frontend rendering.
- **`POST /search` & `POST /bulk-create`**: Specialized endpoints for the admin dashboard to perform advanced filtering and bulk test data injection.
