const express = require('express');
const router = express.Router();
const RiskZone = require('../models/RiskZone');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * GET /api/risk-zones
 * Get all risk zones (public endpoint for map display)
 */
router.get('/', async (req, res) => {
  try {
    const riskLevel = req.query.riskLevel;
    
    let query = {};
    if (riskLevel && ['low', 'medium', 'high', 'critical'].includes(riskLevel)) {
      query.riskLevel = riskLevel;
    }
    
    const zones = await RiskZone.find(query)
      .select('name description riskLevel polygon center radius')
      .populate('createdBy', 'name email');
    
    res.json({
      success: true,
      count: zones.length,
      data: zones
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching risk zones',
      error: err.message 
    });
  }
});

/**
 * GET /api/risk-zones/:id
 * Get single risk zone by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const zone = await RiskZone.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('incidents');
    
    if (!zone) {
      return res.status(404).json({ 
        success: false, 
        message: 'Risk zone not found' 
      });
    }
    
    res.json({
      success: true,
      data: zone
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching risk zone',
      error: err.message 
    });
  }
});

/**
 * POST /api/risk-zones
 * Create new risk zone (admin only)
 */
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, riskLevel, polygon, center, radius } = req.body;
    
    // Validation
    if (!name || !riskLevel || !polygon || !center) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, riskLevel, polygon, center'
      });
    }
    
    if (!['low', 'medium', 'high', 'critical'].includes(riskLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid risk level. Must be: low, medium, high, or critical'
      });
    }
    
    // Validate polygon format (at least 3 points, each [lat, lng])
    if (!Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Polygon must have at least 3 coordinate points'
      });
    }
    
    const newZone = new RiskZone({
      name,
      description: description || '',
      riskLevel,
      polygon,
      center,
      radius: radius || 1,
      createdBy: req.user.id
    });
    
    const savedZone = await newZone.save();
    
    res.status(201).json({
      success: true,
      message: 'Risk zone created successfully',
      data: savedZone
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error creating risk zone',
      error: err.message
    });
  }
});

/**
 * PUT /api/risk-zones/:id
 * Update risk zone (admin only)
 */
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, riskLevel, polygon, center, radius } = req.body;
    
    let zone = await RiskZone.findById(req.params.id);
    
    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Risk zone not found'
      });
    }
    
    // Update fields if provided
    if (name) zone.name = name;
    if (description !== undefined) zone.description = description;
    if (riskLevel) {
      if (!['low', 'medium', 'high', 'critical'].includes(riskLevel)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid risk level'
        });
      }
      zone.riskLevel = riskLevel;
    }
    if (polygon) {
      if (polygon.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Polygon must have at least 3 points'
        });
      }
      zone.polygon = polygon;
    }
    if (center) zone.center = center;
    if (radius) zone.radius = radius;
    
    const updatedZone = await zone.save();
    
    res.json({
      success: true,
      message: 'Risk zone updated successfully',
      data: updatedZone
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating risk zone',
      error: err.message
    });
  }
});

/**
 * DELETE /api/risk-zones/:id
 * Delete risk zone (admin only)
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const zone = await RiskZone.findByIdAndDelete(req.params.id);
    
    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Risk zone not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Risk zone deleted successfully',
      data: zone
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting risk zone',
      error: err.message
    });
  }
});

/**
 * POST /api/risk-zones/check-location
 * Check if a location is within any risk zone
 */
router.post('/check-location', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Missing latitude or longitude'
      });
    }
    
    // Find zones using geospatial query
    const zones = await RiskZone.find({
      center: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: 5000 // 5km radius in meters
        }
      }
    });
    
    res.json({
      success: true,
      location: { latitude, longitude },
      nearbyZones: zones,
      isSafe: zones.length === 0 || zones.every(z => z.riskLevel === 'low')
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error checking location',
      error: err.message
    });
  }
});

/**
 * GET /api/risk-zones/stats/summary
 * Get risk zone statistics (admin only)
 */
router.get('/stats/summary', adminAuth, async (req, res) => {
  try {
    const stats = await RiskZone.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const total = await RiskZone.countDocuments();
    
    res.json({
      success: true,
      total,
      byRiskLevel: stats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: err.message
    });
  }
});

/**
 * GET /api/risk-zones/heatmap/data
 * Get incident density heatmap data for visualization
 */
router.get('/heatmap/data', async (req, res) => {
  try {
    const zones = await RiskZone.find({}, {
      name: 1,
      center: 1,
      radius: 1,
      riskLevel: 1,
      incident_count: 1,
      incident_density: 1,
      last_incident_date: 1,
      alert_severity: 1
    });

    // Transform data for heatmap visualization
    const heatmapData = zones.map(zone => ({
      id: zone._id,
      name: zone.name,
      center: zone.center,
      radius: zone.radius,
      riskLevel: zone.riskLevel,
      incidentCount: zone.incident_count,
      incidentDensity: zone.incident_density,
      lastIncident: zone.last_incident_date,
      severity: zone.alert_severity,
      intensity: (zone.incident_count / 10) * 100 // Normalize for visualization
    }));

    res.json({
      success: true,
      count: heatmapData.length,
      data: heatmapData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching heatmap data',
      error: err.message
    });
  }
});

