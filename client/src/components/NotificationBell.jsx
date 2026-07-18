import React, { useEffect } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { BellRing, Check, Trash2, MessageSquare, Plus, CheckSquare } from 'lucide-react';

const NotificationBell = () => {
  const {
    notifications,
    fetchNotifications,
    markAllNotificationsAsRead,
    markOneNotificationAsRead,
    unreadNotificationsCount,
  } = useNotificationStore();
  const { getOrCreateChat } = useChatStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    toast.success('All notifications marked as read');
  };

  const handleOpenNotification = async (notif) => {
    await markOneNotificationAsRead(notif._id);

    if (notif.type === 'request_accepted' && notif.data?.chatId) {
      await getOrCreateChat(notif.sender._id);
    } else if (notif.type === 'unread_message' && notif.data?.chatId) {
      await getOrCreateChat(notif.sender._id);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'request_received':
        return <Plus className="h-4 w-4 text-blue-500" />;
      case 'request_accepted':
        return <Check className="h-4 w-4 text-emerald-500" />;
      case 'request_rejected':
        return <Trash2 className="h-4 w-4 text-slate-400" />;
      case 'unread_message':
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      default:
        return <BellRing className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatText = (notif) => {
    const sender = notif.sender?.username || 'Someone';

    switch (notif.type) {
      case 'request_received':
        return `received a chat request from ${sender}`;
      case 'request_accepted':
        return `${sender} accepted your chat request!`;
      case 'request_rejected':
        return `${sender} declined your chat request.`;
      case 'unread_message':
        return `sent you a message.`;
      default:
        return 'sent you a new alert';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 transition-colors duration-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Alerts & Logs</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Updates on requests and connection events.</p>
        </div>
        
        {unreadNotificationsCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center text-xs font-semibold text-emerald-500 hover:text-emerald-600 transition"
            title="Mark All Read"
          >
            <CheckSquare className="h-4 w-4 mr-1" /> Mark All Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence mode="wait">
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 flex items-center justify-center rounded-2xl text-2xl mx-auto mb-3">
                🔔
              </div>
              <p className="text-slate-400 dark:text-slate-400 text-sm font-medium">Inbox Clean</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No alerts have been recorded yet.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => handleOpenNotification(notif)}
                  className={`w-full flex items-start p-4 bg-slate-50/50 dark:bg-slate-900/30 border rounded-2xl transition text-left hover:bg-slate-50 dark:hover:bg-slate-900/60 ${
                    notif.isRead 
                      ? 'border-slate-100 dark:border-slate-850' 
                      : 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/10 dark:bg-emerald-950/5'
                  }`}
                >
                  {/* Icon Block */}
                  <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center mr-3 shrink-0 shadow-soft">
                    {renderIcon(notif.type)}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-slate-500 dark:text-slate-450' : 'font-semibold text-slate-900 dark:text-slate-100'}`}>
                      <span className="font-bold text-slate-800 dark:text-white">{notif.sender?.name || 'User'}</span> {formatText(notif)}
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-550 font-semibold block mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 ml-2 mt-2"></span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationBell;
