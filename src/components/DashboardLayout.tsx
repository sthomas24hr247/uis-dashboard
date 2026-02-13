import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Calendar,
  Users,
  UserCog,
  BarChart3,
  CalendarCheck,
  LogOut,
  Settings,
  Bell,
  Search,
  Menu,
  ChevronDown,
  Sparkles,
  Activity,
  Moon,
  Sun,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/today', icon: CalendarCheck, label: "Today's Appointments" },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/providers', icon: UserCog, label: 'Providers' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/ai-predictions', icon: Sparkles, label: 'Dentamind' },
  { to: '/outcome-gap', icon: Activity, label: 'Outcome Gap' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-uis-500 to-uis-700 rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-lg font-bold text-white">U</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">UIS</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Unified Intelligence</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-uis-50 dark:bg-teal-500/10 text-uis-700 dark:text-teal-400 shadow-inner-glow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Practice info */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Current Practice</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user?.practiceName || 'Demo Practice'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Open Dental FHIR · Connected</p>
            </div>
          </div>

          {/* Settings + Theme */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-200 flex-1">
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <button
              onClick={toggleTheme}
              className="p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 w-80">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients, appointments..."
                  className="bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 flex-1"
                />
                <kbd className="hidden lg:inline-flex px-2 py-0.5 bg-white dark:bg-slate-700 rounded text-xs text-slate-400 border border-slate-200 dark:border-slate-600">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <button className="relative p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 pl-3 pr-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.email || 'Demo User'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-uis-400 to-uis-600 rounded-xl flex items-center justify-center text-white font-medium text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'D'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user?.practiceName}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
