# 🛡️ SafeYatra — Smart Tourist Safety System

SafeYatra is a full-stack tourist safety platform designed to help travelers monitor their surroundings, report incidents, and access safety information. It features a centralized web application with incident reporting, risk-zone visualization, emergency assistance, live tourist tracking, and AI-based safety analysis.

## 📸 Application Preview

### 🌐 Landing Page
![Landing Page](docs/screenshots/Safeyatra%20langing%20page.png)

### 👤 Tourist Dashboard
![Tourist Dashboard](docs/screenshots/Safeyatra%20dashboard%20%282%29.png)

### 🗺️ Safety Map
![Safety Map](docs/screenshots/Safeyatra%20map%20page.png)

### 🧭 Route Planning
![Route Planning](docs/screenshots/Safteyatra%20Route%20mapping.png)

### 🚨 Incident Reporting
![Incident Reporting](docs/screenshots/Safeyatra%20incident%20reporting.png)

### 🛡️ Admin Control Center
![Admin Control Center](docs/screenshots/Safeyatra%20admin%20dashboard.png)

### 📍 Live Tourist Tracking
![Live Tourist Tracking](docs/screenshots/Safeyatra%20user%20tracking%20page.png)

### 📊 Analytics Dashboard
![Analytics Dashboard](docs/screenshots/Safeyatra%20Analytics%20page.png)

## 🚀 Features

### Authentication & User Management
- User registration and login with JWT-based authentication
- Protected user and administrator routes
- User profile and notification preferences
- Role-based admin access

### Incident Reporting
- Report safety incidents with location details
- Incident categorization and severity information
- Evidence and image upload support
- Incident management for administrators
- Incident history and status tracking

### Safety Maps & Risk Zones
- Interactive maps using Leaflet
- Visualization of reported incidents and risk zones
- Location-based safety information
- Risk-zone visualization based on incident data

### Live Tourist Tracking
- GPS-based location updates
- Real-time communication using Socket.IO
- Active tourist monitoring for administrators
- Live tracking interface for safety monitoring

### Emergency & Safety Assistance
- Emergency SOS functionality
- Safety status monitoring
- Nearby emergency information
- Safety recommendations and travel tips
- Route safety suggestions

### Administrator Dashboard
- Monitor registered users
- Manage reported incidents
- View safety statistics and analytics
- Monitor active tourists
- Review risk zones
- Manage emergency-related information

### AI Safety Services
- Location-based risk assessment
- Risk score and risk-level calculation
- Historical incident proximity analysis
- Time-based safety factors
- Incident category classification
- Confidence estimation and safety recommendations

### Contextual Safety Information
- Local weather information
- Safety-related news
- Emergency contacts
- Travel safety recommendations

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

```text
smart-tourist-safety-system/
├── frontend-new/                 
│   ├── public/
│   └── src/
├── backend-api/                 
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
├── ai-services/                 
│   ├── app.py
│   ├── requirements.txt
│   └── test_ai.py
├── docker/                      
│   └── docker-compose.yml
├── scripts/                     
├── docs/                        
│   └── screenshots/
├── PROJECT_KNOWLEDGE_BASE/      
├── .gitignore
└── README.md
```

## ⚙️ Installation

### Prerequisites
- Node.js and npm
- Python 3
- MongoDB or Docker
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Venkatesh1526vsi/smart-tourist-safety-system.git
cd smart-tourist-safety-system
```

### 2. Install Backend Dependencies
```bash
cd backend-api
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend-new
npm install
```

### 4. Install AI Service Dependencies
```bash
cd ../ai-services
pip install -r requirements.txt
```

## 🔐 Environment Variables

The backend uses environment variables for configuration. Create a `.env` file in `backend-api/` using `.env.example` as a reference.

Sensitive configuration must remain outside version control. Never commit `.env` files, database credentials, JWT secrets, API keys, or other sensitive values to the repository.

## ▶️ Running the Application

### Backend
From `backend-api/`:
```bash
npm start
```
Runs by default on `http://localhost:5000`.

### Frontend
From `frontend-new/`:
```bash
npm run dev
```
Vite will display the local development URL.

### AI Service
From `ai-services/`:
```bash
python app.py
```
Runs by default on `http://localhost:8000`.

## 🧪 Testing & Code Quality

### Frontend
Build the frontend:
```bash
cd frontend-new
npm run build
```
Run linting:
```bash
npm run lint
```

### AI Service
Run the service-level test script:
```bash
python ai-services/test_ai.py
```

## 🐳 Docker

The repository includes a Docker Compose configuration (`docker/docker-compose.yml`) for running the multi-service environment (MongoDB, Backend API, AI service, Frontend).

To start the configured Docker environment:
```bash
cd docker
docker compose up --build
```

Note: The current Docker Compose configuration should be reviewed before use as some paths may reference an older frontend directory instead of `frontend-new`.

## 📚 Documentation

Additional technical documentation is available under `docs/`. A detailed internal project knowledge base is maintained under `PROJECT_KNOWLEDGE_BASE/`.

## 📊 Project Status

The current application supports user and administrator authentication, incident reporting, interactive risk-zone mapping, tourist tracking, real-time communication, emergency SOS, analytics, and AI-based risk assessment. The project is split into separate frontend, backend, and AI services with Docker configuration and PWA support.

## 🔮 Future Improvements

- Expand automated test coverage for frontend and backend
- Improve AI risk prediction with real-world datasets
- Enhance tracking reliability and scalability
- Add stronger production monitoring
- Improve API documentation and deployment consistency

## 👨‍💻 Author

Venkatesh Inamdar

GitHub: https://github.com/Venkatesh1526vsi