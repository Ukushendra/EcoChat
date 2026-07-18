const Message = require('../models/Message');
const Chat = require('../models/Chat');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');
const { getReceiverSocketId, userActiveChat } = require('../socket/socket');

// Send a message (saves to DB and emits socket event)
const sendMessage = async (req, res) => {
  const { chatId, message } = req.body;
  const senderId = req.user._id;

  if (!chatId || !message) {
    return res.status(400).json({ success: false, message: 'Chat ID and message content are required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Ensure sender is participant
    const isParticipant = chat.participants.includes(senderId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this chat' });
    }

    const receiverId = chat.participants.find((p) => p.toString() !== senderId.toString());

    // Check blocked status
    const blockCheck = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      status: 'blocked',
    });

    if (blockCheck) {
      return res.status(403).json({ success: false, message: 'You cannot send messages to this user' });
    }

    // Check if the receiver currently has this chat open
    const isReceiverInActiveChat = userActiveChat[receiverId] === chatId;
    const messageStatus = isReceiverInActiveChat ? 'read' : 'delivered';

    // Create the message
    const newMessage = new Message({
      chat: chatId,
      sender: senderId,
      receiver: receiverId,
      message: message.trim(),
      status: messageStatus,
    });

    await newMessage.save();

    // Update lastMessage in chat
    chat.lastMessage = newMessage._id;
    await chat.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name username profilePicture')
      .populate('receiver', 'name username profilePicture');

    // Deliver via Socket
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId && req.io) {
      req.io.to(receiverSocketId).emit('newMessage', populatedMessage);
      
      // If receiver does not have the chat active, create an unread message notification and send alert
      if (!isReceiverInActiveChat) {
        const notification = await Notification.create({
          recipient: receiverId,
          sender: senderId,
          type: 'unread_message',
          data: { chatId, messageId: newMessage._id },
        });

        req.io.to(receiverSocketId).emit('newNotification', {
          _id: notification._id,
          type: 'unread_message',
          sender: {
            _id: req.user._id,
            name: req.user.name,
            username: req.user.username,
            profilePicture: req.user.profilePicture,
          },
          data: { chatId, message: message.trim() },
          createdAt: notification.createdAt,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error('Send message HTTP error:', error);
    res.status(500).json({ success: false, message: 'Server error sending message' });
  }
};

// Fetch message history for a chat & mark incoming messages as read
const getMessages = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Check participant
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view these messages' });
    }

    // Mark messages sent by the OTHER participant in this chat as READ
    const otherParticipantId = chat.participants.find((p) => p.toString() !== userId.toString());
    
    await Message.updateMany(
      { chat: chatId, receiver: userId, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );

    // Delete corresponding unread_message notifications
    await Notification.deleteMany({
      recipient: userId,
      type: 'unread_message',
      'data.chatId': chatId,
    });

    // Notify other user via socket that their messages were read
    const otherUserSocketId = getReceiverSocketId(otherParticipantId);
    if (otherUserSocketId && req.io) {
      req.io.to(otherUserSocketId).emit('messagesRead', { chatId });
    }

    // Fetch messages
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name username profilePicture')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching messages' });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};
