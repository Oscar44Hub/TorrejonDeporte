import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, Users, Trophy, Calendar, LogOut,
  Menu, X, ChevronRight, ArrowLeft, Shield, Building2, UserCheck, Flag, Star, FileSpreadsheet
} from 'lucide-react';

const AYTO_LOGO = 'https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/eb4bc3502_image.png';

const navItems = [
  { path: '/admin',                 label: 'Resumen',               icon: LayoutDashboard },
  { path: '/admin/equipos',         label: 'Gestión de Equipos',    icon: Users },
  { path: '/admin/ligas',           label: 'Competiciones',         icon: Trophy },
  { path: '/admin/partidos',        label: 'Partidos y Resultados', icon: Calendar },
  { path: '/admin/incidencias',     label: 'Panel de Incidencias',  icon: Flag },
  { path: '/admin/arbitros',        label: 'Árbitros',              icon: Star },
  { path: '/admin/instalaciones',   label: 'Instalaciones',         icon: Building2 },
  { path: '/admin/delegados',       label: 'Delegados',             icon: UserCheck },
  { path: '/admin/inscripcion-masiva', label: 'Inscripción Masiva',  icon: FileSpreadsheet },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-sidebar z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <img src={AYTO_LOGO} alt="Torrejón de Ardoz" className="h-8 object-contain brightness-0 invert mb-2" />
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-sidebar-primary" />
            <span className="text-xs text-sidebar-primary font-semibold tracking-widest uppercase">Panel Administración</span>
          </div>
          {user && (
            <div className="flex items-center gap-2 mt-3 px-2 py-2 bg-sidebar-accent rounded-lg">
              <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold flex-shrink-0">
                {user.full_name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sidebar-foreground text-xs font-semibold truncate">{user.full_name}</p>
                <p className="text-sidebar-foreground/50 text-xs capitalize">{user.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={label} to={path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link to="/"
            className="flex items-center gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground text-xs py-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Web pública
          </Link>
          <Link to="/mi-panel"
            className="flex items-center gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground text-xs py-1.5 transition-colors">
            <Users className="w-3.5 h-3.5" /> Panel delegado
          </Link>
          <button onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground text-xs w-full py-1.5 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-oswald font-bold text-primary text-base">Administración</span>
          <div className="w-9" />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}