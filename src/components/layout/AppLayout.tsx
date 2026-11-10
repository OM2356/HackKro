import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Award,
  Send,
  Users,
  ClipboardCheck,
  PlusCircle,
  Mail,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title, subtitle, action }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const internNav = [
    { label: 'Overview', path: '/intern/dashboard', icon: LayoutDashboard },
    { label: 'Daily Tasks', path: '/intern/daily-tasks', icon: CalendarDays },
    { label: 'Weekly Tasks', path: '/intern/weekly-tasks', icon: CalendarRange },
    { label: 'Points & Badges', path: '/intern/points', icon: Award },
    { label: 'My Submissions', path: '/intern/submissions', icon: Send },
    { label: 'My Profile', path: '/profile', icon: UserCheck },
  ];

  const adminNav = [
    { label: 'Executive Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Assign Tasks', path: '/admin/tasks', icon: PlusCircle },
    { label: 'Review Submissions', path: '/admin/submissions', icon: ClipboardCheck },
    { label: 'Intern Management', path: '/admin/interns', icon: Users },
    { label: 'Points Leaderboard', path: '/admin/leaderboard', icon: Award },
    { label: 'Email Audit Logs', path: '/admin/email-logs', icon: Mail },
    { label: 'My Profile', path: '/profile', icon: UserCheck },
  ];

  const currentNav = isAdmin ? adminNav : internNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-slate-900 text-white flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <Link to={isAdmin ? '/admin/dashboard' : '/intern/dashboard'} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
            HK
          </div>
          <span className="font-bold text-base tracking-tight text-white">HackKro Portal</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <Link
              to={isAdmin ? '/admin/dashboard' : '/intern/dashboard'}
              className="flex items-center gap-3 group"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow-sm group-hover:bg-blue-500 transition-colors">
                HK
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-base tracking-tight leading-tight">HackKro</span>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  {isAdmin ? 'Admin Console' : 'Intern Workspace'}
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Brief Bar */}
          <div className="px-5 py-4 mx-3 my-3 rounded-lg bg-slate-800/50 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-semibold text-xs text-white shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-400 capitalize">{user?.role}</div>
              </div>
            </div>
            {!isAdmin && user?.total_points !== undefined && (
              <div className="text-right shrink-0">
                <div className="text-xs font-bold font-mono tabular-nums text-amber-400">
                  {user.total_points}
                </div>
                <div className="text-[9px] text-slate-400 uppercase font-semibold">pts</div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between px-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>PostgreSQL + Resend</span>
            </span>
            <span className="font-mono text-[10px]">v2.4</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header conforming to §2 Top Bar Contract */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Contextual Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
            <Link to={isAdmin ? '/admin/dashboard' : '/intern/dashboard'} className="hover:text-slate-900 transition-colors">
              HackKro
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold capitalize">{user?.role} Workspace</span>
            {title && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 truncate max-w-[200px]">{title}</span>
              </>
            )}
          </div>

          {/* Zone 2: Navigation / Status summary */}
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-600 whitespace-nowrap">
            {!isAdmin && (
              <div className="flex items-center gap-2 text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Earned:</span>
                <span className="font-bold font-mono tabular-nums text-slate-900">
                  {user?.total_points || 0} pts
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Track:</span>
              <span className="font-medium text-slate-800">{user?.track || 'Full-Stack'}</span>
            </div>
          </div>

          {/* Zone 3: Primary Action or Profile pill */}
          <div className="flex items-center gap-3 shrink-0">
            {action}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-800"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:inline-block max-w-[120px] truncate">{user?.name}</span>
            </Link>
          </div>
        </header>

        {/* Page Header (if provided) */}
        {(title || subtitle) && (
          <div className="bg-white border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Page Body Viewport */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-30 lg:hidden backdrop-blur-xs"
        />
      )}
    </div>
  );
};
