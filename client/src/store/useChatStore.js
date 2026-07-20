import { create } from 'zustand';
import api from '../services/api';
import { useGroupStore } from './useGroupStore';

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: [],
  typingStatus: {}, // Maps userId -> boolean

  // Set currently active chat
  setActiveChat: (chat) => {
    set({ activeChat: chat, messages: [] });
    if (chat) {
      useGroupStore.getState().setActiveGroup(null);
    }
  },

  // Fetch all chat sessions
  fetchChats: async () => {
    try {
      const res = await api.get('/api/chat');
      if (res.data.success) {
        set({ chats: res.data.chats });
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  },

  // Open/Create chat with a friend
  getOrCreateChat: async (participantId) => {
    try {
      const res = await api.post('/api/chat', { participantId });
      if (res.data.success) {
        const chat = res.data.chat;
        
        const selfId = useAuthStore.getState().user?._id;
        const otherParticipant = chat.participants.find(
          (p) => p._id.toString() !== selfId?.toString()
        );

        await get().fetchChats();
        
        const updatedChat = get().chats.find((c) => c._id === chat._id);
        if (updatedChat) {
          set({ activeChat: updatedChat });
        } else {
          set({
            activeChat: {
              _id: chat._id,
              otherParticipant,
              unreadCount: 0,
            }
          });
        }
        return { success: true, chat };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to open chat',
      };
    }
  },

  // Load message history for active chat
  fetchMessages: async (chatId) => {
    try {
      const res = await api.get(`/api/message/${chatId}`);
      if (res.data.success) {
        set({ messages: res.data.messages });
        
        // Reset unread count locally for this chat
        set((state) => ({
          chats: state.chats.map((c) =>
            c._id === chatId ? { ...c, unreadCount: 0 } : c
          ),
        }));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  },

  // Send message via API
  sendMessage: async (chatId, messageText) => {
    try {
      const res = await api.post('/api/message', { chatId, message: messageText });
      if (res.data.success) {
        const newMessage = res.data.message;
        
        // Append message to active message log
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));

        // Update lastMessage in the chats list
        set((state) => ({
          chats: state.chats.map((c) =>
            c._id === chatId ? { ...c, lastMessage: newMessage, updatedAt: new Date().toISOString() } : c
          ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
        }));

        return { success: true, message: newMessage };
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Message could not be sent',
      };
    }
  },

  // Handle incoming real-time messages (Socket event)
  addIncomingMessage: (message) => {
    const { activeChat } = get();
    
    // Check if the message belongs to the active conversation
    if (activeChat && activeChat._id === message.chat) {
      set((state) => ({
        messages: [...state.messages, message],
      }));
      // Note: active chat messages are read automatically, socket listener handles marking read
    }

    // Update the chats list: update lastMessage, increment unreadCount if not active
    set((state) => ({
      chats: state.chats
        .map((c) => {
          if (c._id === message.chat) {
            const isNotActive = !activeChat || activeChat._id !== message.chat;
            return {
              ...c,
              lastMessage: message,
              unreadCount: isNotActive ? c.unreadCount + 1 : 0,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    }));
  },

  // Handle message read confirmation (Socket event)
  markMessagesAsReadLocally: (chatId) => {
    const { activeChat } = get();
    if (activeChat && activeChat._id === chatId) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.status !== 'read' ? { ...m, status: 'read' } : m
        ),
      }));
    }
    
    // Set lastMessage status to read in chat list
    set((state) => ({
      chats: state.chats.map((c) => {
        if (c._id === chatId && c.lastMessage) {
          return {
            ...c,
            lastMessage: { ...c.lastMessage, status: 'read' },
          };
        }
        return c;
      }),
    }));
  },

  // Presence & Typing Setters
  setOnlineUsers: (users) => {
    set({ onlineUsers: users });
  },

  setTypingStatus: (userId, isTyping) => {
    set((state) => ({
      typingStatus: {
        ...state.typingStatus,
        [userId]: isTyping,
      },
    }));
  },
}));
