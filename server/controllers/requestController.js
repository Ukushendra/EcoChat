const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const { getReceiverSocketId } = require('../socket/socket');

// Send Chat Request
const sendChatRequest = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  if (!receiverId) {
    return res.status(400).json({ success: false, message: 'Receiver user ID is required' });
  }

  if (senderId.toString() === receiverId.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot send a chat request to yourself' });
  }

  try {
    const receiverUser = await User.findById(receiverId);
    if (!receiverUser) {
      return res.status(404).json({ success: false, message: 'Recipient user not found' });
    }

    // Check for existing request/block
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'You are already in a chat with this user' });
      }

      if (existing.status === 'blocked') {
        if (existing.sender.toString() === senderId.toString()) {
          return res.status(400).json({ success: false, message: 'You have blocked this user. Unblock them first.' });
        } else {
          return res.status(400).json({ success: false, message: 'You cannot message this user' });
        }
      }

      if (existing.status === 'pending') {
        if (existing.sender.toString() === senderId.toString()) {
          return res.status(400).json({ success: false, message: 'Chat request is already pending' });
        } else {
          // Auto-accept if they sent a request to us
          existing.status = 'accepted';
          await existing.save();

          // Create conversation
          let chat = await Chat.findOne({
            participants: { $all: [senderId, receiverId] },
          });

          if (!chat) {
            chat = new Chat({ participants: [senderId, receiverId] });
            await chat.save();
          }

          // Create notification for other user
          const notification = await Notification.create({
            recipient: receiverId,
            sender: senderId,
            type: 'request_accepted',
            data: { requestId: existing._id, chatId: chat._id },
          });

          // Socket notify
          const receiverSocketId = getReceiverSocketId(receiverId);
          if (receiverSocketId && req.io) {
            req.io.to(receiverSocketId).emit('newNotification', {
              _id: notification._id,
              type: 'request_accepted',
              sender: {
                _id: req.user._id,
                name: req.user.name,
                username: req.user.username,
                profilePicture: req.user.profilePicture,
              },
              data: { chatId: chat._id },
              createdAt: notification.createdAt,
            });
            // Also notify to refresh chats list
            req.io.to(receiverSocketId).emit('chatCreated', chat);
          }

          return res.status(200).json({
            success: true,
            message: 'Auto-accepted pending incoming request from this user!',
            chat,
            request: existing,
          });
        }
      }

      if (existing.status === 'rejected') {
        // Reset rejected request to pending
        existing.sender = senderId;
        existing.receiver = receiverId;
        existing.status = 'pending';
        await existing.save();

        const notification = await Notification.create({
          recipient: receiverId,
          sender: senderId,
          type: 'request_received',
          data: { requestId: existing._id },
        });

        // Socket notify
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId && req.io) {
          req.io.to(receiverSocketId).emit('newNotification', {
            _id: notification._id,
            type: 'request_received',
            sender: {
              _id: req.user._id,
              name: req.user.name,
              username: req.user.username,
              profilePicture: req.user.profilePicture,
            },
            createdAt: notification.createdAt,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Chat request sent successfully',
          request: existing,
        });
      }
    }

    // Create new request
    const request = new FriendRequest({
      sender: senderId,
      receiver: receiverId,
      status: 'pending',
    });
    await request.save();

    // Create notification
    const notification = await Notification.create({
      recipient: receiverId,
      sender: senderId,
      type: 'request_received',
      data: { requestId: request._id },
    });

    // Socket notify
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId && req.io) {
      req.io.to(receiverSocketId).emit('newNotification', {
        _id: notification._id,
        type: 'request_received',
        sender: {
          _id: req.user._id,
          name: req.user.name,
          username: req.user.username,
          profilePicture: req.user.profilePicture,
        },
        createdAt: notification.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Chat request sent successfully',
      request,
    });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ success: false, message: 'Server error sending request' });
  }
};

