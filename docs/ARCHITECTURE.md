# System Architecture & Data Flow

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      USERS / TOURISTS                          │
└──────────┬──────────────────────────────────────────┬───────────┘
           │                                          │
     ┌─────▼──────┐                            ┌──────▼─────┐
     │  Web App   │                            │ Mobile App │
     │  React.js  │                            │React Native│
     │ :3000      │                            │   /Expo    │
     └─────┬──────┘                            └──────┬─────┘
           │                                          │
           │        HTTP/HTTPS (REST API)            │
           └──────────────────┬─────────────────────┘
                              │
                    ┌─────────▼────────────┐
                    │   BACKEND API        │
                    │  Node.js/Express     │
                    │  :5000               │
                    │                      │
                    │ ✅ Authentication    │
                    │ ✅ Location Mgmt     │
                    │ ✅ Incidents         │
                    │ ✅ Notifications     │
                    │ ✅ Admin Routes      │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────▼─────┐ ┌─────▼──────┐ ┌────▼────────┐
         │  MongoDB   │ │ AI Engine  │ │ Email/SMS   │
         │ Database   │ │ FastAPI    │ │ Services    │
         │ :27017     │ │ :8000      │ │ (External)  │
         │            │ │            │ │             │
         │ • Users    │ │ • Classify │ │ • Nodemailer│
         │ • Incidents│ │ • Predict  │ │ • Twilio    │
         │ • Locations│ │ • Analyze  │ │             │
         │ • Zones    │ │            │ │             │
         │ • Notifs   │ │            │ │             │
         └────────────┘ └────────────┘ └─────────────┘
```

---

## 🔄 Authentication Flow

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │
       │ 1. Register/Login
       ▼
┌──────────────────────────┐
│  Frontend (React)        │
│ apiPost('/api/login')    │
└──────┬───────────────────┘
       │
       │ 2. POST /api/login
       │    {email, password}
       ▼
┌──────────────────────────┐
│  Backend API             │
│ POST /api/login          │
└──────┬───────────────────┘
       │
       │ 3. Validate credentials
       │    Compare password hash
       ▼
┌──────────────────────────┐
│  MongoDB                 │
│ users.findOne({email})   │
└──────┬───────────────────┘
       │
       │ 4. User found, password matches
       ▼
┌──────────────────────────┐
│  Backend API             │
│ jwt.sign(userId, secret) │
└──────┬───────────────────┘
       │
       │ 5. Return token
       │    {token: "jwt..."}
       ▼
┌──────────────────────────┐
│  Frontend (React)        │
│ localStorage.setItem     │
│   ('token', jwt)         │
└──────┬───────────────────┘
       │
       │ 6. All future requests
       │    include Authorization header
       │    Authorization: Bearer jwt...
       ▼
┌──────────────────────────┐
│  Protected Routes        │
│ authenticateToken        │
│ jwt.verify(token)        │
└──────┬───────────────────┘
       │
   ✅ Success
       │
       ▼
   Access Granted
```

---

## 📍 Location Update Flow

```
┌──────────────────┐
│  Mobile/Web App  │
│  Geolocation API │
└────────┬─────────┘
         │
    navigator.geolocation
    .getCurrentPosition()
         │
    ┌────▼──────────────┐
    │ User's Browser    │
    │ Gets GPS coords   │
    │ lat: 20.5, lon: 78 │
    └────┬──────────────┘
         │
    ┌────▼────────────────────┐
    │ Frontend (React)        │
    │ apiPost(               │
    │  '/location/update',   │
    │  {lat, lon},           │
    │  {Authorization: token}│
    │ )                      │
    └────┬───────────────────┘
         │
    HTTP POST with token
         │
    ┌────▼──────────────────────┐
    │ Backend API               │
    │ POST /location/update      │
    │ authenticateToken          │
    │ req.user.userId = userId  │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────┐
    │ MongoDB           │
    │ Location.create   │
    │ {                 │
    │   userId,         │
    │   latitude,       │
    │   longitude,      │
    │   timestamp       │
    │ }                 │
    └────┬──────────────┘
         │
    ✅ Location Stored
         │
    ┌────▼──────────────────┐
    │ Frontend              │
    │ Display on map        │
    │ Update user location  │
    │ marker                │
    └──────────────────────┘
```

---

## 🚨 Incident Reporting Flow

