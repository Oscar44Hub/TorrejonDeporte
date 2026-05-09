import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import {
  X, Save, FileText, Plus, Trash2, AlertTriangle,
  ShieldAlert, Flag, User, Clock
} from 'lucide-react';

const INCIDENT_TYPES = [
  { value: 'gol', label: '⚽ Gol', color: 'text-emerald-600' },
  { value: 'tarjeta_amarilla', label: '🟨 Tarjeta amarilla', color: 'text-amber-500' },
  { value: 'tarjeta_roja', label: '🟥 Tarjeta roja', color: 'text-red-600' },
  { value: 'doble_amarilla', label: '🟨🟥 Doble amarilla', color: 'text-orange-600' },
  { value: 'lesion', label: '🏥 Lesión', color: 'text-blue-500' },
  { value: 'sustitucion', label: '🔄 Sustitución', color: 'text-purple-500' },
  { value: 'penalti', label: '⚡ Penalti', color: 'text-indigo-500' },
  { value: 'otro', label: '📝 Otro', color: 'text-gray-500' },
];

const SANCTION_REASONS = [
  { value: 'tarjeta_roja', label: 'Tarjeta roja directa' },
  { value: 'doble_amarilla', label: 'Doble tarjeta amarilla' },
  { value: 'acumulacion_amarillas', label: 'Acumulación de amarillas' },
  { value: 'conducta_antideportiva', label: 'Conducta antideportiva' },
  { value: 'otro', label: 'Otro motivo' },
];

const emptyIncident = () => ({
  minute: '',
  type: 'tarjeta_amarilla',
  team_id: '',
  team_name: '',
  player_id: '',
  player_name: '',
  description: '',
  _key: Math.random(),
});

const emptySanction = () => ({
  player_id: '',
  player_name: '',
  team_id: '',
  team_name: '',
  reason: 'tarjeta_roja',
  matches_suspended: 1,
  notes: '',
  _key: Math.random(),
});

