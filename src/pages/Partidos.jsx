import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_LABELS = { programado: 'Programado', en_juego: '🔴 En juego', finalizado: 'Finalizado', aplazado: 'Aplazado', cancelado: 'Cancelado' };
const STATUS_COLORS = { programado: 'bg-blue-100 text-blue-700', en_juego: 'bg-emerald-100 text-emerald-700', finalizado: 'bg-gray-100 text-gray-600', aplazado: 'bg-amber-100 text-amber-700', cancelado: 'bg-red-100 text-red-600' };

export default function Partidos() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Match.list('-match_date', 100).then(data => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  const filtered = matches.filter(m => {
    const matchFilter = filter === 'all' || m.status === filter;
    const searchFilter = !search || m.home_team_name?.toLowerCase().includes(search.toLowerCase()) || m.away_team_name?.toLowerCase().includes(search.toLowerCase()) || m.league_name?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && searchFilter;
  });

  // Group by date
  const grouped = filtered.reduce((acc, m) => {
    const dateKey = m.match_date ? format(new Date(m.match_date), 'yyyy-MM-dd') : 'sin-fecha';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(m);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-oswald font-bold text-3xl">Partidos</h1>
        <p className="text-muted-foreground text-sm mt-1">Calendario y resultados de todas las competiciones</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar equipos o liga..." className="pl-9" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'programado', 'en_juego', 'finalizado', 'aplazado'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay partidos disponibles</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateKey => (
            <div key={dateKey}>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {dateKey === 'sin-fecha' ? 'Sin fecha' : format(new Date(dateKey), "EEEE, d MMMM yyyy", { locale: es })}
              </h2>
              <div className="space-y-2">
                {grouped[dateKey].map(m => (
                  <div key={m.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">{m.league_name}</span>
                      {m.round && <span className="text-xs text-muted-foreground">· {m.round}</span>}
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                        {STATUS_LABELS[m.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold flex-1 text-right">{m.home_team_name}</span>
                      <div className="flex items-center gap-2 text-center flex-shrink-0">
                        {m.status === 'finalizado' || m.status === 'en_juego' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-2xl font-oswald font-bold w-8 text-center">{m.home_score ?? '-'}</span>
                            <span className="text-muted-foreground">—</span>
                            <span className="text-2xl font-oswald font-bold w-8 text-center">{m.away_score ?? '-'}</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-muted rounded-lg">
                            <p className="text-xs font-bold text-muted-foreground">{m.match_date ? format(new Date(m.match_date), 'HH:mm') : 'Hora TBD'}</p>
                          </div>
                        )}
                      </div>
                      <span className="font-semibold flex-1 text-left">{m.away_team_name}</span>
                    </div>
                    {m.venue && <p className="text-xs text-muted-foreground text-center mt-2">📍 {m.venue}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}