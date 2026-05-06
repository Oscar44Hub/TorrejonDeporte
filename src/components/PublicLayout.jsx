import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Trophy, Calendar, BarChart3, Menu, X, Home, Dumbbell } from 'lucide-react';

const AYTO_LOGO = 'https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/eb4bc3502_image.png';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/deportes', label: 'Deportes', icon: Dumbbell },
  { path: '/ligas', label: 'Competiciones', icon: Trophy },
  { path: '/partidos', label: 'Partidos', icon: Calendar },
  { path: '/clasificaciones', label: 'Clasificaciones', icon: BarChart3 },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navbar */}
      <header className="bg-sidebar border-b border-sidebar-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src={AYTO_LOGO} alt="Torrejón de Ardoz" className="h-8 object-contain brightness-0 invert" />
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-white"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: acceso delegado */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to="/mi-panel"
                className="hidden md:flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
              >
                Panel delegado
              </Link>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
              >
                Acceso delegados
              </button>
            )}
            {/* Mobile burger */}
            <button
              className="md:hidden p-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-sidebar-border bg-sidebar px-4 pb-4 pt-2 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active ? "bg-primary text-white" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-sidebar-border">
              {user ? (
                <Link
                  to="/mi-panel"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-primary bg-primary/10"
                >
                  Panel delegado
                </Link>
              ) : (
                <button
                  onClick={() => { setMobileOpen(false); base44.auth.redirectToLogin(); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white"
                >
                  Acceso delegados
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-sidebar border-t border-sidebar-border py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-sidebar-foreground/50">
          <div className="flex items-center gap-2">
            <img src={AYTO_LOGO} alt="Torrejón de Ardoz" className="h-5 object-contain brightness-0 invert opacity-60" />
            <span>Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz</span>
          </div>
          <span>Ciudad Europea del Deporte 2026 🏆</span>
        </div>
      </footer>
    </div>
  );
}