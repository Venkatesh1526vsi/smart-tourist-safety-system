# Quick Reference Cheat Sheet

## 🚀 Start Everything (Choose One)

### Docker (Easiest)
```bash
cd docker && docker-compose up
```
✅ Backend: http://localhost:5000  
✅ Frontend: http://localhost:3000  
✅ AI: http://localhost:8000  

### Local (Manual)
```bash
# Terminal 1: Backend
cd backend-api && npm install && npm start

# Terminal 2: Frontend  
cd frontend && npm install && npm start

# Terminal 3: AI
cd ai-services && pip install -r requirements.txt && python app.py
```

---

## 🔧 First-Time Setup

```bash
# 1. Create environment files
cp backend-api/.env.example backend-api/.env
cp frontend/.env.example frontend/.env.local

# 2. Edit credentials (backend-api/.env)
# - MONGO_URI (if not using Docker)
# - JWT_SECRET
# - Email/SMS credentials (optional)

# 3. Start services (see above)

# 4. Test
node scripts/test_backend_auth.js
```

---

## 📋 Common Commands

### Docker Commands
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Rebuild images
docker-compose build --no-cache

# Remove everything (WARNING: deletes data!)
docker-compose down -v
```

### Backend Commands
```bash
# Install dependencies
cd backend-api && npm install

# Start dev
npm start

# Start production
NODE_ENV=production npm start

# Test auth
node ../scripts/test_backend_auth.js
```

### Frontend Commands
```bash
# Install dependencies
cd frontend && npm install

# Start dev
npm start

# Build production
npm run build

# Test
npm run test
```

### AI Commands
```bash
# Install dependencies
cd ai-services && pip install -r requirements.txt

# Start
python app.py

# With debug
python -m uvicorn app:app --reload
```

---

## 🔑 Key Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/register` | POST | ❌ | Register user |
| `/api/login` | POST | ❌ | Login user |
| `/profile` | GET | ✅ | Get user profile |
| `/profile` | PATCH | ✅ | Update profile |
| `/location/update` | POST | ✅ | Update location |
| `/incident/report` | POST | ✅ | Report incident |
| `/incident/my` | GET | ✅ | My incidents |
| `/api/risk-zones` | GET | ❌ | Risk zones map |
| `/admin/incidents` | GET | ✅ | All incidents (admin only) |
| `/notifications` | GET | ✅ | Get notifications |

---

## 🐛 Troubleshooting Quick Fixes

### Backend Won't Start
```bash
# Check if port is in use
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Check MongoDB
mongosh
```

### Frontend Blank Page
```javascript
// Run in browser console (F12)
window.diagnoseToken()

// Clear cache
// Ctrl+Shift+Delete or Cmd+Shift+Delete
```

### Login Fails
```bash
# Check backend running
curl http://localhost:5000/

# Check database
mongosh
db.users.find()  // Should show registered users

# Check token storage
// F12 > Application > localStorage > token should exist
```

### Database Connection Error
```bash
# Start MongoDB
mongod  # If local

# Or Docker
docker run -d -p 27017:27017 mongo:7

# Test connection
mongosh mongodb://localhost:27017
```

---

## 📊 Architecture Overview

```
User → Frontend (React) → Backend API → MongoDB
   ↓                         ↓
Mobile App              AI Services
                        (FastAPI)
```

### Data Flow
1. User logs in → Token returned → Stored in localStorage
2. Token added to all requests → Backend validates → Returns data
3. Components update → UI refreshes → User sees changes

---

## 🔒 Environment Variables Required

**Backend (.env)**
```env
MONGO_URI=mongodb://127.0.0.1:27017/touristdb
JWT_SECRET=your_secret_key_min_32_chars
NODE_ENV=development
```

**Frontend (.env.local)**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AI_URL=http://localhost:8000
```

---

## 📂 Project Layout

```
├── backend-api/      ← Node.js API (port 5000)
├── frontend/         ← React app (port 3000)
├── ai-services/      ← Python AI (port 8000)
├── mobile-app/       ← React Native app
├── docker/           ← Docker compose config
├── scripts/          ← Utility scripts
├── docs/             ← Documentation
└── [README, SETUP, TROUBLESHOOTING, DEPLOYMENT]
```

---

## ✅ Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Can register account
- [ ] Can login with account
- [ ] Can access dashboard
- [ ] Can update profile
- [ ] Can report incident
- [ ] Can view risk zones map
- [ ] Admin can access admin panel
- [ ] Admin can see all incidents

---

## 🚀 Deploy to Production

```bash
# 1. Update .env with production values
cp backend-api/.env.example backend-api/.env
# Edit with real values

# 2. Build Docker images
docker-compose build

# 3. Start services
docker-compose up -d

# 4. Verify
docker-compose ps
curl https://yourdomain.com/api/
```

---

## 🆘 Need Help?

1. **Stuck?** → Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. **Setup issues?** → Check [SETUP.md](SETUP.md)
3. **Deploying?** → Check [DEPLOYMENT.md](DEPLOYMENT.md)
4. **Feature status?** → Check [PROJECT_STATUS.md](PROJECT_STATUS.md)

---

## 💡 Pro Tips

✅ Use Docker for fastest setup  
✅ Run `window.diagnoseToken()` when authentication fails  
✅ Check `docker-compose logs -f` for error messages  
✅ Kill port before restarting: `lsof -ti:5000 | xargs kill -9`  
✅ Backup database before updates: See DEPLOYMENT.md  
✅ Use `.env` files, never commit credentials  

---

**Everything working?** → You're ready to go! 🎉

**Something broken?** → Check the troubleshooting section above or the full [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide.
