import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy, Bell, Clock, CheckCircle, AlertCircle, ChevronRight, UserPlus } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

export default function DashboardDelegado() {
  const { user } = useAuth();
  const [myTeams, setMyTeams] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [myPlayers, setMyPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Buscar equipos donde el delegado es el usuario actual
      const [teams, allMatches, allPlayers] = await Promise.all([
        base44.entities.Team.filter({ delegate_email: user?.email }),
        base44.entities.Match.list('-match_date', 200),
        base44.entities.Player.list(),
      ]);
      setMyTeams(teams);
      const teamIds = teams.map(t => t.id);
      const relatedMatches = allMatches.filter(m =>
        teamIds.includes(m.home_team_id) || teamIds.includes(m.away_team_id)
      );
      setMyMatches(relatedMatches);
      setMyPlayers(allPlayers.filter(p => teamIds.includes(p.team_id)));
      setLoading(false);
    };
    if (user?.email) load();
  }, [user]);

  const now = new Date();
  const upcoming = myMatches.filter(m => m.status === 'programado' && m.match_date && isAfter(new Date(m.match_date), now)).sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const recent = myMatches.filter(m => m.status === 'finalizado').slice(0, 5);
  const alerts = upcoming.filter(m => m.match_date && isBefore(new Date(m.match_date), addDays(now, 7)));
  const pendingPlayers = myPlayers.filter(p => p.status === 'activo');
  const sanctioned = myPlayers.filter(p => p.status === 'sancionado');

  if (loading) return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-oswald font-bold text-3xl">Mi Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Bienvenido, {user?.full_name} · Delegado de equipo</p>
      </div>

      {/* Alertas próxima semana */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-amber-800 text-sm">Partidos esta semana ({alerts.length})</span>
          </div>
          <div className="space-y-2">
            {alerts.map(m => {
              const myTeam = myTeams.find(t => t.id === m.home_team_id || t.id === m.away_team_id);
              const isHome = myTeam?.id === m.home_team_id;
              return (
                <div key={m.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                  <div>
                    <p className="text-sm font-medium">{myTeam?.name} {isHome ? 'vs' : 'en'} {isHome ? m.away_team_name : m.home_team_name}</p>
                    <p className="text-xs text-amber-700">{m.league_name} · {m.venue || 'Lugar por confirmar'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-800">{format(new Date(m.match_date), "EEE d MMM", { locale: es })}</p>
                    <p className="text-xs text-amber-600">{format(new Date(m.match_date), 'HH:mm')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mis equipos */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-oswald font-bold">{myTeams.length}</p>
          <p className="text-sm text-muted-foreground">Equipo(s)</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-oswald font-bold">{myPlayers.length}</p>
          <p className="text-sm text-muted-foreground">Jugadores</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-oswald font-bold">{upcoming.length}</p>
          <p className="text-sm text-muted-foreground">Próximos partidos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mis equipos detalle */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-oswald font-semibold text-lg">Mis equipos</h2>
            <Link to="/inscripcion" className="text-primary text-sm font-medium hover:underline">+ Inscribir equipo</Link>
          </div>
          {myTeams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No tienes equipos inscritos</p>
              <Link to="/inscripcion">
                <Button size="sm" className="mt-3">Inscribir equipo</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myTeams.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.league_name} · {t.sport_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'aprobado' ? 'bg-emerald-100 text-emerald-700' : t.status === 'rechazado' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                      {t.status === 'aprobado' ? 'Aprobado' : t.status === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximos partidos */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-oswald font-semibold text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Próximos partidos
            </h2>
            <Link to="/partidos" className="text-primary text-sm font-medium hover:underline">Ver todos</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin partidos programados</p>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 5).map(m => {
                const myTeam = myTeams.find(t => t.id === m.home_team_id || t.id === m.away_team_id);
                const isHome = myTeam?.id === m.home_team_id;
                return (
                  <div key={m.id} className="p-3 bg-muted/40 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{isHome ? 'LOCAL' : 'VISITANTE'} · {m.league_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.home_team_name} vs {m.away_team_name}</p>
                        {m.venue && <p className="text-xs text-muted-foreground">📍 {m.venue}</p>}
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-xs font-bold text-primary">{format(new Date(m.match_date), "EEE d MMM", { locale: es })}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(m.match_date), 'HH:mm')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Jugadores sancionados/alertas */}
        {sanctioned.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h2 className="font-oswald font-semibold text-lg flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-red-500" /> Jugadores sancionados
            </h2>
            <div className="space-y-2">
              {sanctioned.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-medium">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">{p.team_name}</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Sancionado</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultados recientes */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-oswald font-semibold text-lg flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Últimos resultados
          </h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin resultados aún</p>
          ) : (
            <div className="space-y-2">
              {recent.map(m => {
                const myTeam = myTeams.find(t => t.id === m.home_team_id || t.id === m.away_team_id);
                const isHome = myTeam?.id === m.home_team_id;
                const myScore = isHome ? m.home_score : m.away_score;
                const theirScore = isHome ? m.away_score : m.home_score;
                const result = myScore > theirScore ? 'V' : myScore < theirScore ? 'D' : 'E';
                const resultColor = result === 'V' ? 'bg-emerald-500 text-white' : result === 'D' ? 'bg-red-400 text-white' : 'bg-amber-400 text-white';
                return (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-lg">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${resultColor}`}>{result}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{m.home_team_name} {m.home_score} - {m.away_score} {m.away_team_name}</p>
                      <p className="text-xs text-muted-foreground">{m.league_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0">{m.match_date ? format(new Date(m.match_date), 'dd MMM', { locale: es }) : ''}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Acceso rápido inscripción jugadores */}
      <div className="mt-6 bg-accent/40 border border-accent rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4" /> Gestión de plantilla</h3>
            <p className="text-sm text-muted-foreground mt-1">Inscribe o gestiona los jugadores de tus equipos</p>
          </div>
          <div className="flex gap-2">
            <Link to="/inscripcion-jugador">
              <Button size="sm" className="gap-2"><UserPlus className="w-4 h-4" /> Inscribir jugador</Button>
            </Link>
            <Link to="/equipos">
              <Button size="sm" variant="outline" className="gap-2"><Users className="w-4 h-4" /> Ver equipos</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}