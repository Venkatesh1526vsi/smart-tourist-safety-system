# 🛡️ Smart Tourist Safety System

A full-stack tourist safety platform designed to help travelers monitor their surroundings, report incidents, visualize risk zones, and access safety information through a centralized web application.

The system combines a React + TypeScript frontend, Node.js/Express backend, MongoDB, real-time communication, and a FastAPI-based AI service for risk assessment and incident classification.

---

## 🚀 Key Features

### 👤 Authentication & User Management
- User registration and login
- JWT-based authentication
- Protected user and administrator routes
- User profile and notification preferences
- Role-based admin access

### 🚨 Incident Reporting
- Report safety incidents with location details
- Incident categorization and severity information
- Evidence/image upload support
- Incident management for administrators
- Incident history and status tracking

### 🗺️ Risk Zones & Maps
- Interactive maps using Leaflet
- Visualization of reported incidents and risk zones
- Location-based safety information
- Tourist location tracking
- Risk-zone visualization based on incident data

### 📍 Live Tourist Tracking
- GPS-based location updates
- Real-time communication using Socket.IO
- Active tourist monitoring for administrators
- Live tracking interface for safety monitoring

### 🆘 Emergency & Safety Features
- Emergency SOS functionality
- Safety status monitoring
- Nearby emergency information
- Safety recommendations and travel tips
- Route safety suggestions

### 📊 Admin Dashboard
- Monitor registered users
- Manage reported incidents
- View safety statistics and analytics
- Monitor active tourists
- Review risk zones
- Manage emergency-related information

### 🤖 AI Safety Services
The project includes a separate FastAPI service providing:

- Location-based risk assessment
- Risk score and risk-level calculation
- Historical incident proximity analysis
- Time-based safety factors
- Incident category classification
- Confidence estimation and safety recommendations

### 🌦️ Safety Information
The application also provides additional contextual information such as:

- Local weather information
- Safety-related news
- Emergency contacts
- Travel safety recommendations

---

## 🏗️ System Architecture

```text
┌──────────────────────────────┐
│        React Frontend        │
│     TypeScript + Vite        │
│                              │
│  Dashboards • Maps • SOS     │
│  Incidents • Tracking        │
└──────────────┬───────────────┘
               │ REST API
               │ WebSocket
               ▼
┌──────────────────────────────┐
│     Node.js + Express API    │
│                              │
│ Authentication • Incidents   │
│ Users • Profiles • Analytics │
│ Location • Admin Operations  │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐   ┌──────────────────┐
│   MongoDB   │   │  FastAPI AI      │
│             │   │     Service      │
│ Users       │   │ Risk Assessment  │
│ Incidents   │   │ Classification   │
│ Profiles    │   │ Safety Analysis  │
└─────────────┘   └──────────────────┘

## 🛠️ Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Leaflet / Leaflet
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
- JWT
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


## 📁 Project Structure

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

## ⚙️ Installation

### Prerequisites

Make sure the following are installed:

- Node.js and npm
- Python 3
- MongoDB or Docker
- Git

### 1. Clone the Repository

    git clone https://github.com/Venkatesh1526vsi/smart-tourist-safety-system.git
    cd smart-tourist-safety-system

### 2. Install Backend Dependencies

    cd backend-api
    npm install

### 3. Configure Backend Environment

Create:

    backend-api/.env

Use the provided example file as the configuration reference:

    backend-api/.env.example

The backend uses environment variables for configuration such as:

- PORT
- MONGO_URI
- JWT_SECRET
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- ADMIN_EMAILS
- External API keys where applicable

Never commit .env files, database credentials, JWT secrets, API keys, or other sensitive values.

### 4. Install Frontend Dependencies

    cd ../frontend-new
    npm install

### 5. Install AI Service Dependencies

    cd ../ai-services
    pip install -r requirements.txt

---

## ▶️ Running the Application

The application consists of three main services.

### Backend

From backend-api/:

    npm start

Default backend port:

    http://localhost:5000

### Frontend

From frontend-new/:

    npm run dev

Vite will display the local development URL in the terminal.

### AI Service

From ai-services/:

    python app.py

Default AI service port:

    http://localhost:8000

For local development, run the backend, frontend, and AI service in separate terminals.

---

## 🐳 Docker

The repository also contains Docker Compose configuration for running the multi-service environment.

Configuration:

    docker/docker-compose.yml

The Compose setup defines containers for:

- MongoDB
- Backend API
- AI service
- frontend-new

To start the configured Docker environment:

    cd docker
    docker compose up --build

> Note: The current Docker Compose configuration should be reviewed before use because some of its paths still reference the older frontend directory rather than frontend-new.

---

## 🧪 Testing & Code Quality

### Frontend

The frontend uses TypeScript and ESLint.

Build the frontend:

    cd frontend-new
    npm run build

Run linting:

    npm run lint

### Backend

The backend currently contains manual/API-oriented test scripts. Its package.json does not currently define an automated test suite.

### AI Service

A service-level test script is available at:

    ai-services/test_ai.py

It exercises the AI service endpoints when the FastAPI server is running.

---

## 🔐 Security

Sensitive configuration must remain outside version control.

The repository excludes environment files and generated/local data through .gitignore.

Never commit:

- MongoDB connection strings
- JWT secrets
- API keys
- Passwords
- Authentication tokens
- Email credentials
- Third-party service credentials

Use .env.example files containing only placeholder configuration.

---

## 📸 Screenshots

The project includes a dedicated screenshots directory:

    docs/screenshots/

Recommended README screenshots include:

- Landing page
- User dashboard
- Incident reporting
- Risk zone map
- Admin dashboard
- Live tourist tracking
- Emergency SOS
- Analytics

Screenshots should focus on the strongest and most representative parts of the application without unnecessarily duplicating similar screens.

---

## 📚 Documentation

Additional technical documentation is available under:

    docs/

It includes:

- Architecture documentation
- Setup and deployment guides
- Troubleshooting references
- Quick references

A detailed internal project knowledge base is also maintained under:

    PROJECT_KNOWLEDGE_BASE/

---

## 📊 Project Status

The current application includes:

- User and administrator authentication
- Incident reporting and management
- Interactive risk-zone mapping
- Tourist location tracking
- Real-time Socket.IO communication
- Emergency SOS functionality
- Safety dashboards
- Incident analytics
- AI-based risk assessment
- Incident classification
- Weather and safety information
- PWA support
- Docker configuration
- Separate frontend, backend, and AI services

The project can be further improved with stronger automated testing, production monitoring, deployment consistency, and expanded safety intelligence.

---

## 🔮 Future Improvements

- Expand automated frontend and backend test coverage
- Improve AI risk prediction using larger real-world datasets
- Improve real-time tracking reliability and scalability
- Add stronger production monitoring and observability
- Improve notification and emergency communication workflows
- Enhance route-level safety analysis
- Improve deployment configuration consistency
- Add comprehensive API documentation
- Improve production security and environment validation

---

## 👨‍💻 Author

**Venkatesh Inamdar**

GitHub: https://github.com/Venkatesh1526vsi

Project Repository: https://github.com/Venkatesh1526vsi/smart-tourist-safety-system