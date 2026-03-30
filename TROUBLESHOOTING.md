# Troubleshooting Guide

## Frontend Issues

### Issue: Login/Register not working

**Symptoms**: 
- Form submits but nothing happens
- No error message visible
- Page doesn't navigate after login

**Debug Steps**:
1. Open DevTools (F12) > Console
2. Run: `window.diagnoseToken()`
3. Look for red error messages
4. Check Network tab for API calls

**Solutions**:

1. **Backend not running**
   - Check: `curl http://localhost:5000/`
   - Should return: `"Smart Tourist Safety System API is running!"`
   - If not, start backend: `cd backend-api && npm start`

2. **CORS errors**
   - Check Network tab > look for red requests to `/api/login`
   - Fix: Backend `index.js` line 20 must include your frontend port
   ```javascript
   origin: ["http://localhost:3000", "http://YOUR_PORT"]
   ```

3. **MongoDB not responding**
   - Check: `mongosh` or `mongo` in another terminal
   - Should connect and show: `test>`
   - If fails, start MongoDB: `mongod` or `docker run -d -p 27017:27017 mongo:7`

---

### Issue: Token disappears after page refresh

**Symptoms**:
- Login works
- Get redirected to dashboard
- Refresh page → logged out
- Have to login again

**Root Cause**: localStorage not persisting token correctly

**Solutions**:

1. **Check localStorage access**
   - In DevTools Console, run:
   ```javascript
   localStorage.setItem('test', 'value');
   localStorage.getItem('test');  // Should print "value"
   ```
   - If fails, you have a storage permission issue

2. **Private browsing mode**
   - Disable private/incognito mode
   - localStorage doesn't persist in private mode

3. **Browser extensions blocking storage**
   - Try in incognito mode with extensions disabled
   - Or add app to extensions whitelist

---

### Issue: Map not loading / Risk zones empty

**Symptoms**:
- Risk Zone Map shows but no zones appear
- Or map doesn't show at all
- Leaflet errors in console

**Solutions**:

1. **Check if backend is sending risk zones**
   ```bash
   curl http://localhost:5000/api/risk-zones
   ```
   Should return JSON array with zone data

2. **Verify Leaflet is loaded**
   - DevTools Console:
   ```javascript
   L.latLng(20, 80)  // If works, Leaflet is loaded
   ```

3. **Check geolocation permission**
   - Browser asking for location permission?
   - Allow it, or it defaults to hardcoded coordinates

---

### Issue: Notifications not updating

**Symptoms**:
- Incident report doesn't appear immediately
- Have to refresh to see new incidents
- Notifications panel empty

**Solutions**:

1. **Check if backend received incident**
   ```bash
   curl -X GET http://localhost:5000/incident/my \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Verify authentication token**
   - Run: `window.diagnoseToken()` in console
   - Token should show as "✓ FOUND"
   - Should have 3 parts separated by dots

---

## Backend Issues

### Issue: "MongoDB connection error"

**Symptoms**:
- Server won't start
- Error: `MongooseError: Cannot connect to MongoDB`
- Error: `connect ECONNREFUSED 127.0.0.1:27017`

**Solutions**:

1. **Start MongoDB**
   ```bash
   # Option 1: Local MongoDB
   mongod
   
   # Option 2: Docker
   docker run -d -p 27017:27017 --name mongo mongo:7
   ```

2. **Check connection string**
   - Local: `mongodb://127.0.0.1:27017/touristdb`
   - Docker: `mongodb://mongo:27017/touristdb`
   - Your .env file has the right one?

3. **Firewall blocking**
   - Check if MongoDB port 27017 is accessible
   - Windows Defender might block it
   - Or running on non-standard port?

---

### Issue: "Port 5000 already in use"

**Symptoms**:
- Error: `EADDRINUSE: address already in use :::5000`
- Server won't start

**Solutions**:

```bash
# macOS/Linux: Kill process
lsof -ti:5000 | xargs kill -9

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Or use different port
PORT=5001 npm start
```

---

### Issue: Authentication middleware not working

**Symptoms**:
- Protected routes return `{"error": "Token missing"}`
- Even with valid token in header
- Login works but can't access `/profile` etc

**Debug**:

1. **Check token format**
   - Should be: `Authorization: Bearer <token>`
   - NOT: `Bearer<token>` (missing space)
   - NOT: `<token>` (missing "Bearer ")

2. **Verify JWT_SECRET**
   - Backend .env must have: `JWT_SECRET=<some_secret>`
   - Must be same secret used to sign token
   - If you change it, all existing tokens become invalid

3. **Check middleware order in index.js**
   - `authenticateToken` middleware must be applied BEFORE route handler
   - Wrong: `app.get('/profile', (req, res) => {}, authenticateToken)`
   - Right: `app.get('/profile', authenticateToken, (req, res) => {})`

