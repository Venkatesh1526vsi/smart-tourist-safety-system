// backend-api/models/RiskZone.js

const mongoose = require('mongoose');

const RiskZoneSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  riskLevel: { 
    type: String, 
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  polygon: { 
    type: [[Number]], 
    required: true,
    validate: {
      validator: function(v) {
        // Each coordinate should be [latitude, longitude]
        return Array.isArray(v) && v.length >= 3 && v.every(coord => 
          Array.isArray(coord) && coord.length === 2 && 
          typeof coord[0] === 'number' && typeof coord[1] === 'number'
        );
      },
      message: 'Polygon must have at least 3 coordinates as [latitude, longitude] pairs'
    }
  },
  center: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  radius: { type: Number, default: 1 }, // in km
  // Weather-based risk multiplier (1.0 = normal, 1.5 = 50% higher risk during rain/storms)
  weather_multiplier: { 
    type: Number, 
    default: 1.0,
    min: 0.5,
    max: 3.0,
    validate: {
      validator: function(v) { return v >= 0.5 && v <= 3.0; },
      message: 'Weather multiplier must be between 0.5 and 3.0'
    }
  },
  // Peak hours configuration (when risk is higher)
  peak_hours: {
    enabled: { type: Boolean, default: false },
    start_hour: { type: Number, min: 0, max: 23, default: 18 }, // 6 PM
    end_hour: { type: Number, min: 0, max: 23, default: 6 },    // 6 AM next day
    multiplier: { 
      type: Number, 
      default: 1.5,
      min: 0.5,
      max: 3.0
    }
  },
  // Alert severity when incidents happen in this zone
  alert_severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    validate: {
      validator: function(v) { 
        return ['low', 'medium', 'high', 'critical'].includes(v);
      },
      message: 'Alert severity must be one of: low, medium, high, critical'
    }
  },
  // Incident statistics for heatmap
  incident_count: { type: Number, default: 0 },
  incident_density: { type: Number, default: 0 }, // incidents per square km
  last_incident_date: { type: Date, default: null },
  incidents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Incident' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for geospatial queries
RiskZoneSchema.index({ 'center': '2dsphere' });

// Update timestamp on save
RiskZoneSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RiskZone', RiskZoneSchema);