```
┌──────────────┐
│  User        │
│  Presses     │
│  "Report     │
│   Incident"  │
└────┬─────────┘
     │
     ▼
┌──────────────────────────┐
│  Frontend - Form Modal   │
│  • Type (theft, etc)     │
│  • Description           │
│  • Current location auto │
└────┬─────────────────────┘
     │
     │ 1. Collect location
     ├─ navigator.geolocation
     │  OR fallback to last known
     │
     │ 2. Submit form
     ├─ apiPost('/incident/report')
     │  {
     │    type, description,
     │    latitude, longitude
     │  }
     │
     ▼
┌──────────────────────────────┐
│  Backend API                 │
│  POST /incident/report       │
│  authenticateToken           │
│  req.user.userId = userId   │
└────┬─────────────────────────┘
     │
     │ 1. Validate input
     ├─ Check type, description
     │  Check coordinates
     │
     │ 2. Save to database
     ├─ Incident.create({
     │    userId, type, desc,
     │    lat, lon, status: 'open'
     │  })
     │
     │ 3. Find admin users
     ├─ User.find({role: 'admin'})
     │
     │ 4. Send notifications
     ├─ Email (Nodemailer)
     │ ├─ SUBJECT: "Incident Reported"
     │ ├─ FROM: process.env.EMAIL_USER
     │ ├─ TO: admin@example.com
     │ └─ TEXT: incident details
     │
     ├─ SMS (Twilio)
     │ ├─ TO: admin.phone
     │ ├─ FROM: TWILIO_PHONE
     │ └─ BODY: incident summary
     │
     │ 5. Create notification records
     ├─ Notification.create({
     │    recipientId: adminId,
     │    type: 'incident',
     │    message: ...,
     │    read: false
     │  })
     │
     ▼
┌──────────────────────────┐
│  Frontend                │
│  Show success message    │
│  Refresh incidents list  │
└──────────────────────────┘

│
│ Meanwhile...
▼
┌──────────────────────────┐
│  Admin User              │
│ Gets:                   │
│ • Email notification     │
│ • SMS alert (if enabled) │
│ • App notification       │
└──────────────────────────┘
     │
     │ Admin logs in and goes to
     │ /admin panel
     │
     ▼
┌──────────────────────────────┐
│  Admin Dashboard             │
│  GET /admin/incidents        │
│  Shows all reported incidents │
│  Can update status:          │
│  • open                       │
│  • in_progress                │
│  • resolved                   │
│  • closed                     │
└──────────────────────────────┘
```

---

## 🗂️ Database Schema

```
MongoDB Collections:

┌─────────────────────────────────────────┐
│ users                                   │
├─────────────────────────────────────────┤
│ _id: ObjectId                           │
│ name: String                            │
│ email: String (unique)                  │
│ password: String (hashed)               │
│ phone: String (optional)                │
│ role: String (user|admin)               │
│ createdAt: Date                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ locations                               │
├─────────────────────────────────────────┤
│ _id: ObjectId                           │
│ userId: ObjectId (ref: users)           │
│ latitude: Number                        │
│ longitude: Number                       │
│ timestamp: Date                         │
│ accuracy: Number                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ incidents                               │
├─────────────────────────────────────────┤
│ _id: ObjectId                           │
│ userId: ObjectId (ref: users)           │
│ type: String                            │
│ description: String                     │
│ latitude: Number                        │
│ longitude: Number                       │
│ status: String (open|in_progress|...)  │
│ timestamp: Date                         │
│ resolvedAt: Date (optional)             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ riskzones                               │
├─────────────────────────────────────────┤
│ _id: ObjectId                           │
│ name: String                            │
│ description: String                     │
│ latitude: Number                        │
│ longitude: Number                       │
│ radius: Number                          │
│ riskLevel: String (low|med|high)        │
│ color: String (#hexcolor)               │
│ createdAt: Date                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ notifications                           │
├─────────────────────────────────────────┤
│ _id: ObjectId                           │
│ recipientId: ObjectId (ref: users)      │
│ incidentId: ObjectId (optional)         │
│ type: String (incident|alert|...)      │
│ message: String                         │
│ read: Boolean                           │
│ timestamp: Date                         │
└─────────────────────────────────────────┘
```

---

## 🔌 API Request/Response Examples

### Register User
```
REQUEST:
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

RESPONSE (201):
{
  "message": "User registered successfully!",
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Login User
```
REQUEST:
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

