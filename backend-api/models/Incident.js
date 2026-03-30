const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // location can be provided by coordinates, or inferred from Location model
  latitude: { type: Number },
  longitude: { type: Number },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  type: { type: String, enum: ['medical','medical emergency', 'theft', 'lost', 'other', 'assault'], required: true },
  description: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['reported', 'investigating', 'resolved', 'closed'], default: 'reported' },
  
  // OPTION A: Enhanced Incident Features
  severity: { 
    type: String, 
    enum: ['critical', 'high', 'medium', 'low'], 
    default: 'medium',
    required: true 
  },
  category: { 
    type: String, 
    enum: ['theft', 'assault', 'accident', 'suspicious', 'other'], 
    default: 'other',
    required: true 
  },
  priority_score: { 
    type: Number, 
    min: 1, 
    max: 100, 
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
  media_attachments: [
    {
      url: String,
      type: String, // 'photo', 'video', 'document'
      uploaded_at: { type: Date, default: Date.now }
    }
  ],
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


