const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // OPTION B: User Profile Enhancements
  phone: { 
    type: String, 
    default: null,
    match: /^[0-9]{10}$/ // Indian phone number format (10 digits)
  },
  
  bio: { 
    type: String, 
    default: '',
    maxlength: 500 
  },
  
  profile_picture: { 
    type: String, 
    default: null 
    // URL to profile picture (can be stored in cloud storage)
  },
  
  availability_status: { 
    type: String, 
    enum: ['available', 'busy', 'away', 'offline'], 
    default: 'available' 
  },
  
  emergency_contacts: [
    {
      name: { type: String, required: true },
      relationship: { type: String }, // 'parent', 'spouse', 'sibling', 'friend', etc.
      phone: { 
        type: String, 
        required: true,
        match: /^[0-9]{10}$/
      },
      email: { type: String },
      is_primary: { type: Boolean, default: false }
    }
  ],
  
  preferences: {
    language: { 
      type: String, 
      enum: ['en', 'hi', 'mr'], 
      default: 'en' 
    },
    notifications: {
      email_alerts: { type: Boolean, default: true },
      sms_alerts: { type: Boolean, default: true },
      push_notifications: { type: Boolean, default: true }
    },
    privacy: {
      show_profile: { type: Boolean, default: true },
      allow_location_sharing: { type: Boolean, default: false },
      allow_contact_sharing: { type: Boolean, default: false }
    },
    safety: {
      emergency_mode_enabled: { type: Boolean, default: false },
      trusted_contacts_only: { type: Boolean, default: false },
      sos_enabled: { type: Boolean, default: true }
    }
  },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

module.exports = User;
