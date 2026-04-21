require('./config');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { PORT, MONGO_URI, JWT_SECRET } = require('./config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const User = require('./models/User');
const Location = require('./models/Location');
const Incident = require('./models/Incident');
const Notification = require('./models/Notification');

if (!MONGO_URI) {
  console.error('MONGO_URI is required (Render env var). MongoDB connection will be skipped.');
  console.error('Set MONGO_URI in your Render environment variables.');
  process.exit(1); // Exit with error to prevent app from starting
}
if (!JWT_SECRET) {
  console.error('JWT_SECRET is required (Render env var). Authenticated routes will likely fail.');
  console.error('Set JWT_SECRET in your Render environment variables.');
  process.exit(1); // Exit with error to prevent app from starting
}

// Routers
const riskZonesRouter = require('./routes/riskZones');
const incidentsRouter = require('./routes/incidents');
const profilesRouter = require('./routes/profiles');
const advancedRouter = require('./routes/advanced');
const adminRouter = require('./routes/admin');

// Error Handlers
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const ResponseHandler = require('./utils/responseHandler');

// WebSocket
const WebSocketServer = require('./utils/websocket');
const logger = require('./utils/logger');

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = 'uploads/incident-images';

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Winston Logger
// const logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.errors({ stack: true }),
//     winston.format.json()
//   ),
//   defaultMeta: { service: 'tourist-safety-api' },
//   transports: [
//     new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
//     new winston.transports.File({ filename: 'logs/combined.log' })
//   ]
// });

// // If we're not in production, log to console too
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new winston.transports.Console({
//     format: winston.format.combine(
//       winston.format.colorize(),
//       winston.format.simple()
//     )
//   }));
// }

const app = express(); // ----> Must be BEFORE app.use()
app.set("trust proxy", 1);

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket server
const websocketServer = new WebSocketServer(server);

// Store reference for use in routes
app.set('webSocketServer', websocketServer);

// Rate Limiting Configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for OPTIONS requests (CORS preflight)
    return req.method === 'OPTIONS';
  }
});

// SECURITY: Password strength middleware
const validatePasswordStrength = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Minimum 8 characters, at least one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
    });
  }

  next();
};

// SECURITY: Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove potentially dangerous characters
        req.body[key] = req.body[key].trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    });
  }
  next();
};

// SECURITY: Rate limiting for auth endpoints (more lenient for development)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs (increased from 5)
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for OPTIONS requests (CORS preflight)
    return req.method === 'OPTIONS';
  }
});

// SECURITY: Rate limiting for incident reports
const incidentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 incident reports per hour
  message: {
    error: 'Too many incident reports, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: true,
  credentials: true
}));

// Middleware
// Apply general rate limiting to API routes only (NOT login/register)
app.use('/api/', generalLimiter);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Global request logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip}`);
  next();
});

// Serve static files BEFORE auth middleware (public PWA files)
app.use(express.static(path.join(__dirname, '../frontend-new/public'), {
  maxAge: '1h',
  setHeaders: (res, path) => {
    // Cache manifest and service worker for 1 hour
    if (path.endsWith('.webmanifest') || path.endsWith('.js')) {
      res.set('Cache-Control', 'public, max-age=3600');
    }
    // Allow manifest and icons to be accessed without auth
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Serve uploads directory 
app.use('/uploads', express.static('uploads'));

// MongoDB connection validation middleware
const validateMongoConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.error('MongoDB not connected. Ready state:', mongoose.connection.readyState);
    return res.status(500).json({
      error: 'Database connection error',
      message: 'Unable to connect to database. Please try again later.'
    });
  }
  next();
};

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply input sanitization
app.use(sanitizeInput);

// Apply specific rate limiting to authentication routes
app.use('/api/register', authLimiter);
app.use('/api/login', authLimiter);

// Apply specific rate limiting to incident reporting
app.use('/incident/report', incidentLimiter);

// AFTER app.use(express.json());
app.use((req, res, next) => {
  next();
});


// Plug in router AFTER defining app
// TEMPORARILY DISABLED: app.use('/api/incidents', validateMongoConnection);
app.use('/api/incidents', incidentsRouter);
app.use('/api/profile', profilesRouter);
app.use('/api/advanced', advancedRouter);
app.use('/api/admin', adminRouter);

// Routes
app.get('/', (req, res) => {
  res.send('Server running');
});

// Start listening immediately so Render can verify the app is alive.
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} with WebSocket support`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Root URL: http://localhost:${PORT}/`);
  console.log(`🔐 JWT_SECRET configured: ${JWT_SECRET ? 'Yes' : 'No'}`);
  console.log(`🗄️  MONGO_URI configured: ${MONGO_URI ? 'Yes' : 'No'}`);
});

