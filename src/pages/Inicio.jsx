import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Trophy, Calendar, BarChart3, Star, ArrowRight, Clock, TrendingUp, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
        base44.entities.Match.list('-match_date', 30),
      ]);
      const now = new Date();
      setStats({ leagues: leagues.length, teams: teams.length, sports: sportsList.length });
      setSports(sportsList.slice(0, 8));
      setUpcoming(matches.filter(m => m.status === 'programado' && m.match_date && new Date(m.match_date) > now).slice(0, 4));
      setRecent(matches.filter(m => m.status === 'finalizado').slice(0, 4));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-sidebar via-sidebar/95 to-primary/80 py-20 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-60 h-60 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-10 w-40 h-40 rounded-full bg-primary/50 blur-2xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
            <Star className="w-4 h-4 text-primary" fill="currentColor" />
            <span className="text-primary text-sm font-semibold">Ciudad Europea del Deporte 2026</span>
          </div>
          <h1 className="font-oswald font-bold text-white text-5xl md:text-7xl leading-none mb-4">
            TORREJÓN<br /><span className="text-primary">DEPORTES</span>
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Sigue todas las competiciones municipales · Resultados, clasificaciones y calendarios en tiempo real
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/ligas" className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors">
              Ver competiciones <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/clasificaciones" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors">
              Clasificaciones <BarChart3 className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Deportes', value: stats.sports, icon: Dumbbell },
            { label: 'Competiciones activas', value: stats.leagues, icon: Trophy },
            { label: 'Equipos participantes', value: stats.teams, icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <p className="text-3xl font-oswald font-bold text-foreground">
                {loading ? <span className="inline-block w-8 h-7 bg-muted animate-pulse rounded" /> : value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Deportes disponibles */}
        {sports.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-oswald font-bold text-2xl">Deportes municipales</h2>
              <Link to="/deportes" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sports.map(s => (
                <Link key={s.id} to={`/ligas?sport=${encodeURIComponent(s.name)}`}
                  className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:border-primary/30 transition-all">
                  <div className="text-3xl mb-2">{s.icon || '🏅'}</div>
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.type}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Próximos partidos */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-oswald font-bold text-xl flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Próximos partidos
              </h2>
              <Link to="/partidos" className="text-primary text-sm font-medium hover:underline">Ver todos</Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : upcoming.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No hay partidos programados</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map(m => (
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
                ))}
              </div>
            )}
          </section>

          {/* Resultados recientes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-oswald font-bold text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Últimos resultados
              </h2>
              <Link to="/partidos" className="text-primary text-sm font-medium hover:underline">Ver todos</Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : recent.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No hay resultados disponibles</p>
            ) : (
              <div className="space-y-3">
                {recent.map(m => (
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
                ))}
              </div>
            )}
          </section>
        </div>

        {/* CTA delegados */}
        <div className="bg-sidebar rounded-2xl p-8 text-center">
          <p className="text-primary text-sm font-semibold mb-2">¿Eres delegado de un equipo?</p>
          <h3 className="font-oswald font-bold text-white text-2xl mb-2">Gestiona tu equipo online</h3>
          <p className="text-sidebar-foreground/60 text-sm mb-6 max-w-md mx-auto">
            Accede a tu panel privado para gestionar jugadores, consultar tus partidos e inscribir nuevos miembros.
          </p>
          <Link to="/mi-panel" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
            Acceder a mi panel <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}