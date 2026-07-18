import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import { useAuthStore } from '../store/useAuthStore';
import Avatar from '../components/Avatar';
import {
  Users,
  MessageSquare,
  Shield,
  Search,
  Settings,
  Trash2,
  Ban,
  UserCheck,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  ArrowLeft,
  Loader2,
  Lock,
  Mail,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const {
    stats,
    analytics,
    users,
    adminGroups,
    loadingStats,
    loadingAnalytics,
    loadingUsers,
    loadingGroups,
    fetchStats,
    fetchAnalytics,
    fetchUsers,
    fetchGroups,
    toggleUserStatus,
    toggleUserRole,
    deleteUser,
    deleteGroup,
    assignGroupOwner,
    seedDevAdmin,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, groups, system
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [groupSearch, setGroupSearch] = useState('');

  // Transfer Ownership state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetGroup, setTargetGroup] = useState(null);
  const [newOwnerId, setNewOwnerId] = useState('');

  useEffect(() => {
    // Redirect if not admin
    if (currentUser && currentUser.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
      return;
    }

    loadTabInfo();
  }, [activeTab, currentUser]);

  const loadTabInfo = () => {
    if (activeTab === 'overview') {
      fetchStats();
      fetchAnalytics();
    } else if (activeTab === 'users') {
      fetchUsers(userSearch, userFilter);
    } else if (activeTab === 'groups') {
      fetchGroups(groupSearch);
    }
  };

  // Trigger search dynamically with delay
  useEffect(() => {
    if (activeTab === 'users') {
      const delay = setTimeout(() => fetchUsers(userSearch, userFilter), 300);
      return () => clearTimeout(delay);
    }
  }, [userSearch, userFilter]);

  useEffect(() => {
    if (activeTab === 'groups') {
      const delay = setTimeout(() => fetchGroups(groupSearch), 300);
      return () => clearTimeout(delay);
    }
  }, [groupSearch]);

  const handleStatusToggle = async (userId, currentStatus, name) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    if (window.confirm(`Are you sure you want to ${nextStatus === 'disabled' ? 'DISABLE' : 'ENABLE'} ${name}'s account?`)) {
      const res = await toggleUserStatus(userId, nextStatus);
      if (res.success) {
        toast.success(`Account successfully ${nextStatus === 'disabled' ? 'disabled' : 'enabled'}`);
      } else {
        toast.error(res.message);
      }
    }
  };

  const handleRoleToggle = async (userId, currentRole, name) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Are you sure you want to ${nextRole === 'admin' ? 'PROMOTE' : 'DEMOTE'} ${name} ${nextRole === 'admin' ? 'to Admin' : 'to User'}?`)) {
      const res = await toggleUserRole(userId, nextRole);
      if (res.success) {
        toast.success(`Role updated successfully`);
      } else {
        toast.error(res.message);
      }
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (window.confirm(`WARNING: Are you sure you want to permanently delete the user ${name}? This will clean up all their chats, requests and groups membership. This cannot be undone.`)) {
      const res = await deleteUser(userId);
      if (res.success) {
        toast.success(`User ${name} permanently deleted`);
      } else {
        toast.error(res.message);
      }
    }
  };

  const handleDeleteGroup = async (groupId, name) => {
    if (window.confirm(`WARNING: Delete group "${name}" and all its message logs?`)) {
      const res = await deleteGroup(groupId);
      if (res.success) {
        toast.success('Group deleted successfully');
      } else {
        toast.error(res.message);
      }
    }
  };

  const handleOwnerTransfer = async (e) => {
    e.preventDefault();
    if (!newOwnerId) return;

    const res = await assignGroupOwner(targetGroup._id, newOwnerId);
    if (res.success) {
      toast.success('Group owner updated');
      setShowTransferModal(false);
      setTargetGroup(null);
      setNewOwnerId('');
    } else {
      toast.error(res.message || 'Failed to update owner');
    }
  };

  const handleSeedData = async () => {
    const email = prompt('Enter the email address of the account to promote to Admin (leave empty to promote yourself):');
    const loadingToast = toast.loading('Seeding data...');
    const res = await seedDevAdmin(email);
    toast.dismiss(loadingToast);

    if (res.success) {
      toast.success(res.message);
      loadTabInfo();
    } else {
      toast.error(res.message);
    }
  };

  // --- CUSTOM SVG CHARTS RENDERERS (Clean, no dependencies, 100% responsive) ---
  const renderSVGLineChart = () => {
    if (analytics.length === 0) return null;

    const chartWidth = 500;
    const chartHeight = 200;
    const padding = 35;

    const maxVal = Math.max(...analytics.map((d) => d.messages), 1);
    
    // Compute line coordinates
    const points = analytics.map((d, index) => {
      const x = padding + (index * (chartWidth - padding * 2)) / (analytics.length - 1);
      const y = chartHeight - padding - (d.messages / maxVal) * (chartHeight - padding * 2);
      return { x, y, value: d.messages, date: d.date };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full text-emerald-500 font-sans">
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding + ratio * (chartHeight - padding * 2);
          const val = Math.round(maxVal * (1 - ratio));
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#E2E8F0" strokeDasharray="3" className="dark:stroke-slate-800" />
              <text x={padding - 5} y={y + 4} textAnchor="end" className="text-[9px] fill-slate-400 font-semibold">{val}</text>
            </g>
          );
        })}

        {/* Line Path */}
        <path d={linePath} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx} className="group">
            <circle cx={p.x} cy={p.y} r="5" className="fill-white stroke-emerald-500 stroke-[3] cursor-pointer hover:r-7 transition-all duration-200" />
            <text x={p.x} y={chartHeight - 8} textAnchor="middle" className="text-[9px] fill-slate-400 font-semibold">{p.date}</text>
            
            {/* Tooltip Overlay */}
            <title>{`${p.value} messages`}</title>
          </g>
        ))}
      </svg>
    );
  };

  const renderSVGBarChart = () => {
    if (analytics.length === 0) return null;

    const chartWidth = 500;
    const chartHeight = 200;
    const padding = 35;
    const barWidth = 25;

    const maxVal = Math.max(...analytics.map((d) => d.activeUsers), 1);

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full text-emerald-500 font-sans">
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding + ratio * (chartHeight - padding * 2);
          const val = Math.round(maxVal * (1 - ratio));
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#E2E8F0" strokeDasharray="3" className="dark:stroke-slate-800" />
              <text x={padding - 5} y={y + 4} textAnchor="end" className="text-[9px] fill-slate-400 font-semibold">{val}</text>
            </g>
          );
        })}

        {/* Bars */}
        {analytics.map((d, index) => {
          const x = padding + (index * (chartWidth - padding * 2)) / (analytics.length - 1) - barWidth / 2;
          const barHeight = (d.activeUsers / maxVal) * (chartHeight - padding * 2);
          const y = chartHeight - padding - barHeight;

          return (
            <g key={index} className="group">
              {/* Rounded Rect representing bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                className="fill-emerald-500/25 hover:fill-emerald-500 transition duration-200 cursor-pointer"
              />
              <text x={x + barWidth / 2} y={chartHeight - 8} textAnchor="middle" className="text-[9px] fill-slate-400 font-semibold">{d.date}</text>
              <title>{`${d.activeUsers} Active Users`}</title>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Upper Navigation Header */}
      <header className="px-8 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-soft">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🌿</span>
            <span className="text-lg font-bold">
              GreenChat <span className="text-emerald-500">Admin Control</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-850">
            System Administrator
          </span>
        </div>
      </header>

      {/* Main Core Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl w-full mx-auto p-6 md:p-8 gap-8">
        
        {/* Sidebar subtabs navigation */}
        <aside className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-white shadow-premium'
                : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Activity className="h-4.5 w-4.5" />
            <span>Overview Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-white shadow-premium'
                : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Users className="h-4.5 w-4.5" />
            <span>Manage Users</span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'groups'
                ? 'bg-emerald-500 text-white shadow-premium'
                : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Layers className="h-4.5 w-4.5" />
            <span>Manage Groups</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'system'
                ? 'bg-emerald-500 text-white shadow-premium'
                : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Settings className="h-4.5 w-4.5" />
            <span>System Helpers</span>
          </button>
        </aside>

        {/* Tab content viewports */}
        <main className="flex-1 overflow-y-auto min-w-0 pr-1">
          <AnimatePresence mode="wait">
            
            {/* Overview / Analytics tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats grid cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Accounts', value: stats.totalUsers, icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
                    { label: 'Online Now', value: stats.onlineUsers, icon: Activity, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
                    { label: 'Active Groups', value: stats.totalGroups, icon: Layers, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
                    { label: 'Daily Messages', value: stats.messagesSentToday, icon: MessageSquare, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20' }
                  ].map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{card.label}</p>
                          <h4 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5">{loadingStats ? '...' : card.value}</h4>
                        </div>
                        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${card.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Analytics SVG charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Messages Sent */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                      <TrendingUp className="h-4.5 w-4.5 text-emerald-500 mr-2" />
                      Daily Messages Volume (7 Days)
                    </h4>
                    <div className="h-52 flex items-center justify-center">
                      {loadingAnalytics ? <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" /> : renderSVGLineChart()}
                    </div>
                  </div>

                  {/* Chart 2: DAU */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                      <Activity className="h-4.5 w-4.5 text-emerald-500 mr-2" />
                      Daily Active Users (DAU)
                    </h4>
                    <div className="h-52 flex items-center justify-center">
                      {loadingAnalytics ? <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" /> : renderSVGBarChart()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Users listing management */}
            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col h-[500px]"
              >
                {/* Search / filter header toolbar */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search name, handle, or email..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  </div>

                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-semibold focus:outline-none text-slate-500 dark:text-slate-400 cursor-pointer"
                  >
                    <option value="">All Users</option>
                    <option value="active">Active Only</option>
                    <option value="disabled">Disabled Only</option>
                    <option value="admin">Administrators</option>
                    <option value="new">New Users (7d)</option>
                  </select>
                </div>

                {/* Table scroll container */}
                <div className="flex-1 overflow-auto">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-7 w-7 text-emerald-500 animate-spin" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                      No matching user registrations found.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold text-[9px] border-b border-slate-100 dark:border-slate-800">
                          <th className="p-4">Profile</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Joined</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 font-semibold text-slate-700 dark:text-slate-300">
                            {/* Profile details */}
                            <td className="p-4 flex items-center space-x-3">
                              <Avatar src={u.profilePicture} name={u.name} size="sm" isOnline={u.onlineStatus === 'online'} />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{u.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[100px]">{u.username}</p>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="p-4 truncate max-w-[140px]">{u.email}</td>

                            {/* Role badge */}
                            <td className="p-4">
                              {u.role === 'admin' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 text-[10px] font-bold border border-emerald-100 dark:border-emerald-900/40">
                                  Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                                  User
                                </span>
                              )}
                            </td>

                            {/* Account status */}
                            <td className="p-4">
                              {u.status === 'active' ? (
                                <span className="inline-flex items-center text-emerald-500">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-red-500">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-1.5"></span> Disabled
                                </span>
                              )}
                            </td>

                            {/* Joined */}
                            <td className="p-4 text-slate-400 dark:text-slate-500">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>

                            {/* Action links */}
                            <td className="p-4 text-right space-x-1 whitespace-nowrap">
                              {u._id !== currentUser._id ? (
                                <>
                                  {/* Role update toggle */}
                                  <button
                                    onClick={() => handleRoleToggle(u._id, u.role, u.name)}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-500"
                                    title={u.role === 'admin' ? 'Remove Admin Privileges' : 'Promote to Admin'}
                                  >
                                    <Shield className="h-4 w-4" />
                                  </button>

                                  {/* Status update toggle */}
                                  <button
                                    onClick={() => handleStatusToggle(u._id, u.status, u.name)}
                                    className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 ${
                                      u.status === 'active' ? 'hover:text-red-500' : 'hover:text-emerald-500'
                                    }`}
                                    title={u.status === 'active' ? 'Disable Account' : 'Enable Account'}
                                  >
                                    {u.status === 'active' ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                  </button>

                                  {/* Delete user */}
                                  <button
                                    onClick={() => handleDeleteUser(u._id, u.name)}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-slate-400 hover:text-red-500"
                                    title="Delete User permanently"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Owner</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            )}

            {/* Groups list management */}
            {activeTab === 'groups' && (
              <motion.div
                key="groups"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col h-[500px]"
              >
                {/* Search header toolbar */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center shrink-0">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      placeholder="Search group name..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Table list */}
                <div className="flex-1 overflow-auto">
                  {loadingGroups ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-7 w-7 text-emerald-500 animate-spin" />
                    </div>
                  ) : adminGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                      No matching group chats active.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold text-[9px] border-b border-slate-100 dark:border-slate-800">
                          <th className="p-4">Group details</th>
                          <th className="p-4">Owner</th>
                          <th className="p-4">Members</th>
                          <th className="p-4">Created</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {adminGroups.map((g) => (
                          <tr key={g._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 font-semibold text-slate-700 dark:text-slate-300">
                            {/* Group details */}
                            <td className="p-4 flex items-center space-x-3">
                              <Avatar src={g.image} name={g.name} size="sm" />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 dark:text-white truncate max-w-[140px]">{g.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">{g.description || 'No description'}</p>
                              </div>
                            </td>

                            {/* Owner */}
                            <td className="p-4">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{g.owner?.name || 'Unknown'}</p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[100px]">{g.owner?.username || ''}</p>
                              </div>
                            </td>

                            {/* Member count */}
                            <td className="p-4">{g.members?.length || 0} members</td>

                            {/* Created */}
                            <td className="p-4 text-slate-400 dark:text-slate-500">
                              {new Date(g.createdAt).toLocaleDateString()}
                            </td>

                            {/* Action controls */}
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setTargetGroup(g);
                                  setShowTransferModal(true);
                                }}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-500 rounded-lg text-[9px] font-bold text-slate-500 transition"
                              >
                                Assign Owner
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(g._id, g.name)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-slate-400 hover:text-red-500"
                                title="Delete Group"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            )}

            {/* System settings and dev seed tab */}
            {activeTab === 'system' && (
              <motion.div
                key="system"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft max-w-lg"
              >
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Developer Testing Tools</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Seeding utilities to facilitate sandboxed tests and populate analytics dashboards.</p>

                <div className="mt-8 space-y-4">
                  <div className="p-4 border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-2xl">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Quick Seed Metrics</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Promotes a user account (by email) to Admin privileges, and spawns mock demo profiles (Sarah Connor, Batman, Diana Prince, Spidey) to test user filters, online presence, and SVG charting datasets.
                    </p>
                    <button
                      onClick={handleSeedData}
                      className="mt-4 flex items-center justify-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-soft"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Seed Dashboard Accounts
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* --- OWNER ASSIGNMENT MODAL OVERLAY --- */}
      <AnimatePresence>
        {showTransferModal && targetGroup && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-premium shrink-0"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h4 className="text-sm font-bold text-slate-850 dark:text-white flex items-center">
                  <Crown className="h-4.5 w-4.5 text-emerald-500 mr-2" />
                  Assign New Group Owner
                </h4>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setTargetGroup(null);
                    setNewOwnerId('');
                  }}
                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-400"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleOwnerTransfer} className="space-y-4">
                <div>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    Select a member from group **{targetGroup.name}** to designate as the new owner.
                  </p>
                  
                  <select
                    required
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    className="w-full mt-3 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-semibold focus:outline-none text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="">Select new owner...</option>
                    {targetGroup.members?.map((m) => (
                      <option key={m} value={m}>
                        Member ID: {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferModal(false);
                      setTargetGroup(null);
                      setNewOwnerId('');
                    }}
                    className="px-4 py-2 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-500 text-[10px] font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newOwnerId}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold transition shadow-soft"
                  >
                    Confirm Assignment
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

export default AdminDashboard;