// MongoDB Connect (only once!)
if (MONGO_URI) {
  console.log('Attempting to connect to MongoDB...');
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      console.log('✅ MongoDB connected successfully');
      console.log('MongoDB URI:', MONGO_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs

      const { riskZones, seedRiskZones } = require('./models/riskZones');
      const RiskZone = require('./models/RiskZone');
      await seedRiskZones(RiskZone);
      console.log('✅ Risk zones seeded');

      // Seed incidents (Option A feature)
      const { seedIncidents } = require('./models/incidents');
      await seedIncidents(Incident, User);
      console.log('✅ Incidents seeded');

      // Seed profiles (Option B feature)
      const { seedProfiles } = require('./models/profiles');
      await seedProfiles(User);
      console.log('✅ Profiles seeded');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      console.error('Full error:', err);
      // TEMPORARILY DISABLED: process.exit(1); // Exit if DB connection fails
      console.log('⚠️  Continuing without MongoDB for testing purposes...');
    });
} else {
  console.error('❌ MONGO_URI not provided. Cannot connect to database.');
  // TEMPORARILY DISABLED: process.exit(1);
  console.log('⚠️  Continuing without MongoDB for testing purposes...');
}

// SYSTEM HEALTH CHECK
app.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();

    // Check database connection
    await mongoose.connection.db.admin().ping();

    // Get counts for different collections
    const userCount = await User.countDocuments();
    const incidentCount = await Incident.countDocuments();
    const locationCount = await Location.countDocuments();

    // Check WebSocket server status
    const webSocketServer = req.app.get('webSocketServer');
    const wsStatus = webSocketServer ? 'running' : 'not initialized';

    // Calculate response time
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      timestamp: new Date(),
      response_time_ms: responseTime,
      uptime: process.uptime(),
      services: {
        database: {
          status: 'connected',
          collections: {
            users: userCount,
            incidents: incidentCount,
            locations: locationCount
          }
        },
        websocket: {
          status: wsStatus,
          connected_clients: webSocketServer ? webSocketServer.getOnlineUsers().length : 0
        },
        api: {
          status: 'operational',
          version: '1.0.0'
        }
      },
      environment: process.env.NODE_ENV || 'development'
    };

    return ResponseHandler.success(res, 200, { health: healthData }, 'System health check successful');
  } catch (err) {
    const errorHealthData = {
      status: 'unhealthy',
      timestamp: new Date(),
      error: err.message,
      services: {
        database: { status: 'disconnected' },
        websocket: { status: 'unknown' },
        api: { status: 'operational' }
      }
    };

    return ResponseHandler.error(res, 500, 'System health check failed', errorHealthData);
  }
});

// USER REGISTRATION
app.post('/api/register', validateMongoConnection, validatePasswordStrength, async (req, res) => {

  try {
    console.log('Registration attempt:', req.body);
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      console.log('Registration failed: Missing required fields');
      return ResponseHandler.validationError(res, [
        { path: 'name', message: 'Name is required' },
        { path: 'email', message: 'Email is required' },
        { path: 'password', message: 'Password is required' }
      ]);
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Registration failed: Email already exists:', email);
      return ResponseHandler.error(res, 400, 'Email already registered.');
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    console.log('User registered successfully:', { id: user._id, email: user.email });

    // Issue JWT token for immediate login
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || 'tourist' },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return ResponseHandler.created(res, {
      user: { name, email, role: user.role || 'tourist' },
      token
    }, 'User registered successfully!');
  } catch (err) {
    console.error('Registration error:', err);
    return ResponseHandler.error(res, 500, 'Server error during registration.', err.message);
  }
});

