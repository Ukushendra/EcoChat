const Chat = require('../models/Chat');
const FriendRequest = require('../models/FriendRequest');
const Message = require('../models/Message');

// Get all chats/conversations for the logged-in user
const getChats = async (req, res) => {
  const userId = req.user._id;

  try {
    const chats = await Chat.find({
      participants: userId,
    })
      .populate('participants', 'name username profilePicture onlineStatus lastSeen')
      .populate({
        path: 'lastMessage',
        select: 'message sender receiver status createdAt',
      })
      .sort({ updatedAt: -1 });

    // Format chats and append unread count
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const otherParticipant = chat.participants.find(
          (p) => p._id.toString() !== userId.toString()
        );

        // Count messages in this chat, sent by the other participant, where status is NOT 'read'
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: otherParticipant ? otherParticipant._id : null,
          status: { $ne: 'read' },
        });

        return {
          _id: chat._id,
          otherParticipant,
          lastMessage: chat.lastMessage,
          unreadCount,
          updatedAt: chat.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      chats: chatsWithUnread,
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching chats' });
  }
};

// Create or retrieve chat between logged-in user and another user
const getOrCreateChat = async (req, res) => {
  const { participantId } = req.body;
  const userId = req.user._id;

  if (!participantId) {
    return res.status(400).json({ success: false, message: 'Participant user ID is required' });
  }

  try {
    // 1. Verify if relationship is "accepted"
    const relationship = await FriendRequest.findOne({
      $or: [
        { sender: userId, receiver: participantId },
        { sender: participantId, receiver: userId },
      ],
      status: 'accepted',
    });

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'You cannot open a chat with this user unless your chat request is accepted',
      });
    }

    // 2. Find or create the Chat
    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId] },
    }).populate('participants', 'name username profilePicture onlineStatus lastSeen');

    if (!chat) {
      chat = new Chat({
        participants: [userId, participantId],
      });
      await chat.save();
      // Populate participants after saving
      chat = await Chat.findById(chat._id).populate(
        'participants',
        'name username profilePicture onlineStatus lastSeen'
      );
    }

    res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error('Get/create chat error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching chat' });
  }
};

module.exports = {
  getChats,
  getOrCreateChat,
};
