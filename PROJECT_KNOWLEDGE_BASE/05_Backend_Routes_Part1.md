# Backend Routes & Controllers (Part 1)

This document covers the implementation-level details of the Express routers handling User Profiles and Risk Zones within the Smart Tourist Safety System.

---

## 1. Profiles Router (`routes/profiles.js`)

### Purpose
Manages all user-specific profile operations, including fetching profile data, updating personal details, managing emergency contacts, setting application preferences, and calculating profile completion statistics.

### Location
`backend-api/routes/profiles.js`

### Base URL
`/api/profile` (Mounted in `index.js`)

### Dependencies
- `express.Router()`
- `jsonwebtoken`
- `../models/User`
- Custom `authenticateToken` middleware (defined locally in the file, replicating the logic from `auth.js`).

### Endpoint Documentation

#### `GET /me`
- **Workflow:** Extracts `req.user.userId` from the JWT. Fetches the User document.
- **Data Query:** Uses `.select('-password')` to ensure the bcrypt hash is never returned to the client.
- **Returns:** Full user object.

#### `GET /:userId` (Public Profile)
- **Workflow:** Fetches a specific user's public details.
- **Privacy Enforcement:** Checks the target user's `preferences.privacy.show_profile` boolean. If `false` and the requester is not the target user, it blocks the request with a `403 Forbidden`.
- **Returns:** Filtered object (`name`, `bio`, `profile_picture`, `availability_status`, `created_at`).

#### `PATCH /update`
- **Workflow:** Accepts `name`, `bio`, and `phone`. 
- **Validation:** Uses regex `/^[0-9]{10}$/` to validate the phone number before updating.
- **Database Interaction:** Uses `findByIdAndUpdate` with `{ runValidators: true }` to enforce Mongoose schema constraints during the update.

#### `PATCH /picture`
- **Workflow:** Accepts a `picture_url`. Validates it using the native `new URL(picture_url)` constructor to prevent invalid image paths. Updates the `profile_picture` field.

#### `PATCH /emergency-contacts`
- **Workflow:** A multi-purpose endpoint that accepts an `action` string (`'add'`, `'update'`, `'delete'`) and a `contact` object.
- **Implementation (Add):** Uses MongoDB's `$push` operator to append to the `emergency_contacts` array. Validates the nested phone number.
- **Implementation (Update):** Uses MongoDB's powerful `arrayFilters` and `$set` with positional operator `$[elem]` to specifically update a contact within the array without overwriting the whole array: `{'emergency_contacts.$[elem].name': contact.name}`.
- **Implementation (Delete):** Uses MongoDB's `$pull` operator to remove the nested document by `_id`.

#### `PATCH /preferences` & `PATCH /availability`
- **Workflow:** Uses deep object assignment to selectively update nested schema paths like `preferences.notifications.email_alerts` without destroying siblings in the object tree.

#### `GET /search`
- **Workflow:** Allows users to search for others to add as emergency contacts.
- **Database Interaction:** Uses `$or` with `$regex` (case-insensitive `i`) on `name` and `email`. Uses `$ne` to exclude the requester from the results.

#### `GET /stats/summary`
- **Purpose:** Calculates the "Profile Completion" percentage shown on the dashboard.
- **Algorithm:** Calculates an internal score based on 5 parameters (phone/bio/picture=25%, emergency contacts=25%, preferences=25%, safety config=25%). Generates dynamic string recommendations (e.g., "Upload a profile picture") using a custom `generateRecommendations` function if specific checks fail.

### Developer Notes
- The local duplication of `authenticateToken` inside `profiles.js` instead of importing it from `middleware/auth.js` is a DRY (Don't Repeat Yourself) violation that should be refactored in future updates.

---

## 2. Risk Zones Router (`routes/riskZones.js`)

### Purpose
Manages the creation, retrieval, spatial querying, and predictive risk calculation of geographical Risk Zones.

### Location
`backend-api/routes/riskZones.js`

### Base URL
`/api/risk-zones` (Mounted in `index.js`)

### Dependencies
- `express.Router()`
- `../models/RiskZone`
- `../middleware/auth` (`auth`, `adminAuth`)

### Endpoint Documentation

#### `GET /` & `GET /:id`
- **Workflow:** Public endpoints to fetch zones for the map. Supports filtering via `?riskLevel=high`. Uses Mongoose `.populate('createdBy', 'name email')` to join admin data.

#### `POST /` & `PUT /:id` & `DELETE /:id`
- **Security:** Protected by `adminAuth` middleware.
- **Validation:** Enforces standard risk levels (`low`, `medium`, `high`, `critical`). Manually verifies that the `polygon` array contains at least 3 points before attempting to save to MongoDB.

#### `POST /check-location`
- **Purpose:** Determines if a given user's coordinate falls within any defined risk zone.
- **Database Interaction (Geospatial Query):** This is highly advanced. It utilizes MongoDB's native geospatial operators:
  ```javascript
  center: {
    $near: {
      $geometry: { type: 'Point', coordinates: [longitude, latitude] },
      $maxDistance: 5000 // 5km
    }
  }
  ```
- **Returns:** An array of nearby zones and an `isSafe` boolean if no high-risk zones overlap.

#### `GET /heatmap/data`
- **Workflow:** Aggregates risk zones specifically for frontend visualization tools (like Leaflet heatmaps). Normalizes the data by calculating `intensity = (incident_count / 10) * 100`.

#### `POST /:id/calculate-risk`
- **Purpose:** Dynamically calculates an "Effective Risk" score for a zone based on external environmental factors (Time and Weather).
- **Algorithm:** 
  1. Base risk mapped to integers (Low=1, Critical=4).
  2. Applies `weather_multiplier` (e.g., 1.5x during rain) if weather param is passed.
  3. Applies `peak_hours.multiplier` if the current hour falls within the defined peak hours (handling overnight wraps like 18:00 to 06:00 properly via OR/AND logic).
  4. Bounds the final score using `Math.min(4, ...)` and maps it back to a string severity.

#### `PATCH /:id/update-weather` & `PATCH /:id/update-peak-hours`
- **Security:** Admin only.
- **Workflow:** Allows admins to tune the dynamic modifiers for the predictive risk engine.

### Developer Notes
- The spatial queries rely entirely on the 2dsphere index defined in the `RiskZone` schema. If this index is dropped, the `/check-location` endpoint will fail catastrophically.
- The use of longitude first `[longitude, latitude]` in the `$geometry` object is correct per GeoJSON specifications, even though the rest of the application typically uses lat/lng ordering.
