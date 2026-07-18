const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');
const { uploadImage } = require('../utils/cloudinary');

// @desc    Create a new group
// @route   POST /api/groups
const createGroup = async (req, res) => {
  const { name, description, members } = req.body;
  const ownerId = req.user._id;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Group name is required' });
  }

  try {
    let membersList = [];
    if (members) {
      membersList = typeof members === 'string' ? JSON.parse(members) : members;
    }

    const uniqueMembers = [...new Set(membersList.map((m) => m.toString()))];
    
    if (!uniqueMembers.includes(ownerId.toString())) {
      uniqueMembers.push(ownerId.toString());
    }

    if (uniqueMembers.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'A group must contain at least 2 contacts besides the creator',
      });
    }

    let groupImageUrl = '';
    if (req.file) {
      groupImageUrl = await uploadImage(req.file.path);
    }

    const group = new Group({
      name: name.trim(),
      description: description ? description.trim() : '',
      image: groupImageUrl,
      owner: ownerId,
      admins: [],
      members: uniqueMembers,
    });

    await group.save();
    
    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name username profilePicture onlineStatus')
      .populate('owner', 'name username profilePicture');

    // Notify all group members over Socket
    const io = req.app.get('io');
    if (io) {
      uniqueMembers.forEach((mId) => {
        io.to(`user_${mId}`).emit('groupCreated', populatedGroup);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: populatedGroup,
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Failed to create group' });
  }
};

// @desc    Get user's groups
// @route   GET /api/groups
const getMyGroups = async (req, res) => {
  const userId = req.user._id;
  try {
    const groups = await Group.find({ members: userId })
      .populate('owner', 'name username profilePicture')
      .populate('admins', 'name username profilePicture')
      .populate('members', 'name username profilePicture onlineStatus')
      .sort({ updatedAt: -1 });

    const groupsWithLastMsg = await Promise.all(
      groups.map(async (g) => {
        const lastMessage = await GroupMessage.findOne({ groupId: g._id })
          .populate('sender', 'name username profilePicture')
          .sort({ createdAt: -1 });
        return {
          ...g.toObject(),
          lastMessage,
        };
      })
    );

    res.status(200).json({
      success: true,
      groups: groupsWithLastMsg,
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve groups' });
  }
};

// @desc    Get specific group details
// @route   GET /api/groups/:id
const getGroupDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const group = await Group.findById(id)
      .populate('owner', 'name username profilePicture about onlineStatus')
      .populate('admins', 'name username profilePicture about onlineStatus')
      .populate('members', 'name username profilePicture about onlineStatus');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!group.members.some((m) => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not a member of this group' });
    }

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve group details' });
  }
};

// @desc    Edit group metadata (Name, description, image)
// @route   PUT /api/groups/:id
const updateGroupDetails = async (req, res) => {
  const { id } = req.params;
  const { name, description, removeImage } = req.body;
  const userId = req.user._id;

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isOwner = group.owner.toString() === userId.toString();
    const isAdmin = group.admins.some((adminId) => adminId.toString() === userId.toString());

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only owners or admins can edit group settings' });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();

    if (removeImage === 'true' || removeImage === true) {
      group.image = '';
    } else if (req.file) {
      const imageUrl = await uploadImage(req.file.path);
      group.image = imageUrl;
    }

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('owner', 'name username profilePicture')
      .populate('admins', 'name username profilePicture')
      .populate('members', 'name username profilePicture onlineStatus');

    // Socket Notify Room
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${id}`).emit('groupUpdated', populatedGroup);
    }

    res.status(200).json({
      success: true,
      message: 'Group settings updated successfully',
      group: populatedGroup,
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ success: false, message: 'Failed to update group settings' });
  }
};

// @desc    Delete group (Owner only)
// @route   DELETE /api/groups/:id
const deleteGroup = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.owner.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the group owner can delete this group' });
    }

    const memberIds = group.members.map((m) => m.toString());

    await Group.findByIdAndDelete(id);
    await GroupMessage.deleteMany({ groupId: id });

    // Socket Notify Room + members
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${id}`).emit('groupDeleted', { groupId: id });
      memberIds.forEach((mId) => {
        io.to(`user_${mId}`).emit('groupRemovedSelf', { groupId: id });
      });
    }

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete group' });
  }
};

