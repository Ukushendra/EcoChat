import { create } from 'zustand';
import api from '../services/api';
import { useChatStore } from './useChatStore';

export const useGroupStore = create((set, get) => ({
  groups: [],
  activeGroup: null,
  groupMessages: [],
  loadingGroups: false,
  loadingGroupMessages: false,
  groupTypingStatus: {}, // maps groupId -> { userId -> { name, username } }

  fetchGroups: async () => {
    set({ loadingGroups: true });
    try {
      const res = await api.get('/api/groups');
      if (res.data.success) {
        set({ groups: res.data.groups });
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      set({ loadingGroups: false });
    }
  },

  createGroup: async (formData) => {
    try {
      const res = await api.post('/api/groups', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        const { group } = res.data;
        set((state) => ({
          groups: [group, ...state.groups],
        }));
        return { success: true, group };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create group',
      };
    }
  },

  setActiveGroup: (group) => {
    set({ activeGroup: group });
    if (group) {
      // Clear 1-to-1 active chat in ChatStore
      useChatStore.getState().setActiveChat(null);
    }
  },

  fetchGroupMessages: async (groupId, before = '') => {
    set({ loadingGroupMessages: !before });
    try {
      const url = `/api/groups/${groupId}/messages${before ? `?before=${before}` : ''}`;
      const res = await api.get(url);
      if (res.data.success) {
        if (before) {
          // Prepend messages for infinite scroll pagination
          set((state) => ({
            groupMessages: [...res.data.messages, ...state.groupMessages],
          }));
        } else {
          set({ groupMessages: res.data.messages });
        }
        return { success: true, count: res.data.messages.length };
      }
    } catch (error) {
      console.error('Error fetching group messages:', error);
      return { success: false };
    } finally {
      set({ loadingGroupMessages: false });
    }
  },

  sendGroupMessage: async (groupId, formData) => {
    try {
      const res = await api.post(`/api/groups/${groupId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        // Handled via Socket room emission, but we can append locally in case of lag
        // Wait, socket room broadcasts to everyone INCLUDING sender, so double append needs to be avoided.
        // If we emit to group, the sender will also receive the message through socket.
        // So we do not need to append here manually if socket room is active.
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send message',
      };
    }
  },

  editGroupDetails: async (groupId, formData) => {
    try {
      const res = await api.put(`/api/groups/${groupId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        const { group } = res.data;
        set((state) => ({
          groups: state.groups.map((g) => (g._id === groupId ? group : g)),
          activeGroup: state.activeGroup?._id === groupId ? group : state.activeGroup,
        }));
        return { success: true, group };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to edit group settings',
      };
    }
  },

  deleteGroup: async (groupId) => {
    try {
      const res = await api.delete(`/api/groups/${groupId}`);
      if (res.data.success) {
        set((state) => ({
          groups: state.groups.filter((g) => g._id !== groupId),
          activeGroup: state.activeGroup?._id === groupId ? null : state.activeGroup,
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

  leaveGroup: async (groupId, myUserId) => {
    try {
      const res = await api.delete(`/api/groups/${groupId}/members/${myUserId}`);
      if (res.data.success) {
        set((state) => ({
          groups: state.groups.filter((g) => g._id !== groupId),
          activeGroup: state.activeGroup?._id === groupId ? null : state.activeGroup,
        }));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to leave group',
      };
    }
  },

  addGroupMembers: async (groupId, memberIds) => {
    try {
      const res = await api.post(`/api/groups/${groupId}/members`, { memberIds });
      if (res.data.success) {
        const { group } = res.data;
        set((state) => ({
          groups: state.groups.map((g) => (g._id === groupId ? group : g)),
          activeGroup: state.activeGroup?._id === groupId ? group : state.activeGroup,
        }));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add members',
      };
    }
  },

  removeGroupMember: async (groupId, memberId) => {
    try {
      const res = await api.delete(`/api/groups/${groupId}/members/${memberId}`);
      if (res.data.success) {
        const { group } = res.data;
        set((state) => ({
          groups: state.groups.map((g) => (g._id === groupId ? group : g)),
          activeGroup: state.activeGroup?._id === groupId ? group : state.activeGroup,
        }));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove member',
      };
    }
  },

  updateMemberRole: async (groupId, targetUserId, action) => {
    try {
      const res = await api.put(`/api/groups/${groupId}/role`, { targetUserId, action });
      if (res.data.success) {
        const { group } = res.data;
        set((state) => ({
          groups: state.groups.map((g) => (g._id === groupId ? group : g)),
          activeGroup: state.activeGroup?._id === groupId ? group : state.activeGroup,
        }));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update member role',
      };
    }
  },

  transferOwnership: async (groupId, newOwnerId) => {
    try {
      const res = await api.put(`/api/groups/${groupId}/transfer`, { newOwnerId });
      if (res.data.success) {
        const { group } = res.data;
        set((state) => ({
          groups: state.groups.map((g) => (g._id === groupId ? group : g)),
          activeGroup: state.activeGroup?._id === groupId ? group : state.activeGroup,
        }));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to transfer ownership',
      };
    }
  },

  addGroupMessage: (msg) => {
    set((state) => ({
      groupMessages: [...state.groupMessages, msg],
    }));
  },

  setGroupTyping: (groupId, userId, username, name, isTyping) => {
    set((state) => {
      const current = { ...(state.groupTypingStatus[groupId] || {}) };
      if (isTyping) {
        current[userId] = { name, username };
      } else {
        delete current[userId];
      }
      return {
        groupTypingStatus: {
          ...state.groupTypingStatus,
          [groupId]: current,
        },
      };
    });
  },
}));
