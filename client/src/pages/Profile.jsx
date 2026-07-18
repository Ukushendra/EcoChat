import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Camera, Calendar, Users, Mail } from 'lucide-react';
import Avatar from '../components/Avatar';
import api from '../services/api';

const Profile = () => {
  const { user, updateProfile, getUserStats, stats } = useAuthStore();
  const navigate = useNavigate();
  
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: true, message: '' });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      username: user?.username || '',
      about: user?.about || '',
    },
  });

  const usernameInput = watch('username');

  useEffect(() => {
    getUserStats();
  }, []);

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('username', user.username);
      setValue('about', user.about);
      setAvatarPreview(user.profilePicture || '');
    }
  }, [user]);

  // Username validation check
  useEffect(() => {
    if (!usernameInput || usernameInput === user?.username) {
      setUsernameStatus({ checking: false, available: true, message: '' });
      return;
    }

    let formatted = usernameInput.trim().toLowerCase();
    if (formatted.length > 0 && !formatted.startsWith('@')) {
      formatted = '@' + formatted;
    }

    const usernameRegex = /^@[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formatted)) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Must start with @ and be 3-20 chars (letters, numbers, underscores only)',
      });
      return;
    }

    setUsernameStatus({ checking: true, available: true, message: '' });

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get(`/api/user/check-username?username=${formatted}`);
        if (res.data.success) {
          if (res.data.available) {
            setUsernameStatus({
              checking: false,
              available: true,
              message: `Username ${formatted} is available!`,
            });
          } else {
            setUsernameStatus({
              checking: false,
              available: false,
              message: 'This username is taken',
            });
          }
        }
      } catch (err) {
        setUsernameStatus({ checking: false, available: false, message: 'Check failed' });
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [usernameInput]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setRemoveAvatar(false);
      const localUrl = URL.createObjectURL(file);
      setAvatarPreview(localUrl);
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setAvatarPreview('');
    setRemoveAvatar(true);
    const input = document.getElementById('avatar-upload');
    if (input) input.value = '';
  };

  const onSubmit = async (data) => {
    if (usernameStatus.available === false) {
      toast.error('Username is taken or invalid');
      return;
    }

    const loadingToast = toast.loading('Saving changes...');

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('username', data.username);
    formData.append('about', data.about);
    formData.append('removeAvatar', removeAvatar ? 'true' : 'false');
    if (selectedFile) {
      formData.append('avatar', selectedFile);
    }

    const res = await updateProfile(formData);
    toast.dismiss(loadingToast);

    if (res?.success) {
      toast.success('Profile updated successfully!');
      setSelectedFile(null);
      setRemoveAvatar(false);
    } else {
      toast.error(res?.message || 'Update failed');
    }
  };

  const joinedDate = stats.joinedAt
    ? new Date(stats.joinedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-50 dark:bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none opacity-40"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-50/50 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none opacity-40"></div>

      <div className="max-w-4xl mx-auto z-10 relative">
        {/* Back Link Header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition text-sm font-semibold mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition" />
          <span>Back to Dashboard</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Info Card / Stats summary */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center shadow-premium lg:col-span-1"
          >
            {/* Avatar Selector Wrapper */}
            <div className="relative group w-32 h-32 mb-6">
              <Avatar
                src={avatarPreview}
                name={user?.name}
                size="xxl"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/45 rounded-[40px] opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition duration-200"
              >
                <Camera className="h-6 w-6 text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Remove photo option if user currently has one */}
            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-xs text-red-500 hover:text-red-600 font-bold transition mb-6"
              >
                Remove Photo
              </button>
            )}

            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{user?.name}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1 tracking-wide">{user?.username}</p>

            <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 my-6"></div>

            {/* Quick Metadata Stats */}
            <div className="space-y-4 w-full">
              <div className="flex items-center text-left space-x-3 text-slate-500 text-xs font-semibold bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-50 dark:border-slate-900">
                <Users className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Total Friends</p>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{stats.friendsCount} Connected</p>
                </div>
              </div>

              <div className="flex items-center text-left space-x-3 text-slate-500 text-xs font-semibold bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-50 dark:border-slate-900">
                <Calendar className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Joined EcoChat</p>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{joinedDate}</p>
                </div>
              </div>

              <div className="flex items-center text-left space-x-3 text-slate-500 text-xs font-semibold bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-50 dark:border-slate-900">
                <Mail className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Verified Email</p>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Column 2: Edit Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-premium lg:col-span-2"
          >
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Edit Profile Details</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Updates will sync across your connections in real-time.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
              <div className="space-y-4">
                {/* Display Name Input */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                    Display Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name', { required: 'Display Name is required' })}
                    className="block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold transition"
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.name.message}</p>
                  )}
                </div>

                {/* Username Input */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                    Unique Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    {...register('username', {
                      required: 'Username is required',
                      validate: (value) => {
                        const clean = value.startsWith('@') ? value : '@' + value;
                        return (
                          /^[a-zA-Z0-9_]{3,20}$/.test(clean.substring(1)) ||
                          'letters, numbers, underscore only (min 3, max 20)'
                        );
                      },
                    })}
                    className="block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold transition"
                  />
                  {usernameStatus.message && (
                    <p
                      className={`mt-1.5 text-xs font-semibold ${
                        usernameStatus.available ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {usernameStatus.message}
                    </p>
                  )}
                </div>

                {/* About Bio Input */}
                <div>
                  <label htmlFor="about" className="block text-sm font-semibold text-slate-700 dark:text-slate-355 mb-1.5">
                    About / Bio
                  </label>
                  <textarea
                    id="about"
                    rows={4}
                    {...register('about', { maxLength: { value: 150, message: 'Max 150 characters' } })}
                    className="block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium transition resize-none"
                  />
                  {errors.about && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.about.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-950 font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isDirty && !selectedFile && !removeAvatar}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm transition shadow-premium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
