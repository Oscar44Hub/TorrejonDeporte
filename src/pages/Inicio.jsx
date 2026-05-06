import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Trophy, Calendar, BarChart3, Star, ArrowRight, Clock, TrendingUp, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AYTO_LOGO = 'https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/eb4bc3502_image.png';
const CIUDAD_DEPORTE_LOGO = 'https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/f3862358a_image.png';
const DEPORTISTAS_IMG = 'https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/cb9a5a334_image.png';
const EUROPEAN_SPORT_LOGO = 'https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/5ad43e604_image.png';

export default function Inicio() {
  const [stats, setStats] = useState({ leagues: 0, teams: 0, sports: 0 });
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [leagues, teams, sportsList, matches] = await Promise.all([
      base44.entities.League.filter({ status: 'activa' }),
      base44.entities.Team.filter({ status: 'aprobado' }),
      base44.entities.Sport.filter({ is_active: true }),
      base44.entities.Match.list('-match_date', 30)]
      );
      const now = new Date();
      setStats({ leagues: leagues.length, teams: teams.length, sports: sportsList.length });
      setSports(sportsList.slice(0, 8));
      setUpcoming(matches.filter((m) => m.status === 'programado' && m.match_date && new Date(m.match_date) > now).slice(0, 4));
      setRecent(matches.filter((m) => m.status === 'finalizado').slice(0, 4));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[hsl(272,35%,14%)] via-[hsl(272,35%,18%)] to-[hsl(274,45%,24%)]">
        {/* Banner "ciudad del deporte" como franja decorativa superior */}
        <div className="w-full overflow-hidden opacity-20 h-16">
          <img src={CIUDAD_DEPORTE_LOGO} alt="" className="w-full h-full object-cover object-center hidden" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-14 flex flex-col lg:flex-row items-center gap-10">
          {/* Texto */}
          <div className="flex-1 text-center lg:text-left">
            {/* Logo ayuntamiento */}
            <div className="inline-flex bg-white rounded-xl px-4 py-2 mb-6 shadow-lg">
              <img src={AYTO_LOGO} alt="Ayuntamiento de Torrejón de Ardoz" className="h-10 object-contain" />
            </div>
            <h1 className="font-oswald font-bold text-white text-5xl md:text-6xl leading-none mb-3">
              CONCEJALÍA<br /><span className="text-[hsl(44,95%,55%)]">DE DEPORTES</span>
            </h1>
            <p className="text-white/60 text-base mb-8 max-w-lg">Sigue todas las competiciones municipales · Resultados, clasificaciones y calendarios en tiempo real

            </p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link to="/ligas"
              className="bg-[hsl(44,95%,55%)] hover:bg-[hsl(44,95%,48%)] text-[hsl(272,50%,12%)] px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md">
                Ver competiciones <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/clasificaciones"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors">
                Clasificaciones <BarChart3 className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Logo Ciudad Europea del Deporte */}
          <div className="flex-shrink-0 flex flex-col items-center gap-4">
            <img
              src={EUROPEAN_SPORT_LOGO}
              alt="European City of Sport 2026"
              className="w-48 h-48 object-contain drop-shadow-2xl" />
            
          </div>
        </div>

        {/* Franja deportistas */}
        <div className="w-full overflow-hidden h-28 opacity-30">
          <img src={DEPORTISTAS_IMG} alt="" className="w-full h-full object-cover object-top hidden" />
        </div>
      </div>

      {/* ── BANNER CIUDAD DEL DEPORTE ── */}
      <div className="w-full overflow-hidden bg-black shadow-md">
        <img
          src={CIUDAD_DEPORTE_LOGO}
          alt="Torrejón Ciudad del Deporte"
          className="w-full max-h-20 object-cover object-center hidden" />
        
      </div>

      {/* ── STATS ── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
          {[
          { label: 'Deportes', value: stats.sports, icon: Dumbbell },
          { label: 'Competiciones activas', value: stats.leagues, icon: Trophy },
          { label: 'Equipos participantes', value: stats.teams, icon: BarChart3 }].
          map(({ label, value, icon: Icon }) =>
          <div key={label}>
              <p className="text-3xl font-oswald font-bold text-foreground">
                {loading ? <span className="inline-block w-8 h-7 bg-muted animate-pulse rounded" /> : value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">

        {/* ── DEPORTES ── */}
        {sports.length > 0 &&
        <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-oswald font-bold text-2xl">Deportes municipales</h2>
              <Link to="/deportes" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sports.map((s) =>
            <Link key={s.id} to={`/ligas?sport=${encodeURIComponent(s.name)}`}
            className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:border-primary/30 transition-all">
                  <div className="text-3xl mb-2">{s.icon || '🏅'}</div>
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.type}</p>
                </Link>
            )}
            </div>
          </section>
        }

        {/* ── PARTIDOS ── */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Próximos */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-oswald font-bold text-xl flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Próximos partidos
              </h2>
              <Link to="/partidos" className="text-primary text-sm font-medium hover:underline">Ver todos</Link>
            </div>
            {loading ?
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div> :
            upcoming.length === 0 ?
            <p className="text-muted-foreground text-sm text-center py-8">No hay partidos programados</p> :

            <div className="space-y-3">
                {upcoming.map((m) =>
              <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{m.home_team_name} vs {m.away_team_name}</p>
                      <p className="text-xs text-muted-foreground">{m.league_name}</p>
                      {m.venue && <p className="text-xs text-muted-foreground">📍 {m.venue}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-primary">{format(new Date(m.match_date), "EEE d MMM", { locale: es })}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(m.match_date), 'HH:mm')}</p>
                    </div>
                  </div>
              )}
              </div>
            }
          </section>

          {/* Resultados */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-oswald font-bold text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Últimos resultados
              </h2>
              <Link to="/partidos" className="text-primary text-sm font-medium hover:underline">Ver todos</Link>
            </div>
            {loading ?
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div> :
            recent.length === 0 ?
            <p className="text-muted-foreground text-sm text-center py-8">No hay resultados disponibles</p> :

            <div className="space-y-3">
                {recent.map((m) =>
              <div key={m.id} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-2">{m.league_name} · {m.match_date ? format(new Date(m.match_date), 'dd MMM', { locale: es }) : ''}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm flex-1 text-right truncate">{m.home_team_name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0 bg-muted rounded-lg px-3 py-1">
                        <span className="font-oswald font-bold text-lg">{m.home_score ?? '-'}</span>
                        <span className="text-muted-foreground mx-1">-</span>
                        <span className="font-oswald font-bold text-lg">{m.away_score ?? '-'}</span>
                      </div>
                      <span className="font-semibold text-sm flex-1 truncate">{m.away_team_name}</span>
                    </div>
                  </div>
              )}
              </div>
            }
          </section>
        </div>

        {/* ── IMAGEN DEPORTISTAS ── */}
        <div className="rounded-2xl overflow-hidden shadow-md">
          <img src={DEPORTISTAS_IMG} alt="Deportes en Torrejón de Ardoz" className="w-full object-cover" style={{ maxHeight: 200 }} />
        </div>

        {/* ── CTA DELEGADOS ── */}
        <div className="bg-[hsl(272,35%,14%)] rounded-2xl p-8 text-center">
          <p className="text-[hsl(44,95%,55%)] text-sm font-semibold mb-2">¿Eres delegado de un equipo?</p>
          <h3 className="font-oswald font-bold text-white text-2xl mb-2">Gestiona tu equipo online</h3>
          <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
            Accede a tu panel privado para gestionar jugadores, consultar tus partidos e inscribir nuevos miembros.
          </p>
          <Link to="/mi-panel"
          className="inline-flex items-center gap-2 bg-[hsl(44,95%,55%)] hover:bg-[hsl(44,95%,48%)] text-[hsl(272,50%,12%)] px-6 py-3 rounded-xl font-bold transition-colors">
            Acceder a mi panel <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── FOOTER INFO ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 border-t border-border">
          <img src={AYTO_LOGO} alt="Ayuntamiento de Torrejón de Ardoz" className="h-10 object-contain opacity-70" />
          <img src={EUROPEAN_SPORT_LOGO} alt="European City of Sport 2026" className="h-14 object-contain opacity-70" />
        </div>
      </div>
    </div>);

}