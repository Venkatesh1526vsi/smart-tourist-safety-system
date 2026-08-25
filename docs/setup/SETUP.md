# Smart Tourist Safety System - Setup Guide

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Python 3.9+
- MongoDB 5.0+ (local or Docker)
- Docker & Docker Compose (optional, but recommended)

---

## Option 1: Docker Setup (Recommended - Easiest)

### 1. Create environment file
```bash
cp backend-api/.env.example backend-api/.env
# Edit backend-api/.env and fill in your credentials
```

### 2. Start all services
```bash
cd docker
docker-compose up
```

### 3. Access the application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Services**: http://localhost:8000
- **MongoDB**: mongodb://localhost:27017

### Stop services
```bash
docker-compose down
```

---

## Option 2: Local Setup (Manual)

### 1. Setup Environment Files

#### Backend API
```bash
cd backend-api
cp .env.example .env
```

Edit `backend-api/.env`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/touristdb
JWT_SECRET=your_strong_secret_key_here_min_32_chars
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
TWILIO_SID=your_twilio_sid
TWILIO_AUTH=your_twilio_auth_token
TWILIO_PHONE=+1234567890
ADMIN_EMAILS=admin1@example.com,admin2@example.com
NODE_ENV=development
```

#### Frontend
```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AI_URL=http://localhost:8000
```

### 2. Start MongoDB
```bash
# If MongoDB is installed locally
mongod

# Or use Docker
docker run -d -p 27017:27017 --name tourist-mongo mongo:7
```

### 3. Start Backend API (Terminal 1)
```bash
cd backend-api
npm install
npm start
```

Expected output:
```
MongoDB connected
Server running on port 5000
```

### 4. Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm start
```

Expected output:
```
Compiled successfully!
You can now view the app in the browser.
```

### 5. Start AI Services (Terminal 3)
```bash
cd ai-services
pip install -r requirements.txt
python app.py
```

Expected output:
```
Uvicorn running on http://127.0.0.1:8000
```

---

## Verification

### Test Backend Authentication
```bash
node scripts/test_backend_auth.js
```

Expected output:
```
✓ User registered
✓ Login successful
✓ Token received
✓ Protected route works
```

### Test Frontend
1. Open http://localhost:3000
2. Register a new account
3. Login
4. Navigate to Dashboard
5. View Risk Zone Map
6. Report an incident

### Test AI Services
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"type":"theft","location":"tourist_area"}'
```

---

## Common Issues & Fixes

### Issue: "MongoDB Connection Error"
**Solution**: 
- Check MongoDB is running: `mongosh` or `mongo`
- If using Docker: `docker ps` (should see `tourist-mongo`)
- Check `MONGO_URI` in `.env` is correct

### Issue: "Port 5000 already in use"
**Solution**:
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows
```

### Issue: "Token missing/invalid"
**Solution**:
- Check browser localStorage: Open DevTools > Application > localStorage
- Verify token is saved after login
- Check JWT_SECRET in backend matches
- Run `window.diagnoseToken()` in browser console

### Issue: "CORS errors"
**Solution**:
- Backend CORS is configured for `http://localhost:3000`
- If using different port, update backend-api/index.js line 20:
  ```javascript
  origin: ["http://localhost:YOUR_PORT"]
  ```

### Issue: "Email/SMS notifications not working"
**Solution**:
- These require actual Twilio and Email credentials
- Without them, system works but doesn't send notifications
- Optional feature for production only

---

## Production Deployment

### Environment Variables (Update for Production)
```env
MONGO_URI=mongodb://prod-mongo-server:27017/touristdb
JWT_SECRET=generate_a_strong_32_char_secret
NODE_ENV=production
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_AI_URL=https://ai.yourdomain.com
```

### Using Docker Compose (Recommended)
```bash
cd docker
docker-compose up -d
```

### Manual Deployment
1. Use process manager (PM2, systemd)
2. Setup reverse proxy (Nginx)
3. Enable HTTPS (Let's Encrypt)
4. Configure firewall rules

---

## Project Structure

```
smart-tourist-safety-system/
├── backend-api/          # Node.js/Express API
│   ├── index.js         # Main server file
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── package.json
│   └── .env             # Configuration (create from .env.example)
│
├── frontend/             # React.js Web App
│   ├── src/
│   │   ├── App.js
│   │   ├── components/  # React components
│   │   ├── contexts/    # Auth context
│   │   └── services/    # API service layer
│   ├── package.json
│   └── .env.local       # Configuration (create from .env.example)
│
├── mobile-app/           # React Native Mobile App
│   ├── src/
│   └── package.json
│
├── ai-services/          # Python FastAPI AI
│   ├── app.py
│   ├── requirements.txt
│   └── models/
│
├── docker/               # Docker compose config
│   ├── docker-compose.yml
│   └── data/            # MongoDB data volume
│
├── scripts/              # Utility scripts
│   ├── test_backend_auth.js
│   ├── setup-env.js
│   ├── start-all.sh
│   └── start-all.bat
│
└── docs/                 # Documentation
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Users/Tourists                      │
└──────────┬──────────────────────────────────┬───────────┘
           │                                  │
      ┌────▼─────┐                    ┌──────▼─────┐
      │ Web App  │                    │ Mobile App │
      │ (React)  │                    │ (RN/Expo)  │
      └────┬─────┘                    └──────┬─────┘
           │                                  │
           └──────────────────┬───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Backend API     │
                    │  (Node/Express)   │
                    │   :5000           │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
              ┌─────▼────┐        ┌─────▼──────┐
              │ MongoDB  │        │  AI Engine │
              │Database  │        │ (FastAPI)  │
              └──────────┘        └────────────┘
```

---

## Support & Debugging

### Enable Debug Logging
- Backend: Check `console.log` output in terminal
- Frontend: Open DevTools (F12) > Console tab
- Run diagnostic: `window.diagnoseToken()` in browser console

### View Logs
```bash
# Backend logs
tail -f backend-api/logs/error.log

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Reset Everything
```bash
# Stop all services
docker-compose down -v

# Remove all data
rm -rf docker/data/

# Restart
docker-compose up
```

---

## Next Steps

1. ✅ Complete environment setup
2. ✅ Start all services
3. ✅ Test authentication
4. ✅ Create admin account
5. ✅ Configure notifications (optional)
6. 🔄 Deploy to production

---

**For more information, see PROJECT_STATUS.md**
