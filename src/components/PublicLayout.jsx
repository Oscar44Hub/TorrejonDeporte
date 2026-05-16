import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Trophy, Calendar, BarChart3, Menu, X, Home, Dumbbell, Instagram, Twitter } from 'lucide-react';

const AYTO_LOGO = 'https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/eb4bc3502_image.png';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
{ path: '/', label: 'Inicio', icon: Home },
{ path: '/deportes', label: 'Deportes', icon: Dumbbell },
{ path: '/ligas', label: 'Competiciones', icon: Trophy },
{ path: '/partidos', label: 'Partidos', icon: Calendar },
{ path: '/clasificaciones', label: 'Clasificaciones', icon: BarChart3 }];


export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navbar */}
      <header className="bg-sidebar border-b border-sidebar-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14 gap-2">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/1121d3e1f_image.png"
              alt="Torrejón Ciudad del Deporte"
              className="h-8 object-contain" />
          </Link>

          {/* Nav desktop — visible solo en pantallas grandes */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-[#ffffff] bg-[#682c96]",
                    active ?
                    "" :
                    "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>);
            })}
          </nav>

          {/* Redes sociales — solo desktop */}
          <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
            <a href="https://www.instagram.com/torrejondexte/" target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://x.com/TorrejonDxte" target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
          </div>

          {/* Right: acceso delegado / admin — solo desktop grande */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {user && user.role === 'admin' &&
            <Link
              to="/admin"
              className="flex items-center gap-2 hover:bg-[hsl(44,95%,55%)]/30 border border-[hsl(44,95%,55%)]/40 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap bg-[#f9bf1f] text-[#000000]">Administración

            </Link>
            }
            {user && user.role === 'arbitro' &&
            <Link
              to="/arbitro/panel"
              className="flex items-center gap-2 bg-amber-100/60 hover:bg-amber-100 text-amber-800 border border-amber-300/60 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap">
                Panel árbitro
              </Link>
            }
            {user && user.role !== 'arbitro' ?
            <Link
              to="/mi-panel"
              className="flex items-center gap-2 hover:bg-primary/30 border border-primary/30 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap bg-[#682c96] text-zinc-50">Panel delegado

            </Link> : !user &&
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap">
                Acceso delegados
              </button>
            }
          </div>

          {/* Burger — visible en móvil y tablet */}
          <button
            className="lg:hidden p-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
            onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile/Tablet menu */}
        {mobileOpen &&
        <div className="lg:hidden border-t border-sidebar-border bg-sidebar px-4 pb-4 pt-2 space-y-1">
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
                )}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>);
          })}
            <div className="pt-2 border-t border-sidebar-border space-y-1">
              {user && user.role === 'admin' &&
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-[hsl(44,60%,35%)] bg-[hsl(44,95%,55%)]/10">
                  Administración
                </Link>
            }
              {user && user.role === 'arbitro' &&
            <Link
              to="/arbitro/panel"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-amber-800 bg-amber-100/60">
                  Panel árbitro
                </Link>
            }
              {user && user.role !== 'arbitro' ?
            <Link
              to="/mi-panel"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-primary bg-primary/10">
                  Panel delegado
                </Link> : !user &&
            <button
              onClick={() => {setMobileOpen(false);base44.auth.redirectToLogin();}}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white">
                  Acceso delegados
                </button>
            }
            </div>
          </div>
        }
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-sidebar border-t border-sidebar-border py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 pb-6 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <img src="https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/1121d3e1f_image.png" alt="Torrejón Ciudad del Deporte" className="h-8 object-contain opacity-80" />
              <span className="text-sm text-sidebar-foreground">Concejalía de Deportes · C/ Londres, 25 · 28850 Torrejón de Ardoz</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/torrejondexte/" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://x.com/TorrejonDxte" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          {/* Bottom section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-sidebar-foreground/50">
            <p>Desarrollado por: <a href="https://instagram.com/tjsociamedia" target="_blank" rel="noopener noreferrer" className="text-sidebar-primary hover:underline font-semibold">@tjsociamedia</a></p>
            <p>© {new Date().getFullYear()} Ayuntamiento de Torrejón de Ardoz. RESERVADOS TODOS LOS DERECHOS.</p>
          </div>
        </div>
      </footer>
    </div>);

}