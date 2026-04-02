const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config');

// General auth middleware: verifies JWT and attaches `user` to req
function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// Admin middleware: verifies JWT and checks user role in DB
async function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    try {
      const dbUser = await User.findById(decoded.userId);
      if (!dbUser) return res.status(404).json({ error: 'User not found' });
      if (dbUser.role !== 'admin') return res.status(403).json({ error: 'Forbidden: admin only' });
      req.user = decoded;
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Server error' });
    }
  });
}

module.exports = { auth, adminAuth };
