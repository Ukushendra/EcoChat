import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Check, X, Shield, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';

const Signup = () => {
  const { register: registerAction, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
    },
  });

  const usernameInput = watch('username');

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
        message: 'Must start with @ and be 3-20 chars (alphanumeric/underscores)',
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
        setUsernameStatus({ checking: false, available: false, message: 'Check failed' });
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [usernameInput]);

  const onSubmit = async (data) => {
    if (usernameStatus.available === false) {
      toast.error('Choose an available username');
      return;
    }

    const loadingToast = toast.loading('Registering account...');
    const res = await registerAction(data.name, data.username, data.email, data.password);
    toast.dismiss(loadingToast);

    if (res?.success) {
      toast.success('Registration successful! Welcome to EcoChat.');
      await checkAuth(); // Sync state
      navigate('/dashboard');
    } else {
      toast.error(res?.message || 'Registration failed');
    }
  };

  const handleGoogleLogin = () => {
    window.location.assign(`${import.meta.env.PROD ? 'https://ecochat-rec4.onrender.com' : ''}/api/auth/google`);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-50 dark:bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-50/70 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none opacity-60"></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 glass p-8 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-premium z-10 bg-white/80 dark:bg-slate-900/80"
      >
        <div className="text-center">
          <Link to="/" className="inline-block text-3xl mb-3">🌿</Link>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Create Account
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-semibold">
            Claim your unique handle and start messaging safely.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Display Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                required
                {...register('name', { required: 'Name is required' })}
                placeholder="John Doe"
                className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold transition"
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                required
                {...register('email', { required: 'Email is required' })}
                placeholder="name@example.com"
                className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold transition"
              />
            </div>
          </div>

          {/* Unique Handle / Username */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Claim Handle
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold font-sans">
                @
              </span>
              <input
                type="text"
                required
                {...register('username', { required: 'Username is required' })}
                placeholder="username"
                className="block w-full pl-8 pr-11 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold tracking-wide transition"
              />
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
            <AnimatePresence mode="wait">
              {usernameStatus.message && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mt-1.5 text-[11px] font-semibold ${
                    usernameStatus.available ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {usernameStatus.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Min 6 characters required' },
                })}
                placeholder="••••••••"
                className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold transition"
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-[11px] text-red-500 font-semibold">{errors.password.message}</p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={usernameStatus.available === false || usernameStatus.checking}
            className="w-full mt-4 flex items-center justify-center px-6 py-3.5 border border-transparent rounded-2xl text-white bg-emerald-500 hover:bg-emerald-600 transition font-bold text-sm shadow-premium disabled:opacity-50"
          >
            Create Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </motion.button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">Or continue with</span></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition font-semibold text-xs shadow-soft"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36s2.81-6.36 6.277-6.36c1.55 0 2.955.56 4.053 1.488l3.1-3.15C19.196 2.215 15.934 1 12.24 1 6.033 1 1 6.095 1 12.38s5.033 11.38 11.24 11.38c5.84 0 10.965-4.225 10.965-11.38 0-.77-.077-1.372-.23-2.095H12.24z"
            />
          </svg>
          Sign up with Google
        </button>

        <p className="text-center text-xs text-slate-400 font-semibold mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-500 hover:text-emerald-600 font-bold transition">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