// Brute force protection
const failedLoginAttempts = new Map(); // In-memory store (use Redis in production)

const resetFailedAttempts = (ipAddress) => {
  failedLoginAttempts.delete(ipAddress);
};

const incrementFailedAttempts = (ipAddress) => {
  const attempts = failedLoginAttempts.get(ipAddress) || 0;
  failedLoginAttempts.set(ipAddress, attempts + 1);
  return attempts + 1;
};

const getFailedAttempts = (ipAddress) => {
  return failedLoginAttempts.get(ipAddress) || 0;
};

// USER LOGIN (JWT returned on success)
app.post('/api/login', validateMongoConnection, async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return ResponseHandler.validationError(res, [
        { path: 'email', message: 'Email is required' },
        { path: 'password', message: 'Password is required' }
      ]);
    }

    // Check if IP is blocked due to too many failed attempts
    const failedAttempts = getFailedAttempts(ipAddress);
    if (failedAttempts >= 5) {
      console.log('Login blocked: Too many failed attempts from IP:', ipAddress);
      return ResponseHandler.error(res, 429, 'Too many failed login attempts. Please try again later.');
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found:', email);
      // Increment failed attempts for invalid email
      incrementFailedAttempts(ipAddress);
      return ResponseHandler.unauthorized(res, 'Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Invalid password for user:', email);
      // Increment failed attempts for invalid password
      incrementFailedAttempts(ipAddress);
      return ResponseHandler.unauthorized(res, 'Invalid email or password.');
    }

    // Reset failed attempts on successful login
    resetFailedAttempts(ipAddress);
    console.log('Login successful for user:', email);

    // Issue JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || 'tourist' },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return ResponseHandler.success(res, 200, {
      user: { name: user.name, email: user.email, role: user.role || 'tourist' },
      token
    }, 'Login successful!');
  } catch (err) {
    console.error('Login error:', err);
    return ResponseHandler.error(res, 500, 'Server error during login.', err.message);
  }
});

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}


