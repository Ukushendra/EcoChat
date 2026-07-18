import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { motion } from 'framer-motion';
import { MessageSquare, Search, UserCheck, Bell, User, Settings, LogOut, Users, Shield } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuthStore();
  const { chats } = useChatStore();
  const { pendingRequests, unreadNotificationsCount } = useNotificationStore();
  const navigate = useNavigate();

  // Count total unread messages from active chats
  const totalUnreadMessages = chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
  const totalPendingRequests = pendingRequests.length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      id: 'chats',
      icon: MessageSquare,
      label: 'Chats',
      badge: totalUnreadMessages,
    },
    {
      id: 'groups',
      icon: Users,
      label: 'Groups',
      badge: 0,
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search Users',
      badge: 0,
    },
    {
      id: 'requests',
      icon: UserCheck,
      label: 'Chat Requests',
      badge: totalPendingRequests,
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      badge: unreadNotificationsCount,
    },
  ];

  return (
    <div className="h-full flex flex-col justify-between items-center bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 py-6 px-4 w-20 md:w-24 shrink-0 transition-colors duration-200">
      {/* Top Section - Logo & Menu */}
      <div className="flex flex-col items-center space-y-8 w-full">
        {/* App Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-2xl shadow-soft cursor-pointer"
          onClick={() => setActiveTab('chats')}
        >
          🌿
        </motion.div>

        {/* Nav Icons */}
        <nav className="flex flex-col space-y-4 w-full items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative group w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-premium'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5 stroke-[2.2]" />
                
                {/* Badge Overlay */}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-50 dark:border-slate-900">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on Hover */}
                <span className="absolute left-16 scale-0 transition-all rounded-lg bg-slate-800 p-2 text-xs font-semibold text-white group-hover:scale-100 z-50 whitespace-nowrap shadow-soft">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Settings, Profile, Logout */}
      <div className="flex flex-col items-center space-y-4 w-full">
        {/* Admin Dashboard Trigger (If user role is admin) */}
        {user?.role === 'admin' && (
          <button
            onClick={() => navigate('/admin')}
            className="relative group w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition duration-200 animate-none"
            title="Admin Dashboard"
          >
            <Shield className="h-5 w-5" />
            <span className="absolute left-16 scale-0 transition-all rounded-lg bg-slate-800 p-2 text-xs font-semibold text-white group-hover:scale-100 z-50 whitespace-nowrap shadow-soft">
              Admin Panel
            </span>
          </button>
        )}

        {/* Profile Details Page Button */}
        <button
          onClick={() => navigate('/profile')}
          className="relative group w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition duration-200"
          title="Profile"
        >
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`;
              }}
            />
          ) : (
            <User className="h-5 w-5 text-slate-400" />
          )}
          <span className="absolute left-16 scale-0 transition-all rounded-lg bg-slate-800 p-2 text-xs font-semibold text-white group-hover:scale-100 z-50 whitespace-nowrap shadow-soft">
            Profile Settings
          </span>
        </button>

        {/* Settings Page Button */}
        <button
          onClick={() => navigate('/settings')}
          className="relative group w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-200"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
          <span className="absolute left-16 scale-0 transition-all rounded-lg bg-slate-800 p-2 text-xs font-semibold text-white group-hover:scale-100 z-50 whitespace-nowrap shadow-soft">
            Settings
          </span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="relative group w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition duration-200"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="absolute left-16 scale-0 transition-all rounded-lg bg-slate-800 p-2 text-xs font-semibold text-white group-hover:scale-100 z-50 whitespace-nowrap shadow-soft">
            Log Out
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
