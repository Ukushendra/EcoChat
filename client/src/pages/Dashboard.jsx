import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatList from '../components/ChatList';
import GroupsList from '../components/GroupsList';
import SearchUsers from '../components/SearchUsers';
import RequestsList from '../components/RequestsList';
import NotificationBell from '../components/NotificationBell';
import ChatWindow from '../components/ChatWindow';
import { useChatStore } from '../store/useChatStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useGroupStore } from '../store/useGroupStore';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('chats'); // chats, groups, search, requests, notifications
  
  const { activeChat } = useChatStore();
  const { activeGroup } = useGroupStore();
  const { fetchPendingRequests, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchPendingRequests();
    fetchNotifications();
  }, []);

  const renderActiveTabPanel = () => {
    switch (activeTab) {
      case 'chats':
        return <ChatList />;
      case 'groups':
        return <GroupsList />;
      case 'search':
        return <SearchUsers />;
      case 'requests':
        return <RequestsList />;
      case 'notifications':
        return <NotificationBell />;
      default:
        return <ChatList />;
    }
  };

  const isWindowActive = !!activeChat || !!activeGroup;

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-200">
      {/* 1. Left Icon Sidebar Menu */}
      <div className={`${isWindowActive ? 'hidden md:flex' : 'flex'} h-full shrink-0`}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* 2. Middle Panel Feed */}
      <div
        className={`${
          isWindowActive ? 'hidden md:flex' : 'flex'
        } flex-col h-full w-full md:w-[380px] lg:w-[420px] shrink-0 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ duration: 0.15 }}
            className="flex-1 h-full overflow-hidden"
          >
            {renderActiveTabPanel()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Right Message Sandbox Log Window */}
      <div
        className={`${
          isWindowActive ? 'flex' : 'hidden md:flex'
        } flex-1 h-full bg-slate-50 dark:bg-slate-900/10`}
      >
        <ChatWindow />
      </div>
    </div>
  );
};

export default Dashboard;
