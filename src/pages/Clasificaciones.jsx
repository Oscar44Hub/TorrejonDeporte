import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart3, Trophy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Clasificacion from '@/components/Clasificacion';

export default function Clasificaciones() {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLeagues, setLoadingLeagues] = useState(true);

  useEffect(() => {
    base44.entities.League.filter({ status: 'activa' }).then(data => {
      setLeagues(data);
      if (data.length > 0) setSelectedLeague(data[0].id);
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-oswald font-bold text-3xl">Clasificaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">Tablas de clasificación por liga</p>
      </div>

      {loadingLeagues ? (
        <div className="h-10 bg-muted rounded-xl animate-pulse w-64" />
      ) : leagues.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay ligas activas en este momento</p>
        </div>
      ) : (
        <>
          <div className="mb-6 max-w-xs">
            <Select value={selectedLeague} onValueChange={setSelectedLeague}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar liga..." />
              </SelectTrigger>
              <SelectContent>
                {leagues.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} — {l.season}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="h-64 bg-muted rounded-xl animate-pulse" />
          ) : (
            <Clasificacion teams={teams} matches={matches} />
          )}
        </>
      )}
    </div>
  );
}