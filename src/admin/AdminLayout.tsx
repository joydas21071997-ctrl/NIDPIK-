import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from '../components/Logo';
import {
  LayoutDashboard,
  Package,
  Layers,
  FileText,
  BookOpen,
  Scale,
  Star,
  Zap,
  Tag,
  Store,
  Link2,
  Image as ImageIcon,
  Users,
  Shield,
  BarChart3,
  Globe,
  Settings,
  ClipboardList,
  LogOut,
  ExternalLink,
  Menu,
  X,
  UserCheck,
  Mail
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  actions
}) => {
  const { currentPath, navigate, adminUser, logoutAdmin, isAdminAuthenticated } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If not authenticated, redirect to login
  React.useEffect(() => {
    if (!isAdminAuthenticated) {
      navigate('/admin/login', { replace: true, scroll: false });
    }
  }, [isAdminAuthenticated, navigate]);

  if (!isAdminAuthenticated) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Articles', path: '/admin/articles', icon: FileText },
    { label: 'Buying Guides', path: '/admin/guides', icon: BookOpen },
    { label: 'Comparisons', path: '/admin/comparisons', icon: Scale },
    { label: 'Reviews', path: '/admin/reviews', icon: Star },
    { label: 'Problem Solver', path: '/admin/problems', icon: Zap },
    { label: 'Budget Tiers', path: '/admin/budgets', icon: Tag },
    { label: 'Merchants', path: '/admin/merchants', icon: Store },
    { label: 'Affiliate Links', path: '/admin/affiliate-links', icon: Link2 },
    { label: 'Media Library', path: '/admin/media', icon: ImageIcon },
    { label: 'Authors', path: '/admin/authors', icon: UserCheck },
    { label: 'Subscribers', path: '/admin/subscribers', icon: Mail },
    { label: 'Admin Users', path: '/admin/users', icon: Users, roles: ['OWNER', 'ADMIN'] },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'SEO Config', path: '/admin/seo', icon: Globe },
    { label: 'Site Settings', path: '/admin/settings', icon: Settings },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ClipboardList, roles: ['OWNER', 'ADMIN'] }
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileSidebarOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/admin' && currentPath === '/admin') return true;
    if (path !== '/admin' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-slate-900 font-sans">
      
      {/* SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none">
        
        {/* LOGO & BRAND */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="bg-white px-2.5 py-1 rounded-lg">
            <Logo size="sm" showTagline={false} />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-blue-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            CMS
          </span>
        </div>

        {/* NAVIGATION ITEMS */}
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5 no-scrollbar text-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1.5 tracking-wider">
            Content &amp; Catalog
          </div>
          {navItems.map((item) => {
            if (item.roles && adminUser && !item.roles.includes(adminUser.role)) {
              return null;
            }
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* CURRENT USER & LOGOUT */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-bold text-white block truncate">{adminUser?.name || 'Site Administrator'}</span>
              <span className="text-[10px] font-mono text-slate-400 block truncate">admin@nidpik.com</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
              adminUser?.role === 'OWNER' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' :
              adminUser?.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
              'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
            }`}>
              {adminUser?.role}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-1.5 px-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-center font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Switch to Main Website"
            >
              <span>Main Website</span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </button>
            <button
              onClick={() => logoutAdmin()}
              className="py-1.5 px-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 border border-rose-800/40 cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="bg-white px-2 py-0.5 rounded">
            <Logo size="sm" showTagline={false} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-700"
            title="Switch to Main Website"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Main Site</span>
          </button>
          <span className="text-xs font-mono font-bold text-blue-400 bg-slate-800 px-2 py-1 rounded">
            {adminUser?.role}
          </span>
        </div>
      </div>

      {/* MOBILE SIDEBAR DRAWER */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xs flex">
          <div className="w-72 bg-slate-900 text-white p-4 flex flex-col justify-between h-full border-r border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-sm font-bold text-white">NIDPIK Admin</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[60vh]">
                {navItems.map((item) => {
                  if (item.roles && adminUser && !item.roles.includes(adminUser.role)) {
                    return null;
                  }
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left ${
                        active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMobileSidebarOpen(false);
                  navigate('/');
                }}
                className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Switch to Main Website</span>
              </button>

              <div className="flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <span className="text-white font-semibold block truncate">Site Administrator</span>
                  <span className="text-slate-400 text-[10px] font-mono block truncate">admin@nidpik.com</span>
                </div>
                <button
                  onClick={() => logoutAdmin()}
                  className="text-rose-400 font-semibold hover:underline shrink-0"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN ADMIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP BAR / PAGE TITLE */}
        <header className="bg-white border-b border-slate-200 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 md:static z-30 shadow-2xs">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
              title="Switch to Main Public Website"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">View Main Website</span>
              <span className="sm:hidden">Main Site</span>
            </button>
            {actions}
          </div>
        </header>

        {/* VIEWPORT CONTENT CONTAINER */}
        <div className="p-6 sm:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