RESPONSE (200):
{
  "message": "Login successful!",
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Report Incident (Protected)
```
REQUEST:
POST /incident/report
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "type": "theft",
  "description": "Bag stolen at market",
  "latitude": 20.5937,
  "longitude": 78.9629
}

RESPONSE (201):
{
  "message": "Incident reported successfully!",
  "incident": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "userId": "...",
    "type": "theft",
    "description": "Bag stolen at market",
    "latitude": 20.5937,
    "longitude": 78.9629,
    "status": "open",
    "timestamp": "2026-02-07T10:30:00.000Z"
  }
}
```

### Get Risk Zones (Public)
```
REQUEST:
GET /api/risk-zones

RESPONSE (200):
[
  {
    "_id": "...",
    "name": "Market District",
    "latitude": 20.5937,
    "longitude": 78.9629,
    "radius": 500,
    "riskLevel": "high",
    "color": "#ff0000"
  },
  {
    "_id": "...",
    "name": "Airport Road",
    "latitude": 20.5890,
    "longitude": 78.9700,
    "radius": 1000,
    "riskLevel": "medium",
    "color": "#ffaa00"
  }
]
```

---

## 🔐 Security Architecture

```
┌──────────────────────────────────────────────────┐
│         REQUEST VALIDATION LAYER                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. Input Validation                             │
│     └─ Check email format, password length       │
│                                                  │
│  2. Authentication Middleware                    │
│     └─ authenticateToken()                       │
│        ├─ Extract token from header              │
│        ├─ Verify JWT signature                   │
│        └─ Add user to req.user                   │
│                                                  │
│  3. Authorization Middleware                     │
│     └─ isAdmin()                                 │
│        ├─ Check user.role === 'admin'            │
│        └─ Deny if not admin                      │
│                                                  │
└──────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│         DATA LAYER                               │
├──────────────────────────────────────────────────┤
│                                                  │
│  • Passwords hashed with bcrypt (10 rounds)      │
│  • Sensitive fields excluded from queries        │
│  • MongoDB connection with validation            │
│  • Error messages don't expose internals         │
│                                                  │
└──────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│         RESPONSE LAYER                           │
├──────────────────────────────────────────────────┤
│                                                  │
│  • CORS headers configured                       │
│  • No sensitive data in responses                │
│  • HTTP-only cookies (if used)                   │
│  • Security headers set                          │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 🐳 Docker Container Architecture

```
Host Machine (Port Mapping)
┌─────────────────────────────────────────┐
│                                         │
│  :27017 ─────┐                         │
│  :5000  ─────┤                         │
│  :3000  ─────┤                         │
│  :8000  ─────┤                         │
│              │                         │
│        Docker Bridge Network           │
│        "tourist-network"               │
│              │                         │
│              ▼                         │
│        ┌─────────────────┐             │
│        │ Docker Engine   │             │
│        └─────────────────┘             │
│              │                         │
│    ┌─────────┼─────────┬──────────┐   │
│    │         │         │          │   │
│    ▼         ▼         ▼          ▼   │
│  ┌───┐   ┌───────┐  ┌────┐   ┌──────┐ │
│  │   │   │       │  │    │   │      │ │
│  │M  │   │Backend│  │ AI │   │Front-│ │
│  │o  │   │       │  │    │   │ end  │ │
│  │n  │   │Node.js│  │Py  │   │React │ │
│  │g  │   │Express│  │API │   │Nginx │ │
│  │o  │   │       │  │    │   │      │ │
│  │   │   │       │  │    │   │      │ │
│  │7  │   │5000   │  │8000│   │80    │ │
│  │   │   │       │  │    │   │      │ │
│  └───┘   └───────┘  └────┘   └──────┘ │
│   27017                               │
│                                       │
└─────────────────────────────────────────┘

Service Dependencies:
  MongoDB ──── Health Check
       │
       └────> Backend API ──── Health Check
                   │
                   └────> AI Services
                   │
                   └────> Frontend
```

---

## 📊 Data Flow Sequence

```
Sequence: User Registration → Login → Report Incident → View in Admin

Time ─────────────────────────────────────────────────────────────────>

1. Register
   User ──POST /api/register──> Backend ──save──> MongoDB
                                                   ✅ User created

2. Login
   User ──POST /api/login──> Backend ──find──> MongoDB
                                ✅ User found
                                ✅ JWT created
             <──{token}────────────
            (stored in localStorage)

3. Update Location
   User ──POST /location/update──> Backend ──Authorization check✅
        (with token header)             ✅ Valid token
                                        └──save──> MongoDB
                                                   ✅ Location recorded

4. Report Incident
   User ──POST /incident/report──> Backend ──Authorization check✅
        (with token header)            ✅ Valid token
                                       ├──save──> MongoDB
                                       │          ✅ Incident created
                                       │
                                       ├──notify─> Admins (Email)
                                       │          (Nodemailer)
                                       │
                                       ├──notify─> Admins (SMS)
                                       │          (Twilio)
                                       │
                                       └──create─> Notifications
                                                   (Database)

5. Admin Views Incidents
   Admin ──GET /admin/incidents──> Backend ──isAdmin check✅
         (with token header)          ✅ Admin verified
                                      └──fetch──> MongoDB
                                                  ✅ All incidents
         <──[incident array]────────────────

6. Admin Updates Status
   Admin ──PATCH /admin/incidents/:id──> Backend ──update──> MongoDB
         (with token header)                      ✅ Status changed
```

---

## 🔌 Environment Configuration

```
├─ Backend Configuration
│  ├─ MONGO_URI: Points to MongoDB
│  ├─ JWT_SECRET: Signs JWT tokens
│  ├─ EMAIL_USER: Sender email address
│  ├─ EMAIL_PASS: Email app password
│  ├─ TWILIO_*: SMS service credentials
│  └─ ADMIN_EMAILS: Who gets notifications
│
├─ Frontend Configuration
│  ├─ REACT_APP_API_URL: Backend endpoint
│  ├─ REACT_APP_AI_URL: AI services endpoint
│  └─ Feature flags
│
└─ AI Configuration
   ├─ BACKEND_URL: Backend API address
   └─ Model paths
```

---

## ✅ This Architecture Enables:

- ✅ Scalable microservices
- ✅ Easy horizontal scaling (multiple backend instances)
- ✅ Clean separation of concerns
- ✅ Independent service deployment
- ✅ Load balancing ready
- ✅ Fault isolation
- ✅ Comprehensive logging
- ✅ Health monitoring
- ✅ Backup & restore procedures

---

**For more details, see individual documentation files.**
