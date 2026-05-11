import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, Trophy, Star, Download, FileText, TrendingUp, Award, ChevronDown, ChevronUp, History } from 'lucide-react';

const STATUS_CONFIG = {
  programado: { label: 'Programado', cls: 'bg-blue-100 text-blue-700' },
  en_juego: { label: 'En juego', cls: 'bg-emerald-100 text-emerald-700' },
  finalizado: { label: 'Finalizado', cls: 'bg-gray-100 text-gray-700' },
  aplazado: { label: 'Aplazado', cls: 'bg-amber-100 text-amber-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
};

export default function HistorialArbitro() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('todos');
  const [filterLeague, setFilterLeague] = useState('todos');
  const [expanded, setExpanded] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [allMatches, allReviews, allReports] = await Promise.all([
        base44.entities.Match.filter({ referee: user.full_name }),
        base44.entities.MatchTeamReview.filter({ referee_name: user.full_name }),
        base44.entities.MatchReport.filter({ referee: user.full_name }),
      ]);
      setMatches(allMatches.sort((a, b) => new Date(b.match_date) - new Date(a.match_date)));
      setReviews(allReviews);
      setReports(allReports);
      setLoading(false);
    };
    load();
  }, [user]);

  const finished = matches.filter(m => m.status === 'finalizado');
  const avgRating = reviews.filter(r => r.referee_rating).length > 0
    ? (reviews.reduce((s, r) => s + (r.referee_rating || 0), 0) / reviews.filter(r => r.referee_rating).length).toFixed(1)
    : '—';

  const leagues = [...new Set(matches.map(m => m.league_name).filter(Boolean))];
  const years = [...new Set(matches.map(m => m.match_date ? new Date(m.match_date).getFullYear() : null).filter(Boolean))].sort((a,b) => b-a);

  const filtered = matches.filter(m => {
    const yearOk = filterYear === 'todos' || (m.match_date && new Date(m.match_date).getFullYear() === parseInt(filterYear));
    const leagueOk = filterLeague === 'todos' || m.league_name === filterLeague;
    return yearOk && leagueOk;
  });

  const reportForMatch = (matchId) => reports.find(r => r.match_id === matchId);
  const reviewsForMatch = (matchId) => reviews.filter(r => r.match_id === matchId);

  const handleExportPDF = async (report) => {
    setExportingId(report.id);
    const response = await base44.functions.invoke('exportarActaPDF', { reportId: report.id });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acta_${report.home_team_name}_vs_${report.away_team_name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setExportingId(null);
  };

  // Stats por competición
  const statsByLeague = leagues.map(league => {
    const leagueMatches = finished.filter(m => m.league_name === league);
    const leagueReviews = reviews.filter(r => r.league_name === league && r.referee_rating);
    const avg = leagueReviews.length > 0
      ? (leagueReviews.reduce((s, r) => s + r.referee_rating, 0) / leagueReviews.length).toFixed(1)
      : '—';
    return { league, count: leagueMatches.length, avg };
  }).filter(s => s.count > 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-oswald font-bold text-3xl">Historial Completo</h1>
        <p className="text-muted-foreground text-sm mt-1">Registro histórico de todos tus partidos arbitrados</p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total arbitrados', value: loading ? '…' : finished.length, icon: Trophy, color: 'text-primary' },
          { label: 'Valoración media', value: loading ? '…' : avgRating, icon: Star, color: 'text-amber-500' },
          { label: 'Competiciones', value: loading ? '…' : leagues.length, icon: Award, color: 'text-emerald-600' },
          { label: 'Actas generadas', value: loading ? '…' : reports.length, icon: FileText, color: 'text-blue-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <p className="font-oswald font-bold text-2xl">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Stats por competición */}
      {statsByLeague.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-oswald font-bold text-lg flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" /> Estadísticas por competición
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {statsByLeague.map(({ league, count, avg }) => (
              <div key={league} className="bg-muted/40 rounded-lg p-3">
                <p className="font-semibold text-sm truncate">{league}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{count} partido{count !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold">{avg}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
          className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="todos">Todos los años</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={filterLeague}
          onChange={e => setFilterLeague(e.target.value)}
          className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="todos">Todas las competiciones</option>
          {leagues.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} partido{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay partidos en los filtros seleccionados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => {
            const report = reportForMatch(m.id);
            const matchReviews = reviewsForMatch(m.id);
            const isExpanded = expanded === m.id;
            const statusCfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.programado;
            const avgR = matchReviews.filter(r => r.referee_rating).length > 0
              ? (matchReviews.reduce((s, r) => s + (r.referee_rating || 0), 0) / matchReviews.filter(r => r.referee_rating).length).toFixed(1)
              : null;

            return (
              <div key={m.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
                        <span className="text-xs text-muted-foreground">{m.sport_name}</span>
                        {report && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            report.status === 'firmado' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {report.status === 'firmado' ? '✔ Acta firmada' : '📋 Borrador'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-sm flex-1 text-right truncate">{m.home_team_name}</span>
                        <div className="bg-muted rounded-lg px-3 py-1 font-oswald font-bold text-lg flex-shrink-0">
                          {m.status === 'finalizado' ? `${m.home_score ?? 0} — ${m.away_score ?? 0}` : 'vs'}
                        </div>
                        <span className="font-semibold text-sm flex-1 truncate">{m.away_team_name}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /><span className="truncate">{m.league_name}</span></div>
                        {m.match_date && <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /><span>{format(new Date(m.match_date), "d MMM yyyy", { locale: es })}</span></div>}
                        {m.venue && <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{m.venue}</span></div>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                      {avgR && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-sm">{avgR}</span>
                        </div>
                      )}
                      {report && (
                        <button
                          onClick={() => handleExportPDF(report)}
                          disabled={exportingId === report.id}
                          className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {exportingId === report.id ? 'Generando...' : 'Acta PDF'}
                        </button>
                      )}
                      {matchReviews.length > 0 && (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : m.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {isExpanded ? 'Ocultar' : 'Ver valoraciones'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && matchReviews.length > 0 && (
                  <div className="border-t border-border bg-muted/30 p-4 space-y-2">
                    <h4 className="text-sm font-semibold">Valoraciones de equipos</h4>
                    {matchReviews.map(r => (
                      <div key={r.id} className="bg-card border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{r.team_name}</span>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} className={`w-3.5 h-3.5 ${n <= (r.referee_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-xs italic text-muted-foreground mt-1">"{r.comment}"</p>}
                        {r.referee_response && (
                          <div className="mt-2 bg-primary/5 border border-primary/20 rounded px-3 py-1.5">
                            <p className="text-xs font-semibold text-primary">Tu respuesta:</p>
                            <p className="text-xs">{r.referee_response}</p>
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