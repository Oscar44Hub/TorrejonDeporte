import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  Trophy, Users, Calendar, BarChart3, Home, Menu, X, 
  Shield, Star, ChevronRight, LogOut
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/deportes', label: 'Deportes', icon: Trophy },
  { path: '/ligas', label: 'Ligas', icon: Shield },
  { path: '/equipos', label: 'Equipos', icon: Users },
  { path: '/partidos', label: 'Partidos', icon: Calendar },
  { path: '/clasificaciones', label: 'Clasificaciones', icon: BarChart3 },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-sidebar z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <div className="font-oswald font-bold text-sidebar-foreground text-lg leading-tight">TORREJÓN</div>
              <div className="text-xs text-primary font-semibold tracking-widest uppercase">Deportes</div>
            </div>
          </div>
          {/* Ciudad Europea del Deporte */}
          <div className="mt-3 px-2 py-1.5 bg-primary/20 rounded-md border border-primary/30">
            <p className="text-primary text-xs font-semibold text-center">🏆 Ciudad Europea del Deporte 2026</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div className="p-4 border-t border-sidebar-border">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sidebar-foreground text-xs font-medium truncate">{user.full_name}</p>
                <p className="text-sidebar-foreground/50 text-xs truncate">{isAdmin ? 'Administrador' : 'Delegado'}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground text-xs w-full py-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-oswald font-bold text-primary text-lg">TORREJÓN</span>
            <span className="text-xs text-muted-foreground font-medium">Deportes</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}