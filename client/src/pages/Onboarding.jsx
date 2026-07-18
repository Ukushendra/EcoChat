import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Check, X, Shield, ArrowRight } from 'lucide-react';

const Onboarding = () => {
  const { user, onboard, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    message: '',
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      username: '',
      about: 'Hey there! I am using EcoChat.',
    },
  });

  const usernameInput = watch('username');

  useEffect(() => {
    if (user?.name) {
      setValue('name', user.name);
    }
  }, [user]);

  // Handle username availability check with debounce
  useEffect(() => {
    if (!usernameInput) {
      setUsernameStatus({ checking: false, available: null, message: '' });
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

    setUsernameStatus({ checking: true, available: null, message: '' });

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
              message: 'This username is already taken',
            });
          }
        }
      } catch (err) {
        setUsernameStatus({
          checking: false,
          available: false,
          message: 'Error validating username',
        });
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [usernameInput]);

  const onSubmit = async (data) => {
    if (usernameStatus.available === false) {
      toast.error('Please choose an available username.');
      return;
    }

    const loadingToast = toast.loading('Setting up your profile...');
    const res = await onboard(data.username, data.name, data.about);
    toast.dismiss(loadingToast);

    if (res?.success) {
      toast.success('Welcome to EcoChat!');
      await checkAuth();
      navigate('/dashboard');
    } else {
      toast.error(res?.message || 'Failed to complete setup');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-200">
      {/* Ambient background blur */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-50 dark:bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-50/70 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none opacity-60"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-xl w-full space-y-8 glass dark:bg-slate-900 p-10 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-premium z-10"
      >
        <div className="text-center">
          <span className="text-4xl">🌿</span>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
            Set Up Your Account
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            EcoChat requires every user to claim a unique username. Others can find you only via this handle.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Display Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  {...register('name', { required: 'Name is required' })}
                  className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-850 rounded-2xl bg-white/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold transition"
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.name.message}</p>
              )}
            </div>

            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 dark:text-slate-355 mb-1.5">
                Choose Unique Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold font-sans">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  {...register('username', {
                    required: 'Username is required',
                    validate: (value) => {
                      const clean = value.startsWith('@') ? value : '@' + value;
                      return (
                        /^[a-zA-Z0-9_]{3,20}$/.test(clean.substring(1)) ||
                        'Min 3, max 20 letters/numbers/underscores only'
                      );
                    },
                  })}
                  className="block w-full pl-8 pr-12 py-3.5 border border-slate-200 dark:border-slate-850 rounded-2xl bg-white/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold tracking-wide transition"
                  placeholder="username"
                />
                
                {/* Checking Status Indicators */}
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  {usernameStatus.checking && (
                    <div className="w-5 h-5 border-2 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                  )}
                  {!usernameStatus.checking && usernameStatus.available === true && (
                    <Check className="h-5 w-5 text-emerald-500" />
                  )}
                  {!usernameStatus.checking && usernameStatus.available === false && (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>

              {/* Status Message */}
              <AnimatePresence mode="wait">
                {usernameStatus.message && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-1.5 text-xs font-semibold ${
                      usernameStatus.available ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {usernameStatus.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* About / Bio Input */}
            <div>
              <label htmlFor="about" className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                About
              </label>
              <textarea
                id="about"
                rows={3}
                {...register('about', { maxLength: { value: 150, message: 'Max 150 characters' } })}
                className="block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-850 rounded-2xl bg-white/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold transition resize-none"
                placeholder="Write a short status update..."
              />
              {errors.about && (
                <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.about.message}</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/10 dark:bg-emerald-950/5 p-4 flex items-start space-x-3">
            <Shield className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Privacy Notice:</span> EcoChat prevents unsolicited messaging. Other users can search your handle and send a request. They will not see your email, only your username, name, and bio.
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={usernameStatus.available === false || usernameStatus.checking}
            className="w-full flex items-center justify-center px-6 py-4 border border-transparent rounded-2xl text-white bg-emerald-500 hover:bg-emerald-600 transition font-bold text-base shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Setup
            <ArrowRight className="ml-2.5 h-5 w-5" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Onboarding;