---

### Issue: Email/SMS notifications not sending

**Symptoms**:
- Incident reported successfully
- But admins don't receive email/SMS
- No errors in console

**This is expected!** These are optional features requiring credentials:

**To enable email notifications**:
1. Get Gmail app password
2. Add to `.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
   ```
3. Restart backend: `npm start`

**To enable SMS notifications**:
1. Get Twilio account (free trial available)
2. Add to `.env`:
   ```env
   TWILIO_SID=ACxxxxxxxxxxxxxx
   TWILIO_AUTH=your_auth_token
   TWILIO_PHONE=+1234567890
   ```
3. Restart backend

---

## Docker Issues

### Issue: "docker-compose: command not found"

**Solutions**:
```bash
# Install Docker Desktop (includes docker-compose)
# Or install manually

# macOS
brew install docker-compose

# Ubuntu
sudo apt-get install docker-compose

# Windows
# Download Docker Desktop from docker.com
```

---

### Issue: Container exits immediately

**Symptoms**:
- `docker-compose up` shows container created then exits
- Or error like `ExitCode: 1`

**Debug**:
```bash
# Check logs
docker-compose logs -f backend

# Or individual service
docker logs -f tourist-backend

# Common causes:
# 1. Port already in use
# 2. Missing dependencies (npm install failed)
# 3. Environment variable missing
```

---

### Issue: Database data lost after `docker-compose down`

**Normal behavior!** To persist data:

```bash
# Current docker-compose.yml should persist to ./data/
# If not, add to docker-compose.yml:

services:
  mongo:
    image: mongo:7
    volumes:
      - ./data:/data/db  # This line persists data
```

---

## Mobile App Issues

### Issue: Missing dependencies errors

**Symptoms**:
- Error: `Cannot find module @react-native-picker/picker`
- App crashes on startup

**Solutions**:
```bash
cd mobile-app
npm install
npm start
```

---

### Issue: Geolocation not working

**Symptoms**:
- Can't get current location
- Permission denied error

**Solutions**:

1. **Allow permissions**
   - Android: Settings > Apps > [App Name] > Permissions > Location
   - iOS: Settings > [App Name] > Location

2. **Use real device (not emulator)**
   - Emulators might not have proper GPS

3. **Fallback location in code**
   - If geolocation fails, app uses fallback coordinates
   - Default: 20.5937, 78.9629 (India center)

---

## General System Issues

### Issue: Everything is down, can't fix it

**Nuclear Option** (Reset everything):

```bash
# Stop everything
docker-compose down -v

# Remove all containers
docker system prune -a

# Remove all data
rm -rf docker/data/

# Clean npm cache
cd backend-api && npm cache clean --force
cd ../frontend && npm cache clean --force

# Reinstall everything
docker-compose build --no-cache
docker-compose up
```

---

### Issue: System is slow/hanging

**Symptoms**:
- Services take forever to start
- Network requests timeout

**Solutions**:

1. **Check resource usage**
   ```bash
   docker stats  # See CPU/memory usage
   ```

2. **Increase Docker resources**
   - Docker Desktop > Settings > Resources
   - Increase CPU and Memory allocated

3. **Clear Docker volumes**
   ```bash
   docker volume prune
   ```

---

## Performance Tuning

### Optimize Database
```javascript
// Add indexes to frequently queried fields
db.users.createIndex({ email: 1 })
db.incidents.createIndex({ userId: 1, timestamp: -1 })
```

### Optimize Frontend
- Use React.memo for components
- Lazy load routes
- Compress images
- Enable caching

### Optimize Backend
- Add response caching
- Use connection pooling for MongoDB
- Implement pagination for large datasets
- Use aggregation pipelines

---

## Getting Help

If still stuck:

1. **Check logs**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker logs -f tourist-backend
   ```

2. **Run diagnostic**
   - Frontend: `window.diagnoseToken()`
   - Backend test: `node scripts/test_backend_auth.js`

3. **Check network requests**
   - DevTools > Network tab
   - Look for failed requests (red)
   - Check response for error messages

4. **Restart everything**
   ```bash
   docker-compose restart
   ```

---

## Common Configuration Errors

| Error | Solution |
|-------|----------|
| `CORS error` | Update `origin` in backend-api/index.js |
| `Token expired` | Increase `expiresIn` or login again |
| `MongoDB timeout` | Check MongoDB is running |
| `Port in use` | Kill process or use different port |
| `No env file` | Run `node scripts/setup-env.js` |
| `Can't write to disk` | Check folder permissions |

---

**Still need help? Check PROJECT_STATUS.md or SETUP.md**
