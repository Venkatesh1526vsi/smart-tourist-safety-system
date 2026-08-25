# 🛡️ SafeYatra — Smart Tourist Safety System

SafeYatra is a full-stack tourist safety platform designed to help travelers monitor their surroundings, report safety incidents, identify risk zones, access emergency assistance, and receive contextual safety information through a centralized web application.

The platform combines a React and TypeScript frontend, Node.js and Express backend, MongoDB database, real-time Socket.IO communication, and a separate FastAPI-based AI service for safety risk assessment and incident classification.

---

## 📸 Application Preview

SafeYatra provides dedicated interfaces for tourists and administrators, covering safety monitoring, incident reporting, mapping, route planning, emergency assistance, live tourist tracking, and analytics.

### 🌐 Landing Page

![SafeYatra Landing Page](docs/screenshots/Safeyatra%20langing%20page.png)

### 👤 Tourist Dashboard

![SafeYatra Tourist Dashboard](docs/screenshots/Safeyatra%20dashboard%20%282%29.png)

### 🗺️ Safety Map

![SafeYatra Safety Map](docs/screenshots/Safeyatra%20map%20page.png)

### 🧭 Route Planning

![SafeYatra Route Planning](docs/screenshots/Safteyatra%20Route%20mapping.png)

### 🚨 Incident Reporting

![SafeYatra Incident Reporting](docs/screenshots/Safeyatra%20incident%20reporting.png)

### 🛡️ Admin Control Center

![SafeYatra Admin Dashboard](docs/screenshots/Safeyatra%20admin%20dashboard.png)

### 📍 Live Tourist Tracking

![SafeYatra Live Tourist Tracking](docs/screenshots/Safeyatra%20user%20tracking%20page.png)

### 📊 Analytics Dashboard

![SafeYatra Analytics Dashboard](docs/screenshots/Safeyatra%20Analytics%20page.png)

---

## 🚀 Features

### 👤 Authentication & User Management

- User registration and login
- JWT-based authentication
- Protected application routes
- Role-based user and administrator access
- User profile management
- Notification preferences

### 🚨 Incident Reporting

- Report safety incidents with location information
- Incident category and severity selection
- Evidence and image upload support
- Emergency and escalated incident reporting
- Incident history and status tracking
- Administrative incident management

### 🗺️ Safety Maps & Risk Zones

- Interactive maps using Leaflet
- Tourist location visualization
- Reported incident visualization
- Risk-zone identification
- Safety score information
- Route safety analysis
- Fastest, balanced, and safest route options

### 📍 Live Tourist Tracking

- GPS-based location updates
- Real-time communication using Socket.IO
- Active tourist monitoring
- Tourist safety status
- Current coordinates and travel status
- Recent safety alerts and operational activity

### 🆘 Emergency & Safety Assistance

- Emergency SOS functionality
- Nearby emergency contacts
- Police, hospital, and fire/rescue information
- Emergency status monitoring
- Safety recommendations
- Context-aware travel advisories

### 📊 Administrator Dashboard

- Centralized safety operations dashboard
- Incident monitoring and management
- Registered user statistics
- Critical case monitoring
- Live tourist tracking
- Broadcast functionality
- Analytics and safety metrics

### 🤖 AI Safety Services

SafeYatra includes a dedicated FastAPI-based AI service providing:

- Location-based risk assessment
- Risk score calculation
- Risk-level classification
- Historical incident analysis
- Time-based safety factors
- Incident category classification
- Confidence estimation
- Safety recommendations

### 🌦️ Contextual Safety Information

- Local weather information
- Weather risk information
- Safety alerts
- Emergency information
- Travel safety recommendations
- Route-level safety insights

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Leaflet
- Leaflet
- Recharts
- Framer Motion
- Lucide React
- Socket.IO Client
- PWA Support

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Bcrypt
- Socket.IO
- Multer
- Winston
- Express Rate Limit
- Dotenv

### AI Service

- Python
- FastAPI
- Uvicorn
- Pydantic
- Scikit-learn
- Pandas
- NumPy

### Development & Deployment

- Git
- GitHub
- Docker
- Docker Compose
- Vercel
- Render

---

## 📁 Project Structure

```text
smart-tourist-safety-system/
│
├── frontend-new/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       ├── types/
│       └── utils/
│
├── backend-api/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── config.js
│   └── index.js
│
├── ai-services/
│   ├── app.py
│   ├── requirements.txt
│   └── test_ai.py
│
├── docker/
│   └── docker-compose.yml
│
├── scripts/
│
├── docs/
│   ├── architecture/
│   ├── reference/
│   ├── setup/
│   └── screenshots/
│
├── PROJECT_KNOWLEDGE_BASE/
│
├── .gitignore
└── README.md
```
