import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Flag, ShieldAlert, Trophy, Search, Filter, AlertTriangle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const INCIDENT_LABELS = {
  gol: { label: '⚽ Gol', color: 'bg-emerald-100 text-emerald-700' },
  tarjeta_amarilla: { label: '🟨 Tarjeta amarilla', color: 'bg-amber-100 text-amber-700' },
  tarjeta_roja: { label: '🟥 Tarjeta roja', color: 'bg-red-100 text-red-700' },
  doble_amarilla: { label: '🟨🟥 Doble amarilla', color: 'bg-orange-100 text-orange-700' },
  lesion: { label: '🏥 Lesión', color: 'bg-blue-100 text-blue-700' },
  sustitucion: { label: '🔄 Sustitución', color: 'bg-purple-100 text-purple-700' },
  penalti: { label: '⚡ Penalti', color: 'bg-indigo-100 text-indigo-700' },
  otro: { label: '📝 Otro', color: 'bg-gray-100 text-gray-700' },
};

const SANCTION_LABELS = {
  tarjeta_roja: 'Tarjeta roja directa',
  doble_amarilla: 'Doble amarilla',
  acumulacion_amarillas: 'Acumulación amarillas',
  conducta_antideportiva: 'Conducta antideportiva',
  otro: 'Otro motivo',
};

export default function PanelIncidencias() {
  const [reports, setReports] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all | incidencias | sanciones
  const [activeTab, setActiveTab] = useState('incidencias'); // incidencias | sanciones

  useEffect(() => {
    const load = async () => {
      const [r, l] = await Promise.all([
        base44.entities.MatchReport.list('-created_date', 200),
        base44.entities.League.list(),
      ]);
      setReports(r);
      setLeagues(l);
      setLoading(false);
    };
    load();
  }, []);

  // Aplanar todas las incidencias
  const allIncidents = reports.flatMap(r =>
    (r.incidents || []).map(inc => ({
      ...inc,
      report_id: r.id,
      match_date: r.match_date,
      league_name: r.league_name,
      league_id: r.league_id,
      home_team_name: r.home_team_name,
      away_team_name: r.away_team_name,
    }))
  );

  // Aplanar todas las sanciones
  const allSanctions = reports.flatMap(r =>
    (r.sanctions || []).map(s => ({
      ...s,
      report_id: r.id,
      match_date: r.match_date,
      league_name: r.league_name,
      league_id: r.league_id,
      home_team_name: r.home_team_name,
      away_team_name: r.away_team_name,
    }))
  );

  const filterLeague = (item) => !leagueFilter || item.league_id === leagueFilter;
  const filterSearch = (item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (item.player_name || '').toLowerCase().includes(q) ||
      (item.team_name || '').toLowerCase().includes(q) ||
      (item.league_name || '').toLowerCase().includes(q)
    );
  };

  const filteredIncidents = allIncidents.filter(filterLeague).filter(filterSearch);
  const filteredSanctions = allSanctions.filter(filterLeague).filter(filterSearch);

  // KPIs
  const totalRojas = allIncidents.filter(i => i.type === 'tarjeta_roja' || i.type === 'doble_amarilla').length;
  const totalAmarillas = allIncidents.filter(i => i.type === 'tarjeta_amarilla').length;
  const totalSanciones = allSanctions.length;
  const totalGoles = allIncidents.filter(i => i.type === 'gol').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <Flag className="w-3.5 h-3.5" /> Administración
        </p>
        <h1 className="font-oswald font-bold text-3xl">Panel de Incidencias</h1>
        <p className="text-muted-foreground text-sm mt-1">Registro de incidencias y sanciones de todas las ligas y competiciones</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Goles registrados', value: totalGoles, color: 'text-emerald-600', bg: 'bg-emerald-100', icon: '⚽' },
          { label: 'Tarjetas amarillas', value: totalAmarillas, color: 'text-amber-600', bg: 'bg-amber-100', icon: '🟨' },
          { label: 'Rojas / Dobles', value: totalRojas, color: 'text-red-600', bg: 'bg-red-100', icon: '🟥' },
          { label: 'Sanciones totales', value: totalSanciones, color: 'text-purple-600', bg: 'bg-purple-100', icon: '⚖️' },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center text-xl flex-shrink-0`}>{k.icon}</div>
            <div>
              {loading ? <div className="h-7 w-10 bg-muted rounded animate-pulse mb-1" /> : <p className={`text-2xl font-oswald font-bold ${k.color}`}>{k.value}</p>}
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 border border-input rounded-lg px-3 py-2 bg-background flex-1 min-w-48">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar jugador, equipo..."
            className="flex-1 text-sm bg-transparent focus:outline-none"
          />
        </div>
        <select
          value={leagueFilter}
          onChange={e => setLeagueFilter(e.target.value)}
          className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Todas las ligas</option>
          {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { id: 'incidencias', label: 'Incidencias', count: filteredIncidents.length, icon: Flag },
          { id: 'sanciones', label: 'Sanciones', count: filteredSanctions.length, icon: ShieldAlert },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {/* Panel incidencias */}
          {activeTab === 'incidencias' && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {filteredIncidents.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Flag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No hay incidencias registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Tipo</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Jugador</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Equipo</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Liga</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Partido</th>
                        <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Min</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredIncidents.map((inc, i) => {
                        const meta = INCIDENT_LABELS[inc.type] || INCIDENT_LABELS.otro;
                        return (
                          <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>{meta.label}</span>
                            </td>
                            <td className="px-4 py-3 font-medium">{inc.player_name || <span className="text-muted-foreground italic">Sin jugador</span>}</td>
                            <td className="px-4 py-3 text-muted-foreground">{inc.team_name || '—'}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{inc.league_name}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{inc.home_team_name} vs {inc.away_team_name}</td>
                            <td className="px-4 py-3 text-center font-mono text-xs">{inc.minute ? `${inc.minute}'` : '—'}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {inc.match_date ? format(new Date(inc.match_date), 'dd MMM yyyy', { locale: es }) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Panel sanciones */}
          {activeTab === 'sanciones' && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {filteredSanctions.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No hay sanciones registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Jugador</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Equipo</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Motivo</th>
                        <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Partidos</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Liga</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Fecha</th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredSanctions.map((s, i) => (
                        <tr key={i} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{s.player_name || <span className="text-muted-foreground italic">Sin nombre</span>}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.team_name || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              {SANCTION_LABELS[s.reason] || s.reason}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-red-600">{s.matches_suspended || 1}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{s.league_name}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {s.match_date ? format(new Date(s.match_date), 'dd MMM yyyy', { locale: es }) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{s.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}