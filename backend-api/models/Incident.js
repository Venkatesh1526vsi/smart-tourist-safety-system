const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, ref: 'User' }, // Accept both String and ObjectId
  // location can be provided by coordinates, or inferred from Location model
  latitude: { type: Number },
  longitude: { type: Number },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  type: { type: String, default: 'other' }, // Removed enum and required
  description: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'reported' }, // Removed enum
  
  // OPTION A: Enhanced Incident Features
  severity: { 
    type: String, 
    default: 'medium' // Removed enum and required
  },
  category: { 
    type: String, 
    default: 'other' // Removed enum and required
  },
  priority_score: { 
    type: Number, 
    default: 50 
  },
  assigned_officer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null 
  },
  assigned_at: { 
    type: Date,
    default: null 
  },
  resolved_at: { 
    type: Date,
    default: null 
  },
  resolved_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null 
  },
  resolution_notes: { 
    type: String, 
    default: '' 
  },
  media_attachments: [{ type: String }], // Changed to simple String array
  witnesses: [
    {
      name: String,
      contact: String,
      statement: String
    }
  ],
  risk_zone_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RiskZone',
    default: null
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: true });

const Incident = mongoose.model('Incident', IncidentSchema);

module.exports = Incident;


