const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Incident = require('../models/Incident');
const RiskZone = require('../models/RiskZone');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcrypt');

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_strong_secret_key';

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Admin authorization
async function isAdmin(req, res, next) {
  try {
    const dbUser = await User.findById(req.user.userId);
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
}

// Log audit action
async function logAudit(adminId, action, resourceType, resourceId, details, ipAddress, userAgent, status = 'success', errorMsg = null) {
  try {
    const auditLog = new AuditLog({
      admin_id: adminId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      change_details: details,
      ip_address: ipAddress,
      user_agent: userAgent,
      status,
      error_message: errorMsg
    });
    await auditLog.save();
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

// ===== USER MANAGEMENT ENDPOINTS =====

// 1. GET /api/admin/users - List all users
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 2. GET /api/admin/users/:id - Get specific user
router.get('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 3. POST /api/admin/users - Create new user (bulk support)
router.post('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { users: usersData, bulk = false } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    let usersToCreate = bulk && Array.isArray(usersData) ? usersData : [req.body];
    const createdUsers = [];
    const errors = [];

    for (const userData of usersToCreate) {
      try {
        const { name, email, password, role = 'user', phone, bio } = userData;

        if (!name || !email || !password) {
          errors.push({ email, error: 'name, email, password required' });
          continue;
        }

        const existing = await User.findOne({ email });
        if (existing) {
          errors.push({ email, error: 'Email already registered' });
          continue;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
          name,
          email,
          password: hashedPassword,
          role,
          phone,
          bio
        });

        await user.save();
        createdUsers.push({ _id: user._id, name: user.name, email: user.email, role: user.role });

        // Log audit
        await logAudit(
          req.user.userId,
          'user_create',
          'user',
          user._id,
          { after: { name, email, role } },
          ipAddress,
          userAgent
        );
      } catch (err) {
        errors.push({ error: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `${createdUsers.length} user(s) created`,
      created: createdUsers.length,
      failed: errors.length,
      data: createdUsers,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 4. PATCH /api/admin/users/:id - Update user
router.patch('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, role, phone, bio } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const before = { name: user.name, email: user.email, role: user.role };

    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ['user', 'admin'].includes(role)) user.role = role;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;

    await user.save();

    const after = { name: user.name, email: user.email, role: user.role };

    await logAudit(
      req.user.userId,
      'user_update',
      'user',
      user._id,
      { before, after },
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 5. DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await logAudit(
      req.user.userId,
      'user_delete',
      'user',
      req.params.id,
      { before: { name: user.name, email: user.email } },
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: { deleted_user_id: user._id, name: user.name }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 6. PATCH /api/admin/users/:id/role - Change user role
router.patch('/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAudit(
      req.user.userId,
      'user_update',
      'user',
      user._id,
      { before: { role: oldRole }, after: { role } },
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: `User role changed from ${oldRole} to ${role}`,
      data: { user_id: user._id, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// ===== AUDIT LOG ENDPOINTS =====

// 7. GET /api/admin/audit-logs - View audit logs
router.get('/audit-logs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { action, admin_id, days = 30, page = 1, limit = 50 } = req.query;
    const filter = {};

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(days));
    filter.timestamp = { $gte: dateFrom };

    if (action) filter.action = action;
    if (admin_id) filter.admin_id = admin_id;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(filter)
      .populate('admin_id', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// ===== HEALTH & DASHBOARD ENDPOINTS =====

// 8. GET /api/admin/health - System health status
router.get('/health', authenticateToken, isAdmin, async (req, res) => {
  try {
    const startTime = Date.now();

    // Check database connection
    const userCount = await User.countDocuments();
    const incidentCount = await Incident.countDocuments();
    const zoneCount = await RiskZone.countDocuments();

    const dbTime = Date.now() - startTime;

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      response_time_ms: dbTime,
      services: {
        database: {
          status: 'connected',
          collections: {
            users: userCount,
            incidents: incidentCount,
            risk_zones: zoneCount
          }
        },
        api: {
          status: 'operational',
          uptime_hours: (process.uptime() / 3600).toFixed(2)
        }
      }
    };

    res.json({ success: true, data: health });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: err.message
    });
  }
});

// 9. GET /api/admin/dashboard/summary - Dashboard summary
router.get('/dashboard/summary', authenticateToken, isAdmin, async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        admins: await User.countDocuments({ role: 'admin' }),
        regular_users: await User.countDocuments({ role: 'user' })
      },
      incidents: {
        total: await Incident.countDocuments(),
        by_status: {
          reported: await Incident.countDocuments({ status: 'reported' }),
          investigating: await Incident.countDocuments({ status: 'investigating' }),
          resolved: await Incident.countDocuments({ status: 'resolved' }),
          closed: await Incident.countDocuments({ status: 'closed' })
        },
        by_severity: {
          critical: await Incident.countDocuments({ severity: 'critical' }),
          high: await Incident.countDocuments({ severity: 'high' }),
          medium: await Incident.countDocuments({ severity: 'medium' }),
          low: await Incident.countDocuments({ severity: 'low' })
        }
      },
      zones: {
        total: await RiskZone.countDocuments(),
        by_risk_level: {
          critical: await RiskZone.countDocuments({ riskLevel: 'critical' }),
          high: await RiskZone.countDocuments({ riskLevel: 'high' }),
          medium: await RiskZone.countDocuments({ riskLevel: 'medium' }),
          low: await RiskZone.countDocuments({ riskLevel: 'low' })
        }
      },
      audit_logs: {
        total: await AuditLog.countDocuments(),
        last_7_days: await AuditLog.countDocuments({
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      }
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 10. GET /api/admin/dashboard/activity - Recent activity
router.get('/dashboard/activity', authenticateToken, isAdmin, async (req, res) => {
  try {
    const recentIncidents = await Incident.find()
      .populate('userId', 'name email')
      .populate('risk_zone_id', 'name')
      .sort({ created_at: -1 })
      .limit(5);

    const recentAuditLogs = await AuditLog.find()
      .populate('admin_id', 'name email')
      .sort({ timestamp: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .select('-password')
      .sort({ created_at: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        recent_incidents: recentIncidents,
        recent_audit_logs: recentAuditLogs,
        recent_users: recentUsers
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// ===== SYSTEM CONFIGURATION ENDPOINTS =====

// 11. GET /api/admin/config - Get system configuration
router.get('/config', authenticateToken, isAdmin, async (req, res) => {
  try {
    const config = {
      system: {
        name: 'Smart Tourist Safety System',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      features: {
        incidents: {
          enabled: true,
          max_severity_levels: 4,
          statuses: ['reported', 'investigating', 'resolved', 'closed']
        },
        risk_zones: {
          enabled: true,
          geofencing: true,
          heatmap: true
        },
        profiles: {
          enabled: true,
          emergency_contacts: true,
          preferences: true
        },
        advanced: {
          search: true,
          predictions: true,
          reports: true,
          exports: ['csv', 'pdf']
        }
      },
      limits: {
        max_users: 10000,
        max_incidents_per_user: 100,
        max_audit_logs_retention_days: 365,
        file_upload_max_mb: 50
      },
      notifications: {
        email_enabled: !!process.env.EMAIL_USER,
        sms_enabled: !!process.env.TWILIO_SID
      }
    };

    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 12. GET /api/admin/analytics/overview - System analytics overview
router.get('/analytics/overview', authenticateToken, isAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const incident30d = await Incident.countDocuments({ created_at: { $gte: thirtyDaysAgo } });
    const user30d = await User.countDocuments({ created_at: { $gte: thirtyDaysAgo } });
    const auditLog30d = await AuditLog.countDocuments({ timestamp: { $gte: thirtyDaysAgo } });

    const avgIncidentsPriority = await Incident.aggregate([
      { $group: { _id: null, avg: { $avg: '$priority_score' } } }
    ]);

    const analytics = {
      period: '30_days',
      metrics: {
        incidents_created: incident30d,
        incidents_per_day: (incident30d / 30).toFixed(2),
        users_created: user30d,
        audit_actions: auditLog30d,
        average_incident_priority: avgIncidentsPriority[0]?.avg?.toFixed(2) || 0
      },
      top_actions: await AuditLog.aggregate([
        { $match: { timestamp: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      top_admins: await AuditLog.aggregate([
        { $match: { timestamp: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$admin_id', actions: { $sum: 1 } } },
        { $sort: { actions: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'admin' } },
        { $project: { admin_name: { $arrayElemAt: ['$admin.name', 0] }, actions: 1 } }
      ])
    };

    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 13. POST /api/admin/backup - Trigger system backup (simulated)
router.post('/backup', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    const backupInfo = {
      backup_id: require('mongoose').Types.ObjectId(),
      timestamp: new Date(),
      collections: {
        users: await User.countDocuments(),
        incidents: await Incident.countDocuments(),
        zones: await RiskZone.countDocuments(),
        audit_logs: await AuditLog.countDocuments()
      },
      status: 'success'
    };

    await logAudit(
      req.user.userId,
      'backup_create',
      'system',
      null,
      { backup_info: backupInfo },
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: 'System backup initiated',
      data: backupInfo
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 14. POST /api/admin/actions - Perform administrative actions
router.post('/actions', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { action, payload } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');
    
    // Validate required fields
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }
    
    // Get WebSocket server instance from app
    const webSocketServer = req.app.get('webSocketServer');
    
    if (!webSocketServer) {
      return res.status(500).json({ error: 'WebSocket server not available' });
    }
    
    // Perform the requested action
    switch(action) {
      case 'broadcast_emergency':
        // Validate emergency broadcast payload
        if (!payload || !payload.message) {
          return res.status(400).json({ error: 'Message is required for emergency broadcast' });
        }
        
        // Use WebSocket server to broadcast emergency
        webSocketServer.broadcastToAdmins('admin:action:performed', {
          action: 'broadcast_emergency',
          adminId: req.user.userId,
          adminName: req.user.name,
          payload,
          timestamp: new Date()
        });
        
        // Also broadcast to all users
        webSocketServer.broadcastToRoom('notifications_room', 'emergency:alert', {
          ...payload,
          adminId: req.user.userId,
          adminName: req.user.name,
          timestamp: new Date()
        });
        
        // Log the action
        await logAudit(
          req.user.userId,
          'emergency_broadcast',
          'system',
          null,
          { action, payload },
          ipAddress,
          userAgent
        );
        
        return res.status(200).json({
          success: true,
          message: 'Emergency broadcast sent successfully',
          data: { action, timestamp: new Date() }
        });
        
      case 'broadcast_notification':
        // Validate notification broadcast payload
        if (!payload || !payload.message) {
          return res.status(400).json({ error: 'Message is required for notification broadcast' });
        }
        
        // Use WebSocket server to broadcast notification
        webSocketServer.broadcastToRoom('notifications_room', 'notification:new', {
          ...payload,
          adminId: req.user.userId,
          adminName: req.user.name,
          timestamp: new Date()
        });
        
        // Log the action
        await logAudit(
          req.user.userId,
          'notification_broadcast',
          'system',
          null,
          { action, payload },
          ipAddress,
          userAgent
        );
        
        return res.status(200).json({
          success: true,
          message: 'Notification broadcast sent successfully',
          data: { action, timestamp: new Date() }
        });
        
      default:
        return res.status(400).json({ error: 'Invalid action specified' });
    }
  } catch (err) {
    console.error('Admin action error:', err);
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

module.exports = router;
