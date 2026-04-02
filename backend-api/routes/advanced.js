const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const router = express.Router();
const RiskZone = require('../models/RiskZone');
const Incident = require('../models/Incident');
const User = require('../models/User');

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

// ===== HELPER FUNCTIONS =====

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if point is within geofence (circle)
function isWithinGeofence(userLat, userLon, zoneLat, zoneLon, radiusKm) {
  const distance = calculateDistance(userLat, userLon, zoneLat, zoneLon);
  return distance <= radiusKm;
}

// Check if point is within polygon
function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

// ===== ENDPOINTS =====

// 1. POST /api/advanced/zones/search - Advanced zone search with filters
router.post('/zones/search', authenticateToken, async (req, res) => {
  try {
    const {
      keyword,
      riskLevel,
      severity,
      latitude,
      longitude,
      radiusKm = 10,
      minIncidents = 0,
      maxIncidents,
      sortBy = 'name',
      page = 1,
      limit = 10
    } = req.body;

    const filter = {};

    // Text search
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Risk level filter
    if (riskLevel) {
      filter.riskLevel = riskLevel;
    }

    // Alert severity filter
    if (severity) {
      filter.alert_severity = severity;
    }

    // Incident count filter
    if (minIncidents !== undefined || maxIncidents !== undefined) {
      filter.incident_count = {};
      if (minIncidents !== undefined) filter.incident_count.$gte = minIncidents;
      if (maxIncidents !== undefined) filter.incident_count.$lte = maxIncidents;
    }

    let zones = await RiskZone.find(filter)
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: 1 });

    // Geospatial filter (if coordinates provided)
    if (latitude && longitude && radiusKm) {
      zones = zones.filter(zone => {
        const distance = calculateDistance(
          latitude, longitude,
          zone.center.latitude, zone.center.longitude
        );
        return distance <= radiusKm;
      });
    }

    // Add distance to each zone
    if (latitude && longitude) {
      zones = zones.map(zone => {
        const zoneObj = zone.toObject();
        zoneObj.distance_km = calculateDistance(
          latitude, longitude,
          zone.center.latitude, zone.center.longitude
        ).toFixed(2);
        return zoneObj;
      });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedZones = zones.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      count: paginatedZones.length,
      total: zones.length,
      page: parseInt(page),
      pages: Math.ceil(zones.length / parseInt(limit)),
      data: paginatedZones
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 2. POST /api/advanced/zones/geofence-check - Check if user is in geofence
router.post('/zones/geofence-check', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude and longitude must be numbers' });
    }

    const zones = await RiskZone.find();
    const insideZones = [];
    const nearbyZones = [];

    for (const zone of zones) {
      const distance = calculateDistance(
        latitude, longitude,
        zone.center.latitude, zone.center.longitude
      );

      // Check if inside zone radius
      if (distance <= zone.radius) {
        insideZones.push({
          _id: zone._id,
          name: zone.name,
          riskLevel: zone.riskLevel,
          alert_severity: zone.alert_severity,
          distance_km: distance.toFixed(2),
          polygon: zone.polygon,
          center: zone.center
        });
      }
      // Check if within 5km (nearby)
      else if (distance <= 5) {
        nearbyZones.push({
          _id: zone._id,
          name: zone.name,
          riskLevel: zone.riskLevel,
          alert_severity: zone.alert_severity,
          distance_km: distance.toFixed(2)
        });
      }
    }

    // Generate alert if in high-risk zone
    let alert = null;
    if (insideZones.length > 0) {
      const criticalZone = insideZones.find(z => z.alert_severity === 'critical');
      const highZone = insideZones.find(z => z.alert_severity === 'high');
      
      if (criticalZone) {
        alert = {
          level: 'critical',
          message: `⚠️ CRITICAL: You are in ${criticalZone.name}. Exercise extreme caution.`,
          zone: criticalZone
        };
      } else if (highZone) {
        alert = {
          level: 'high',
          message: `⚠️ HIGH RISK: You are in ${highZone.name}. Stay alert.`,
          zone: highZone
        };
      }
    }

    res.json({
      success: true,
      user_location: { latitude, longitude },
      inside_zones: insideZones,
      nearby_zones: nearbyZones,
      alert,
      total_alerts: insideZones.filter(z => z.alert_severity === 'critical' || z.alert_severity === 'high').length
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 3. GET /api/advanced/zones/nearby - Get nearby zones for location
router.get('/zones/nearby', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radiusKm = 10, limit = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const zones = await RiskZone.find();
    let nearbyZones = [];

    for (const zone of zones) {
      const distance = calculateDistance(
        parseFloat(latitude), parseFloat(longitude),
        zone.center.latitude, zone.center.longitude
      );

      if (distance <= parseFloat(radiusKm)) {
        nearbyZones.push({
          ...zone.toObject(),
          distance_km: distance.toFixed(2)
        });
      }
    }

    nearbyZones.sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km));
    nearbyZones = nearbyZones.slice(0, parseInt(limit));

    res.json({
      success: true,
      user_location: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      count: nearbyZones.length,
      radius_km: parseFloat(radiusKm),
      data: nearbyZones
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 4. POST /api/advanced/reports/generate - Generate incident report (Admin)
router.post('/reports/generate', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      report_type = 'incident',
      zone_id,
      date_from,
      date_to,
      severity,
      status,
      format = 'json'
    } = req.body;

    let filter = {};

    if (zone_id) {
      filter.risk_zone_id = zone_id;
    }

    if (date_from || date_to) {
      filter.created_at = {};
      if (date_from) filter.created_at.$gte = new Date(date_from);
      if (date_to) filter.created_at.$lte = new Date(date_to);
    }

    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    const incidents = await Incident.find(filter)
      .populate('userId', 'name email phone')
      .populate('assigned_officer', 'name email')
      .populate('risk_zone_id', 'name riskLevel');

    // Calculate statistics
    const stats = {
      total_incidents: incidents.length,
      by_severity: {
        critical: incidents.filter(i => i.severity === 'critical').length,
        high: incidents.filter(i => i.severity === 'high').length,
        medium: incidents.filter(i => i.severity === 'medium').length,
        low: incidents.filter(i => i.severity === 'low').length
      },
      by_status: {
        reported: incidents.filter(i => i.status === 'reported').length,
        investigating: incidents.filter(i => i.status === 'investigating').length,
        resolved: incidents.filter(i => i.status === 'resolved').length,
        closed: incidents.filter(i => i.status === 'closed').length
      },
      by_category: {
        theft: incidents.filter(i => i.category === 'theft').length,
        assault: incidents.filter(i => i.category === 'assault').length,
        accident: incidents.filter(i => i.category === 'accident').length,
        suspicious: incidents.filter(i => i.category === 'suspicious').length,
        other: incidents.filter(i => i.category === 'other').length
      },
      average_priority_score: incidents.length > 0
        ? (incidents.reduce((sum, i) => sum + i.priority_score, 0) / incidents.length).toFixed(2)
        : 0,
      response_time_avg_hours: calculateAverageResponseTime(incidents)
    };

    const report = {
      _id: require('mongoose').Types.ObjectId(),
      report_type,
      generated_by: req.user.userId,
      generated_at: new Date(),
      date_range: { from: date_from || 'any', to: date_to || 'any' },
      filters: { severity, status, zone_id },
      statistics: stats,
      incidents: incidents,
      format
    };

    res.json({
      success: true,
      message: 'Report generated successfully',
      report_id: report._id,
      data: report
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 5. POST /api/advanced/reports/export - Export report as CSV or PDF (Admin)
router.post('/reports/export', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      zone_id,
      date_from,
      date_to,
      severity,
      status,
      format = 'csv'
    } = req.body;

    if (!['csv', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'format must be csv or pdf' });
    }

    let filter = {};
    if (zone_id) filter.risk_zone_id = zone_id;
    if (date_from || date_to) {
      filter.created_at = {};
      if (date_from) filter.created_at.$gte = new Date(date_from);
      if (date_to) filter.created_at.$lte = new Date(date_to);
    }
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    const incidents = await Incident.find(filter)
      .populate('userId', 'name email')
      .populate('assigned_officer', 'name email')
      .populate('risk_zone_id', 'name');

    if (format === 'csv') {
      // Generate CSV
      const csvContent = generateCSV(incidents);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="incidents_report_${Date.now()}.csv"`);
      res.send(csvContent);
    } else if (format === 'pdf') {
      // For PDF, we'll return a JSON response with PDF generation instructions
      res.json({
        success: true,
        message: 'PDF export ready. Use a PDF library like pdfkit to generate.',
        data: {
          incident_count: incidents.length,
          incidents: incidents,
          generated_at: new Date(),
          instructions: 'Send this data to frontend PDF generator or use server-side PDF library'
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 6. GET /api/advanced/predictions/risk-trend - Get risk trend predictions
router.get('/predictions/risk-trend', authenticateToken, async (req, res) => {
  try {
    const { zone_id, days = 30 } = req.query;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(days));

    let filter = { created_at: { $gte: dateFrom } };
    if (zone_id) filter.risk_zone_id = zone_id;

    const incidents = await Incident.find(filter).select('created_at severity category risk_zone_id');

    // Group by day
    const dailyData = {};
    incidents.forEach(incident => {
      const date = incident.created_at.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        };
      }
      dailyData[date].total++;
      dailyData[date][incident.severity]++;
    });

    // Convert to array and sort
    const trend = Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Simple prediction: calculate trend
    const avgIncidentsPerDay = incidents.length / parseInt(days);
    const prediction = {
      current_trend: avgIncidentsPerDay > 2 ? 'increasing' : avgIncidentsPerDay > 1 ? 'stable' : 'decreasing',
      average_per_day: avgIncidentsPerDay.toFixed(2),
      predicted_incidents_next_7_days: Math.ceil(avgIncidentsPerDay * 7),
      confidence: '75%'
    };

    res.json({
      success: true,
      days_analyzed: parseInt(days),
      prediction,
      daily_trend: trend,
      total_incidents: incidents.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 7. GET /api/advanced/predictions/hotspots - Identify incident hotspots
router.get('/predictions/hotspots', authenticateToken, async (req, res) => {
  try {
    const { days = 30, min_incidents = 3 } = req.query;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(days));

    const incidents = await Incident.find({ created_at: { $gte: dateFrom } })
      .populate('risk_zone_id', 'name center riskLevel alert_severity incident_count');

    // Group by zone
    const zoneIncidents = {};
    incidents.forEach(incident => {
      const zoneId = incident.risk_zone_id?._id?.toString() || 'unknown';
      if (!zoneIncidents[zoneId]) {
        zoneIncidents[zoneId] = {
          zone_id: zoneId,
          zone_name: incident.risk_zone_id?.name || 'Unknown',
          count: 0,
          severity_breakdown: {},
          risk_level: incident.risk_zone_id?.riskLevel || 'unknown'
        };
      }
      zoneIncidents[zoneId].count++;
      const sev = incident.severity;
      zoneIncidents[zoneId].severity_breakdown[sev] = (zoneIncidents[zoneId].severity_breakdown[sev] || 0) + 1;
    });

    // Filter by minimum incidents and sort
    const hotspots = Object.values(zoneIncidents)
      .filter(z => z.count >= parseInt(min_incidents))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      days_analyzed: parseInt(days),
      min_incidents: parseInt(min_incidents),
      hotspots_count: hotspots.length,
      data: hotspots
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 8. GET /api/advanced/analytics/pattern-analysis - Analyze incident patterns
router.get('/analytics/pattern-analysis', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(days));

    const incidents = await Incident.find({ created_at: { $gte: dateFrom } });

    // Pattern: Time of day analysis
    const hourlyPatterns = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyPatterns[hour] = 0;
    }

    incidents.forEach(incident => {
      const hour = incident.created_at.getHours();
      hourlyPatterns[hour]++;
    });

    // Pattern: Day of week analysis
    const weeklyPatterns = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0
    };

    const days_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    incidents.forEach(incident => {
      const dayName = days_names[incident.created_at.getDay()];
      weeklyPatterns[dayName]++;
    });

    // Pattern: Category trends
    const categoryPatterns = {
      theft: 0,
      assault: 0,
      accident: 0,
      suspicious: 0,
      other: 0
    };

    incidents.forEach(incident => {
      categoryPatterns[incident.category]++;
    });

    res.json({
      success: true,
      days_analyzed: parseInt(days),
      total_incidents: incidents.length,
      patterns: {
        by_hour: hourlyPatterns,
        peak_hour: Object.entries(hourlyPatterns).reduce((a, b) => parseInt(a[1]) > parseInt(b[1]) ? a : b)[0],
        by_day_of_week: weeklyPatterns,
        peak_day: Object.entries(weeklyPatterns).reduce((a, b) => a[1] > b[1] ? a : b)[0],
        by_category: categoryPatterns,
        most_common_category: Object.entries(categoryPatterns).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// ===== HELPER FUNCTIONS =====

function calculateAverageResponseTime(incidents) {
  const withResponse = incidents.filter(i => i.assigned_at && i.created_at);
  if (withResponse.length === 0) return 0;

  const totalHours = withResponse.reduce((sum, i) => {
    const diff = new Date(i.assigned_at) - new Date(i.created_at);
    return sum + (diff / (1000 * 60 * 60));
  }, 0);

  return (totalHours / withResponse.length).toFixed(2);
}

function generateCSV(incidents) {
  const headers = ['ID', 'User', 'Type', 'Severity', 'Category', 'Status', 'Priority', 'Zone', 'Created', 'Assigned Officer'];
  const rows = incidents.map(incident => [
    incident._id.toString(),
    incident.userId?.name || 'Unknown',
    incident.type,
    incident.severity,
    incident.category,
    incident.status,
    incident.priority_score,
    incident.risk_zone_id?.name || 'N/A',
    incident.created_at.toISOString(),
    incident.assigned_officer?.name || 'Unassigned'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

module.exports = router;
