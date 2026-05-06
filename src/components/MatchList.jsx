import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar, Pencil, ClipboardEdit } from 'lucide-react';
import ResultadoInlineForm from '@/components/ResultadoInlineForm';

const STATUS_LABELS = { programado: 'Programado', en_juego: 'En juego', finalizado: 'Finalizado', aplazado: 'Aplazado', cancelado: 'Cancelado' };
const STATUS_COLORS = { programado: 'bg-blue-100 text-blue-700', en_juego: 'bg-emerald-100 text-emerald-700', finalizado: 'bg-gray-100 text-gray-600', aplazado: 'bg-amber-100 text-amber-700', cancelado: 'bg-red-100 text-red-600' };

export default function MatchList({ matches, teams, isAdmin, onEdit, onSaved }) {
  const [resultadoOpen, setResultadoOpen] = useState(null);
  const sorted = [...matches].sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>No hay partidos programados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map(m => (
        <div key={m.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {m.round && <span className="text-xs text-muted-foreground font-medium">{m.round}</span>}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                  {STATUS_LABELS[m.status]}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm truncate">{m.home_team_name}</span>
                {m.status === 'finalizado' || m.status === 'en_juego' ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xl font-oswald font-bold">{m.home_score ?? '-'}</span>
                    <span className="text-muted-foreground mx-1">—</span>
                    <span className="text-xl font-oswald font-bold">{m.away_score ?? '-'}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm flex-shrink-0">vs</span>
                )}
                <span className="font-semibold text-sm truncate">{m.away_team_name}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{m.match_date ? format(new Date(m.match_date), "EEEE dd MMM · HH:mm", { locale: es }) : '-'}</span>
                {m.venue && <span>· 📍 {m.venue}</span>}
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setResultadoOpen(resultadoOpen === m.id ? null : m.id)}
                  title="Registrar resultado"
                  className={`p-2 rounded-lg transition-colors ${resultadoOpen === m.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                  <ClipboardEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(m)}
                  title="Editar partido"
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Formulario inline de resultado */}
          {isAdmin && resultadoOpen === m.id && (
            <ResultadoInlineForm
              match={m}
              onSaved={() => { setResultadoOpen(null); onSaved(); }}
              onCancel={() => setResultadoOpen(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}