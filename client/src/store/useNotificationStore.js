import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  pendingRequests: [],
  sentRequests: [],
  unreadNotificationsCount: 0,

  // Fetch historical notifications
  fetchNotifications: async () => {
    try {
      const res = await api.get('/api/notification');
      if (res.data.success) {
        const notifications = res.data.notifications;
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        set({ notifications, unreadNotificationsCount: unreadCount });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  },

  // Fetch pending incoming friend requests
  fetchPendingRequests: async () => {
    try {
      const res = await api.get('/api/request/pending');
      if (res.data.success) {
        set({ pendingRequests: res.data.requests });
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  },

  // Fetch pending sent friend requests
  fetchSentRequests: async () => {
    try {
      const res = await api.get('/api/request/sent');
      if (res.data.success) {
        set({ sentRequests: res.data.requests });
      }
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    }
  },

  // Send a chat request to a user by ID
  sendChatRequest: async (receiverId) => {
    try {
      const res = await api.post('/api/request/send', { receiverId });
      if (res.data.success) {
        // Refresh sent requests
        await get().fetchSentRequests();
        return { success: true, message: res.data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send chat request',
      };
    }
  },

  // Accept chat request
  acceptRequest: async (requestId) => {
    try {
      const res = await api.put(`/api/request/accept/${requestId}`);
      if (res.data.success) {
        // Remove from pending list
        set((state) => ({
          pendingRequests: state.pendingRequests.filter((r) => r._id !== requestId),
        }));
        return { success: true, chat: res.data.chat };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to accept request',
      };
    }
  },

  // Reject chat request
  rejectRequest: async (requestId) => {
    try {
      const res = await api.put(`/api/request/reject/${requestId}`);
      if (res.data.success) {
        // Remove from pending list
        set((state) => ({
          pendingRequests: state.pendingRequests.filter((r) => r._id !== requestId),
        }));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject request',
      };
    }
  },

  // Block a user
  blockUser: async (userIdToBlock) => {
    try {
      const res = await api.post('/api/request/block', { userIdToBlock });
      if (res.data.success) {
        // Clean lists containing the blocked user
        set((state) => ({
          pendingRequests: state.pendingRequests.filter(
            (r) => r.sender._id !== userIdToBlock && r.receiver?._id !== userIdToBlock
          ),
          sentRequests: state.sentRequests.filter(
            (r) => r.receiver._id !== userIdToBlock && r.sender?._id !== userIdToBlock
          ),
        }));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to block user',
      };
    }
  },

  // Unblock a user
  unblockUser: async (userIdToUnblock) => {
    try {
      const res = await api.post('/api/request/unblock', { userIdToUnblock });
      if (res.data.success) {
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unblock user',
      };
    }
  },

  // Add a notification dynamically from Socket
  addIncomingNotification: (notification) => {
    set((state) => {
      const updatedList = [notification, ...state.notifications];
      const unreadCount = updatedList.filter((n) => !n.isRead).length;
      return {
        notifications: updatedList,
        unreadNotificationsCount: unreadCount,
      };
    });

    // Refresh pending requests if it's a new incoming friend request
    if (notification.type === 'request_received') {
      get().fetchPendingRequests();
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    try {
      const res = await api.put('/api/notification/read');
      if (res.data.success) {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadNotificationsCount: 0,
        }));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  },

  // Mark a single notification as read
  markOneNotificationAsRead: async (notificationId) => {
    try {
      const res = await api.put(`/api/notification/read/${notificationId}`);
      if (res.data.success) {
        set((state) => {
          const updated = state.notifications.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          );
          const unreadCount = updated.filter((n) => !n.isRead).length;
          return {
            notifications: updated,
            unreadNotificationsCount: unreadCount,
          };
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },
}));
