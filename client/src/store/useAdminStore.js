import { create } from 'zustand';
import api from '../services/api';

export const useAdminStore = create((set, get) => ({
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    onlineUsers: 0,
    totalChats: 0,
    totalGroups: 0,
    messagesSentToday: 0,
    imagesShared: 0,
    newUsersThisWeek: 0,
  },
  analytics: [],
  users: [],
  adminGroups: [],
  loadingStats: false,
  loadingAnalytics: false,
  loadingUsers: false,
  loadingGroups: false,

  fetchStats: async () => {
    set({ loadingStats: true });
    try {
      const res = await api.get('/api/admin/dashboard');
      if (res.data.success) {
        set({ stats: res.data.stats });
      }
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
    } finally {
      set({ loadingStats: false });
    }
  },

  fetchAnalytics: async () => {
    set({ loadingAnalytics: true });
    try {
      const res = await api.get('/api/admin/analytics');
      if (res.data.success) {
        set({ analytics: res.data.analytics });
      }
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
    } finally {
      set({ loadingAnalytics: false });
    }
  },

  fetchUsers: async (search = '', filter = '') => {
    set({ loadingUsers: true });
    try {
      let url = '/api/admin/users';
      const params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (filter) params.push(`filter=${filter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url);
      if (res.data.success) {
        set({ users: res.data.users });
      }
    } catch (error) {
      console.error('Error fetching admin users list:', error);
    } finally {
      set({ loadingUsers: false });
    }
  },

  toggleUserStatus: async (userId, status) => {
    try {
      const res = await api.put(`/api/admin/users/${userId}/status`, { status });
      if (res.data.success) {
        const { user } = res.data;
        set((state) => ({
          users: state.users.map((u) => (u._id === userId ? user : u)),
        }));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user status',
      };
    }
  },

  toggleUserRole: async (userId, role) => {
    try {
      const res = await api.put(`/api/admin/users/${userId}/role`, { role });
      if (res.data.success) {
        const { user } = res.data;
        set((state) => ({
          users: state.users.map((u) => (u._id === userId ? user : u)),
        }));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user role',
      };
    }
  },

  deleteUser: async (userId) => {
    try {
      const res = await api.delete(`/api/admin/users/${userId}`);
      if (res.data.success) {
        set((state) => ({
          users: state.users.filter((u) => u._id !== userId),
        }));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete user',
      };
    }
  },

  fetchGroups: async (search = '') => {
    set({ loadingGroups: true });
    try {
      let url = '/api/admin/groups';
      if (search) url += `?search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      if (res.data.success) {
        set({ adminGroups: res.data.groups });
      }
    } catch (error) {
      console.error('Error fetching admin groups list:', error);
    } finally {
      set({ loadingGroups: false });
    }
  },

  deleteGroup: async (groupId) => {
    try {
      const res = await api.delete(`/api/admin/groups/${groupId}`);
      if (res.data.success) {
        set((state) => ({
          adminGroups: state.adminGroups.filter((g) => g._id !== groupId),
        }));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete group',
      };
    }
  },

  assignGroupOwner: async (groupId, newOwnerId) => {
    try {
      const res = await api.put(`/api/admin/groups/${groupId}/owner`, { newOwnerId });
      if (res.data.success) {
        // Refresh groups
        get().fetchGroups();
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reassign group owner',
      };
    }
  },

  seedDevAdmin: async (email) => {
    try {
      const res = await api.post('/api/admin/seed-dev', { email });
      return { success: res.data.success, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Seeding helper failed',
      };
    }
  },
}));
