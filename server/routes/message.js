const express = require('express');
const { protect } = require('../middleware/auth');
const { sendMessage, getMessages } = require('../controllers/messageController');

const router = express.Router();

router.use(protect); // Secure all message routes

router.post('/', sendMessage);
router.get('/:chatId', getMessages);

module.exports = router;
