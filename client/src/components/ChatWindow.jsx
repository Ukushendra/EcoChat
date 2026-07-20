import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import { useAuthStore } from '../store/useAuthStore';
import MessageInput from './MessageInput';
import Avatar from './Avatar';
import {
  Check,
  CheckCheck,
  ShieldAlert,
  ArrowLeft,
  Info,
  Settings,
  Users,
  Calendar,
  X,
  Search,
  Trash2,
  LogOut,
  UserPlus,
  ShieldAlert as AdminIcon,
  ShieldCheck as OwnerIcon,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const ChatWindow = () => {
  const { user: currentUser } = useAuthStore();
  
  // 1-to-1 Chat Store
  const {
    activeChat,
    setActiveChat,
    messages: directMessages,
    fetchMessages: fetchDirectMessages,
    onlineUsers,
  } = useChatStore();

  // Group Chat Store
  const {
    activeGroup,
    setActiveGroup,
    groupMessages,
    loadingGroupMessages,
    fetchGroupMessages,
    groupTypingStatus,
    editGroupDetails,
    deleteGroup: deleteGroupAction,
    leaveGroup,
    addGroupMembers,
    removeGroupMember,
    updateMemberRole,
    transferOwnership,
  } = useGroupStore();

  // Component UI state
  const [showGroupSidebar, setShowGroupSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('info'); // info, members, addMembers
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);

  // Group settings inputs
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Add members selector state
  const [inviteList, setInviteList] = useState([]);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const activeChatId = activeChat?._id || activeGroup?._id;

  // Auto-scroll helper
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Sync active states on mount/change
  useEffect(() => {
    if (activeGroup) {
      fetchGroupMessages(activeGroup._id);
      setEditName(activeGroup.name);
      setEditDesc(activeGroup.description || '');
      setImagePreview(activeGroup.image || '');
      setNewImageFile(null);
      setShowGroupSidebar(false);
    } else if (activeChat) {
      fetchDirectMessages(activeChat._id);
    }
  }, [activeChatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom('smooth');
  }, [directMessages, groupMessages]);

  const handleScroll = async () => {
    if (!scrollContainerRef.current || loadingGroupMessages || !activeGroup) return;

    // Infinite scrolling pagination: when scrolled to top, fetch preceding page
    if (scrollContainerRef.current.scrollTop === 0 && groupMessages.length > 0) {
      const firstMessage = groupMessages[0];
      const previousScrollHeight = scrollContainerRef.current.scrollHeight;
      
      const res = await fetchGroupMessages(activeGroup._id, firstMessage.createdAt);
      
      if (res?.success && res.count > 0) {
        // Maintain scroll offset position
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop =
              scrollContainerRef.current.scrollHeight - previousScrollHeight;
          }
        }, 50);
      }
    }
  };

  const handleGroupSettingsSave = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Group name cannot be empty');
      return;
    }

    setSavingSettings(true);
    const formData = new FormData();
    formData.append('name', editName);
    formData.append('description', editDesc);
    if (newImageFile) {
      formData.append('image', newImageFile);
    }

    const res = await editGroupDetails(activeGroup._id, formData);
    setSavingSettings(false);

    if (res.success) {
      toast.success('Group settings updated');
      setNewImageFile(null);
    } else {
      toast.error(res.message || 'Failed to update settings');
    }
  };

  const handleGroupImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddSelectedMembers = async () => {
    if (inviteList.length === 0) return;
    const res = await addGroupMembers(activeGroup._id, inviteList);
    if (res.success) {
      toast.success('Members added successfully');
      setInviteList([]);
      setSidebarTab('members');
    } else {
      toast.error('Failed to add members');
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm('WARNING: Are you sure you want to permanently delete this group? This action cannot be undone.')) {
      const res = await deleteGroupAction(activeGroup._id);
      if (res.success) {
        toast.success('Group deleted');
        setActiveGroup(null);
      } else {
        toast.error(res.message || 'Failed to delete group');
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      const res = await leaveGroup(activeGroup._id, currentUser._id);
      if (res.success) {
        toast.success('Left group');
        setActiveGroup(null);
      } else {
        toast.error(res.message || 'Failed to leave group');
      }
    }
  };

  const handleRemoveMember = async (targetId, name) => {
    if (window.confirm(`Remove ${name} from the group?`)) {
      const res = await removeGroupMember(activeGroup._id, targetId);
      if (res.success) {
        toast.success(`Removed ${name}`);
      } else {
        toast.error('Failed to remove member');
      }
    }
  };

  const handleRoleToggle = async (targetId, currentRole, name) => {
    const isCurrentlyAdmin = activeGroup.admins.some((a) => a._id === targetId);
    const action = isCurrentlyAdmin ? 'demote' : 'promote';
    
    if (window.confirm(`${isCurrentlyAdmin ? 'Demote' : 'Promote'} ${name} ${isCurrentlyAdmin ? 'to Member' : 'to Admin'}?`)) {
      const res = await updateMemberRole(activeGroup._id, targetId, action);
      if (res.success) {
        toast.success(`Role updated for ${name}`);
      } else {
        toast.error('Failed to update role');
      }
    }
  };

  const handleTransfer = async (targetId, name) => {
    if (window.confirm(`Transfer group ownership to ${name}? You will become a normal member.`)) {
      const res = await transferOwnership(activeGroup._id, targetId);
      if (res.success) {
        toast.success(`Transferred ownership to ${name}`);
      } else {
        toast.error('Transfer failed');
      }
    }
  };

  if (!activeChat && !activeGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-8 text-center h-full transition-colors duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center rounded-3xl text-5xl mb-6 shadow-soft animate-pulse">
            🌿
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">GreenChat safe connections</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-3 leading-relaxed">
            Invite friends to 1-to-1 chats or build multi-user Group Chat rooms. Messaging is secure and sandboxed.
          </p>
        </motion.div>
      </div>
    );
  }

  // Define values based on active screen (group vs direct chat)
  const isGroup = !!activeGroup;
  
  const title = isGroup ? activeGroup.name : activeChat?.otherParticipant?.name;
  
  const partner = isGroup ? null : activeChat?.otherParticipant;
  
  const isOnline = isGroup ? false : onlineUsers.includes(partner?._id);

  // Group permissions
  const isOwner = isGroup && activeGroup.owner?._id === currentUser._id;
  const isAdmin = isGroup && activeGroup.admins.some((a) => a._id === currentUser._id);
  const canManageSettings = isOwner || isAdmin;

  // Filter group messages by search query
  const filteredMessages = (isGroup ? groupMessages : directMessages).filter((m) => {
    if (!chatSearchQuery.trim()) return true;
    return m.content?.toLowerCase().includes(chatSearchQuery.toLowerCase());
  });

  // Filter members list by search query
  const filteredMembers = isGroup
    ? activeGroup.members?.filter(
        (m) =>
          m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
          m.username.toLowerCase().includes(memberSearchQuery.toLowerCase())
      )
    : [];

  // Contacts available for group invite
  const availableToInvite = isGroup
    ? useChatStore
        .getState()
        .chats.map((c) => c.otherParticipant)
        .filter((p) => p !== null && !activeGroup.members.some((m) => m._id === p._id))
    : [];

  const typingUsersObj = isGroup ? groupTypingStatus[activeGroup._id] || {} : {};
  const typingUsers = Object.values(typingUsersObj).filter((u) => u.username !== currentUser.username);

  return (
    <div className="flex-1 flex h-full relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-200">
      
      {/* Main Chat Core panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/85 dark:bg-slate-950/85 backdrop-blur z-10 shadow-soft">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Mobile Back navigation */}
            <button
              onClick={() => (isGroup ? setActiveGroup(null) : setActiveChat(null))}
              className="md:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 mr-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Avatar */}
            <Avatar
              src={isGroup ? activeGroup.image : partner?.profilePicture}
              name={title}
              size="md"
              isOnline={isOnline}
            />

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{title}</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">
                {isGroup ? `${activeGroup.members?.length || 0} members` : isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          {/* Action Header Icons */}
          <div className="flex items-center space-x-2">
            {/* Search chat messages */}
            <button
              onClick={() => setShowChatSearch(!showChatSearch)}
              className={`p-2.5 rounded-2xl transition ${
                showChatSearch
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500'
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Search chat"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Toggle group details settings sidebar */}
            {isGroup && (
              <button
                onClick={() => setShowGroupSidebar(!showGroupSidebar)}
                className={`p-2.5 rounded-2xl transition ${
                  showGroupSidebar
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Group info & settings"
              >
                <Info className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Message Local Search overlay Bar */}
        <AnimatePresence>
          {showChatSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center space-x-2 z-10"
            >
              <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                placeholder="Search messages in this chat..."
                className="flex-1 bg-transparent text-xs focus:outline-none font-medium text-slate-800 dark:text-white"
              />
              {chatSearchQuery && (
                <button
                  onClick={() => setChatSearchQuery('')}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Feed View */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50/20 dark:bg-slate-900/10"
        >
          {filteredMessages.map((msg, index) => {
            const isMe = msg.sender?._id === currentUser?._id;

            return (
              <div
                key={msg._id || index}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start max-w-[70%] space-x-2.5 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                  {/* Avatar in Group chat */}
                  {!isMe && isGroup && (
                    <Avatar src={msg.sender?.profilePicture} name={msg.sender?.name} size="xs" className="mt-1" />
                  )}

                  <div className="flex flex-col">
                    {/* Sender name label inside Group chats */}
                    {!isMe && isGroup && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold ml-1 mb-1">
                        {msg.sender?.name}
                      </span>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl shadow-soft border ${
                        isMe
                          ? 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-500 dark:border-emerald-600 rounded-tr-none'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-800 rounded-tl-none'
                      }`}
                    >
                      {/* Image Message attachment */}
                      {msg.messageType === 'image' && msg.imageUrl && (
                        <div className="mb-2 max-w-sm rounded-xl overflow-hidden border border-slate-100/50 dark:border-slate-850">
                          <img src={msg.imageUrl} alt="Shared attachment" className="w-full h-auto object-cover max-h-60" />
                        </div>
                      )}

                      {/* Message Content */}
                      {(msg.content || msg.message) && (
                        <p className="text-sm font-medium leading-relaxed">
                          {msg.content || msg.message}
                        </p>
                      )}

                      {/* Metadata row */}
                      <div className="flex items-center justify-end mt-1.5 text-[9px] font-semibold opacity-75">
                        <span className={isMe ? 'text-white' : 'text-slate-400 dark:text-slate-500'}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex w-full justify-start animate-pulse">
              <div className="bg-white dark:bg-slate-900 text-slate-550 dark:text-slate-400 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl rounded-tl-none shadow-soft flex items-center space-x-1.5">
                <span className="text-xs font-semibold">
                  {typingUsers.map((u) => u.name.split(' ')[0]).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                </span>
                <span className="flex space-x-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-850 shrink-0 bg-white dark:bg-slate-950 shadow-soft">
          <MessageInput />
        </div>
      </div>

      {/* --- RIGHT SIDEBAR DRAWER (GROUPS SETTINGS / DETAILS) --- */}
      <AnimatePresence>
        {isGroup && showGroupSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-premium flex flex-col z-20 shrink-0"
          >
            {/* Sidebar Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center">
                <Users className="h-4.5 w-4.5 text-emerald-500 mr-2" />
                Group Details
              </h4>
              <button
                onClick={() => setShowGroupSidebar(false)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-tab selection */}
            <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 mx-5 mt-4 rounded-xl shrink-0">
              <button
                onClick={() => setSidebarTab('info')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                  sidebarTab === 'info'
                    ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-soft'
                    : 'text-slate-400 hover:text-slate-650'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setSidebarTab('members')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                  sidebarTab === 'members'
                    ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-soft'
                    : 'text-slate-400 hover:text-slate-650'
                }`}
              >
                Members ({activeGroup.members?.length || 0})
              </button>
              {canManageSettings && (
                <button
                  onClick={() => setSidebarTab('addMembers')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                    sidebarTab === 'addMembers'
                      ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-soft'
                      : 'text-slate-400 hover:text-slate-650'
                  }`}
                >
                  Invite
                </button>
              )}
            </div>

            {/* Tab Scroll Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Tab 1: Info & Settings Form */}
              {sidebarTab === 'info' && (
                <div className="space-y-6">
                  {/* Group Avatar and metadata details */}
                  <div className="flex flex-col items-center text-center">
                    <Avatar src={imagePreview} name={activeGroup.name} size="lg" className="mb-3" />
                    <h4 className="text-base font-bold text-slate-800 dark:text-white">{activeGroup.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{activeGroup.description || 'No description provided'}</p>
                    
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-4">
                      <Calendar className="h-4 w-4 text-slate-350" />
                      <span>Created {new Date(activeGroup.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Settings Update Form (Admins/Owners only) */}
                  {canManageSettings ? (
                    <form onSubmit={handleGroupSettingsSave} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-850">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">
                          Group Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleGroupImageChange}
                          className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border file:border-slate-200 file:bg-slate-50 file:text-xs file:font-semibold hover:file:bg-slate-100 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">
                          Group Name
                        </label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="block w-full px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">
                          Group Description
                        </label>
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={2}
                          className="block w-full px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 dark:text-white resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="w-full flex items-center justify-center py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-soft"
                      >
                        {savingSettings ? 'Saving...' : 'Save Settings'}
                      </button>
                    </form>
                  ) : null}

                  {/* Actions buttons (Delete / Leave) */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-2">
                    {isOwner ? (
                      <button
                        onClick={handleDeleteGroup}
                        className="w-full flex items-center justify-center space-x-2 py-2.5 border border-red-200 hover:bg-red-50/10 text-red-500 rounded-xl text-xs font-bold transition"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Group</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleLeaveGroup}
                        className="w-full flex items-center justify-center space-x-2 py-2.5 border border-red-200 hover:bg-red-50/10 text-red-500 rounded-xl text-xs font-bold transition"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Leave Group</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Group Member List panel */}
              {sidebarTab === 'members' && (
                <div className="space-y-4">
                  {/* Search inside members */}
                  <div className="relative">
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Search member..."
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Members list items */}
                  <div className="space-y-2">
                    {filteredMembers.map((member) => {
                      const isMemberOwner = activeGroup.owner?._id === member._id;
                      const isMemberAdmin = activeGroup.admins.some((a) => a._id === member._id);
                      const memberOnline = onlineUsers.includes(member._id);
                      
                      const showRoleAction = isOwner && member._id !== currentUser._id;
                      const showRemoveAction =
                        (isOwner || (isAdmin && !isMemberAdmin && !isMemberOwner)) &&
                        member._id !== currentUser._id;

                      return (
                        <div
                          key={member._id}
                          className="p-3 bg-slate-50/50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0">
                              <Avatar src={member.profilePicture} name={member.name} size="sm" isOnline={memberOnline} />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{member.name}</p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{member.username}</p>
                              </div>
                            </div>

                            {/* Role Badge */}
                            <div className="shrink-0">
                              {isMemberOwner ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-600 text-[9px] font-bold border border-amber-100 dark:border-amber-900/40">
                                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                                  Owner
                                </span>
                              ) : isMemberAdmin ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-600 text-[9px] font-bold border border-blue-100 dark:border-blue-900/40">
                                  <AdminIcon className="h-2.5 w-2.5 mr-0.5" />
                                  Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-150 dark:bg-slate-900 text-slate-500 text-[9px] font-bold">
                                  Member
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Member management options */}
                          {(showRoleAction || showRemoveAction) && (
                            <div className="flex items-center justify-end space-x-1.5 pt-1 border-t border-slate-100 dark:border-slate-850/80">
                              {showRoleAction && (
                                <>
                                  <button
                                    onClick={() => handleRoleToggle(member._id, isMemberAdmin, member.name)}
                                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-bold text-slate-500 hover:text-emerald-500"
                                  >
                                    {isMemberAdmin ? 'Demote' : 'Promote'}
                                  </button>
                                  <button
                                    onClick={() => handleTransfer(member._id, member.name)}
                                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-bold text-slate-500 hover:text-amber-500"
                                  >
                                    Make Owner
                                  </button>
                                </>
                              )}
                              {showRemoveAction && (
                                <button
                                  onClick={() => handleRemoveMember(member._id, member.name)}
                                  className="px-2 py-1 bg-red-50 dark:bg-red-950/20 rounded-lg text-[9px] font-bold text-red-500 hover:bg-red-100"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 3: Invite Members panel */}
              {sidebarTab === 'addMembers' && (
                <div className="space-y-4">
                  {availableToInvite.length === 0 ? (
                    <div className="border border-dashed border-slate-150 dark:border-slate-850 rounded-2xl p-6 text-center text-slate-400 text-xs leading-relaxed">
                      All your accepted contacts are already members of this group.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Contacts ({availableToInvite.length})</p>
                      
                      <div className="border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-150 dark:divide-slate-800 max-h-72 overflow-y-auto">
                        {availableToInvite.map((friend) => {
                          const isChecked = inviteList.includes(friend._id);
                          return (
                            <button
                              key={friend._id}
                              onClick={() => {
                                if (isChecked) {
                                  setInviteList((prev) => prev.filter((id) => id !== friend._id));
                                } else {
                                  setInviteList((prev) => [...prev, friend._id]);
                                }
                              }}
                              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-950 transition text-left"
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar src={friend.profilePicture} name={friend.name} size="xs" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{friend.name}</p>
                                  <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{friend.username}</p>
                                </div>
                              </div>

                              <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                              }`}>
                                {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={handleAddSelectedMembers}
                        disabled={inviteList.length === 0}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-soft flex items-center justify-center space-x-1.5"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Add Invitees ({inviteList.length})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWindow;
