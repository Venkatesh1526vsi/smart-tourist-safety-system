# Backend Root & Configuration

This document covers the implementation-level details of the core backend initialization files, specifically `index.js`, `config.js`, and environment variables.

---

## 1. Environment Configuration (`backend-api/config.js` & `.env`)

### Purpose
To load and centralize environment-specific variables, keeping sensitive credentials (like database URIs and API keys) out of the source code.

### Location
`backend-api/config.js`, `backend-api/.env.example`

### Implementation Details
`config.js` utilizes the `dotenv` package (`require('dotenv').config()`) to load variables from a local `.env` file into `process.env`. It then exports these constants:
- `PORT`: The port the Express server will listen on (defaults to `5000` if not provided).
- `MONGO_URI`: The connection string for the MongoDB instance.
- `JWT_SECRET`: The cryptographic key used to sign and verify JSON Web Tokens.
- `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN`: Credentials for the Twilio SMS integration.

### Developer Notes
Centralizing these in `config.js` ensures that if an environment variable's name changes, it only needs to be updated in one place rather than throughout the entire application.

---

## 2. Server Entry Point (`backend-api/index.js`)

### Purpose
This is the heart of the backend application. It initializes the Express server, connects to the database, configures global middleware (CORS, body parsing, security, rate limiting), sets up WebSocket connections, mounts routes, and handles global errors.

### Location
`backend-api/index.js`

### Imports & Dependencies
- **Core:** `express`, `http`, `path`, `fs`
- **Security & Config:** `./config`, `cors`, `bcrypt`, `jsonwebtoken`, `express-rate-limit`
- **Database:** `mongoose`
- **Uploads:** `multer`
- **Models:** `User`, `Location`, `Incident`, `Notification`
- **Routes:** `riskZonesRouter`, `incidentsRouter`, `profilesRouter`, `advancedRouter`, `adminRouter`
- **Custom Utils:** `WebSocketServer`, `ResponseHandler`, `globalErrorHandler`, `notFoundHandler`

### Initialization Workflow
1. **Environment Checks:** The app immediately exits with `process.exit(1)` if `MONGO_URI` or `JWT_SECRET` are missing. This fail-fast approach prevents the app from running in a broken state.
2. **Directory Setup:** Synchronously checks for and creates `uploads/incident-images` if it doesn't exist, preventing file upload crashes.
3. **Server & WebSocket Creation:** Instantiates `express()`, wraps it in `http.createServer(app)`, and initializes a custom `WebSocketServer`. The WebSocket instance is attached to the Express app via `app.set('webSocketServer', websocketServer)` so routes can broadcast events.
4. **Database Connection:** Connects to MongoDB via `mongoose.connect()`. Upon successful connection, it executes database seed scripts (`seedRiskZones`, `seedIncidents`, `seedProfiles`) to ensure default data is present.

### Middleware Implementation

#### Security Middleware
- **Password Strength (`validatePasswordStrength`):** Custom middleware using Regex `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*?]{8,}$/` to enforce 8+ chars, 1 uppercase, 1 lowercase, 1 number.
- **Input Sanitization (`sanitizeInput`):** Custom middleware that recursively strips `<script>` tags from incoming string payloads in `req.body` to prevent XSS.
- **Security Headers:** Manually sets `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, and `Strict-Transport-Security`.
- **CORS:** Configured to allow `localhost:3000`, `localhost:3001`, and `vercel.app` domains.

#### Rate Limiting
Utilizes `express-rate-limit` with three distinct profiles:
- `generalLimiter`: 100 requests / 15 minutes (applied to `/api/`).
- `authLimiter`: 20 requests / 15 minutes (applied to `/api/login` and `/api/register`).
- `incidentLimiter`: 20 requests / 1 hour (applied to `/incident/report` to prevent spamming the emergency system).

### API Route Definitions (In-File)

While most routes are delegated to routers, several core endpoints are defined directly in `index.js`:

#### 1. System Health (`GET /health`)
- **Workflow:** Pings the MongoDB admin interface, counts users/incidents/locations, checks WebSocket status, and calculates response time.
- **Output:** Returns a detailed system health JSON object.

#### 2. Authentication (`POST /api/register`, `POST /api/login`)
- **Workflow (Register):** Validates input, checks for existing email, hashes password with `bcrypt` (10 rounds). 
- **Role Assignment:** If the email ends in `@safeyatra.in`, it automatically assigns the `admin` role; otherwise, `tourist`.
- **Workflow (Login):** Includes custom brute-force protection using an in-memory `Map` to track failed login attempts per IP. Blocks IPs with >= 5 failed attempts. On success, signs and returns a JWT valid for 2 hours.

#### 3. Incident Reporting (`POST /incident/report`)
- **Upload Integration:** Uses `multer` configured for a 5MB limit and image-only MIME types.
- **Workflow:** Validates coordinates. If no coordinates are provided in the payload, it fetches the user's last known location from the `Location` collection. Saves the incident and broadcasts a WebSocket event (`incident:reported`) to the `incidents_room`.

#### 4. Analytics & Risk Assessment (`GET /analytics/...`, `GET /risk-assessment/...`)
- **Workflow:** Extensive use of MongoDB Aggregation Pipelines (`$group`, `$match`, `$project`) to calculate incident trends, severity distributions, and user activity.
- **Predictive Algorithm:** Analyzes incidents grouped by geographic bounding boxes (lat/lng multiplied by 1000) and temporal patterns to predict high-risk areas. Incorporates a time-decay factor (older incidents weigh less) and a severity multiplier (critical=5x, high=3x).

#### 5. External API Proxies
- `GET /api/external/weather`: Proxies requests to OpenWeatherMap for Pune coordinates to prevent exposing the API key to the frontend. Returns mock data if no key is configured.
- `GET /api/external/news`: Proxies requests to GNews API searching for "Pune safety/accident/emergency". Deduplicates articles by title.

### Global Error Handling
The file ends by mounting the `notFoundHandler` and `globalErrorHandler` to catch untrapped promise rejections and invalid routes.

### Common Errors & Developer Notes
- **Brute Force Map Reset:** The `failedLoginAttempts` map is stored in memory. It resets when the Node server restarts. *Future Enhancement:* Move this to Redis for distributed, persistent tracking.
- **Multer Memory Limits:** Ensure the server hosting the API has sufficient RAM or storage, as file uploads write directly to local disk (`uploads/incident-images/`).
- **Domain-based Roles:** The strict `email.endsWith('@safeyatra.in')` logic for admin assignment is clever but requires the organization to own and secure that domain to prevent unauthorized admin access.
