import React, { useState, useEffect } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Check, X, ShieldAlert, Inbox, Send, Loader2 } from 'lucide-react';

const RequestsList = () => {
  const [tab, setTab] = useState('received'); // received, sent
  const [loading, setLoading] = useState(false);
  const {
    pendingRequests,
    sentRequests,
    fetchPendingRequests,
    fetchSentRequests,
    acceptRequest,
    rejectRequest,
    blockUser,
  } = useNotificationStore();
  const { getOrCreateChat } = useChatStore();

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'received') {
        await fetchPendingRequests();
      } else {
        await fetchSentRequests();
      }
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleAccept = async (requestId, username, userId) => {
    const res = await acceptRequest(requestId);
    if (res?.success) {
      toast.success(`Request accepted! Chat created with ${username}`);
      await getOrCreateChat(userId);
    } else {
      toast.error(res?.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId, username) => {
    const res = await rejectRequest(requestId);
    if (res?.success) {
      toast.success(`Rejected request from ${username}`);
    } else {
      toast.error(res?.message || 'Failed to reject request');
    }
  };

  const handleBlock = async (userId, username) => {
    if (window.confirm(`Are you sure you want to block ${username}? They will not be able to send you chat requests.`)) {
      const res = await blockUser(userId);
      if (res?.success) {
        toast.success(`Blocked ${username}`);
        loadData();
      } else {
        toast.error(res?.message || 'Failed to block user');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 transition-colors duration-200">
      {/* Header & Tabs */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Chat Requests</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Manage connection requests to start messaging.</p>

        {/* Tab Buttons */}
        <div className="flex space-x-1.5 bg-slate-100/60 dark:bg-slate-900 p-1 rounded-xl mt-4">
          <button
            onClick={() => setTab('received')}
            className={`flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-lg transition ${
              tab === 'received'
                ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-soft'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Inbox className="h-3.5 w-3.5 mr-1.5" />
            Received ({pendingRequests.length})
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-lg transition ${
              tab === 'sent'
                ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-soft'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Sent ({sentRequests.length})
          </button>
        </div>
      </div>

      {/* Requests Feed Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading && pendingRequests.length === 0 && sentRequests.length === 0 && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
          </div>
        )}

        {!loading && tab === 'received' && (
          <AnimatePresence mode="wait">
            {pendingRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 flex items-center justify-center rounded-2xl text-2xl mx-auto mb-3">
                  📥
                </div>
                <p className="text-slate-400 dark:text-slate-400 text-sm font-medium">Inbox Clean</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No incoming chat requests at the moment.</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {pendingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition gap-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 relative">
                        <img
                          src={req.sender.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${req.sender.name}`}
                          alt={req.sender.name}
                          className="w-full h-full rounded-2xl object-cover"
                        />
                        {req.sender.onlineStatus === 'online' && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950"></span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{req.sender.name}</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">{req.sender.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => handleAccept(req._id, req.sender.username, req.sender._id)}
                        className="flex items-center justify-center p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-soft transition"
                        title="Accept Request"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReject(req._id, req.sender.username)}
                        className="flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 rounded-xl transition"
                        title="Reject Request"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleBlock(req.sender._id, req.sender.username)}
                        className="flex items-center justify-center p-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-xl transition"
                        title="Block User"
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!loading && tab === 'sent' && (
          <AnimatePresence mode="wait">
            {sentRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 flex items-center justify-center rounded-2xl text-2xl mx-auto mb-3">
                  📤
                </div>
                <p className="text-slate-400 dark:text-slate-400 text-sm font-medium">No Sent Requests</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Sent chat requests will appear here.</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {sentRequests.map((req) => (
                  <div
                    key={req._id}
                    className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11">
                        <img
                          src={req.receiver.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${req.receiver.name}`}
                          alt={req.receiver.name}
                          className="w-full h-full rounded-2xl object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{req.receiver.name}</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">{req.receiver.username}</p>
                      </div>
                    </div>

                    <span className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                      Pending
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default RequestsList;
