import React, { useState, useEffect } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, UserCheck, MessageSquare, Send, Ban, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchUsers = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { sendChatRequest, acceptRequest, unblockUser } = useNotificationStore();
  const { getOrCreateChat } = useChatStore();

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await api.get(`/api/user/search?username=${query}`);
      if (res.data.success) {
        setResults(res.data.users);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSendRequest = async (userId, username) => {
    const res = await sendChatRequest(userId);
    if (res?.success) {
      toast.success(`Chat request sent to ${username}!`);
      handleSearch();
    } else {
      toast.error(res?.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId, username, userId) => {
    const res = await acceptRequest(requestId);
    if (res?.success) {
      toast.success(`Request accepted! You can now chat with ${username}.`);
      await getOrCreateChat(userId);
    } else {
      toast.error(res?.message || 'Failed to accept request');
    }
  };

  const handleOpenChat = async (userId) => {
    const res = await getOrCreateChat(userId);
    if (!res?.success) {
      toast.error(res?.message || 'Failed to open chat');
    }
  };

  const handleUnblock = async (userId, username) => {
    const res = await unblockUser(userId);
    if (res?.success) {
      toast.success(`Unblocked ${username}`);
      handleSearch();
    } else {
      toast.error('Failed to unblock');
    }
  };

  const renderActionButton = (user) => {
    const status = user.relationshipStatus;

    switch (status) {
      case 'none':
        return (
          <button
            onClick={() => handleSendRequest(user._id, user.username)}
            className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-soft transition"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Request Chat
          </button>
        );
      case 'pending_sent':
        return (
          <span className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-xl cursor-default">
            Request Pending
          </span>
        );
      case 'pending_received':
        return (
          <button
            onClick={async () => {
              const pending = useNotificationStore.getState().pendingRequests;
              const matchingRequest = pending.find((r) => r.sender._id === user._id);
              if (matchingRequest) {
                handleAcceptRequest(matchingRequest._id, user.username, user._id);
              } else {
                await useNotificationStore.getState().fetchPendingRequests();
                const refreshedPending = useNotificationStore.getState().pendingRequests;
                const match = refreshedPending.find((r) => r.sender._id === user._id);
                if (match) {
                  handleAcceptRequest(match._id, user.username, user._id);
                } else {
                  toast.error('Could not resolve request. Try accepting from Requests tab.');
                }
              }
            }}
            className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-soft transition"
          >
            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
            Accept Request
          </button>
        );
      case 'accepted':
        return (
          <button
            onClick={() => handleOpenChat(user._id)}
            className="flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-950/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl transition border border-emerald-250 dark:border-emerald-900/50"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Chat
          </button>
        );
      case 'blocked_sent':
        return (
          <button
            onClick={() => handleUnblock(user._id, user.username)}
            className="flex items-center px-4 py-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl transition border border-red-100 dark:border-red-900/50"
          >
            Unblock
          </button>
        );
      case 'blocked_received':
        return (
          <span className="flex items-center px-4 py-2 bg-red-50/50 dark:bg-red-950/10 text-red-400 dark:text-red-500 text-xs font-semibold rounded-xl cursor-not-allowed">
            <Ban className="h-3.5 w-3.5 mr-1" /> Blocked
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 transition-colors duration-200">
      {/* Search Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Search Users</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Find users by username to initiate conversations.</p>
        
        <div className="relative mt-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username (e.g. @john)..."
            className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 dark:text-slate-100 transition"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {searching && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
            <span className="ml-2.5 text-sm text-slate-500 dark:text-slate-400 font-medium">Searching...</span>
          </div>
        )}

        {!searching && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {results.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl transition hover:bg-slate-50 dark:hover:bg-slate-900/60"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative w-11 h-11 shrink-0">
                    <img
                      src={u.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                      alt={u.name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                    {u.onlineStatus === 'online' && (
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950"></span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{u.name}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">{u.username}</p>
                  </div>
                </div>
                
                {renderActionButton(u)}
              </div>
            ))}
          </motion.div>
        )}

        {!searching && query.trim() && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 dark:text-slate-400 text-sm">No users found matching "{query}"</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Make sure you include the '@' sign or double-check the spelling.</p>
          </div>
        )}

        {!query.trim() && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 flex items-center justify-center rounded-2xl text-2xl mx-auto mb-3">
              🔍
            </div>
            <p className="text-slate-400 dark:text-slate-450 text-sm font-medium">Type a username to start searching</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Search results will load automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;
