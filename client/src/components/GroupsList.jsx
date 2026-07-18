import React, { useState, useEffect } from 'react';
import { useGroupStore } from '../store/useGroupStore';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import Avatar from './Avatar';
import { Plus, X, Users, Image as ImageIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const GroupsList = () => {
  const { groups, activeGroup, setActiveGroup, fetchGroups, createGroup } = useGroupStore();
  const { chats, fetchChats } = useChatStore();
  const { user: currentUser } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupImage, setGroupImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchChats();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File must be less than 5MB');
        return;
      }
      setGroupImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers((prev) => prev.filter((id) => id !== userId));
    } else {
      setSelectedMembers((prev) => [...prev, userId]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    if (selectedMembers.length < 2) {
      toast.error('Select at least 2 members to join the group');
      return;
    }

    setCreating(true);
    const formData = new FormData();
    formData.append('name', groupName);
    formData.append('description', groupDesc);
    formData.append('members', JSON.stringify(selectedMembers));
    if (groupImage) {
      formData.append('image', groupImage);
    }

    const res = await createGroup(formData);
    setCreating(false);

    if (res.success) {
      toast.success('Group created successfully!');
      // Reset form
      setGroupName('');
      setGroupDesc('');
      setSelectedMembers([]);
      setGroupImage(null);
      setImagePreview(null);
      setShowCreateModal(false);
      fetchGroups();
    } else {
      toast.error(res.message || 'Failed to create group');
    }
  };

  // Extract friends from active chats (since each chat is an approved, active 1-to-1 conversation)
  const friends = chats
    .map((c) => c.otherParticipant)
    .filter((p) => p !== null);

  const formatLastMsgTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 transition-colors duration-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Groups</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Multi-user real-time rooms.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-premium transition"
          title="Create Group"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {groups.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 flex items-center justify-center rounded-2xl text-2xl mx-auto mb-3">
              👥
            </div>
            <p className="text-slate-400 dark:text-slate-450 text-sm font-medium">No Groups Joined</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Click the <strong>plus</strong> button above to invite members and create a new group.
            </p>
          </div>
        ) : (
          groups.map((group) => {
            const isActive = activeGroup && activeGroup._id === group._id;
            const hasLastMsg = !!group.lastMessage;

            return (
              <button
                key={group._id}
                onClick={() => setActiveGroup(group)}
                className={`w-full flex items-start p-3.5 rounded-2xl transition duration-200 text-left border ${
                  isActive
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/30'
                    : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-transparent hover:border-slate-100 dark:hover:border-slate-800'
                }`}
              >
                {/* Group profile picture */}
                <Avatar
                  src={group.image}
                  name={group.name}
                  size="md"
                  className="mr-3"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm truncate ${isActive ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-semibold text-slate-700 dark:text-slate-400'}`}>
                      {group.name}
                    </h4>
                    
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold shrink-0 ml-1">
                      {hasLastMsg ? formatLastMsgTime(group.lastMessage.createdAt) : formatLastMsgTime(group.updatedAt)}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">{group.members?.length || 0} members</p>

                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-1">
                    {hasLastMsg ? (
                      <>
                        <span className="font-bold text-slate-500 dark:text-slate-450 mr-1">
                          {group.lastMessage.sender?._id === currentUser?._id ? 'You' : group.lastMessage.sender?.name.split(' ')[0]}:
                        </span>
                        {group.lastMessage.content || 'Sent an image'}
                      </>
                    ) : (
                      group.description || 'Group created'
                    )}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Group Creation Overlay Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-premium overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-150 dark:border-slate-800 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                  <Users className="h-5 w-5 text-emerald-500 mr-2" />
                  Create New Group
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Form Scroll Area */}
              <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1.5">
                {/* Image Upload Input */}
                <div className="flex flex-col items-center">
                  <div className="relative group w-24 h-24 mb-2">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full rounded-[24px] object-cover border"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[24px] bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                    <label
                      htmlFor="group-image-upload"
                      className="absolute inset-0 bg-black/40 rounded-[24px] opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition duration-200"
                    >
                      <Plus className="h-6 w-6 text-white" />
                    </label>
                    <input
                      id="group-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Group Profile Image</span>
                </div>

                {/* Group Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      required
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                      className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 dark:text-slate-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      value={groupDesc}
                      onChange={(e) => setGroupDesc(e.target.value)}
                      rows={2}
                      placeholder="Optional group description"
                      className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 dark:text-slate-100 transition resize-none"
                    />
                  </div>
                </div>

                {/* Select Members Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Invite Members (Select min 2)
                  </label>
                  
                  {friends.length === 0 ? (
                    <div className="border border-dashed border-slate-150 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                      No accepted contacts found. Add friends before creating a group.
                    </div>
                  ) : (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                      {friends.map((friend) => {
                        const isChecked = selectedMembers.includes(friend._id);
                        return (
                          <button
                            type="button"
                            key={friend._id}
                            onClick={() => toggleMemberSelection(friend._id)}
                            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-950 transition text-left"
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar src={friend.profilePicture} name={friend.name} size="sm" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{friend.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{friend.username}</p>
                              </div>
                            </div>
                            
                            <div className={`h-5 w-5 rounded-lg border flex items-center justify-center transition ${
                              isChecked
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                            }`}>
                              {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-105 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || selectedMembers.length < 2 || !groupName.trim()}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-bold text-xs transition shadow-premium"
                  >
                    {creating ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupsList;
