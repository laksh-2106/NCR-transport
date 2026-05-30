import { ReactNode, useState } from 'react';
import { Bus, LayoutDashboard, MapPin, Users, Calendar, Wrench, Fuel, AlertTriangle, Clock, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

type LayoutProps = {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  badgeCounts?: Record<string, number>;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'fleet', label: 'Fleet', icon: <Bus className="w-5 h-5" /> },
  { id: 'routes', label: 'Routes', icon: <MapPin className="w-5 h-5" /> },
  { id: 'drivers', label: 'Drivers', icon: <Users className="w-5 h-5" /> },
  { id: 'schedules', label: 'Schedules', icon: <Clock className="w-5 h-5" /> },
  { id: 'trips', label: 'Trips', icon: <Calendar className="w-5 h-5" /> },
  { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-5 h-5" /> },
  { id: 'fuel', label: 'Fuel', icon: <Fuel className="w-5 h-5" /> },
  { id: 'incidents', label: 'Incidents', icon: <AlertTriangle className="w-5 h-5" /> },
];

export default function Layout({ children, activePage, onNavigate, badgeCounts = {} }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">NCR Transport</p>
            <p className="text-slate-400 text-xs">Bus Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = activePage === item.id;
          const badge = badgeCounts[item.id];
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {badge && badge > 0 ? (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isActive ? 'bg-blue-500 text-blue-100' : 'bg-red-500 text-white'}`}>
                  {badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-4 h-4 opacity-60" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-300 text-xs font-medium truncate">{user?.email ?? 'Staff User'}</p>
            <p className="text-slate-500 text-xs">Administrator</p>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const pageLabel = navItems.find(n => n.id === activePage)?.label ?? 'Dashboard';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 flex-col shrink-0 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-slate-900 flex flex-col shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-slate-800">{pageLabel}</h1>
              <p className="text-xs text-slate-400 hidden sm:block">NCR Transport Corporation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium">Live</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
