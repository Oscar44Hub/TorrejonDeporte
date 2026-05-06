import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_LABELS = { programado: 'Programado', en_juego: 'En juego', finalizado: 'Finalizado', aplazado: 'Aplazado', cancelado: 'Cancelado' };
const STATUS_COLORS = { programado: 'bg-blue-100 text-blue-700', en_juego: 'bg-emerald-100 text-emerald-700', finalizado: 'bg-gray-100 text-gray-600', aplazado: 'bg-amber-100 text-amber-700', cancelado: 'bg-red-100 text-red-600' };

export default function MisPartidos() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');

  useEffect(() => {
    const load = async () => {
      const myTeams = await base44.entities.Team.filter({ delegate_email: user?.email });
      setTeams(myTeams);
      const teamIds = myTeams.map(t => t.id);
      const allMatches = await base44.entities.Match.list('-match_date', 200);
      setMatches(allMatches.filter(m => teamIds.includes(m.home_team_id) || teamIds.includes(m.away_team_id)));
      setLoading(false);
    };
    if (user?.email) load();
  }, [user]);

  const now = new Date();
  const upcoming = matches.filter(m => m.status === 'programado' && m.match_date && new Date(m.match_date) > now).sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const past = matches.filter(m => m.status === 'finalizado').sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
  const filtered = filter === 'proximos' ? upcoming : filter === 'pasados' ? past : [...upcoming, ...matches.filter(m => m.status !== 'programado' || new Date(m.match_date) <= now)].sort((a, b) => new Date(b.match_date) - new Date(a.match_date));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-oswald font-bold text-3xl">Mis partidos</h1>
        <p className="text-muted-foreground text-sm mt-1">Calendario de partidos de tus equipos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['todos', 'Todos'], ['proximos', `Próximos (${upcoming.length})`], ['pasados', `Pasados (${past.length})`]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === v ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay partidos disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => {
            const myTeam = teams.find(t => t.id === m.home_team_id || t.id === m.away_team_id);
            const isHome = myTeam?.id === m.home_team_id;
            return (
              <div key={m.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                        {STATUS_LABELS[m.status]}
                      </span>
                      <span className="text-xs text-muted-foreground">{m.league_name}</span>
                      {m.round && <span className="text-xs text-muted-foreground">· {m.round}</span>}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isHome ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                        {isHome ? 'LOCAL' : 'VISITANTE'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold text-sm truncate ${isHome ? 'text-foreground' : 'text-muted-foreground'}`}>{m.home_team_name}</span>
                      {m.status === 'finalizado' ? (
                        <div className="flex items-center gap-1 flex-shrink-0 bg-muted rounded-lg px-2 py-0.5">
                          <span className="font-oswald font-bold">{m.home_score ?? '-'}</span>
                          <span className="text-muted-foreground text-sm">-</span>
                          <span className="font-oswald font-bold">{m.away_score ?? '-'}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm flex-shrink-0">vs</span>
                      )}
                      <span className={`font-semibold text-sm truncate ${!isHome ? 'text-foreground' : 'text-muted-foreground'}`}>{m.away_team_name}</span>
                    </div>
                    {m.venue && <p className="text-xs text-muted-foreground mt-1">📍 {m.venue}</p>}
                  </div>
                  {m.match_date && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-primary">{format(new Date(m.match_date), "EEE d MMM", { locale: es })}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(m.match_date), 'HH:mm')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}