import React, { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { Check, CheckCheck } from 'lucide-react';

const ChatList = () => {
  const { user } = useAuthStore();
  const { chats, activeChat, setActiveChat, fetchChats, onlineUsers } = useChatStore();

  useEffect(() => {
    fetchChats();
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatusTicks = (msg) => {
    if (!msg || msg.sender.toString() !== user?._id.toString()) return null;

    if (msg.status === 'sending') {
      return <Check className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mr-1 shrink-0" />;
    } else if (msg.status === 'delivered') {
      return <CheckCheck className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mr-1 shrink-0" />;
    } else if (msg.status === 'read') {
      return <CheckCheck className="h-3.5 w-3.5 text-emerald-500 mr-1 shrink-0" />;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 transition-colors duration-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Recent Chats</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Direct messaging for accepted connections.</p>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {chats.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 flex items-center justify-center rounded-2xl text-2xl mx-auto mb-3">
              💬
            </div>
            <p className="text-slate-400 dark:text-slate-400 text-sm font-medium">No Conversations Yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Use the <strong>Search Users</strong> tab to find friends and send a chat request.
            </p>
          </div>
        ) : (
          chats.map((chat) => {
            const partner = chat.otherParticipant;
            if (!partner) return null;

            const isOnline = onlineUsers.includes(partner._id);
            const isActive = activeChat && activeChat._id === chat._id;
            const hasLastMessage = !!chat.lastMessage;
            const isUnread = chat.unreadCount > 0;

            return (
              <button
                key={chat._id}
                onClick={() => setActiveChat(chat)}
                className={`w-full flex items-start p-3.5 rounded-2xl transition duration-200 text-left border ${
                  isActive
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/30'
                    : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-transparent hover:border-slate-100 dark:hover:border-slate-800'
                }`}
              >
                {/* Profile Pic with Online Dot */}
                <div className="relative w-12 h-12 mr-3 shrink-0">
                  <img
                    src={partner.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${partner.name}`}
                    alt={partner.name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950"></span>
                  )}
                </div>

                {/* Conversation Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm truncate ${isActive || isUnread ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-semibold text-slate-700 dark:text-slate-400'}`}>
                      {partner.name}
                    </h4>
                    
                    {/* Timestamp */}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold shrink-0 ml-1">
                      {hasLastMessage ? formatTime(chat.lastMessage.createdAt) : formatTime(chat.updatedAt)}
                    </span>
                  </div>

                  {/* Username info */}
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">{partner.username}</p>

                  {/* Last message snippet */}
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs truncate flex items-center ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {renderStatusTicks(chat.lastMessage)}
                      {hasLastMessage ? chat.lastMessage.message : 'No messages yet'}
                    </p>

                    {/* Unread badge count */}
                    {isUnread && (
                      <span className="bg-emerald-500 text-white text-[10px] font-bold h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center shrink-0 ml-2 animate-bounce">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
