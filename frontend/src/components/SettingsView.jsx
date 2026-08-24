import React from 'react';
import { Moon, Sun, LogOut, User, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

const SettingsView = ({ onOpenAbout }) => {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();

  return (
    <div className="px-4 pt-6 pb-safe max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6" data-testid="settings-title">
        Settings
      </h2>

      {/* User Profile */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <User className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100" data-testid="settings-username">
              {user?.full_name || user?.username}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500">@{user?.username}</p>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-4">
        <button
          onClick={toggleTheme}
          data-testid="toggle-theme-btn"
          className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors border-b border-slate-100 dark:border-slate-700"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-slate-500" />
          ) : (
            <Sun className="h-5 w-5 text-amber-500" />
          )}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
        <button
          onClick={onOpenAbout}
          data-testid="about-btn"
          className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
        >
          <Info className="h-5 w-5 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">About</span>
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        data-testid="logout-btn"
        className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span>Sign Out</span>
      </button>

      <p className="text-center text-xs text-slate-400 mt-6">
        Version 1.3.0 &middot; &copy; {new Date().getFullYear()} Smart Transcriber. All rights reserved.
      </p>
    </div>
  );
};

export default SettingsView;
