import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Shield, User, Ban, LogOut, Loader2, Key, Sun, Moon, Sparkles } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const { user, logout } = useAuthStore();
  const { unblockUser } = useNotificationStore();
  const navigate = useNavigate();

  const [activeSubTab, setActiveSubTab] = useState('privacy'); // privacy, account, appearance
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Sync theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
    localStorage.setItem('theme', selectedTheme);
    toast.success(`Switched to ${selectedTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
  };

  const fetchBlocked = async () => {
    setLoadingBlocked(true);
    try {
      const res = await api.get('/api/request/blocked');
      if (res.data.success) {
        setBlockedUsers(res.data.blocked);
      }
    } catch (error) {
      console.error('Error fetching blocked list:', error);
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'privacy') {
      fetchBlocked();
    }
  }, [activeSubTab]);

  const handleUnblockUser = async (userId, username) => {
    const res = await unblockUser(userId);
    if (res?.success) {
      toast.success(`Unblocked ${username}`);
      fetchBlocked(); // Refresh
    } else {
      toast.error('Failed to unblock user');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Background gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-50 dark:bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none opacity-40"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-50/50 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none opacity-40"></div>

      <div className="max-w-4xl mx-auto z-10 relative">
        {/* Back Link Header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition text-sm font-semibold mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition" />
          <span>Back to Dashboard</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="md:col-span-1 space-y-2">
            <button
              onClick={() => setActiveSubTab('privacy')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                activeSubTab === 'privacy'
                  ? 'bg-emerald-500 text-white shadow-premium'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <Shield className="h-4.5 w-4.5" />
              <span>Privacy & Blocks</span>
            </button>

            <button
              onClick={() => setActiveSubTab('appearance')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                activeSubTab === 'appearance'
                  ? 'bg-emerald-500 text-white shadow-premium'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <Sun className="h-4.5 w-4.5" />
              <span>Theme Shift</span>
            </button>

            <button
              onClick={() => setActiveSubTab('account')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                activeSubTab === 'account'
                  ? 'bg-emerald-500 text-white shadow-premium'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <User className="h-4.5 w-4.5" />
              <span>Account details</span>
            </button>

            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 mt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              {activeSubTab === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-premium"
                >
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Privacy & Restrictions</h3>
                  <p className="text-xs text-slate-400 mt-1">Manage blocked profiles. Blocked users cannot send chat requests.</p>

                  <div className="mt-8 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blocked users ({blockedUsers.length})</h4>

                    {loadingBlocked ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                      </div>
                    ) : blockedUsers.length === 0 ? (
                      <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-sm">
                        No blocked users. Your privacy settings are default.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {blockedUsers.map((b) => (
                          <div
                            key={b._id}
                            className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl"
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={b.receiver?.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${b.receiver?.name}`}
                                alt={b.receiver?.name}
                                className="w-10 h-10 rounded-xl object-cover"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{b.receiver?.name}</p>
                                <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{b.receiver?.username}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleUnblockUser(b.receiver?._id, b.receiver?.username)}
                              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/10 transition"
                            >
                              Unblock
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeSubTab === 'appearance' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-premium"
                >
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Theme Shift</h3>
                  <p className="text-xs text-slate-400 mt-1">Configure your dashboard color preferences.</p>

                  <div className="mt-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Light Mode Selector Card */}
                      <button
                        onClick={() => handleThemeChange('light')}
                        className={`flex flex-col items-center justify-center p-6 border rounded-2xl transition duration-200 ${
                          theme === 'light'
                            ? 'border-emerald-500 bg-emerald-50/10 text-emerald-500 dark:text-emerald-400 shadow-soft'
                            : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-400'
                        }`}
                      >
                        <Sun className="h-8 w-8 mb-3" />
                        <span className="text-sm font-bold">Light Theme</span>
                      </button>

                      {/* Dark Mode Selector Card */}
                      <button
                        onClick={() => handleThemeChange('dark')}
                        className={`flex flex-col items-center justify-center p-6 border rounded-2xl transition duration-200 ${
                          theme === 'dark'
                            ? 'border-emerald-500 bg-emerald-50/10 text-emerald-500 dark:text-emerald-400 shadow-soft'
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-400'
                        }`}
                      >
                        <Moon className="h-8 w-8 mb-3" />
                        <span className="text-sm font-bold">Dark Theme</span>
                      </button>
                    </div>

                    <div className="p-4 border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-2xl flex items-start space-x-3">
                      <Sparkles className="h-5 w-5 text-emerald-500 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">Auto Sync</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                          Theme selection is cached in local storage and applied dynamically on page mount, keeping your preferred theme active even after logging out.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSubTab === 'account' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-premium"
                >
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Account Credentials</h3>
                  <p className="text-xs text-slate-400 mt-1">EcoChat profile registration details.</p>

                  <div className="mt-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/40 rounded-2xl">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Registration Method</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                          {user?.googleId ? (
                            <>
                              <span className="text-lg mr-1.5">🌐</span> Google Account Linked
                            </>
                          ) : (
                            <>
                              <span className="text-lg mr-1.5">🔑</span> Credentials Profile
                            </>
                          )}
                        </span>
                      </div>

                      <div className="p-4 border border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/40 rounded-2xl">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">API Connection</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2"></span> Connection Active
                        </span>
                      </div>
                    </div>

                    <div className="p-4 border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-2xl flex items-start space-x-3">
                      <Key className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">Session Security</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                          EcoChat secures user authentication sessions using HTTP-Only cookies with silent Refresh Token rotations. No local storage tokens are used, preventing XSS-based hijacking.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
