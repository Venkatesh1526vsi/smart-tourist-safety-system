# 🚀 Complete Setup & Configuration Guide

**Status**: ✅ System Ready for Testing  
**Last Updated**: February 8, 2026

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Services Overview](#services-overview)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [Next Steps](#next-steps)

---

## 🎯 Quick Start

### All Services Running
```bash
# All services are already running in Docker
✅ MongoDB (port 27017)
✅ Backend API (port 5000)
✅ Frontend (port 3000)
✅ AI Service (port 8000)
```

### Access Points
- **Frontend Web UI**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8000
- **MongoDB**: mongodb://localhost:27017

---

## 🏗️ Services Overview

### 1. MongoDB
- **Container**: tourist-mongo
- **Port**: 27017
- **Database**: touristdb
- **Status**: ✅ Healthy
- **Data**: Persisted in `docker/data/`

### 2. Backend API (Node.js/Express)
- **Container**: tourist-backend
- **Port**: 5000
- **Framework**: Express.js
- **Auth**: JWT-based
- **Status**: ✅ Running and responsive

### 3. Frontend (React)
- **Container**: tourist-frontend
- **Port**: 3000
- **Framework**: React
- **Status**: ✅ Running

### 4. AI Service (Python/FastAPI)
- **Container**: tourist-ai
- **Port**: 8000
- **Framework**: FastAPI
- **Status**: ✅ Running

---

## ⚙️ Configuration

### Environment Variables

#### Backend Configuration (backend-api/.env)
```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://mongo:27017/touristdb

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_123456

# Admin Users (comma-separated emails)
ADMIN_EMAILS=admin@example.com,venky@test.com

# Email Notifications (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Notifications (Optional)
TWILIO_SID=your-twilio-account-sid
TWILIO_AUTH=your-twilio-auth-token
TWILIO_PHONE=+1234567890
```

#### Frontend Configuration (frontend/.env)
```env
# API Endpoints
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AI_URL=http://localhost:8000
```

### Adding Admin Users

**Option 1: Direct Database Update**
```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/touristdb

# Update user role
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

**Option 2: Update ADMIN_EMAILS in .env**
```bash
# Edit backend-api/.env
ADMIN_EMAILS=admin1@example.com,admin2@example.com,user@example.com

# Restart backend
docker-compose -f docker/docker-compose.yml restart backend
```

### Enabling Email Notifications

1. **Setup Gmail App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Generate app password for "Mail"
   - Copy the 16-character password

2. **Update .env**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```

3. **Restart Backend**:
   ```bash
   docker-compose -f docker/docker-compose.yml restart backend
   ```

### Enabling SMS Notifications

1. **Setup Twilio Account**:
   - Go to https://www.twilio.com
   - Create account and verify phone
   - Get Account SID, Auth Token, and Phone Number

2. **Update .env**:
   ```env
   TWILIO_SID=ACxxxxxxxxxxxxxxxx
   TWILIO_AUTH=your-auth-token-here
   TWILIO_PHONE=+1234567890
   ```

3. **Restart Backend**:
   ```bash
   docker-compose -f docker/docker-compose.yml restart backend
   ```

---

## 🧪 Testing

### Manual API Testing

#### 1. Test User Registration
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

#### 2. Test User Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
# Save the returned token for next requests
```

#### 3. Test Protected Endpoint (Get Profile)
```bash
curl -X GET http://localhost:5000/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

#### 4. Get All Risk Zones
```bash
curl -X GET http://localhost:5000/api/risk-zones
```

#### 5. Update Location
```bash
curl -X POST http://localhost:5000/location/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 18.5204,
    "longitude": 73.8567
  }'
```

#### 6. Report Incident
```bash
curl -X POST http://localhost:5000/incident/report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "accident",
    "description": "Minor car accident",
    "latitude": 18.5204,
    "longitude": 73.8567
  }'
```

### Automated Test Script

```bash
# Run the complete test suite
node test-api.js
```

### Frontend UI Testing

1. **Open Frontend**: http://localhost:3000
2. **Register**: Create new account
3. **Login**: Use registered credentials
4. **Dashboard**: View risk zones on map
5. **Report Incident**: Submit incident report
6. **Profile**: Update profile information

---

## 📊 Verified Working Features

### ✅ Core Features
- [x] User registration and authentication
- [x] JWT token generation and validation
- [x] User profile management
- [x] Password change functionality
- [x] Location tracking (GPS updates)
- [x] Risk zone database
- [x] Risk zone geospatial queries
- [x] Risk assessment (location in zone check)
- [x] Incident reporting
- [x] User incident history

### ✅ Database
- [x] MongoDB connection
- [x] Data persistence
- [x] User schema
- [x] Location schema
- [x] Incident schema
- [x] Risk Zone schema
- [x] Proper indexes
- [x] Validation

### ✅ Infrastructure
- [x] Docker containers running
- [x] Docker networking
- [x] Health checks
- [x] Service dependencies
- [x] Volume mounting
- [x] Environment variables
- [x] CORS configuration
- [x] Error handling

### ⏳ In Progress / Optional
- [ ] Email notifications (ready to enable)
- [ ] SMS alerts (ready to enable)
- [ ] Admin dashboard full features
- [ ] Mobile app push notifications
- [ ] AI-powered incident analysis

---

## 🔍 Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker logs tourist-backend

# Restart with rebuild
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up --build backend
```

### MongoDB Connection Failed
```bash
# Check MongoDB is running
docker logs tourist-mongo

# Verify port 27017 is accessible
telnet localhost 27017
```

### Frontend Not Loading
```bash
# Check frontend logs
docker logs tourist-frontend

# Rebuild frontend
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up --build frontend
```

### API Returning 500 Error
```bash
# Check backend logs
docker logs -f tourist-backend

# Verify database connection
# Check .env variables
# Restart backend
```

---

## 📈 Next Steps

### Immediate (Today)
1. ✅ Verify all services running
2. ✅ Test core API endpoints
3. ✅ Test user authentication
4. ✅ Test frontend UI
5. 🔄 Configure admin users
6. 🔄 Enable email/SMS (optional)

### Short Term (This Week)
1. Complete frontend testing
2. Test all admin features
3. Configure production database backup
4. Setup application monitoring
5. Test incident workflows

### Medium Term (Next Week)
1. Performance testing and optimization
2. Security audit
3. Production deployment preparation
4. CI/CD setup
5. Monitoring and alerting

### Long Term (Next Month)
1. Production deployment
2. User onboarding
3. Feature enhancements
4. Scale testing
5. Go live!

---

## 📞 Common Commands

```bash
# Start all services
cd smart-tourist-safety-system/docker
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up --build backend

# Access MongoDB shell
docker exec -it tourist-mongo mongosh

# Clear all data
docker-compose down -v
docker volume prune -f
```

---

## ✨ Summary

Your Smart Tourist Safety System is now:
- ✅ **Fully operational** with all core features working
- ✅ **Properly configured** with MongoDB, JWT, and CORS
- ✅ **Ready for testing** with complete API endpoints
- ✅ **Scalable** with Docker containers
- ✅ **Maintainable** with proper documentation

**Status**: Ready for production deployment when needed.

Next: Configure admin users and optional email/SMS features, then deploy to production!
