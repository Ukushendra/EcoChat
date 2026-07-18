const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');
const {
  onboardUser,
  checkUsernameAvailability,
  updateProfile,
  searchUsers,
  getUserStats,
} = require('../controllers/userController');

const router = express.Router();

// Onboarding route
router.post('/onboard', protect, onboardUser);

// Check username availability
router.get('/check-username', checkUsernameAvailability);

// Update profile details (with optional avatar upload)
router.put('/profile', protect, upload.single('avatar'), updateProfile);

// Search users by username
router.get('/search', protect, searchUsers);

// Get user statistics
router.get('/stats', protect, getUserStats);

module.exports = router;
