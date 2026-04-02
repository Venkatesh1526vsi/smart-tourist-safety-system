const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const router = express.Router();
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

// ===== ENDPOINTS =====

// 1. GET /api/profile/me - Get current user's profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ 
      success: true, 
      data: user 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 2. GET /api/profile/:userId - Get public profile of another user
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'name bio profile_picture availability_status created_at'
    );
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check privacy settings
    const privateUser = await User.findById(req.params.userId);
    if (!privateUser.preferences.privacy.show_profile && req.user.userId !== req.params.userId) {
      return res.status(403).json({ error: 'User profile is private' });
    }

    res.json({ 
      success: true, 
      data: user 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 3. PATCH /api/profile/update - Update basic profile information
router.patch('/update', authenticateToken, async (req, res) => {
  try {
    const { name, bio, phone } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (phone) {
      // Validate phone format
      if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ error: 'Invalid phone format (must be 10 digits)' });
      }
      updates.phone = phone;
    }

    updates.updated_at = new Date();

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 4. PATCH /api/profile/picture - Update profile picture
router.patch('/picture', authenticateToken, async (req, res) => {
  try {
    const { picture_url } = req.body;

    if (!picture_url) {
      return res.status(400).json({ error: 'picture_url is required' });
    }

    // Optional: Validate URL format
    try {
      new URL(picture_url);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        $set: { 
          profile_picture: picture_url,
          updated_at: new Date()
        }
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile picture updated',
      data: { profile_picture: updatedUser.profile_picture }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 5. PATCH /api/profile/emergency-contacts - Manage emergency contacts
router.patch('/emergency-contacts', authenticateToken, async (req, res) => {
  try {
    const { action, contact } = req.body;

    if (!action || !['add', 'update', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'action must be add, update, or delete' });
    }

    let updatedUser;

    if (action === 'add') {
      if (!contact.name || !contact.phone) {
        return res.status(400).json({ error: 'name and phone are required' });
      }
      if (!/^[0-9]{10}$/.test(contact.phone)) {
        return res.status(400).json({ error: 'Invalid phone format' });
      }

      updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        { 
          $push: { emergency_contacts: contact },
          $set: { updated_at: new Date() }
        },
        { new: true, runValidators: true }
      ).select('-password');
    } 
    else if (action === 'update') {
      if (!contact.contact_id || !contact.name || !contact.phone) {
        return res.status(400).json({ error: 'contact_id, name, and phone are required' });
      }

      updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        { 
          $set: { 
            'emergency_contacts.$[elem].name': contact.name,
            'emergency_contacts.$[elem].phone': contact.phone,
            'emergency_contacts.$[elem].relationship': contact.relationship,
            'emergency_contacts.$[elem].email': contact.email,
            updated_at: new Date()
          }
        },
        { 
          arrayFilters: [{ 'elem._id': contact.contact_id }],
          new: true 
        }
      ).select('-password');
    } 
    else if (action === 'delete') {
      if (!contact.contact_id) {
        return res.status(400).json({ error: 'contact_id is required' });
      }

      updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        { 
          $pull: { emergency_contacts: { _id: contact.contact_id } },
          $set: { updated_at: new Date() }
        },
        { new: true }
      ).select('-password');
    }

    res.json({
      success: true,
      message: `Emergency contact ${action}d successfully`,
      data: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 6. PATCH /api/profile/preferences - Update user preferences
router.patch('/preferences', authenticateToken, async (req, res) => {
  try {
    const { language, notifications, privacy, safety } = req.body;
    const updates = { updated_at: new Date() };

    if (language) {
      if (!['en', 'hi', 'mr'].includes(language)) {
        return res.status(400).json({ error: 'Invalid language' });
      }
      updates['preferences.language'] = language;
    }

    if (notifications) {
      if (notifications.email_alerts !== undefined) 
        updates['preferences.notifications.email_alerts'] = notifications.email_alerts;
      if (notifications.sms_alerts !== undefined) 
        updates['preferences.notifications.sms_alerts'] = notifications.sms_alerts;
      if (notifications.push_notifications !== undefined) 
        updates['preferences.notifications.push_notifications'] = notifications.push_notifications;
    }

    if (privacy) {
      if (privacy.show_profile !== undefined) 
        updates['preferences.privacy.show_profile'] = privacy.show_profile;
      if (privacy.allow_location_sharing !== undefined) 
        updates['preferences.privacy.allow_location_sharing'] = privacy.allow_location_sharing;
      if (privacy.allow_contact_sharing !== undefined) 
        updates['preferences.privacy.allow_contact_sharing'] = privacy.allow_contact_sharing;
    }

    if (safety) {
      if (safety.emergency_mode_enabled !== undefined) 
        updates['preferences.safety.emergency_mode_enabled'] = safety.emergency_mode_enabled;
      if (safety.trusted_contacts_only !== undefined) 
        updates['preferences.safety.trusted_contacts_only'] = safety.trusted_contacts_only;
      if (safety.sos_enabled !== undefined) 
        updates['preferences.safety.sos_enabled'] = safety.sos_enabled;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 7. PATCH /api/profile/availability - Update availability status
router.patch('/availability', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['available', 'busy', 'away', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        $set: { 
          availability_status: status,
          updated_at: new Date()
        }
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Availability status updated',
      data: { availability_status: updatedUser.availability_status }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 8. GET /api/profile/search - Search users (for adding emergency contacts)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user.userId } // Exclude self
    })
      .select('_id name email profile_picture bio')
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// 9. GET /api/profile/stats/summary - Get profile completion stats
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    // Calculate profile completion percentage
    let completionScore = 0;
    const checks = {};

    // Basic info (25%)
    checks.has_phone = !!user.phone;
    checks.has_bio = !!user.bio;
    checks.has_picture = !!user.profile_picture;
    
    // Emergency contacts (25%)
    checks.has_emergency_contacts = user.emergency_contacts.length > 0;
    checks.has_primary_contact = user.emergency_contacts.some(c => c.is_primary);
    
    // Preferences configured (25%)
    checks.notifications_configured = user.preferences.notifications.email_alerts || 
                                     user.preferences.notifications.sms_alerts;
    checks.privacy_configured = true; // Always true since defaults exist
    
    // Safety settings (25%)
    checks.sos_enabled = user.preferences.safety.sos_enabled;
    checks.availability_status_set = user.availability_status !== 'available';

    // Calculate score
    const total = Object.keys(checks).length;
    const completed = Object.values(checks).filter(v => v).length;
    completionScore = Math.round((completed / total) * 100);

    res.json({
      success: true,
      stats: {
        profile_completion: completionScore,
        checks,
        recommendations: generateRecommendations(checks)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

// Helper function to generate recommendations
function generateRecommendations(checks) {
  const recommendations = [];
  
  if (!checks.has_phone) recommendations.push('Add your phone number for better communication');
  if (!checks.has_bio) recommendations.push('Add a bio to help other users know you better');
  if (!checks.has_picture) recommendations.push('Upload a profile picture');
  if (!checks.has_emergency_contacts) recommendations.push('Add emergency contacts for safety');
  if (!checks.has_primary_contact) recommendations.push('Mark a primary emergency contact');
  if (!checks.sos_enabled) recommendations.push('Enable SOS feature for quick emergency assistance');

  return recommendations;
}

module.exports = router;
