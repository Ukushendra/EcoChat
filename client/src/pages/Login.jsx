import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
  });

  useEffect(() => {
    const error = searchParams.get('error');
    const sessionExpired = searchParams.get('session_expired');

    if (error) {
      if (error === 'oauth_failed') {
        toast.error('Google Sign-in failed. Please try again.', { id: 'auth-error' });
      } else {
        toast.error('An error occurred during authentication.', { id: 'auth-error' });
      }
    }

    if (sessionExpired) {
      toast.error('Your session has expired. Please login again.', { id: 'session-expired' });
    }
  }, [searchParams]);

  const onSubmit = async (data) => {
    const loadingToast = toast.loading('Signing in...');
    const res = await login(data.emailOrUsername, data.password);
    toast.dismiss(loadingToast);

    if (res?.success) {
      toast.success('Welcome back!');
      await checkAuth(); // Sync state
      navigate('/dashboard');
    } else {
      toast.error(res?.message || 'Invalid credentials');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-50 dark:bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-50/70 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none opacity-60"></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 glass p-8 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-premium z-10 bg-white/80 dark:bg-slate-900/80"
      >
        <div className="text-center">
          <Link to="/" className="inline-block text-3xl mb-3">🌿</Link>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-semibold">
            Sign in to access your safe connection dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email or Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Email or Handle
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                required
                {...register('emailOrUsername', { required: true })}
                placeholder="email or @handle"
                className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold transition"
              />
            </div>
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
                {...register('password', { required: true })}
                placeholder="••••••••"
                className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold transition"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full mt-4 flex items-center justify-center px-6 py-3.5 border border-transparent rounded-2xl text-white bg-emerald-500 hover:bg-emerald-600 transition font-bold text-sm shadow-premium"
          >
            Sign In
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
          Sign in with Google
        </button>

        <p className="text-center text-xs text-slate-400 font-semibold mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-emerald-500 hover:text-emerald-600 font-bold transition">
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
