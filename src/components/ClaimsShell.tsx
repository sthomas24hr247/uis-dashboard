// src/components/ClaimsShell.tsx
// Minimal shell for standalone Claims Recovery product
// No sidebar, no full platform nav — just the claims product

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, LogOut, HelpCircle, Bell } from 'lucide-react';
import ClaimsRecoveryPage from '@/pages/ClaimsRecoveryPage';
import InsuranceVerificationPage from '@/pages/InsuranceVerificationPage';
import { UserManagement } from '@/components/claims/UserManagement';

export default function ClaimsShell() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [view, setView] = useState<'claims' | 'insurance' | 'admin'>('claims');

  const handleLogout = () => {
    logout();
    navigate('/claims-login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">

      {/* ── Top header ── */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 flex-shrink-0 z-50">

        {/* Left — Logo + product name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs font-mono">UIS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white text-sm">UIS Health</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold text-sm">Claims Recovery</span>
          </div>
          <div className="ml-2 hidden sm:flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full px-2.5 py-0.5">
            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
            <span className="text-teal-600 dark:text-teal-400 text-xs font-medium">Dentamind AI Active</span>
          </div>
        </div>

        {/* Center — tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button onClick={() => setView('claims')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === 'claims' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            Claims Recovery
          </button>
          <button onClick={() => setView('insurance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === 'insurance' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            Insurance Verification
          </button>
          <button onClick={() => setView('admin')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === 'admin' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            Admin
          </button>
        </div>

        {/* Right — controls */}
        <div className="flex items-center gap-2">

          {/* Help */}
          <a
            href="mailto:support@uishealth.com"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Contact support"
          >
            <HelpCircle className="w-4 h-4" />
          </a>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sign out button — always visible */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.email?.slice(0,2).toUpperCase() || 'DR'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium text-slate-900 dark:text-white leading-tight">{user?.practiceName || 'Provider'}</div>
                <div className="text-xs text-slate-400 leading-tight">{user?.email || 'Dental Practice'}</div>
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="text-xs font-medium text-slate-900 dark:text-white">{user?.practiceName || 'Provider'}</div>
                  <div className="text-xs text-slate-400 truncate">{user?.email || ''}</div>
                </div>
                <a
                  href="https://uishealth.com/compliance"
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Privacy & Compliance
                </a>
                <a
                  href="mailto:support@uishealth.com"
                  className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Contact Support
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-slate-100 dark:border-slate-700"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">
        {view === 'claims' && <ClaimsRecoveryPage />}
        {view === 'insurance' && <InsuranceVerificationPage />}
        {view === 'admin' && (
          <div className="p-6 lg:p-8 max-w-4xl mx-auto">
            <UserManagement />
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="h-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
        <span className="text-xs text-slate-400">© 2026 My IT Copilot, LLC · UIS Health Claims Recovery</span>
        <div className="flex items-center gap-4">
          <a href="https://uishealth.com/compliance" target="_blank" className="text-xs text-slate-400 hover:text-teal-500 transition-colors">Privacy</a>
          <a href="https://uishealth.com/compliance" target="_blank" className="text-xs text-slate-400 hover:text-teal-500 transition-colors">Terms</a>
          <a href="mailto:support@uishealth.com" className="text-xs text-slate-400 hover:text-teal-500 transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}
