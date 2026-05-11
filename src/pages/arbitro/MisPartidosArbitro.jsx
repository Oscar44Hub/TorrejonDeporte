import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, Trophy, Clock, Star, MessageSquare, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  programado: { label: 'Programado', cls: 'bg-blue-100 text-blue-700' },
  en_juego: { label: 'En juego', cls: 'bg-emerald-100 text-emerald-700' },
  finalizado: { label: 'Finalizado', cls: 'bg-gray-100 text-gray-700' },
  aplazado: { label: 'Aplazado', cls: 'bg-amber-100 text-amber-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
};

export default function MisPartidosArbitro() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [expanded, setExpanded] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [allMatches, allReviews] = await Promise.all([
        base44.entities.Match.filter({ referee: user.full_name }),
        base44.entities.MatchTeamReview.filter({ referee_name: user.full_name }),
      ]);
      setMatches(allMatches.sort((a, b) => new Date(b.match_date) - new Date(a.match_date)));
      setReviews(allReviews);
      setLoading(false);
    };
    load();
  }, [user]);

  const now = new Date();
  const filtered = filter === 'todos' ? matches
    : filter === 'proximos' ? matches.filter(m => m.status === 'programado' && new Date(m.match_date) > now)
    : matches.filter(m => m.status === 'finalizado');

  const reviewsForMatch = (matchId) => reviews.filter(r => r.match_id === matchId);

  const handleRespond = async (reviewId) => {
    setSaving(true);
    await base44.entities.MatchTeamReview.update(reviewId, {
      referee_response: responseText,
      status: 'corroborado_arbitro',
    });
    setReviews(prev => prev.map(r => r.id === reviewId
      ? { ...r, referee_response: responseText, status: 'corroborado_arbitro' }
      : r
    ));
    setRespondingTo(null);
    setResponseText('');
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-oswald font-bold text-3xl">Mis Partidos</h1>
        <p className="text-muted-foreground text-sm mt-1">Historial completo de partidos arbitrados</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'proximos', label: 'Próximos' },
          { key: 'finalizados', label: 'Finalizados' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay partidos en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(m => {
            const matchReviews = reviewsForMatch(m.id);
            const isExpanded = expanded === m.id;
            const statusCfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.programado;
            const avgRating = matchReviews.filter(r => r.referee_rating).length > 0
              ? (matchReviews.reduce((s, r) => s + (r.referee_rating || 0), 0) / matchReviews.filter(r => r.referee_rating).length).toFixed(1)
              : null;

            return (
              <div key={m.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Match header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{m.sport_name}</span>
                      </div>
                      {/* Marcador */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-sm flex-1 text-right truncate">{m.home_team_name}</span>
                        <div className="bg-muted rounded-lg px-3 py-1 font-oswald font-bold text-lg flex-shrink-0">
                          {m.status === 'finalizado' ? `${m.home_score ?? 0} — ${m.away_score ?? 0}` : 'vs'}
                        </div>
                        <span className="font-semibold text-sm flex-1 truncate">{m.away_team_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      <span className="truncate">{m.league_name}</span>
                    </div>
                    {m.match_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(m.match_date), "d MMM yyyy", { locale: es })}</span>
                      </div>
                    )}
                    {m.match_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{format(new Date(m.match_date), 'HH:mm')}</span>
                      </div>
                    )}
                    {m.venue && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{m.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Reviews summary */}
                  {matchReviews.length > 0 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold">{avgRating} / 5</span>
                        <span className="text-xs text-muted-foreground">({matchReviews.length} valoración{matchReviews.length !== 1 ? 'es' : ''})</span>
                      </div>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : m.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {isExpanded ? 'Ocultar' : 'Ver valoraciones'}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded reviews */}
                {isExpanded && matchReviews.length > 0 && (
                  <div className="border-t border-border bg-muted/30 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" /> Valoraciones de los equipos
                    </h4>
                    {matchReviews.map(r => (
                      <div key={r.id} className="bg-card border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold text-sm">{r.team_name}</span>
                            <span className="text-xs text-muted-foreground ml-2">· {r.signer_name} ({r.signer_role === 'capitan' ? 'Capitán' : 'Delegado'})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} className={`w-3.5 h-3.5 ${n <= (r.referee_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-foreground italic bg-muted/50 rounded-lg px-3 py-2 mb-2">"{r.comment}"</p>
                        )}
                        {!r.accepts_result && r.protest_reason && (
                          <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 mb-2">
                            ⚠️ Protesta: {r.protest_reason}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            r.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                            r.status === 'verificado_admin' ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {r.status === 'pendiente' ? '⏳ Pendiente' : r.status === 'verificado_admin' ? '✅ Verificado por admin' : '✔️ Corroborado'}
                          </span>
                          {r.status === 'verificado_admin' && !r.referee_response && (
                            <button
                              onClick={() => { setRespondingTo(r.id); setResponseText(''); }}
                              className="text-xs text-primary hover:underline"
                            >
                              Responder
                            </button>
                          )}
                        </div>
                        {r.referee_response && (
                          <div className="mt-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                            <p className="text-xs font-semibold text-primary mb-0.5">Tu respuesta:</p>
                            <p className="text-xs">{r.referee_response}</p>
                          </div>
                        )}
                        {respondingTo === r.id && (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={responseText}
                              onChange={e => setResponseText(e.target.value)}
                              placeholder="Escribe tu respuesta al comentario..."
                              rows={3}
                              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setRespondingTo(null)}
                                className="flex-1 py-1.5 border border-input rounded-lg text-sm hover:bg-muted transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleRespond(r.id)}
                                disabled={saving || !responseText.trim()}
                                className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                              >
                                {saving ? 'Enviando...' : 'Enviar respuesta'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}