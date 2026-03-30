const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  admin_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: { 
    type: String, 
    enum: [
      'user_create', 'user_update', 'user_delete',
      'incident_assign', 'incident_close', 'incident_update',
      'zone_create', 'zone_update', 'zone_delete',
      'config_change', 'audit_view', 'report_generate',
      'system_restart', 'backup_create', 'bulk_operation'
    ],
    required: true 
  },
  resource_type: { 
    type: String, 
    enum: ['user', 'incident', 'zone', 'system', 'report'],
    required: true 
  },
  resource_id: { 
    type: mongoose.Schema.Types.ObjectId,
    default: null 
  },
  resource_name: { 
    type: String,
    default: null 
  },
  change_details: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ip_address: String,
  user_agent: String,
  status: { 
    type: String, 
    enum: ['success', 'failed'],
    default: 'success'
  },
  error_message: String,
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
AuditLogSchema.index({ admin_id: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resource_type: 1, resource_id: 1 });
AuditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

module.exports = AuditLog;
