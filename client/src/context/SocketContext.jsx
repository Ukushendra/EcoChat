import React, { createContext, useContext, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import { useNotificationStore } from '../store/useNotificationStore';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useAuthStore();
  
  const {
    setOnlineUsers,
    addIncomingMessage,
    markMessagesAsReadLocally,
    setTypingStatus,
    activeChat,
    fetchChats,
  } = useChatStore();

  const {
    activeGroup,
    addGroupMessage,
    setGroupTyping,
    fetchGroups,
  } = useGroupStore();

  const { addIncomingNotification, fetchPendingRequests } = useNotificationStore();
  const prevActiveGroupRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user && user._id) {
      // Connect to Socket.io server
      const socket = io('/', {
        query: { userId: user._id },
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      // Online status presence tracking
      socket.on('getOnlineUsers', (users) => {
        setOnlineUsers(users);
      });

      // Handle real-time incoming 1-to-1 messages
      socket.on('newMessage', (message) => {
        addIncomingMessage(message);

        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-84.wav');
          audio.volume = 0.2;
          audio.play().catch(() => {});
        } catch (e) {}

        if (activeChat && activeChat._id === message.chat) {
          socket.emit('markAsRead', {
            chatId: activeChat._id,
            senderId: message.sender._id,
          });
        }
      });

      // Handle message read confirmation receipts (turns checkmarks blue)
      socket.on('messagesRead', ({ chatId }) => {
        markMessagesAsReadLocally(chatId);
      });

      // Handle typing indicator updates (1-to-1)
      socket.on('typingStatus', ({ senderId, isTyping }) => {
        setTypingStatus(senderId, isTyping);
      });

      // Handle new notifications (chat request events)
      socket.on('newNotification', (notification) => {
        addIncomingNotification(notification);

        if (notification.type === 'request_received') {
          toast.success(`New chat request from ${notification.sender.username}!`);
          fetchPendingRequests();
        } else if (notification.type === 'request_accepted') {
          toast.success(`${notification.sender.username} accepted your chat request!`);
          fetchChats();
        } else if (notification.type === 'unread_message') {
          if (!activeChat || activeChat._id !== notification.data.chatId) {
            toast(`Message from ${notification.sender.name}: "${notification.data.message.substring(0, 30)}..."`, {
              icon: '💬',
            });
            fetchChats();
          }
        }
      });

      // Refetch chat lists if a chat is created (auto-accept or accepted requests)
      socket.on('chatCreated', () => {
        fetchChats();
      });

      // Auto-kick if blocked
      socket.on('blockedByUser', ({ blockerId }) => {
        if (activeChat && activeChat.otherParticipant?._id === blockerId) {
          toast.error('The conversation was ended by the other participant.');
          useChatStore.getState().setActiveChat(null);
        }
        fetchChats();
      });

      // --- GROUP REAL-TIME EVENTS ---

      // Handle incoming group messages
      socket.on('groupMessageReceived', (message) => {
        // Only append if it matches currently selected active group
        if (activeGroup && activeGroup._id === message.groupId) {
          addGroupMessage(message);
        }
        
        // Play sound for notifications
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-84.wav');
          audio.volume = 0.15;
          audio.play().catch(() => {});
        } catch (e) {}

        // Always reload group lists to preview last messages
        fetchGroups();
      });

      // Handle group typing status
      socket.on('groupTypingStatus', ({ groupId, userId: typerId, username, name, isTyping }) => {
        setGroupTyping(groupId, typerId, username, name, isTyping);
      });

      // Refetch groups list if a user is added to a group
      socket.on('groupCreated', (group) => {
        fetchGroups();
        if (user._id !== group.owner._id) {
          toast.success(`You were added to the group "${group.name}"!`, { icon: '👥' });
        }
      });

      // Refetch group details if updated
      socket.on('groupUpdated', (group) => {
        fetchGroups();
        if (activeGroup && activeGroup._id === group._id) {
          useGroupStore.setState({ activeGroup: group });
        }
      });

      // Clear active group if group is deleted
      socket.on('groupDeleted', ({ groupId }) => {
        fetchGroups();
        if (activeGroup && activeGroup._id === groupId) {
          toast.error('This group has been deleted by the owner.');
          useGroupStore.setState({ activeGroup: null });
        }
      });

      socket.on('groupRemovedSelf', ({ groupId }) => {
        fetchGroups();
        if (activeGroup && activeGroup._id === groupId) {
          toast.error('You are no longer a member of this group.');
          useGroupStore.setState({ activeGroup: null });
        }
      });

      return () => {
        socket.close();
        socketRef.current = null;
      };
    }
  }, [isAuthenticated, user, activeChat, activeGroup]);

  // Sync activeChat state to the socket server so it knows when we open a conversation
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit('setActiveChat', activeChat ? activeChat._id : null);

      if (activeChat && activeChat.otherParticipant) {
        socketRef.current.emit('markAsRead', {
          chatId: activeChat._id,
          senderId: activeChat.otherParticipant._id,
        });
      }
    }
  }, [activeChat]);

  // Sync activeGroup state to handle socket room joins and leaves
  useEffect(() => {
    if (socketRef.current) {
      // Leave old group room if it exists
      if (prevActiveGroupRef.current && prevActiveGroupRef.current !== activeGroup?._id) {
        socketRef.current.emit('leaveGroup', { groupId: prevActiveGroupRef.current });
      }

      // Join new group room
      if (activeGroup) {
        socketRef.current.emit('joinGroup', { groupId: activeGroup._id });
        prevActiveGroupRef.current = activeGroup._id;
      } else {
        prevActiveGroupRef.current = null;
      }
    }
  }, [activeGroup]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};
