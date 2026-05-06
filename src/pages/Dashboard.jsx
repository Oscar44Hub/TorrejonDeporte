import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Trophy, Users, Calendar, Shield, TrendingUp, Star, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const [stats, setStats] = useState({ sports: 0, leagues: 0, teams: 0, matches: 0 });
  const [recentMatches, setRecentMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [sports, leagues, teams, matches] = await Promise.all([
        base44.entities.Sport.list(),
        base44.entities.League.list(),
        base44.entities.Team.list(),
        base44.entities.Match.list('-match_date', 50),
      ]);
      setStats({ sports: sports.length, leagues: leagues.length, teams: teams.length, matches: matches.length });
      const now = new Date();
      setRecentMatches(matches.filter(m => m.status === 'finalizado').slice(0, 5));
      setUpcomingMatches(matches.filter(m => m.status === 'programado').slice(0, 5));
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { label: 'Deportes', value: stats.sports, icon: Trophy, color: 'text-primary', bg: 'bg-primary/10', link: '/deportes' },
    { label: 'Ligas activas', value: stats.leagues, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', link: '/ligas' },
    { label: 'Equipos', value: stats.teams, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/equipos' },
    { label: 'Partidos', value: stats.matches, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', link: '/partidos' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-foreground via-foreground/90 to-primary mb-8 p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-0 left-20 w-32 h-32 rounded-full bg-primary/40 blur-xl" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-primary fill-primary" />
              <span className="text-primary text-sm font-semibold tracking-widest uppercase">Ciudad Europea del Deporte 2026</span>
            </div>
            <h1 className="font-oswald font-bold text-white text-4xl md:text-5xl leading-tight">
              CONCEJALÍA DE<br />DEPORTES
            </h1>
            <p className="text-white/60 mt-2 text-sm">Ayuntamiento de Torrejón de Ardoz</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/ligas" className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
              Ver ligas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg, link }) => (
          <Link key={label} to={link} className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            {loading ? (
              <div className="h-8 w-12 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-oswald font-bold text-foreground">{value}</p>
            )}
            <p className="text-muted-foreground text-sm mt-1">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Próximos partidos */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-oswald font-semibold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Próximos partidos
            </h2>
            <Link to="/partidos" className="text-primary text-sm font-medium hover:underline">Ver todos</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : upcomingMatches.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No hay partidos programados</p>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.home_team_name} vs {m.away_team_name}</p>
                    <p className="text-xs text-muted-foreground">{m.league_name} · {m.venue || 'Por definir'}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-xs font-semibold text-primary">{m.match_date ? format(new Date(m.match_date), 'dd MMM', { locale: es }) : '-'}</p>
                    <p className="text-xs text-muted-foreground">{m.match_date ? format(new Date(m.match_date), 'HH:mm') : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resultados recientes */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-oswald font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Resultados recientes
            </h2>
            <Link to="/partidos" className="text-primary text-sm font-medium hover:underline">Ver todos</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : recentMatches.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No hay resultados disponibles</p>
          ) : (
            <div className="space-y-3">
              {recentMatches.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.home_team_name}</p>
                    <p className="text-xs text-muted-foreground">{m.league_name}</p>
                  </div>
                  <div className="flex items-center gap-2 mx-3">
                    <span className="text-lg font-oswald font-bold">{m.home_score ?? '-'}</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-lg font-oswald font-bold">{m.away_score ?? '-'}</span>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-sm font-medium truncate">{m.away_team_name}</p>
                    <p className="text-xs text-muted-foreground">{m.match_date ? format(new Date(m.match_date), 'dd MMM', { locale: es }) : '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}