export default function MatchReportDialog({ match, onClose, onSaved }) {
  const { toast } = useToast();
  const [players, setPlayers] = useState([]);
  const [existingReport, setExistingReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('incidencias');

  const [referee, setReferee] = useState(match.referee || '');
  const [generalNotes, setGeneralNotes] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [reportStatus, setReportStatus] = useState('borrador');

  // Cargar jugadores de ambos equipos y acta existente
  useEffect(() => {
    const load = async () => {
      const [homePlayers, awayPlayers, reports] = await Promise.all([
        base44.entities.Player.filter({ team_id: match.home_team_id }),
        base44.entities.Player.filter({ team_id: match.away_team_id }),
        base44.entities.MatchReport.filter({ match_id: match.id }),
      ]);
      setPlayers([...homePlayers, ...awayPlayers]);

      if (reports.length > 0) {
        const r = reports[0];
        setExistingReport(r);
        setReferee(r.referee || match.referee || '');
        setGeneralNotes(r.general_notes || '');
        setIncidents((r.incidents || []).map(i => ({ ...i, _key: Math.random() })));
        setSanctions((r.sanctions || []).map(s => ({ ...s, _key: Math.random() })));
        setReportStatus(r.status || 'borrador');
      }
    };
    load();
  }, [match.id]);

  const teams = [
    { id: match.home_team_id, name: match.home_team_name },
    { id: match.away_team_id, name: match.away_team_name },
  ];

  const playersForTeam = (teamId) => players.filter(p => p.team_id === teamId);

  // --- Incidencias ---
  const addIncident = () => setIncidents(prev => [...prev, emptyIncident()]);
  const removeIncident = (key) => setIncidents(prev => prev.filter(i => i._key !== key));
  const updateIncident = (key, field, value) => {
    setIncidents(prev => prev.map(i => {
      if (i._key !== key) return i;
      const updated = { ...i, [field]: value };
      if (field === 'team_id') {
        const team = teams.find(t => t.id === value);
        updated.team_name = team?.name || '';
        updated.player_id = '';
        updated.player_name = '';
      }
      if (field === 'player_id') {
        const player = players.find(p => p.id === value);
        updated.player_name = player?.full_name || '';
      }
      // Auto-sugerir sanción en tarjeta roja / doble amarilla
      if (field === 'type' && (value === 'tarjeta_roja' || value === 'doble_amarilla') && i.player_id) {
        const alreadySanctioned = sanctions.some(s => s.player_id === i.player_id);
        if (!alreadySanctioned) {
          setSanctions(prev => [...prev, {
            ...emptySanction(),
            player_id: i.player_id,
            player_name: i.player_name,
            team_id: i.team_id,
            team_name: i.team_name,
            reason: value === 'tarjeta_roja' ? 'tarjeta_roja' : 'doble_amarilla',
          }]);
        }
      }
      return updated;
    }));
  };

  // --- Sanciones ---
  const addSanction = () => setSanctions(prev => [...prev, emptySanction()]);
  const removeSanction = (key) => setSanctions(prev => prev.filter(s => s._key !== key));
  const updateSanction = (key, field, value) => {
    setSanctions(prev => prev.map(s => {
      if (s._key !== key) return s;
      const updated = { ...s, [field]: value };
      if (field === 'team_id') {
        const team = teams.find(t => t.id === value);
        updated.team_name = team?.name || '';
        updated.player_id = '';
        updated.player_name = '';
      }
      if (field === 'player_id') {
        const player = players.find(p => p.id === value);
        updated.player_name = player?.full_name || '';
      }
      return updated;
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    const cleanIncidents = incidents.map(({ _key, ...i }) => i);
    const cleanSanctions = sanctions.map(({ _key, ...s }) => s);

    const reportData = {
      match_id: match.id,
      match_date: match.match_date,
      league_id: match.league_id,
      league_name: match.league_name,
      home_team_id: match.home_team_id,
      home_team_name: match.home_team_name,
      away_team_id: match.away_team_id,
      away_team_name: match.away_team_name,
      home_score: match.home_score,
      away_score: match.away_score,
      referee,
      venue: match.venue,
      incidents: cleanIncidents,
      sanctions: cleanSanctions,
      general_notes: generalNotes,
      status: reportStatus,
    };

    if (existingReport) {
      await base44.entities.MatchReport.update(existingReport.id, reportData);
    } else {
      await base44.entities.MatchReport.create(reportData);
    }

    // Aplicar sanciones a los jugadores y notificar delegados
    if (cleanSanctions.length > 0) {
      await Promise.all(
        cleanSanctions
          .filter(s => s.player_id)
          .map(s => base44.entities.Player.update(s.player_id, { status: 'sancionado' }))
      );

      // Enviar email de notificación por cada sanción con datos de delegado
      const sanctionsWithDelegate = cleanSanctions.filter(s => s.player_id && s.team_id);
      if (sanctionsWithDelegate.length > 0) {
        const teamIds = [...new Set(sanctionsWithDelegate.map(s => s.team_id))];
        const teams = await Promise.all(teamIds.map(id => base44.entities.Team.filter({ id })));
        const teamMap = Object.fromEntries(teams.flat().map(t => [t.id, t]));

        await Promise.all(sanctionsWithDelegate.map(s => {
          const team = teamMap[s.team_id];
          if (!team?.delegate_email) return Promise.resolve();
          return base44.functions.invoke('notificarSancion', {
            delegateEmail: team.delegate_email,
            delegateName: team.delegate_name || 'Delegado',
            playerName: s.player_name,
            teamName: s.team_name,
            leagueName: match.league_name,
            reason: s.reason,
            matchesSuspended: s.matches_suspended || 1,
            matchDate: match.match_date ? new Date(match.match_date).toLocaleDateString('es-ES') : '',
          });
        }));
      }
    }

    toast({ title: 'Acta guardada', description: `${cleanSanctions.filter(s => s.player_id).length} sanción(es) aplicadas. Delegados notificados por email.` });
    setSaving(false);
    onSaved();
  };

  const tabs = [
    { id: 'incidencias', label: 'Incidencias', icon: Flag, count: incidents.length },
    { id: 'sanciones', label: 'Sanciones', icon: ShieldAlert, count: sanctions.length },
    { id: 'notas', label: 'Notas', icon: FileText, count: 0 },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-oswald font-bold text-xl">Acta del Partido</h2>
              <p className="text-xs text-muted-foreground">{match.home_team_name} vs {match.away_team_name} · {match.league_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info árbitro */}
        <div className="px-5 pt-4 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-48">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                value={referee}
                onChange={e => setReferee(e.target.value)}
                placeholder="Nombre del árbitro"
                className="flex-1 text-sm border border-input rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Estado del acta:</span>
              <select
                value={reportStatus}
                onChange={e => setReportStatus(e.target.value)}
                className="text-sm border border-input rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="borrador">Borrador</option>
                <option value="firmado">Firmado ✅</option>
              </select>
            </div>
          </div>

          {/* Marcador visual */}
          <div className="mt-3 flex items-center justify-center gap-4">
            <span className="font-semibold text-sm text-right flex-1 truncate">{match.home_team_name}</span>
            <div className="bg-muted rounded-lg px-4 py-1 font-oswald font-bold text-xl">
              {match.home_score ?? '—'} — {match.away_score ?? '—'}
            </div>
            <span className="font-semibold text-sm text-left flex-1 truncate">{match.away_team_name}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Tab: Incidencias */}
          {activeTab === 'incidencias' && (
            <div className="space-y-3">
              {incidents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Flag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay incidencias registradas</p>
                </div>
              )}
              {incidents.map(inc => (
                <div key={inc._key} className="bg-muted/40 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Minuto */}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="number" min="0" max="120"
                        value={inc.minute}
                        onChange={e => updateIncident(inc._key, 'minute', e.target.value)}
                        placeholder="Min"
                        className="w-16 text-sm text-center border border-input rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <span className="text-xs text-muted-foreground">'</span>
                    </div>
                    {/* Tipo */}
                    <select
                      value={inc.type}
                      onChange={e => updateIncident(inc._key, 'type', e.target.value)}
                      className="text-sm border border-input rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring flex-1 min-w-40">
                      {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button onClick={() => removeIncident(inc._key)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* Equipo */}
                    <select
                      value={inc.team_id}
                      onChange={e => updateIncident(inc._key, 'team_id', e.target.value)}
                      className="text-sm border border-input rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring flex-1 min-w-36">
                      <option value="">— Equipo —</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {/* Jugador */}
                    <select
                      value={inc.player_id}
                      onChange={e => updateIncident(inc._key, 'player_id', e.target.value)}
                      className="text-sm border border-input rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring flex-1 min-w-36">
                      <option value="">— Jugador —</option>
                      {playersForTeam(inc.team_id).map(p => (
                        <option key={p.id} value={p.id}>{p.full_name} {p.jersey_number ? `(#${p.jersey_number})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={inc.description}
                    onChange={e => updateIncident(inc._key, 'description', e.target.value)}
                    placeholder="Descripción opcional..."
                    className="w-full text-sm border border-input rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ))}
              <button onClick={addIncident}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary hover:text-primary rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-colors">
                <Plus className="w-4 h-4" /> Añadir incidencia
              </button>
            </div>
          )}

          {/* Tab: Sanciones */}
          {activeTab === 'sanciones' && (
            <div className="space-y-3">
              {sanctions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay sanciones registradas</p>
                </div>
              )}
              {sanctions.map(s => (
                <div key={s._key} className="bg-red-50/60 border border-red-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Equipo */}
                    <select
                      value={s.team_id}
                      onChange={e => updateSanction(s._key, 'team_id', e.target.value)}
                      className="text-sm border border-input rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring flex-1 min-w-36">
                      <option value="">— Equipo —</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {/* Jugador */}
                    <select
                      value={s.player_id}
                      onChange={e => updateSanction(s._key, 'player_id', e.target.value)}
                      className="text-sm border border-input rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring flex-1 min-w-36">
                      <option value="">— Jugador —</option>
                      {playersForTeam(s.team_id).map(p => (
                        <option key={p.id} value={p.id}>{p.full_name} {p.jersey_number ? `(#${p.jersey_number})` : ''}</option>
                      ))}
                    </select>
                    <button onClick={() => removeSanction(s._key)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* Motivo */}
                    <select
                      value={s.reason}
                      onChange={e => updateSanction(s._key, 'reason', e.target.value)}
                      className="text-sm border border-input rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring flex-1">
                      {SANCTION_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {/* Partidos sancionado */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Partidos sancionado:</span>
                      <input
                        type="number" min="1" max="20"
                        value={s.matches_suspended}
                        onChange={e => updateSanction(s._key, 'matches_suspended', parseInt(e.target.value) || 1)}
                        className="w-14 text-sm text-center border border-input rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <input
                    value={s.notes}
                    onChange={e => updateSanction(s._key, 'notes', e.target.value)}
                    placeholder="Observaciones de la sanción..."
                    className="w-full text-sm border border-input rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ))}

              {sanctions.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Al guardar el acta, los jugadores sancionados quedarán marcados como <strong>Sancionados</strong> en su expediente.</span>
                </div>
              )}

              <button onClick={addSanction}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-red-200 hover:border-red-400 hover:text-red-600 rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-colors">
                <Plus className="w-4 h-4" /> Añadir sanción
              </button>
            </div>
          )}

          {/* Tab: Notas generales */}
          {activeTab === 'notas' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Observaciones generales del árbitro</label>
              <textarea
                value={generalNotes}
                onChange={e => setGeneralNotes(e.target.value)}
                placeholder="Describe el desarrollo del partido, incidentes destacados, comportamiento de los equipos..."
                rows={8}
                className="w-full text-sm border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-border flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : existingReport ? 'Actualizar acta' : 'Guardar acta'}
          </button>
        </div>
      </div>
    </div>
  );
}