// Admin authorization middleware
async function isAdmin(req, res, next) {
  try {
    const dbUser = await User.findById(req.user.userId);
    if (!dbUser) return res.status(404).json({ error: 'User not found' });
    if (dbUser.role !== 'admin') return res.status(403).json({ error: 'Forbidden: admin only' });
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
}

// PROFILE UPDATE ROUTE (PATCH)
app.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    // Add more fields here if needed

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    res.json({
      message: 'Profile updated successfully!',
      user: { name: updatedUser.name, email: updatedUser.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// CHANGE PASSWORD ROUTE (PATCH)
app.patch('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide both old and new password.' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Old password is incorrect.' });
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedNewPassword;
    await user.save();
    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// SAMPLE PROTECTED ROUTE TO FETCH PROFILE DETAILS (GET)
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({
      name: user.name,
      email: user.email
      // add more fields here if needed
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// LOCATION: Update or create latest user location (POST)
app.post('/location/update', authenticateToken, async (req, res) => {

  try {
    const { latitude, longitude } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude and longitude must be numbers' });
    }

    const update = {
      latitude,
      longitude,
      timestamp: new Date(),
    };

    // Update location in database
    const location = await Location.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: update, $setOnInsert: { userId: req.user.userId } },
      { new: true, upsert: true }
    );

    // Return success response with ResponseHandler
    return ResponseHandler.success(res, 200, { location }, 'Location updated successfully');
  } catch (err) {
    return ResponseHandler.error(res, 500, 'Server error during location update.', err);
  }
});


// LOCATION: Get current user's latest location (GET)
app.get('/location/me', authenticateToken, async (req, res) => {
  try {
    const location = await Location.findOne({ userId: req.user.userId });

    if (!location) {
      return ResponseHandler.notFound(res, 'Location not found');
    }

    return ResponseHandler.success(res, 200, { location }, 'Location retrieved successfully');
  } catch (err) {
    return ResponseHandler.error(res, 500, 'Server error during location retrieval.', err);
  }
});

// INCIDENT REPORTING WITH IMAGE UPLOAD

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/incident-images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'incident-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// INCIDENT: Report incident with optional image evidence (POST)
app.post('/incident/report', incidentLimiter, authenticateToken, async (req, res) => {
  try {
    // Check if there's an uploaded image
    const uploadSingle = upload.single('evidence_image');

    uploadSingle(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return ResponseHandler.error(res, 400, 'File too large. Maximum size is 5MB.');
          }
        }
        return ResponseHandler.error(res, 400, err.message);
      }

      const { type, description, latitude, longitude, severity = 'medium' } = req.body;

      if (!type) {
        return ResponseHandler.validationError(res, [
          { path: 'type', message: 'Incident type is required' }
        ]);
      }

      // Validate coordinates if provided
      if (latitude && (latitude < -90 || latitude > 90)) {
        return ResponseHandler.validationError(res, [
          { path: 'latitude', message: 'Latitude must be between -90 and 90' }
        ]);
      }

      if (longitude && (longitude < -180 || longitude > 180)) {
        return ResponseHandler.validationError(res, [
          { path: 'longitude', message: 'Longitude must be between -180 and 180' }
        ]);
      }

      // Get user's latest location if coordinates not provided
      let incidentData = {
        userId: req.user.userId,
        type,
        description: description || '',
        severity,
        status: 'reported',
        evidence_image: req.file ? `/uploads/${req.file.filename}` : null,
        created_at: new Date()
      };

      if (latitude && longitude) {
        incidentData.latitude = parseFloat(latitude);
        incidentData.longitude = parseFloat(longitude);
      } else {
        // Try to get user's latest location from the location collection
        const latest = await Location.findOne({ userId: req.user.userId });
        if (latest) {
          incidentData.latitude = latest.latitude;
          incidentData.longitude = latest.longitude;
          incidentData.locationId = latest._id;
        }
      }

      // Defensive check for location
      if (
        typeof incidentData.latitude !== 'number' ||
        typeof incidentData.longitude !== 'number'
      ) {
        return res.status(400).json({ error: 'Location data is missing or invalid.' });
      }

      const incident = new Incident(incidentData);
      await incident.save();

      // Send WebSocket notification
      if (websocketServer) {
        websocketServer.broadcastToRoom('incidents_room', 'incident:reported', {
          ...incidentData,
          _id: incident._id,
          reporter: req.user.email
        });
      }

      return ResponseHandler.success(res, 201, { incident }, 'Incident reported successfully!');

    });
  } catch (err) {
    return ResponseHandler.error(res, 500, 'Server error during incident reporting.', err);
  }
});

