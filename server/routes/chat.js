const express = require('express');
const { protect } = require('../middleware/auth');
const { getChats, getOrCreateChat } = require('../controllers/chatController');

const router = express.Router();

router.use(protect); // Secure all chat routes

router.get('/', getChats);
router.post('/', getOrCreateChat);

module.exports = router;