// Accept Chat Request
const acceptChatRequest = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  try {
    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.receiver.toString() !== userId.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to accept this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    request.status = 'accepted';
    await request.save();

    // Create chat
    let chat = await Chat.findOne({
      participants: { $all: [request.sender, request.receiver] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [request.sender, request.receiver],
      });
      await chat.save();
    }

    // Create Notification
    const notification = await Notification.create({
      recipient: request.sender,
      sender: userId,
      type: 'request_accepted',
      data: { requestId: request._id, chatId: chat._id },
    });

    // Socket notify
    const receiverSocketId = getReceiverSocketId(request.sender);
    if (receiverSocketId && req.io) {
      req.io.to(receiverSocketId).emit('newNotification', {
        _id: notification._id,
        type: 'request_accepted',
        sender: {
          _id: userId,
          name: req.user.name,
          username: req.user.username,
          profilePicture: req.user.profilePicture,
        },
        data: { chatId: chat._id },
        createdAt: notification.createdAt,
      });
      // Tell them to refresh chats
      req.io.to(receiverSocketId).emit('chatCreated', chat);
    }

    res.status(200).json({
      success: true,
      message: 'Chat request accepted',
      chat,
      request,
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ success: false, message: 'Server error accepting request' });
  }
};

// Reject Chat Request
const rejectChatRequest = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  try {
    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.receiver.toString() !== userId.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    request.status = 'rejected';
    await request.save();

    const notification = await Notification.create({
      recipient: request.sender,
      sender: userId,
      type: 'request_rejected',
      data: { requestId: request._id },
    });

    // Socket notify
    const receiverSocketId = getReceiverSocketId(request.sender);
    if (receiverSocketId && req.io) {
      req.io.to(receiverSocketId).emit('newNotification', {
        _id: notification._id,
        type: 'request_rejected',
        sender: {
          _id: userId,
          name: req.user.name,
          username: req.user.username,
        },
        createdAt: notification.createdAt,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chat request rejected',
      request,
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Server error rejecting request' });
  }
};

// Block User
const blockUser = async (req, res) => {
  const { userIdToBlock } = req.body;
  const userId = req.user._id;

  if (!userIdToBlock) {
    return res.status(400).json({ success: false, message: 'User ID to block is required' });
  }

  if (userId.toString() === userIdToBlock.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot block yourself' });
  }

  try {
    let request = await FriendRequest.findOne({
      $or: [
        { sender: userId, receiver: userIdToBlock },
        { sender: userIdToBlock, receiver: userId },
      ],
    });

    if (request) {
      request.sender = userId;
      request.receiver = userIdToBlock;
      request.status = 'blocked';
      await request.save();
    } else {
      request = new FriendRequest({
        sender: userId,
        receiver: userIdToBlock,
        status: 'blocked',
      });
      await request.save();
    }

    // Force disconnect socket active chat if open
    const blockedSocketId = getReceiverSocketId(userIdToBlock);
    if (blockedSocketId && req.io) {
      req.io.to(blockedSocketId).emit('blockedByUser', { blockerId: userId });
    }

    res.status(200).json({
      success: true,
      message: 'User blocked successfully',
      request,
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ success: false, message: 'Server error blocking user' });
  }
};

// Unblock User
const unblockUser = async (req, res) => {
  const { userIdToUnblock } = req.body;
  const userId = req.user._id;

  if (!userIdToUnblock) {
    return res.status(400).json({ success: false, message: 'User ID to unblock is required' });
  }

  try {
    const request = await FriendRequest.findOne({
      sender: userId,
      receiver: userIdToUnblock,
      status: 'blocked',
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Block relationship not found' });
    }

    await FriendRequest.deleteOne({ _id: request._id });

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ success: false, message: 'Server error unblocking user' });
  }
};

// Get Pending Requests
const getPendingRequests = async (req, res) => {
  const userId = req.user._id;

  try {
    const requests = await FriendRequest.find({
      receiver: userId,
      status: 'pending',
    })
      .populate('sender', 'name username profilePicture about onlineStatus lastSeen')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching pending requests' });
  }
};

// Get Sent Requests
const getSentRequests = async (req, res) => {
  const userId = req.user._id;

  try {
    const requests = await FriendRequest.find({
      sender: userId,
      status: 'pending',
    })
      .populate('receiver', 'name username profilePicture about onlineStatus lastSeen')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching sent requests' });
  }
};

// Get list of blocked users
const getBlockedUsers = async (req, res) => {
  const userId = req.user._id;

  try {
    const blocked = await FriendRequest.find({
      sender: userId,
      status: 'blocked',
    })
      .populate('receiver', 'name username profilePicture about onlineStatus')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      blocked,
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching blocked users' });
  }
};

module.exports = {
  sendChatRequest,
  acceptChatRequest,
  rejectChatRequest,
  blockUser,
  unblockUser,
  getPendingRequests,
  getSentRequests,
  getBlockedUsers,
};
