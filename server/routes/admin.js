const express = require('express');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const {
  getDashboardStats,
  getDashboardAnalytics,
  getUsersList,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getGroupsList,
  deleteGroup,
  assignGroupOwner,
  seedAdminData,
} = require('../controllers/adminController');

const router = express.Router();

// Dev Seed Endpoint (Protected by JWT, allows the logged-in user to promote themselves to Admin)
router.post('/seed-dev', protect, seedAdminData);

// Admin dashboard routes (Protected by JWT + Admin verification)
router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/analytics', protect, admin, getDashboardAnalytics);

// User Management
router.get('/users', protect, admin, getUsersList);
router.put('/users/:id/status', protect, admin, updateUserStatus);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.delete('/users/:id', protect, admin, deleteUser);

// Group Management
router.get('/groups', protect, admin, getGroupsList);
router.delete('/groups/:id', protect, admin, deleteGroup);
router.put('/groups/:id/owner', protect, admin, assignGroupOwner);

module.exports = router;
