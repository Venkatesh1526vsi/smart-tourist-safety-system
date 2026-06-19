# Backend Database Models

This document covers the implementation-level details of the core MongoDB schemas located in the `backend-api/models/` directory.

---

## 1. User Model (`User.js`)

### Purpose
To define the schema for tourists and administrators within the system, handling authentication credentials, personal profiles, emergency contacts, and application preferences.

### Location
`backend-api/models/User.js`

### Schema Definition
- **Core Info:** `name` (String, required), `email` (String, required, unique), `password` (String, required - stores bcrypt hash).
- **Role Management:** `role` (String, enum: `['user', 'admin', 'tourist']`, defaults to `tourist`).
- **Profile Enhancements:** `phone` (Regex matched Indian format `^[0-9]{10}$`), `bio` (Max length 500), `profile_picture` (String URL), `availability_status` (enum: `['available', 'busy', 'away', 'offline']`).
- **Emergency Contacts:** Array of sub-documents containing `name`, `relationship`, `phone` (Regex matched), `email`, and an `is_primary` boolean.
- **Preferences:** Complex embedded object managing:
  - `language`: enum `['en', 'hi', 'mr']`.
  - `notifications`: email, sms, push toggles.
  - `privacy`: profile visibility, location sharing, contact sharing toggles.
  - `safety`: emergency mode toggle, SOS toggle.
- **Timestamps:** Utilizes Mongoose's `{ timestamps: true }` which automatically manages `createdAt` and `updatedAt`. Also manually defines `created_at` and `updated_at`.

### Security & Developer Notes
- The password is NOT hashed within a pre-save hook in the schema; hashing is handled explicitly in the auth controllers (`index.js`).
- The regex constraint on phone numbers strictly enforces 10-digit Indian numbers, which may cause issues for international tourists unless the validation is relaxed.

---

## 2. Location Model (`Location.js`)

### Purpose
To store the latest geographical coordinates for a specific user. This model powers the real-time tracking feature.

### Location
`backend-api/models/Location.js`

### Schema Definition
- `userId`: ObjectId referencing the `User` model. **Required and Unique.** This means this collection stores exactly *one* location record per user (their current/latest location), rather than a historical trace.
- `latitude`: Number, required.
- `longitude`: Number, required.
- `timestamp`: Date, defaults to `Date.now`.

### Workflow
When the frontend app posts a location update, the backend uses `findOneAndUpdate` with `{ upsert: true }` to either create the document or overwrite the existing coordinates for that user.

---

## 3. Incident Model (`Incident.js`)

### Purpose
To log and manage safety incidents, emergencies, and reports created by users, tracking them through a resolution lifecycle.

### Location
`backend-api/models/Incident.js`

### Schema Definition
- **Reporter Info:** `userId` (Mixed type, accepts String or ObjectId referencing `User`).
- **Geospatial Data:** `latitude`, `longitude` (Numbers). Additionally, `locationId` (ObjectId referencing the `Location` collection, if coordinates were inferred rather than explicitly provided).
- **Core Incident Data:** `type` (String, e.g., 'theft', 'medical', default 'other'), `description` (String), `status` (String, e.g., 'reported', 'in_progress', 'resolved').
- **Assessment & Assignment:** 
  - `severity`: String (default 'medium').
  - `priority_score`: Number (default 50).
  - `assigned_officer`: ObjectId referencing `User`.
  - `assigned_at`, `resolved_at`, `resolved_by`, `resolution_notes`: Lifecycle tracking fields.
- **Evidence:** `media_attachments` (Array of Strings storing URLs to uploaded images/videos).
- **Context:** `witnesses` (Array of objects with name/contact/statement), `risk_zone_id` (ObjectId referencing `RiskZone`).

### Workflow
When an incident is reported, if coordinates are missing, the API fetches the user's `Location` record and attaches it. The incident is created with a status of 'reported' and is subsequently managed via the Admin Dashboard.

---

## 4. RiskZone Model (`RiskZone.js`)

### Purpose
To define geographical boundaries (polygons or radius) that represent areas with specific safety risks. Used for mapping and predictive alerts.

### Location
`backend-api/models/RiskZone.js`

### Schema Definition
- **Core Info:** `name` (String), `description` (String).
- **Risk Assessment:** `riskLevel` (enum: `['low', 'medium', 'high', 'critical']`), `alert_severity` (enum matching riskLevel).
- **Geospatial Boundaries:** 
  - `polygon`: 2D array of Numbers `[[lat, lng]]`. Includes custom validation ensuring at least 3 coordinate pairs (a valid polygon shape).
  - `center`: Object with `latitude` and `longitude`.
  - `radius`: Number (in km).
- **Dynamic Modifiers:**
  - `weather_multiplier`: Number (0.5 to 3.0). Increases risk during bad weather.
  - `peak_hours`: Embedded object defining a time range (e.g., 6 PM to 6 AM) and a risk multiplier.
- **Analytics Metrics:** `incident_count`, `incident_density`, `last_incident_date`, and an array of `incidents` referencing `Incident`.

### Indexes & Execution Flow
- **Geospatial Index:** Utilizes `RiskZoneSchema.index({ 'center': '2dsphere' })` to allow MongoDB to execute fast geographical queries (e.g., finding zones near a user's location).
- **Pre-save Hook:** Intercepts `save()` to manually update `updatedAt`.

---

## 5. Notification Model (`Notification.js`)

### Purpose
To store system alerts, incident updates, and broadcast messages directed at specific users.

### Location
`backend-api/models/Notification.js`

### Schema Definition
- `recipientId`: ObjectId referencing `User`.
- `type`: String categorization of the notification.
- `message`: String payload.
- `incidentId`: Optional ObjectId referencing an `Incident` if the notification is contextually linked to an emergency.
- `read`: Boolean flag to manage UI unread badges.

---

## 6. AuditLog Model (`AuditLog.js`)

### Purpose
To maintain a strict, immutable record of administrative actions for compliance and debugging.

### Location
`backend-api/models/AuditLog.js`

### Schema Definition
- **Actor:** `admin_id` (ObjectId referencing `User`).
- **Action Context:** `action` (Enum containing 15 specific admin actions like `user_create`, `incident_close`, `zone_update`), `resource_type` (Enum: `['user', 'incident', 'zone', 'system', 'report']`), `resource_id`, `resource_name`.
- **Payload:** `change_details` (Stores `before` and `after` states using `mongoose.Schema.Types.Mixed` to accommodate varying object shapes).
- **Environment:** `ip_address`, `user_agent`.
- **Outcome:** `status` (Enum: `['success', 'failed']`), `error_message`.

### Database Optimization (Indexes)
Highly optimized for administrative querying with four separate indexes:
1. `{ admin_id: 1, timestamp: -1 }`: Look up logs by admin.
2. `{ action: 1, timestamp: -1 }`: Look up logs by action type.
3. `{ resource_type: 1, resource_id: 1 }`: Look up history of a specific entity.
4. `{ timestamp: -1 }`: Chronological sorting.
