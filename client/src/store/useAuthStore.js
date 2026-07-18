import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  checkingAuth: true,
  authError: null,
  stats: {
    friendsCount: 0,
    joinedAt: null,
  },

  // Check auth status on app load/reload
  checkAuth: async () => {
    set({ checkingAuth: true, authError: null });
    try {
      const res = await api.get('/api/auth/me');
      if (res.data.success) {
        set({
          user: res.data.user,
          isAuthenticated: true,
          checkingAuth: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          checkingAuth: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        checkingAuth: false,
        authError: error.response?.data?.message || 'Failed to authenticate',
      });
    }
  },

  // Register with email/password
  register: async (name, username, email, password) => {
    try {
      const res = await api.post('/api/auth/register', { name, username, email, password });
      if (res.data.success) {
        set({ user: res.data.user, isAuthenticated: true });
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  },

  // Login with credentials
  login: async (emailOrUsername, password) => {
    try {
      const res = await api.post('/api/auth/login', { emailOrUsername, password });
      if (res.data.success) {
        set({ user: res.data.user, isAuthenticated: true });
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid username or password',
      };
    }
  },

  // Complete onboarding (username selection)
  onboard: async (username, name, about) => {
    try {
      const res = await api.post('/api/user/onboard', { username, name, about });
      if (res.data.success) {
        set({ user: res.data.user, isAuthenticated: true });
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Onboarding failed',
      };
    }
  },

  // Update profile
  updateProfile: async (formData) => {
    try {
      const res = await api.put('/api/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        set({ user: res.data.user });
        return { success: true, message: res.data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
      };
    }
  },

  // Get user profile statistics
  getUserStats: async () => {
    try {
      const res = await api.get('/api/user/stats');
      if (res.data.success) {
        set({
          stats: {
            friendsCount: res.data.friendsCount,
            joinedAt: res.data.joinedAt,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
      set({
        user: null,
        isAuthenticated: false,
        stats: { friendsCount: 0, joinedAt: null },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
}));
