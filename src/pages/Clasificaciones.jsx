import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ClasificacionCompleta from '@/components/ClasificacionCompleta';

const SPORT_GROUPS = ['Fútbol Sala', 'Fútbol 7', 'Fútbol 11', 'Baloncesto', 'Balonmano', 'Voleibol', 'Tenis de Mesa', 'Pádel'];

export default function Clasificaciones() {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [sportFilter, setSportFilter] = useState('all');

  useEffect(() => {
    base44.entities.League.list().then(data => {
      const active = data.filter(l => l.status === 'activa' || l.status === 'finalizada');
      setLeagues(active);
      if (active.length > 0) setSelectedLeague(active[0].id);
      setLoadingLeagues(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);
    Promise.all([
      base44.entities.Team.filter({ league_id: selectedLeague }),
      base44.entities.Match.filter({ league_id: selectedLeague }),
    ]).then(([t, m]) => {
      setTeams(t);
      setMatches(m);
      setLoading(false);
    });
  }, [selectedLeague]);

  const filteredLeagues = sportFilter === 'all' ? leagues : leagues.filter(l => l.sport_name === sportFilter);
  const sports = [...new Set(leagues.map(l => l.sport_name).filter(Boolean))];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-oswald font-bold text-3xl">Clasificaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">Tablas de clasificación por liga y competición</p>
      </div>

      {loadingLeagues ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted rounded-xl animate-pulse w-64" />)}</div>
      ) : leagues.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay ligas con clasificaciones disponibles</p>
        </div>
      ) : (
        <>
          {/* Filtro deporte */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => setSportFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${sportFilter === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              Todos
            </button>
            {sports.map(s => (
              <button key={s} onClick={() => setSportFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${sportFilter === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Selector de liga */}
          <div className="mb-6 max-w-sm">
            <Select value={selectedLeague} onValueChange={setSelectedLeague}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar competición..." />
              </SelectTrigger>
              <SelectContent>
                {filteredLeagues.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} — {l.season}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          <div className="bg-card border border-border rounded-xl p-5">
            {loading ? (
              <div className="h-64 bg-muted rounded-xl animate-pulse" />
            ) : (
              <ClasificacionCompleta teams={teams} matches={matches} />
            )}
          </div>
        </>
      )}
    </div>
  );
}