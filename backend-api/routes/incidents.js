const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const User = require('../models/User');
const RiskZone = require('../models/RiskZone');
const { auth, adminAuth } = require('../middleware/auth');

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

// ===== ENDPOINTS =====

// 1. GET /api/incidents - Get all incidents (with pagination & filters)
router.get('/', auth, async (req, res) => {
  console.log("Incoming incidents request"); 
  console.log("User from token:", req.user);
  try {
    const { page = 1, limit = 10, status, severity, category, assigned_officer } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    if (assigned_officer) filter.assigned_officer = assigned_officer;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const incidents = await Incident.find(filter)
      .populate('userId', 'name email')
      .populate('assigned_officer', 'name email')
      .populate('resolved_by', 'name email')
      .populate('risk_zone_id', 'name riskLevel')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Incident.countDocuments(filter);

    res.json({
      success: true,
      count: incidents.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: incidents
    });
  } catch (err) {
    console.log("Error in GET /api/incidents:", err);
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 2. GET /api/incidents/:id - Get specific incident
router.get('/:id', auth, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('assigned_officer', 'name email')
      .populate('resolved_by', 'name email')
      .populate('risk_zone_id', 'name riskLevel polygon');

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 3. POST /api/incidents - Create new incident (enhanced)
router.post('/', auth, async (req, res) => {
  try {
    const { type, description, latitude, longitude, locationId, severity, category, risk_zone_id, witnesses, media_attachments } = req.body;

    if (!type) return res.status(400).json({ error: 'type is required' });

    const incidentData = {
      userId: req.user.userId,
      type,
      description: description || '',
      severity: severity || 'medium',
      category: category || 'other',
      priority_score: calculatePriority(severity, category),
      timestamp: new Date(),
      status: 'reported'
    };

    if (typeof latitude === 'number') incidentData.latitude = latitude;
    if (typeof longitude === 'number') incidentData.longitude = longitude;
    if (locationId) incidentData.locationId = locationId;
    if (risk_zone_id) incidentData.risk_zone_id = risk_zone_id;
    if (witnesses && Array.isArray(witnesses)) incidentData.witnesses = witnesses;
    if (media_attachments && Array.isArray(media_attachments)) incidentData.media_attachments = media_attachments;

    const incident = new Incident(incidentData);
    await incident.save();

    const populatedIncident = await incident.populate('userId', 'name email');

    res.status(201).json({ 
      success: true,
      message: 'Incident created successfully', 
      data: populatedIncident 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 4. PATCH /api/incidents/:id/assign - Assign incident to officer (Admin only)
router.patch('/:id/assign', auth, isAdmin, async (req, res) => {
  try {
    const { assigned_officer } = req.body;

    if (!assigned_officer) {
      return res.status(400).json({ error: 'assigned_officer is required' });
    }

    // Verify officer exists
    const officer = await User.findById(assigned_officer);
    if (!officer) return res.status(404).json({ error: 'Officer not found' });

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { 
        assigned_officer,
        assigned_at: new Date(),
        status: 'investigating',
        updated_at: new Date()
      },
      { new: true }
    ).populate('assigned_officer', 'name email');

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    res.json({ 
      success: true,
      message: 'Incident assigned successfully',
      data: incident 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 5. PATCH /api/incidents/:id/close - Close incident with resolution (Admin only)
router.patch('/:id/close', auth, isAdmin, async (req, res) => {
  try {
    const { resolution_notes } = req.body;

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'closed',
        resolved_at: new Date(),
        resolved_by: req.user.userId,
        resolution_notes: resolution_notes || '',
        updated_at: new Date()
      },
      { new: true }
    )
      .populate('resolved_by', 'name email')
      .populate('assigned_officer', 'name email');

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    res.json({ 
      success: true,
      message: 'Incident closed successfully',
      data: incident 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 6. PATCH /api/incidents/:id/update-severity - Update severity & priority (Admin)
router.patch('/:id/update-severity', auth, isAdmin, async (req, res) => {
  try {
    const { severity, category } = req.body;

    if (!severity || !category) {
      return res.status(400).json({ error: 'severity and category are required' });
    }

    const priority_score = calculatePriority(severity, category);

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { 
        severity,
        category,
        priority_score,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    res.json({ 
      success: true,
      message: 'Incident severity updated',
      data: incident 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 7. POST /api/incidents/search - Advanced search with filters
router.post('/search', auth, async (req, res) => {
  try {
    const { status, severity, category, priority_min, priority_max, assigned_officer, date_from, date_to, risk_zone_id } = req.body;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    if (assigned_officer) filter.assigned_officer = assigned_officer;
    if (risk_zone_id) filter.risk_zone_id = risk_zone_id;

    if (priority_min !== undefined || priority_max !== undefined) {
      filter.priority_score = {};
      if (priority_min !== undefined) filter.priority_score.$gte = priority_min;
      if (priority_max !== undefined) filter.priority_score.$lte = priority_max;
    }

    if (date_from || date_to) {
      filter.created_at = {};
      if (date_from) filter.created_at.$gte = new Date(date_from);
      if (date_to) filter.created_at.$lte = new Date(date_to);
    }

    const incidents = await Incident.find(filter)
      .populate('userId', 'name email')
      .populate('assigned_officer', 'name email')
      .populate('risk_zone_id', 'name riskLevel')
      .sort({ priority_score: -1, created_at: -1 });

    res.json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 8. POST /api/incidents/bulk-create - Create multiple incidents (Admin)
router.post('/bulk-create', auth, isAdmin, async (req, res) => {
  try {
    const { incidents } = req.body;

    if (!Array.isArray(incidents) || incidents.length === 0) {
      return res.status(400).json({ error: 'incidents array is required and must not be empty' });
    }

    const incidentData = incidents.map(incident => ({
      userId: incident.userId,
      type: incident.type || 'other',
      description: incident.description || '',
      latitude: incident.latitude,
      longitude: incident.longitude,
      severity: incident.severity || 'medium',
      category: incident.category || 'other',
      priority_score: calculatePriority(incident.severity || 'medium', incident.category || 'other'),
      risk_zone_id: incident.risk_zone_id || null,
      timestamp: new Date(),
      status: 'reported'
    }));

    const createdIncidents = await Incident.insertMany(incidentData);

    const populated = await Incident.find({ _id: { $in: createdIncidents.map(i => i._id) } })
      .populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: `${createdIncidents.length} incidents created successfully`,
      count: createdIncidents.length,
      data: populated
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 9. GET /api/incidents/heatmap/data - Get incidents heatmap data
router.get('/heatmap/data', auth, async (req, res) => {
  try {
    const incidents = await Incident.find({ status: { $ne: 'closed' } })
      .populate('risk_zone_id', 'name riskLevel center polygon');

    // Group by risk zone
    const heatmapData = {};
    incidents.forEach(incident => {
      const key = incident.risk_zone_id?._id || 'unassigned';
      if (!heatmapData[key]) {
        heatmapData[key] = {
          zone_id: incident.risk_zone_id?._id,
          zone_name: incident.risk_zone_id?.name || 'Unassigned',
          latitude: incident.latitude,
          longitude: incident.longitude,
          total_incidents: 0,
          by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
          by_category: { theft: 0, assault: 0, accident: 0, suspicious: 0, other: 0 }
        };
      }
      heatmapData[key].total_incidents++;
      heatmapData[key].by_severity[incident.severity]++;
      heatmapData[key].by_category[incident.category]++;
    });

    const data = Object.values(heatmapData);

    res.json({
      success: true,
      count: data.length,
      total_incidents: incidents.length,
      data
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 10. GET /api/incidents/stats/summary - Get incident statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const total = await Incident.countDocuments();
    const by_status = {};
    const statuses = ['reported', 'investigating', 'resolved', 'closed'];
    
    for (const status of statuses) {
      by_status[status] = await Incident.countDocuments({ status });
    }

    const by_severity = {};
    const severities = ['critical', 'high', 'medium', 'low'];
    for (const severity of severities) {
      by_severity[severity] = await Incident.countDocuments({ severity });
    }

    const by_category = {};
    const categories = ['theft', 'assault', 'accident', 'suspicious', 'other'];
    for (const category of categories) {
      by_category[category] = await Incident.countDocuments({ category });
    }

    const avg_priority = await Incident.aggregate([
      { $group: { _id: null, avg: { $avg: '$priority_score' } } }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        by_status,
        by_severity,
        by_category,
        average_priority: avg_priority[0]?.avg || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// Helper function to calculate priority score
function calculatePriority(severity, category) {
  const severityScore = { critical: 40, high: 30, medium: 20, low: 10 };
  const categoryScore = { assault: 30, theft: 25, accident: 20, suspicious: 15, other: 10 };
  
  return (severityScore[severity] || 20) + (categoryScore[category] || 10);
}

module.exports = router;
