import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Search, Filter, CheckCircle2, Clock, Trophy, Save, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MatchScoreDialog from '@/components/admin/MatchScoreDialog';
import MatchReportDialog from '@/components/admin/MatchReportDialog';

const STATUS_LABELS = { programado: 'Programado', en_juego: '🔴 En juego', finalizado: 'Finalizado', aplazado: 'Aplazado', cancelado: 'Cancelado' };
const STATUS_COLORS = {
  programado: 'bg-blue-100 text-blue-700 border-blue-200',
  en_juego: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  finalizado: 'bg-gray-100 text-gray-600 border-gray-200',
  aplazado: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelado: 'bg-red-100 text-red-600 border-red-200',
};

export default function GestionPartidos() {
  const { toast } = useToast();
  const [matches, setMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterLeague, setFilterLeague] = useState('todas');
  const [editMatch, setEditMatch] = useState(null);
  const [reportMatch, setReportMatch] = useState(null);
  const [reportedMatchIds, setReportedMatchIds] = useState(new Set());

  const [exportingLeague, setExportingLeague] = useState(null);
  const [exportingMatch, setExportingMatch] = useState(null);

  const handleExportActaPartido = async (match) => {
    setExportingMatch(match.id);
    const res = await base44.functions.invoke('exportarActaPartido', { matchId: match.id });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const homeName = (match.home_team_name || 'local').replace(/\s/g, '_');
    const awayName = (match.away_team_name || 'visitante').replace(/\s/g, '_');
    a.download = `acta_${homeName}_vs_${awayName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setExportingMatch(null);
  };

  const handleExportActas = async (leagueId, leagueName) => {
    setExportingLeague(leagueId);
    const res = await base44.functions.invoke('exportarActas', { leagueId, leagueName });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `actas_${leagueName.replace(/\s/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setExportingLeague(null);
  };

  const load = async () => {
    const [m, l, reports] = await Promise.all([
      base44.entities.Match.list('-match_date', 300),
      base44.entities.League.list(),
      base44.entities.MatchReport.list(),
    ]);
    setMatches(m);
    setLeagues(l);
    setReportedMatchIds(new Set(reports.map(r => r.match_id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = matches.filter(m => {
    const matchSearch = !search ||
      m.home_team_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.away_team_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.league_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'todos' || m.status === filterStatus;
    const matchLeague = filterLeague === 'todas' || m.league_id === filterLeague;
    return matchSearch && matchStatus && matchLeague;
  });

  const grouped = filtered.reduce((acc, m) => {
    const dateKey = m.match_date ? format(new Date(m.match_date), 'yyyy-MM-dd') : 'sin-fecha';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(m);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const counts = {
    pendientes: matches.filter(m => m.status === 'programado' || m.status === 'en_juego').length,
    finalizados: matches.filter(m => m.status === 'finalizado').length,
    total: matches.length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-oswald font-bold text-3xl text-foreground">Gestión de Partidos</h1>
        <p className="text-muted-foreground text-sm mt-1">Registra resultados y actualiza la clasificación automáticamente</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-3xl font-oswald font-bold text-blue-600">{loading ? '—' : counts.pendientes}</span>
          </div>
          <p className="text-sm text-muted-foreground">Pendientes de resultado</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-3xl font-oswald font-bold text-emerald-600">{loading ? '—' : counts.finalizados}</span>
          </div>
          <p className="text-sm text-muted-foreground">Partidos finalizados</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-3xl font-oswald font-bold text-primary">{loading ? '—' : counts.total}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total de partidos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por equipo o liga..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="todos">Todos los estados</option>
            <option value="programado">Programados</option>
            <option value="en_juego">En juego</option>
            <option value="finalizado">Finalizados</option>
            <option value="aplazado">Aplazados</option>
          </select>
          <select value={filterLeague} onChange={e => setFilterLeague(e.target.value)}
            className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring max-w-48">
            <option value="todas">Todas las ligas</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        {(filterStatus !== 'todos' || filterLeague !== 'todas' || search) && (
          <button onClick={() => { setSearch(''); setFilterStatus('todos'); setFilterLeague('todas'); }}
            className="text-xs text-primary hover:underline">Limpiar filtros</button>
        )}
        {filterLeague !== 'todas' && (
          <button
            onClick={() => {
              const league = leagues.find(l => l.id === filterLeague);
              if (league) handleExportActas(league.id, league.name);
            }}
            disabled={exportingLeague === filterLeague}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" />
            {exportingLeague === filterLeague ? 'Exportando...' : 'Exportar actas PDF'}
          </button>
        )}
      </div>

      {/* Lista de partidos */}
      {loading ? (
        <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay partidos que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateKey => (
            <div key={dateKey}>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {dateKey === 'sin-fecha' ? 'Sin fecha asignada' : format(new Date(dateKey), "EEEE, d MMMM yyyy", { locale: es })}
              </h2>
              <div className="space-y-2">
                {grouped[dateKey].map(m => (
                  <div key={m.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground font-medium">{m.league_name}</span>
                      {m.round && <span className="text-xs text-muted-foreground">· {m.round}</span>}
                      {m.venue && <span className="text-xs text-muted-foreground">· 📍 {m.venue}</span>}
                      <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[m.status] || ''}`}>
                        {STATUS_LABELS[m.status] || m.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Equipos y marcador */}
                      <div className="flex-1 flex items-center gap-3 justify-center">
                        <span className="font-semibold flex-1 text-right text-sm">{m.home_team_name}</span>
                        <div className="flex items-center gap-1 bg-muted rounded-lg px-3 py-1.5 min-w-16 justify-center">
                          {m.status === 'finalizado' || m.status === 'en_juego' ? (
                            <span className="font-oswald font-bold text-xl">
                              {m.home_score ?? '0'} — {m.away_score ?? '0'}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">
                              {m.match_date ? format(new Date(m.match_date), 'HH:mm') : 'TBD'}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold flex-1 text-left text-sm">{m.away_team_name}</span>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditMatch(m)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold transition-colors">
                          <Save className="w-3.5 h-3.5" />
                          {m.status === 'finalizado' ? 'Editar' : 'Resultado'}
                        </button>
                        <button
                         onClick={() => setReportMatch(m)}
                         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                           reportedMatchIds.has(m.id)
                             ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                             : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                         }`}>
                          <FileText className="w-3.5 h-3.5" />
                          {reportedMatchIds.has(m.id) ? 'Acta ✓' : 'Acta'}
                        </button>
                        <button
                         onClick={() => handleExportActaPartido(m)}
                         disabled={exportingMatch === m.id}
                         className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-100 hover:bg-violet-200 text-violet-700 disabled:opacity-50 transition-colors">
                          <Download className="w-3.5 h-3.5" />
                          {exportingMatch === m.id ? '...' : 'Exportar Acta'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editMatch && (
        <MatchScoreDialog
          match={editMatch}
          onClose={() => setEditMatch(null)}
          onSaved={() => { setEditMatch(null); load(); }}
        />
      )}
      {reportMatch && (
        <MatchReportDialog
          match={reportMatch}
          onClose={() => setReportMatch(null)}
          onSaved={() => { setReportMatch(null); load(); }}
        />
      )}
    </div>
  );
}