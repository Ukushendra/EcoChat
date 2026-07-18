const express = require('express');
const { protect } = require('../middleware/auth');
const {
  sendChatRequest,
  acceptChatRequest,
  rejectChatRequest,
  blockUser,
  unblockUser,
  getPendingRequests,
  getSentRequests,
  getBlockedUsers,
} = require('../controllers/requestController');

const router = express.Router();

router.use(protect); // Secure all request routes

router.post('/send', sendChatRequest);
router.put('/accept/:requestId', acceptChatRequest);
router.put('/reject/:requestId', rejectChatRequest);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/pending', getPendingRequests);
router.get('/sent', getSentRequests);
router.get('/blocked', getBlockedUsers);

module.exports = router;
