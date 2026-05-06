import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_COLORS = {
  inscripcion: 'bg-blue-100 text-blue-700',
  activa: 'bg-emerald-100 text-emerald-700',
  finalizada: 'bg-gray-100 text-gray-600',
  suspendida: 'bg-red-100 text-red-600',
};
const STATUS_LABELS = { inscripcion: 'Inscripción', activa: 'Activa', finalizada: 'Finalizada', suspendida: 'Suspendida' };

export default function Ligas() {
  const [leagues, setLeagues] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const l = await base44.entities.League.list('-created_date');
    setLeagues(l);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? leagues : leagues.filter(l => l.status === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-oswald font-bold text-3xl">Ligas y Competiciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Todas las competiciones municipales de Torrejón de Ardoz</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'inscripcion', 'activa', 'finalizada', 'suspendida'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {s === 'all' ? 'Todas' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No hay ligas disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => (
            <div key={l.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-oswald font-semibold text-lg">{l.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[l.status]}`}>
                      {STATUS_LABELS[l.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                    <span>{l.sport_name}</span>
                    {l.category && <span>· {l.category}</span>}
                    {l.season && <span>· {l.season}</span>}
                    {l.gender && <span className="capitalize">· {l.gender}</span>}
                  </div>
                  {l.venue && <p className="text-xs text-muted-foreground mt-1">📍 {l.venue}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/ligas/${l.id}`}>
                    <Button size="sm" variant="ghost" className="gap-1">
                      Ver <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}