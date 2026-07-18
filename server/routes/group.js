const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');
const {
  createGroup,
  getMyGroups,
  getGroupDetails,
  updateGroupDetails,
  deleteGroup,
  addGroupMembers,
  removeGroupMember,
  updateMemberRole,
  transferOwnership,
  getGroupMessages,
  sendGroupMessage,
} = require('../controllers/groupController');

const router = express.Router();

// General group list and creation
router.post('/', protect, upload.single('image'), createGroup);
router.get('/', protect, getMyGroups);

// Group details & updates
router.get('/:id', protect, getGroupDetails);
router.put('/:id', protect, upload.single('image'), updateGroupDetails);
router.delete('/:id', protect, deleteGroup);

// Member adjustments
router.post('/:id/members', protect, addGroupMembers);
router.delete('/:id/members/:userId', protect, removeGroupMember);
router.put('/:id/role', protect, updateMemberRole);
router.put('/:id/transfer', protect, transferOwnership);

// Messaging routes
router.get('/:id/messages', protect, getGroupMessages);
router.post('/:id/messages', protect, upload.single('image'), sendGroupMessage);

module.exports = router;