// @desc    Add members to group
// @route   POST /api/groups/:id/members
const addGroupMembers = async (req, res) => {
  const { id } = req.params;
  const { memberIds } = req.body;
  const userId = req.user._id;

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isOwner = group.owner.toString() === userId.toString();
    const isAdmin = group.admins.some((adminId) => adminId.toString() === userId.toString());

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only owners or admins can add members' });
    }

    const inputIds = Array.isArray(memberIds) ? memberIds : [memberIds];
    const newMembers = inputIds.filter((mId) => !group.members.includes(mId));

    if (newMembers.length > 0) {
      group.members.push(...newMembers);
      await group.save();
    }

    const populatedGroup = await Group.findById(group._id)
      .populate('owner', 'name username profilePicture')
      .populate('admins', 'name username profilePicture')
      .populate('members', 'name username profilePicture onlineStatus');

    // Socket Notify
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${id}`).emit('groupUpdated', populatedGroup);
      newMembers.forEach((mId) => {
        io.to(`user_${mId}`).emit('groupCreated', populatedGroup);
      });
    }

    res.status(200).json({
      success: true,
      message: `${newMembers.length} members added successfully`,
      group: populatedGroup,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add group members' });
  }
};

// @desc    Remove member / Leave group
// @route   DELETE /api/groups/:id/members/:userId
const removeGroupMember = async (req, res) => {
  const { id, userId } = req.params;
  const callerId = req.user._id;

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isSelfLeaving = callerId.toString() === userId.toString();
    const isOwner = group.owner.toString() === callerId.toString();
    const isAdmin = group.admins.some((adminId) => adminId.toString() === callerId.toString());

    if (!isSelfLeaving && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'No permission to remove members' });
    }

    if (isSelfLeaving && isOwner) {
      return res.status(400).json({
        success: false,
        message: 'Owner cannot leave before transferring ownership or deleting the group',
      });
    }

    if (!isSelfLeaving && isAdmin && !isOwner) {
      const targetIsAdmin = group.admins.some((adminId) => adminId.toString() === userId.toString());
      const targetIsOwner = group.owner.toString() === userId.toString();
      if (targetIsAdmin || targetIsOwner) {
        return res.status(403).json({ success: false, message: 'Admins cannot remove other admins or owners' });
      }
    }

    group.members = group.members.filter((mId) => mId.toString() !== userId.toString());
    group.admins = group.admins.filter((aId) => aId.toString() !== userId.toString());
    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('owner', 'name username profilePicture')
      .populate('admins', 'name username profilePicture')
      .populate('members', 'name username profilePicture onlineStatus');

    // Socket Notify
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${id}`).emit('groupUpdated', populatedGroup);
      io.to(`user_${userId}`).emit('groupRemovedSelf', { groupId: id });
    }

    res.status(200).json({
      success: true,
      message: isSelfLeaving ? 'Left the group successfully' : 'Member removed successfully',
      group: populatedGroup,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove group member' });
  }
};

// @desc    Promote/Demote role (Owner only)
// @route   PUT /api/groups/:id/role
const updateMemberRole = async (req, res) => {
  const { id } = req.params;
  const { targetUserId, action } = req.body;
  const userId = req.user._id;

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.owner.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only owners can manage admin roles' });
    }

    if (targetUserId === userId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own owner role' });
    }

    if (action === 'promote') {
      if (!group.admins.includes(targetUserId)) {
        group.admins.push(targetUserId);
      }
    } else if (action === 'demote') {
      group.admins = group.admins.filter((adminId) => adminId.toString() !== targetUserId.toString());
    }

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('owner', 'name username profilePicture')
      .populate('admins', 'name username profilePicture')
      .populate('members', 'name username profilePicture onlineStatus');

    // Socket Notify
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${id}`).emit('groupUpdated', populatedGroup);
    }

    res.status(200).json({
      success: true,
      message: `User successfully ${action}d`,
      group: populatedGroup,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update member role' });
  }
};

// @desc    Transfer ownership (Owner only)
// @route   PUT /api/groups/:id/transfer
const transferOwnership = async (req, res) => {
  const { id } = req.params;
  const { newOwnerId } = req.body;
  const userId = req.user._id;

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.owner.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can transfer ownership' });
    }

    if (!group.members.includes(newOwnerId)) {
      return res.status(400).json({ success: false, message: 'New owner must be a member of the group' });
    }

    group.owner = newOwnerId;
    group.admins = group.admins.filter((adminId) => adminId.toString() !== newOwnerId.toString());
    
    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('owner', 'name username profilePicture')
      .populate('admins', 'name username profilePicture')
      .populate('members', 'name username profilePicture onlineStatus');

    // Socket Notify
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${id}`).emit('groupUpdated', populatedGroup);
    }

    res.status(200).json({
      success: true,
      message: 'Group ownership transferred successfully',
      group: populatedGroup,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to transfer ownership' });
  }
};

// @desc    Get group messages (with infinite scroll pagination)
// @route   GET /api/groups/:id/messages
const getGroupMessages = async (req, res) => {
  const { id } = req.params;
  const { limit = 30, before } = req.query;

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these messages' });
    }

    let query = { groupId: id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await GroupMessage.find(query)
      .populate('sender', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve messages' });
  }
};

// @desc    Send a group message
// @route   POST /api/groups/:id/messages
const sendGroupMessage = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const senderId = req.user._id;

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to post to this group' });
    }

    let imageUrl = '';
    let messageType = 'text';
    if (req.file) {
      imageUrl = await uploadImage(req.file.path);
      messageType = 'image';
    }

    if (messageType === 'text' && (!content || !content.trim())) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }

    const message = new GroupMessage({
      groupId: id,
      sender: senderId,
      content: content ? content.trim() : '',
      messageType,
      imageUrl,
    });

    await message.save();
    
    group.updatedAt = new Date();
    await group.save();

    const populatedMsg = await GroupMessage.findById(message._id)
      .populate('sender', 'name username profilePicture');

    // Socket Emit to Room
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${id}`).emit('groupMessageReceived', populatedMsg);
    }

    res.status(201).json({
      success: true,
      message: populatedMsg,
    });
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

module.exports = {
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
};
