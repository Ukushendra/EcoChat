const express = require('express');
const { protect } = require('../middleware/auth');
const { getNotifications, markAllAsRead, markOneAsRead } = require('../controllers/notificationController');

const router = express.Router();

router.use(protect); // Secure all notification routes

router.get('/', getNotifications);
router.put('/read', markAllAsRead);
router.put('/read/:notificationId', markOneAsRead);

module.exports = router;
