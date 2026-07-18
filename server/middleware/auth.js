const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = req.cookies.accessToken;

  // Check header fallback
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_super_secret_jwt_access_token_key_ecochat_2026');
    req.user = await User.findById(decoded.id).select('-refreshToken');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (req.user.status === 'disabled') {
      return res.status(403).json({ success: false, message: 'Your account has been disabled by an administrator' });
    }
    next();
  } catch (error) {
    console.error('JWT Auth Error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

module.exports = { protect };
