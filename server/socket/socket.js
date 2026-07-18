const socketIo = require('socket.io');
const User = require('../models/User');

const userSocketMap = {}; // Maps userId -> socketId
const userActiveChat = {}; // Maps userId -> activeChatId

const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

const initSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId;
    
    if (userId && userId !== 'undefined') {
      userSocketMap[userId] = socket.id;
      console.log(`User connected: ${userId} (Socket: ${socket.id})`);

      // Join individual user room for targeting specific users easily
      socket.join(`user_${userId}`);

      // Update user presence to online
      try {
        await User.findByIdAndUpdate(userId, { onlineStatus: 'online' });
        // Notify all clients of updated online users
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
      } catch (err) {
        console.error('Error updating online presence on connection:', err.message);
      }
    }

    // Client sets active chat window (to auto-read messages)
    socket.on('setActiveChat', (chatId) => {
      if (userId && userId !== 'undefined') {
        if (chatId) {
          userActiveChat[userId] = chatId;
          console.log(`User ${userId} set active chat to ${chatId}`);
        } else {
          delete userActiveChat[userId];
        }
      }
    });

    // Handle typing status forwarding (One-to-One)
    socket.on('typing', ({ receiverId, isTyping }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typingStatus', {
          senderId: userId,
          isTyping,
        });
      }
    });

    // Handle manual mark messages as read
    socket.on('markAsRead', async ({ chatId, senderId }) => {
      const receiverSocketId = getReceiverSocketId(senderId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('messagesRead', { chatId });
      }
    });

    // --- GROUP SHIELD EVENTS ---
    
    // Join a group room
    socket.on('joinGroup', ({ groupId }) => {
      if (groupId) {
        socket.join(`group_${groupId}`);
        console.log(`Socket ${socket.id} joined group room: group_${groupId}`);
      }
    });

    // Leave a group room
    socket.on('leaveGroup', ({ groupId }) => {
      if (groupId) {
        socket.leave(`group_${groupId}`);
        console.log(`Socket ${socket.id} left group room: group_${groupId}`);
      }
    });

    // Group typing indicator
    socket.on('groupTyping', ({ groupId, isTyping, username, name }) => {
      if (groupId && userId) {
        socket.to(`group_${groupId}`).emit('groupTypingStatus', {
          groupId,
          userId,
          username: username || '',
          name: name || '',
          isTyping,
        });
      }
    });

    socket.on('disconnect', async () => {
      if (userId && userId !== 'undefined') {
        console.log(`User disconnected: ${userId}`);
        delete userSocketMap[userId];
        delete userActiveChat[userId];

        // Update user presence to offline
        try {
          await User.findByIdAndUpdate(userId, {
            onlineStatus: 'offline',
            lastSeen: new Date(),
          });
          // Notify all clients of updated online users
          io.emit('getOnlineUsers', Object.keys(userSocketMap));
        } catch (err) {
          console.error('Error updating offline presence on disconnect:', err.message);
        }
      }
    });
  });

  return io;
};

module.exports = { initSocket, getReceiverSocketId, userSocketMap, userActiveChat };