/**
 * POST /api/risk-zones/:id/calculate-risk
 * Calculate effective risk considering weather and time
 */
router.post('/:id/calculate-risk', async (req, res) => {
  try {
    const { weather = 'normal', hour = new Date().getHours() } = req.body;
    
    const zone = await RiskZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Risk zone not found'
      });
    }

    let effectiveRisk = 1.0; // Base risk multiplier
    let factors = [];

    // Apply weather multiplier
    if (weather === 'rain' || weather === 'storm') {
      effectiveRisk *= zone.weather_multiplier;
      factors.push(`weather: ${zone.weather_multiplier}x`);
    }

    // Apply peak hours multiplier
    if (zone.peak_hours.enabled) {
      const currentHour = hour;
      const inPeakHours = zone.peak_hours.start_hour <= zone.peak_hours.end_hour
        ? currentHour >= zone.peak_hours.start_hour && currentHour < zone.peak_hours.end_hour
        : currentHour >= zone.peak_hours.start_hour || currentHour < zone.peak_hours.end_hour;

      if (inPeakHours) {
        effectiveRisk *= zone.peak_hours.multiplier;
        factors.push(`peak_hours: ${zone.peak_hours.multiplier}x`);
      }
    }

    // Calculate base risk level numeric value
    const riskLevelMap = { low: 1, medium: 2, high: 3, critical: 4 };
    const baseRisk = riskLevelMap[zone.riskLevel];
    const finalRisk = Math.min(4, baseRisk * effectiveRisk);

    // Map back to risk level
    const riskLevelReverse = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };
    const effectiveRiskLevel = riskLevelReverse[Math.ceil(finalRisk)];

    res.json({
      success: true,
      zoneId: zone._id,
      zoneName: zone.name,
      baseRiskLevel: zone.riskLevel,
      effectiveRiskLevel: effectiveRiskLevel,
      effectiveRiskMultiplier: effectiveRisk.toFixed(2),
      factors: factors,
      weather: weather,
      currentHour: hour,
      isPeakHours: zone.peak_hours.enabled && 
        (zone.peak_hours.start_hour <= zone.peak_hours.end_hour
          ? hour >= zone.peak_hours.start_hour && hour < zone.peak_hours.end_hour
          : hour >= zone.peak_hours.start_hour || hour < zone.peak_hours.end_hour)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error calculating risk',
      error: err.message
    });
  }
});

/**
 * PATCH /api/risk-zones/:id/update-weather
 * Update weather multiplier for a zone (admin only)
 */
router.patch('/:id/update-weather', adminAuth, async (req, res) => {
  try {
    const { weather_multiplier } = req.body;

    if (!weather_multiplier || weather_multiplier < 0.5 || weather_multiplier > 3.0) {
      return res.status(400).json({
        success: false,
        message: 'Weather multiplier must be between 0.5 and 3.0'
      });
    }

    const zone = await RiskZone.findByIdAndUpdate(
      req.params.id,
      { weather_multiplier },
      { new: true }
    );

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Risk zone not found'
      });
    }

    res.json({
      success: true,
      message: 'Weather multiplier updated',
      data: {
        zoneId: zone._id,
        zoneName: zone.name,
        weather_multiplier: zone.weather_multiplier
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating weather multiplier',
      error: err.message
    });
  }
});

/**
 * PATCH /api/risk-zones/:id/update-peak-hours
 * Update peak hours configuration (admin only)
 */
router.patch('/:id/update-peak-hours', adminAuth, async (req, res) => {
  try {
    const { enabled, start_hour, end_hour, multiplier } = req.body;

    if (start_hour !== undefined && (start_hour < 0 || start_hour > 23)) {
      return res.status(400).json({ success: false, message: 'Start hour must be 0-23' });
    }
    if (end_hour !== undefined && (end_hour < 0 || end_hour > 23)) {
      return res.status(400).json({ success: false, message: 'End hour must be 0-23' });
    }
    if (multiplier !== undefined && (multiplier < 0.5 || multiplier > 3.0)) {
      return res.status(400).json({ success: false, message: 'Multiplier must be 0.5-3.0' });
    }

    const zone = await RiskZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Risk zone not found' });
    }

    if (enabled !== undefined) zone.peak_hours.enabled = enabled;
    if (start_hour !== undefined) zone.peak_hours.start_hour = start_hour;
    if (end_hour !== undefined) zone.peak_hours.end_hour = end_hour;
    if (multiplier !== undefined) zone.peak_hours.multiplier = multiplier;

    await zone.save();

    res.json({
      success: true,
      message: 'Peak hours updated',
      data: zone.peak_hours
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating peak hours',
      error: err.message
    });
  }
});

module.exports = router;
