import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Onboarding from '../pages/Onboarding';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import AdminDashboard from '../pages/AdminDashboard';

// Global loading skeleton screen
const FullPageLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-white dark:bg-slate-950">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-100 dark:border-emerald-950 border-t-emerald-500 rounded-full animate-spin"></div>
        <span className="absolute text-2xl">🌿</span>
      </div>
      <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium animate-pulse text-sm">Loading GreenChat...</p>
    </div>
  );
};

// Route Guard: Protect routes requiring authentication and completed onboarding
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, checkingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!user) {
      checkAuth();
    }
  }, [user]);

  if (checkingAuth) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.username) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// Route Guard: Admin routes (Protected by JWT + role === 'admin')
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, checkingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!user) {
      checkAuth();
    }
  }, [user]);

  if (checkingAuth) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Route Guard: Guest routes (e.g. login/signup screens)
const GuestRoute = ({ children }) => {
  const { isAuthenticated, user, checkingAuth } = useAuthStore();

  if (checkingAuth) {
    return <FullPageLoader />;
  }

  if (isAuthenticated) {
    if (!user?.username) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Route Guard: Onboarding specific guard
const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, user, checkingAuth } = useAuthStore();

  if (checkingAuth) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.username) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
    
    // Sync theme on mount
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Routes>
      {/* Root Public Landing Page */}
      <Route path="/" element={<Landing />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <GuestRoute>
            <Signup />
          </GuestRoute>
        }
      />
      
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Redirect fallbacks */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
