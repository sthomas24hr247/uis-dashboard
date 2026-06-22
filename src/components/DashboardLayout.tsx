import AlertBell from "./AlertBell";
import AskDentamind from "./AskDentamind";
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FileText,
  LayoutDashboard,
  Briefcase,
  Calendar,
  Users,
  UserCog, UserPlus,
  CalendarCheck,
  Brain,
  UserSearch,
  Fingerprint,
  HardHat,
  BarChart3,
  TrendingDown,
  FileBarChart,
  HeartPulse,
  Shield,
  BookOpen,
  Sparkles,
  Lightbulb,
  Zap,
  LogOut,
  Settings,
  Search,
  Menu,
  ChevronDown,
  ChevronRight,
  Moon,
  Sun,
  Monitor, Layers, MessageCircle, X} from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  roles?: string[]; // per-item role filter
  hideForPractices?: string[]; // hide this item for specific practice ids (case-insensitive)
}

interface NavGroup {
  label: string;
  icon: any;
  items: NavItem[];
  roles?: string[];
}

// Roles: 'admin' | 'manager' | 'dentist' | 'staff'
// admin = executive (full access to everything)
// manager = daily operations focus (Operations, Quality & Care, Dentamind AI)
const allNavGroups: NavGroup[] = [
  {
    label: 'Command Center Suite',
    icon: LayoutDashboard,
    roles: ['admin', 'manager'],
    items: [
      { to: '/command-center', icon: Monitor, label: 'Command Center', roles: ['admin'] },
      { to: '/home', icon: LayoutDashboard, label: 'Executive Dashboard', roles: ['admin'] },
      { to: '/manager-dashboard', icon: LayoutDashboard, label: 'Manager Dashboard', roles: ['manager'] },
    ],
  },
  {
    label: 'Operations',
    icon: Briefcase,
    roles: ['admin', 'manager', 'staff', 'dentist'],
    items: [
      { to: '/schedule', icon: Calendar, label: 'Schedule' },
      { to: '/today', icon: CalendarCheck, label: "Today's Appointments" },
      { to: '/patients', icon: Users, label: 'Patients' },
      { to: '/providers', icon: UserCog, label: 'Providers' },
      { to: '/waitlist', icon: UserPlus, label: 'Waitlist' },
    ],
  },
  {
    label: 'Human Intelligence',
    icon: Brain,
    roles: ['admin'],
    items: [
      { to: '/patient-intel', icon: UserSearch, label: 'Patient Intel' },
      { to: '/bil', icon: Fingerprint, label: 'Fingerprinting' },
      { to: '/workforce', icon: HardHat, label: 'Workforce Intel' },
    ],
  },
  {
    label: 'Business Intelligence',
    icon: BarChart3,
    roles: ['admin'],
    items: [
      { to: '/outcome-gap', icon: TrendingDown, label: 'Outcome Gap' },
      { to: '/outcome-gap/classified', icon: Layers, label: 'Revenue Recovery' },
      { to: '/analytics', icon: FileBarChart, label: 'Practice Performance' },
      // { to: '/cdt-analysis', icon: BarChart3, label: 'CDT Analysis' }, // HIDDEN for go-live: page is hardcoded mock; rebuild on real procedure/episode data (fast-follow)
    ],
  },
  {
    label: 'Quality & Care',
    icon: HeartPulse,
    roles: ['admin', 'manager'],
    items: [
      { to: '/quality-of-care', icon: HeartPulse, label: 'Quality of Care Index', roles: ['admin'] },
      { to: '/insurance', icon: Shield, label: 'Insurance Verification' },
      { to: '/claims-recovery', icon: FileText, label: 'Claims Recovery', hideForPractices: ['65f84018-7f64-423a-82ce-805384130a66'] }, // hidden for PoshPearl (no denial backlog); feature stays available for clients it fits
      // Hidden for now — re-add when educational resources are ready.
      // { to: '/education', icon: BookOpen, label: 'Educational Resources' },
    ],
  },
  {
    label: 'AI & Actions',
    icon: Sparkles,
    roles: ['admin', 'manager'],
    items: [
      { to: '/ai-predictions', icon: Sparkles, label: 'AI Predictions' },
      { to: '/marva', icon: Brain, label: 'MARVA' },
      { to: '/recommendations', icon: Lightbulb, label: 'Recommendations', roles: ['admin'] },
      { to: '/automation', icon: Zap, label: 'Automation Hub' },
    ],
  },
];

// Role display labels
const roleLabelMap: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Office Manager',
  dentist: 'Dentist',
  staff: 'Staff',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [chatOpen, setChatOpen] = useState(false);

  const userRole = user?.role || 'admin';
  const currentPracticeId = (user?.practiceId || '').toLowerCase();
  const isManager = userRole === 'manager';
  const roleLabel = roleLabelMap[userRole] || userRole;

  // Filter groups by role, then filter items within each group by role
  const navGroups = allNavGroups
    .filter(g => !g.roles || g.roles.includes(userRole))
    .map(g => ({
      ...g,
      items: g.items.filter(item => (!item.roles || item.roles.includes(userRole)) && !(item.hideForPractices && item.hideForPractices.some(pid => pid.toLowerCase() === currentPracticeId))),
    }))
    .filter(g => g.items.length > 0); // remove empty groups

  // Determine the "home" path for this role
  const homePath = isManager ? '/manager-dashboard' : '/home';

  // Auto-expand the group containing the active route
  useEffect(() => {
    const activeGroup = navGroups.find(g =>
      g.items.some(item => location.pathname.startsWith(item.to))
    );
    if (activeGroup) {
      setExpandedGroups(prev => ({ ...prev, [activeGroup.label]: true }));
    }
  }, [location.pathname]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isGroupActive = (group: NavGroup) =>
    group.items.some(item => location.pathname.startsWith(item.to));

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
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">UIS Health</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Unified Intelligence</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navGroups.map((group) => {
              const isExpanded = expandedGroups[group.label] ?? false;
              const isActive = isGroupActive(group);

              return (
                <div key={group.label}>
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <group.icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {/* Group Items */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="ml-3 pl-3 border-l border-slate-100 dark:border-slate-800 space-y-0.5 py-1">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isActive
                                ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`
                          }
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Practice info */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Current Practice</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user?.practiceName || 'Demo Practice'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user?.pmsType === 'dentrix_ascend' ? 'Dentrix Ascend' : user?.pmsType === 'cleardent' ? 'ClearDent' : 'Dentrix Ascend'} · Connected</p>
            </div>
          </div>

          {/* Settings + Theme — hide Settings from managers */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            {!isManager && (
              <button onClick={() => navigate("/settings")} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-200 flex-1">
                <Settings className="w-5 h-5" />
                Settings
              </button>
            )}
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isManager ? 'flex-1 flex items-center justify-center gap-2' : ''}`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              {isManager && <span className="text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
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
                <AlertBell />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 pl-3 pr-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.displayName || user?.email || 'Demo User'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-uis-400 to-uis-600 rounded-xl flex items-center justify-center text-white font-medium text-sm">
                    {(user?.displayName || user?.email || 'D').charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.displayName || user?.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user?.practiceName} · {roleLabel}</p>
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
          {location.pathname !== homePath && location.pathname !== "/command-center" && (
            <button
              onClick={() => navigate(homePath)}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>
          )}
          <Outlet />
        </main>

        {/* Floating Dentamind Chat Widget */}
        {chatOpen && (
          <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[560px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <span className="text-sm font-bold">Ask Dentamind</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <AskDentamind practiceData={null} />
            </div>
          </div>
        )}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
            title="Ask Dentamind"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
