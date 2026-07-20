const express = require('express');
const passport = require('passport');
const {
  registerUser,
  loginUser,
  googleCallback,
  getMe,
  refreshAccessToken,
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const frontendUrl = process.env.CLIENT_URL || 'https://eco-chat-eight.vercel.app';

// @desc    Register user (Email/Password)
// @route   POST /api/auth/register
router.post('/register', authLimiter, registerUser);

// @desc    Login user (Email/Password)
// @route   POST /api/auth/login
router.post('/login', authLimiter, loginUser);

// @desc    Auth with Google
// @route   GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// @desc    Google auth callback
// @route   GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${frontendUrl}/login?error=oauth_failed`, session: false }),
  googleCallback
);

// @desc    Get current user profile
// @route   GET /api/auth/me
router.get('/me', protect, getMe);

// @desc    Refresh access token
// @route   POST /api/auth/refresh
router.post('/refresh', authLimiter, refreshAccessToken);

// @desc    Logout user
// @route   POST /api/auth/logout
router.post('/logout', protect, logoutUser);

module.exports = router;
