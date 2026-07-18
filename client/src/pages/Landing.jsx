import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';
import { MessageSquare, ShieldCheck, Zap, Users, ArrowRight, Sparkles, Moon, Sun } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      icon: ShieldCheck,
      title: 'Safe Sandbox',
      desc: 'EcoChat blocks unsolicited contact. Conversations are locked until the receiver explicitly accepts your request.',
    },
    {
      icon: Zap,
      title: 'Real-time Messaging',
      desc: 'Engineered with Socket.io. Experience instantaneous message delivery, online indicators, and typing status.',
    },
    {
      icon: MessageSquare,
      title: 'Detailed Receipts',
      desc: 'Track conversation flows clearly. See single checkmarks for sending, double checkmarks for delivered, and blue checkmarks for read.',
    },
    {
      icon: Users,
      title: 'Unique Handle Claims',
      desc: 'Find friends easily by searching for their unique @handle. No email sharing required, protecting user metadata.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden font-sans">
      {/* Background blur decorators */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] bg-emerald-100/50 dark:bg-emerald-950/15 rounded-full blur-[140px] pointer-events-none opacity-80"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-emerald-100/40 dark:bg-emerald-900/10 rounded-full blur-[140px] pointer-events-none opacity-80"></div>

      {/* Header Navigation */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-xl shadow-premium">
            🌿
          </div>
          <span className="text-xl font-bold font-sans tracking-tight">
            Eco<span className="text-emerald-500">Chat</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5 text-yellow-400" />}
          </button>
          
          <button
            onClick={handleGetStarted}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl shadow-premium hover:shadow-soft transition"
          >
            {isAuthenticated ? 'Go to Chat' : 'Sign In'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left text */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Introducing Safe messaging sandboxes</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white"
          >
            Secure Messaging. <br />
            <span className="text-emerald-500">Zero Spam.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
          >
            EcoChat connects you with peers through unique handles. No stranger can message you directly. Every session starts with an approved chat invitation request.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
          >
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-premium flex items-center justify-center transition"
            >
              Get Started Free
              <ArrowRight className="ml-2.5 h-5 w-5" />
            </button>
            
            <a
              href="#sandbox-flow"
              className="w-full sm:w-auto px-8 py-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl font-bold flex items-center justify-center transition"
            >
              How it works
            </a>
          </motion.div>
        </div>

        {/* Right illustration / graphic card */}
        <div className="lg:col-span-5 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="w-full max-w-sm glass bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-premium relative"
          >
            {/* Visual Chat Mock Card */}
            <div className="flex items-center space-x-3 mb-6 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100/50 dark:border-slate-800">
              <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-500 flex items-center justify-center text-xl font-bold">👦</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Alex Johnson</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">@alex</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-50 dark:bg-slate-900/60 border border-slate-100/50 dark:border-slate-800 text-xs leading-relaxed max-w-[85%] text-slate-600 dark:text-slate-400">
                Hey, I wanted to send you a chat request. Let's connect!
              </div>

              <div className="flex justify-end">
                <div className="p-4 rounded-2xl rounded-tr-none bg-emerald-500 text-white text-xs leading-relaxed max-w-[85%]">
                  Sure! I've accepted your invitation. We can chat here safely now 🌿
                </div>
              </div>
            </div>

            {/* Float badge */}
            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center space-x-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Real-time sockets active</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-100 dark:border-slate-900 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Built for Safe Communication</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            EcoChat connects the client directly to local MERN sockets with rich aesthetics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-900 rounded-3xl hover:border-emerald-500/20 dark:hover:border-emerald-500/10 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 group shadow-soft"
              >
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 mb-6 group-hover:bg-emerald-500 group-hover:text-white transition duration-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed font-semibold">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sandbox flow visual showcase */}
      <section id="sandbox-flow" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-100 dark:border-slate-900 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">The Chat Invitation Workflow</h2>
          <p className="text-sm text-slate-400">Every message connection operates under a strict sequence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-900 text-center relative shadow-soft">
            <span className="text-3xl font-extrabold text-emerald-500/25 block mb-4">01</span>
            <h4 className="text-base font-bold text-slate-800 dark:text-white">Search Unique handle</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Search profiles safely by typing their unique username handle (e.g. @kushendra).</p>
          </div>

          {/* Step 2 */}
          <div className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-900 text-center relative shadow-soft">
            <span className="text-3xl font-extrabold text-emerald-500/25 block mb-4">02</span>
            <h4 className="text-base font-bold text-slate-800 dark:text-white">Send invitation request</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Send a Chat Request. The recipient is instantly alerted via live socket notifications.</p>
          </div>

          {/* Step 3 */}
          <div className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-900 text-center relative shadow-soft">
            <span className="text-3xl font-extrabold text-emerald-500/25 block mb-4">03</span>
            <h4 className="text-base font-bold text-slate-800 dark:text-white">Accept & Chat</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Once accepted, connection state updates to active, unlocking the direct messaging view.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 relative z-10">
        <p>© 2026 EcoChat. Secure messaging framework built under Google Antigravity.</p>
        <p className="mt-4 sm:mt-0">Light & Dark Theme shifts fully active.</p>
      </footer>
    </div>
  );
};

export default Landing;
