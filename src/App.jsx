import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Layouts
import PublicLayout from '@/components/PublicLayout';
import DelegadoLayout from '@/components/DelegadoLayout';
import AdminLayout from '@/components/AdminLayout';

// Páginas admin
import AdminDashboard from '@/pages/admin/AdminDashboard';
import GestionEquipos from '@/pages/admin/GestionEquipos';
import GestionLigas from '@/pages/admin/GestionLigas';
import GeneradorCalendario from '@/pages/admin/GeneradorCalendario';
import GestionInstalaciones from '@/pages/admin/GestionInstalaciones';
import GestionDelegados from '@/pages/admin/GestionDelegados';
import GestionPartidos from '@/pages/admin/GestionPartidos';
import PanelIncidencias from '@/pages/admin/PanelIncidencias';

// Páginas públicas
import Inicio from '@/pages/Inicio';
import Deportes from '@/pages/Deportes';
import Ligas from '@/pages/Ligas';
import LeagueDetail from '@/pages/LeagueDetail';
import Partidos from '@/pages/Partidos';
import Clasificaciones from '@/pages/Clasificaciones';

// Páginas delegado (privadas)
import DashboardDelegado from '@/pages/DashboardDelegado';
import MiEquipo from '@/pages/MiEquipo';
import MisJugadores from '@/pages/MisJugadores';
import MisPartidos from '@/pages/MisPartidos';
import InscripcionJugador from '@/pages/InscripcionJugador';
import Inscripcion from '@/pages/Inscripcion';
import InformeAuditoria from '@/pages/InformeAuditoria';

// Páginas árbitro
import ArbitroLayout from '@/components/ArbitroLayout';
import DashboardArbitro from '@/pages/arbitro/DashboardArbitro';
import MisPartidosArbitro from '@/pages/arbitro/MisPartidosArbitro';
import HistorialArbitro from '@/pages/arbitro/HistorialArbitro';

// Admin: árbitros
import GestionArbitros from '@/pages/admin/GestionArbitros';
import InscripcionMasiva from '@/pages/admin/InscripcionMasiva';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* ── ÁREA PÚBLICA ── visible para todos */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/deportes" element={<Deportes />} />
        <Route path="/ligas" element={<Ligas />} />
        <Route path="/ligas/:id" element={<LeagueDetail />} />
        <Route path="/partidos" element={<Partidos />} />
        <Route path="/clasificaciones" element={<Clasificaciones />} />
        <Route path="/inscripcion" element={<Inscripcion />} />
        <Route path="/informe-auditoria" element={<InformeAuditoria />} />
      </Route>

      {/* ── ÁREA ADMINISTRACIÓN ── solo admin */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/equipos" element={<GestionEquipos />} />
        <Route path="/admin/ligas" element={<GestionLigas />} />
        <Route path="/admin/ligas/:leagueId/calendario" element={<GeneradorCalendario />} />
        <Route path="/admin/instalaciones" element={<GestionInstalaciones />} />
        <Route path="/admin/delegados" element={<GestionDelegados />} />
        <Route path="/admin/partidos" element={<GestionPartidos />} />
        <Route path="/admin/incidencias" element={<PanelIncidencias />} />
        <Route path="/admin/arbitros" element={<GestionArbitros />} />
        <Route path="/admin/inscripcion-masiva" element={<InscripcionMasiva />} />
      </Route>

      {/* ── ÁREA ÁRBITRO ── requiere login con rol árbitro */}
      <Route element={<ArbitroLayout />}>
        <Route path="/arbitro/panel" element={<DashboardArbitro />} />
        <Route path="/arbitro/partidos" element={<MisPartidosArbitro />} />
        <Route path="/arbitro/historial" element={<HistorialArbitro />} />
      </Route>

      {/* ── ÁREA DELEGADO ── requiere login */}
      <Route element={<DelegadoLayout />}>
        <Route path="/mi-panel" element={<DashboardDelegado />} />
        <Route path="/mi-equipo" element={<MiEquipo />} />
        <Route path="/mis-jugadores" element={<MisJugadores />} />
        <Route path="/mis-partidos" element={<MisPartidos />} />
        <Route path="/inscripcion-jugador" element={<InscripcionJugador />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App