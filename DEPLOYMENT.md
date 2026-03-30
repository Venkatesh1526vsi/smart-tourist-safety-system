# Deployment Guide

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database backups created
- [ ] Code reviewed and tested
- [ ] Error handling implemented
- [ ] Security headers configured
- [ ] HTTPS certificates obtained
- [ ] Monitoring/alerting setup
- [ ] Rollback plan documented

---

## Deployment Strategies

### Strategy 1: Docker Compose (Recommended)

**Pros**: Simple, all-in-one, easy to manage  
**Cons**: Single server only, no auto-scaling

**Steps**:

```bash
# 1. Clone repository
git clone <repo> smart-tourist-safety
cd smart-tourist-safety

# 2. Create .env file for production
cp backend-api/.env.example backend-api/.env
# Edit with production credentials:
# - Strong JWT_SECRET (min 32 chars)
# - Real MongoDB connection string
# - Email/SMS credentials
# - Admin emails

# 3. Build images
cd docker
docker-compose build

# 4. Start services
docker-compose up -d

# 5. Verify all services
docker-compose ps
# Should show: mongo, backend, ai, frontend all "Up"

# 6. Test endpoints
curl http://your-domain:5000/
curl http://your-domain:3000/
```

### Strategy 2: Kubernetes (Enterprise)

**Pros**: Auto-scaling, high availability, rolling updates  
**Cons**: Complex setup, overkill for small projects

**Files needed**:
- deployment.yaml (backend, frontend, ai)
- service.yaml (expose services)
- configmap.yaml (environment variables)
- secret.yaml (credentials)
- ingress.yaml (routing)

See `kubernetes/` folder for configs.

### Strategy 3: Traditional VPS (Heroku, DigitalOcean, Linode)

**Pros**: Good balance, affordable, easy deployment  
**Cons**: Manual scaling, more maintenance

**Steps**:

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Install dependencies
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clone and setup
git clone <repo>
cd smart-tourist-safety/docker

# 4. Create .env
nano backend-api/.env  # Copy .env.example content, add credentials

# 5. Start
docker-compose up -d

# 6. Setup Nginx reverse proxy
# (See reverse-proxy section below)
```

---

## Reverse Proxy Setup (Nginx)

Create `/etc/nginx/sites-available/tourist-safety`:

```nginx
upstream backend {
    server 127.0.0.1:5000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

upstream ai {
    server 127.0.0.1:8000;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # AI Services
    location /api/ai/ {
        proxy_pass http://ai/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/tourist-safety /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## SSL/HTTPS Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate (auto-renewing)
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already enabled by default)
sudo systemctl start certbot.timer
sudo systemctl enable certbot.timer
```

---

## Monitoring & Logging

### Docker Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# With timestamps
docker-compose logs -f --timestamps

# Last 100 lines
docker-compose logs --tail=100
```

### Application Logging

**Backend** (Express):
```javascript
// Add to index.js
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const errorLog = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });
process.stderr.pipe(errorLog);
```

**View logs**:
```bash
tail -f backend-api/logs/error.log
```

### Monitoring Services

**Uptime Monitoring**:
```bash
# Simple health check
while true; do
  curl -f http://yourdomain.com/api/ || echo "Backend down at $(date)"
  sleep 300  # Check every 5 minutes
done
```

---

## Database Backups

### Automated MongoDB Backup

Create backup script at `scripts/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/mongo_$DATE"
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec tourist-mongo mongodump --out /data/db/backup_$DATE

echo "Backup completed: $BACKUP_DIR"

# Keep only last 7 days
find backups/ -name "mongo_*" -mtime +7 -exec rm -rf {} \;
```

Schedule with cron:
```bash
# Backup every day at 2 AM
0 2 * * * /path/to/smart-tourist-safety/scripts/backup-db.sh
```

### Restore from Backup

```bash
# Stop services
docker-compose down

# Restore
docker exec tourist-mongo mongorestore /data/db/backup_20260207_000000/

# Restart
docker-compose up -d
```

---

## Performance Optimization

### Database Optimization
```javascript
// Add indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.incidents.createIndex({ userId: 1, timestamp: -1 })
db.locations.createIndex({ userId: 1, timestamp: -1 })
db.notifications.createIndex({ recipientId: 1, read: 1 })
```

### Caching
```javascript
// Redis caching (optional)
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379
});

// Cache risk zones
app.get('/api/risk-zones', (req, res) => {
  const cacheKey = 'risk-zones';
  client.get(cacheKey, (err, data) => {
    if (data) {
      return res.json(JSON.parse(data));
    }
    // Fetch from DB and cache for 1 hour
    const zones = ...;
    client.setex(cacheKey, 3600, JSON.stringify(zones));
    res.json(zones);
  });
});
```

### Load Balancing

Use Nginx upstream to distribute traffic:

```nginx
upstream backend {
    least_conn;  # Connection balancing
    server backend-1:5000;
    server backend-2:5000;
    server backend-3:5000;
    keepalive 32;
}
```

---

## Security Hardening

### API Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Input Validation
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/register', 
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process registration
  }
);
```

### Environment Secrets
```bash
# Never commit .env
echo ".env" >> .gitignore

# Use strong JWT secret (32+ chars)
JWT_SECRET=$(openssl rand -base64 32)

# Rotate secrets periodically (3-6 months)
```

---

## Rollback Plan

If deployment fails:

```bash
# View previous versions
git log --oneline | head -5

# Rollback to previous commit
git checkout <commit-hash>

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Post-Deployment Checklist

- [ ] All services running: `docker-compose ps`
- [ ] Health checks passing: curl all endpoints
- [ ] Database connected: Check logs
- [ ] Frontend loads: Visit https://yourdomain.com
- [ ] Login works: Register and login
- [ ] Incidents can be reported
- [ ] Notifications working
- [ ] Map loads with risk zones
- [ ] SSL certificate valid: https://yourdomain.com (no warnings)
- [ ] Backups running: Check logs

---

## Scaling (Future)

When you outgrow Docker Compose:

1. **Kubernetes**: Multiple servers, auto-scaling
2. **AWS ECS**: Managed containers, easy scaling
3. **Google Cloud Run**: Serverless, pay-per-use
4. **Database clustering**: MongoDB Atlas or sharding

---

**For issues, check TROUBLESHOOTING.md**