// INCIDENT: Get incidents reported by current user (GET)
app.get('/incident/my', authenticateToken, async (req, res) => {
  try {
    const incidents = await Incident.find({ userId: req.user.userId }).sort({ timestamp: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// INCIDENT: Get all incidents (admin only) (GET)
app.get('/incident/all', authenticateToken, async (req, res) => {
  try {
    const admins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    if (!admins.includes(req.user.email)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const incidents = await Incident.find({}).sort({ timestamp: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ADMIN: List all users
app.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ADMIN: List all incidents
app.get('/admin/incidents', authenticateToken, isAdmin, async (req, res) => {
  try {
    const incidents = await Incident.find({}).sort({ timestamp: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ADMIN: Update incident status
app.patch('/admin/incidents/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    const updated = await Incident.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Incident not found' });
    res.json({ message: 'Incident status updated', incident: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// NOTIFICATIONS: List and mark as read for current user
app.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.userId })
      .sort({ timestamp: -1 });

    // Mark all unread as read
    await Notification.updateMany(
      { recipientId: req.user.userId, read: false },
      { $set: { read: true } }
    );

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ADVANCED ANALYTICS: Get system statistics and trends
app.get('/analytics/system-stats', authenticateToken, async (req, res) => {
  try {
    // Only allow admins to access system stats
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'admin') {
      return ResponseHandler.forbidden(res, 'Access denied: Admin only');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get user growth data
    const userGrowth = await User.aggregate([
      {
        $match: {
          created_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get incident trends
    const incidentTrends = await Incident.aggregate([
      {
        $match: {
          created_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
          },
          count: { $sum: 1 },
          byType: {
            $push: "$type"
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Incident distribution by type
    const incidentByType = await Incident.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);

    // Incident distribution by severity
    const incidentBySeverity = await Incident.aggregate([
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalIncidents = await Incident.countDocuments();
    const totalLocations = await Location.countDocuments();
    const recentIncidents = await Incident.countDocuments({
      created_at: { $gte: thirtyDaysAgo }
    });

    const analyticsData = {
      summary: {
        totalUsers,
        totalIncidents,
        totalLocations,
        recentIncidents,
        activeUsers: await User.countDocuments({ last_login: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
      },
      userGrowth,
      incidentTrends,
      incidentDistribution: {
        byType: incidentByType,
        bySeverity: incidentBySeverity
      },
      trends: {
        avgIncidentsPerDay: recentIncidents / 30,
        userGrowthRate: ((userGrowth.length > 0 ? userGrowth[userGrowth.length - 1].count : 0) / totalUsers) * 100
      }
    };

    return ResponseHandler.success(res, 200, { analytics: analyticsData }, 'System analytics retrieved successfully');
  } catch (err) {
    return ResponseHandler.error(res, 500, 'Server error during analytics retrieval.', err);
  }
});

// ADVANCED ANALYTICS: Get user activity statistics
app.get('/analytics/user-activity', authenticateToken, async (req, res) => {
  try {
    // Only allow admins to access user activity stats
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'admin') {
      return ResponseHandler.forbidden(res, 'Access denied: Admin only');
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get active users by day
    const activeUsers = await User.aggregate([
      {
        $match: {
          last_login: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$last_login" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get most active users
    const mostActiveUsers = await User.aggregate([
      {
        $match: {
          last_login: { $gte: sevenDaysAgo }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          last_login: 1,
          incident_count: { $size: { $ifNull: ["$reported_incidents", []] } }
        }
      },
      {
        $sort: { incident_count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const activityData = {
      activeUsers,
      mostActiveUsers,
      totalActiveUsers: activeUsers.reduce((sum, day) => sum + day.count, 0)
    };

    return ResponseHandler.success(res, 200, { activity: activityData }, 'User activity analytics retrieved successfully');
  } catch (err) {
    return ResponseHandler.error(res, 500, 'Server error during activity analytics retrieval.', err);
  }
});

// ADVANCED RISK ASSESSMENT: Predictive analysis for risk zones
app.get('/risk-assessment/predictions', authenticateToken, async (req, res) => {
  try {
    // Only allow admins to access predictive analysis
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'admin') {
      return ResponseHandler.forbidden(res, 'Access denied: Admin only');
    }

    // Analyze incident patterns to predict high-risk areas
    const incidentPatterns = await Incident.aggregate([
      {
        $group: {
          _id: {
            lat: { $floor: { $multiply: ["$latitude", 1000] } }, // Group by approximate location
            lng: { $floor: { $multiply: ["$longitude", 1000] } },
            month: { $month: "$created_at" }
          },
          count: { $sum: 1 },
          types: { $addToSet: "$type" },
          severities: { $addToSet: "$severity" }
        }
      },
      {
        $match: {
          count: { $gt: 2 } // Only consider areas with more than 2 incidents
        }
      }
    ]);

    // Analyze temporal patterns
    const temporalPatterns = await Incident.aggregate([
      {
        $group: {
          _id: {
            hour: { $hour: "$created_at" },
            dayOfWeek: { $dayOfWeek: "$created_at" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Identify high-risk periods
    const highRiskPeriods = temporalPatterns.slice(0, 5);

    // Calculate risk scores for areas
    const riskAreas = incidentPatterns.map(pattern => ({
      latitude: pattern._id.lat / 1000,
      longitude: pattern._id.lng / 1000,
      riskScore: pattern.count * calculateSeverityMultiplier(pattern.severities),
      incidentCount: pattern.count,
      commonTypes: pattern.types,
      month: pattern._id.month
    }));

    // Sort by risk score descending
    riskAreas.sort((a, b) => b.riskScore - a.riskScore);

    const predictions = {
      highRiskAreas: riskAreas.slice(0, 10), // Top 10 high-risk areas
      highRiskPeriods,
      totalPredictions: riskAreas.length,
      analysisDate: new Date(),
      confidenceLevel: 'moderate' // Would be calculated based on data quality in real implementation
    };

    return ResponseHandler.success(res, 200, { predictions }, 'Risk predictions generated successfully');
  } catch (err) {
    return ResponseHandler.error(res, 500, 'Server error during risk prediction.', err);
  }
});

// Helper function to calculate severity multiplier
function calculateSeverityMultiplier(severities) {
  const multiplierMap = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 5
  };

  let maxMultiplier = 1;
  severities.forEach(severity => {
    if (multiplierMap[severity] > maxMultiplier) {
      maxMultiplier = multiplierMap[severity];
    }
  });

  return maxMultiplier;
}

// ADVANCED RISK ASSESSMENT: Get risk assessment for user's location
app.post('/risk-assessment/evaluate', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radius = 1000 } = req.body; // radius in meters

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return ResponseHandler.validationError(res, [
        { path: 'latitude', message: 'Latitude must be a number' },
        { path: 'longitude', message: 'Longitude must be a number' }
      ]);
    }

    // Calculate bounding box for nearby incidents
    const latDelta = radius / 111000; // Approximate meters per degree latitude
    const lonDelta = radius / (111000 * Math.cos(latitude * Math.PI / 180)); // Adjust for longitude

    const nearbyIncidents = await Incident.find({
      latitude: { $gte: latitude - latDelta, $lte: latitude + latDelta },
      longitude: { $gte: longitude - lonDelta, $lte: longitude + lonDelta }
    });

    // Calculate risk score based on nearby incidents
    let riskScore = 0;
    const incidentTypes = {};
    const incidentSeverities = {};

    nearbyIncidents.forEach(incident => {
      // Add to risk score based on severity
      const severityMultiplier = calculateSeverityMultiplier([incident.severity]);
      riskScore += severityMultiplier;

      // Count incident types
      if (incidentTypes[incident.type]) {
        incidentTypes[incident.type]++;
      } else {
        incidentTypes[incident.type] = 1;
      }

      // Count severities
      if (incidentSeverities[incident.severity]) {
        incidentSeverities[incident.severity]++;
      } else {
        incidentSeverities[incident.severity] = 1;
      }
    });

    // Normalize risk score based on time (more recent incidents = higher risk)
    const now = new Date();
    nearbyIncidents.forEach(incident => {
      const daysAgo = (now - incident.created_at) / (1000 * 60 * 60 * 24);
      // Reduce score for older incidents (decay factor)
      const decayFactor = Math.max(0.1, 1 - (daysAgo / 30)); // Full weight for incidents in last 30 days
      const severityMultiplier = calculateSeverityMultiplier([incident.severity]);
      riskScore -= severityMultiplier * (1 - decayFactor);
    });

    // Determine risk level
    let riskLevel = 'low';
    if (riskScore > 10) riskLevel = 'high';
    else if (riskScore > 5) riskLevel = 'medium';

    const assessment = {
      location: { latitude, longitude },
      radius,
      riskScore: Math.round(riskScore * 100) / 100, // Round to 2 decimal places
      riskLevel,
      nearbyIncidents: nearbyIncidents.length,
      incidentTypes,
      incidentSeverities,
      evaluationTimestamp: new Date()
    };

    return ResponseHandler.success(res, 200, { assessment }, 'Risk assessment completed successfully');
  } catch (err) {
    return ResponseHandler.error(res, 500, 'Server error during risk assessment.', err);
  }
});

// EXTERNAL API PROXY ENDPOINTS
// These endpoints proxy requests to third-party APIs to keep API keys secure

// Weather API Proxy - OpenWeatherMap for Pune
app.get('/api/external/weather', authenticateToken, async (req, res) => {
  try {
    const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

    // Pune coordinates
    const lat = 18.5204;
    const lon = 73.8567;

    if (!OPENWEATHER_API_KEY) {
      // Return mock data if API key not configured
      return res.json({
        success: true,
        data: {
          temperature: 28,
          condition: 'Partly Cloudy',
          humidity: 65,
          windSpeed: 12,
          rainProbability: 30,
          alert: null,
          location: 'Pune, Maharashtra',
          timestamp: new Date().toISOString()
        },
        note: 'Using mock data - OPENWEATHER_API_KEY not configured'
      });
    }

    // Fetch from OpenWeatherMap API
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const weatherData = await response.json();

    // Transform to our format
    const transformedData = {
      temperature: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0]?.main || 'Unknown',
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
      rainProbability: weatherData.rain ? Math.round((weatherData.rain['1h'] || 0) * 100) : 0,
      alert: weatherData.weather[0]?.main === 'Thunderstorm' || weatherData.weather[0]?.main === 'Heavy Rain'
        ? `Weather Alert: ${weatherData.weather[0].description}`
        : null,
      location: 'Pune, Maharashtra',
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: transformedData
    });
  } catch (err) {
    logger.error('Weather API error:', err);
    // Return fallback data on error
    res.json({
      success: true,
      data: {
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        rainProbability: 30,
        alert: null,
        location: 'Pune, Maharashtra',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// News API Proxy - GNews for Pune safety news
app.get('/api/external/news', authenticateToken, async (req, res) => {
  try {
    const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

    if (!GNEWS_API_KEY) {
      // Return mock data if API key not configured
      return res.json({
        success: true,
        data: [
          {
            title: 'Pune Police Launch New Tourist Safety Initiative',
            description: 'The Pune Police Department has announced enhanced patrolling in tourist areas including Koregaon Park and Shivajinagar.',
            url: '#',
            publishedAt: new Date().toISOString(),
            source: 'Pune Safety News'
          },
          {
            title: 'Traffic Advisory: Road Work on Mumbai-Pune Expressway',
            description: 'Motorists advised to plan alternate routes due to maintenance work on the expressway.',
            url: '#',
            publishedAt: new Date(Date.now() - 86400000).toISOString(),
            source: 'Traffic Updates'
          },
          {
            title: 'Monsoon Safety Guidelines for Tourists',
            description: 'Important safety tips for visitors during the monsoon season in Pune and surrounding areas.',
            url: '#',
            publishedAt: new Date(Date.now() - 172800000).toISOString(),
            source: 'Tourism Department'
          }
        ],
        note: 'Using mock data - GNEWS_API_KEY not configured'
      });
    }

    // Search for Pune safety-related news
    const searchQueries = ['Pune accident', 'Pune safety', 'Pune emergency'];
    const allArticles = [];

    for (const query of searchQueries) {
      try {
        const response = await fetch(
          `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=in&max=2&apikey=${GNEWS_API_KEY}`
        );

        if (response.ok) {
          const newsData = await response.json();
          if (newsData.articles) {
            allArticles.push(...newsData.articles);
          }
        }
      } catch (e) {
        logger.warn(`News search failed for query: ${query}`);
      }
    }

    // Transform and deduplicate articles
    const seen = new Set();
    const transformedArticles = allArticles
      .filter(article => {
        const key = article.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5)
      .map(article => ({
        title: article.title,
        description: article.description || 'No description available',
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source?.name || 'News Source'
      }));

    res.json({
      success: true,
      data: transformedArticles.length > 0 ? transformedArticles : [
        {
          title: 'Pune Safety Update',
          description: 'Stay informed about safety measures in Pune.',
          url: '#',
          publishedAt: new Date().toISOString(),
          source: 'SafeYatra'
        }
      ]
    });
  } catch (err) {
    logger.error('News API error:', err);
    // Return fallback data on error
    res.json({
      success: true,
      data: [
        {
          title: 'Pune Safety Update',
          description: 'Stay informed about safety measures in Pune.',
          url: '#',
          publishedAt: new Date().toISOString(),
          source: 'SafeYatra'
        }
      ]
    });
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});
