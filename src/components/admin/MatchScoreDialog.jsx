import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { X, Save, Trophy, Bell } from 'lucide-react';

export default function MatchScoreDialog({ match, onClose, onSaved }) {
  const { toast } = useToast();
  const [homeScore, setHomeScore] = useState(match.home_score ?? '');
  const [awayScore, setAwayScore] = useState(match.away_score ?? '');
  const [status, setStatus] = useState(match.status === 'programado' ? 'finalizado' : match.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);

    if (status === 'finalizado' && (isNaN(hs) || isNaN(as_))) {
      toast({ title: 'Introduce ambos marcadores', variant: 'destructive' });
      return;
    }

    setSaving(true);

    const updateData = { status };
    if (status === 'finalizado' || status === 'en_juego') {
      updateData.home_score = hs;
      updateData.away_score = as_;
    }

    // Actualizar el partido
    await base44.entities.Match.update(match.id, updateData);

    // Si el partido está finalizado, actualizar estadísticas del equipo
    if (status === 'finalizado' && !isNaN(hs) && !isNaN(as_)) {
      await recalcularClasificacion(match.league_id);
    }

    // Notificar a delegados y árbitro del cambio de estado/resultado
    const notifPayload = {
      matchId: match.id,
      leagueName: match.league_name,
      homeTeam: match.home_team_name,
      awayTeam: match.away_team_name,
      changeType: `Resultado: ${hs} — ${as_} (${status})`,
    };
    const [homeTeams, awayTeams] = await Promise.all([
      base44.entities.Team.filter({ id: match.home_team_id }),
      base44.entities.Team.filter({ id: match.away_team_id }),
    ]);
    if (homeTeams[0]?.delegate_email) {
      notifPayload.homeTeamDelegateEmail = homeTeams[0].delegate_email;
      notifPayload.homeTeamDelegateName = homeTeams[0].delegate_name;
    }
    if (awayTeams[0]?.delegate_email) {
      notifPayload.awayTeamDelegateEmail = awayTeams[0].delegate_email;
      notifPayload.awayTeamDelegateName = awayTeams[0].delegate_name;
    }
    base44.functions.invoke('notificarCambioPartido', notifPayload).catch(() => {});

    toast({ title: 'Resultado guardado', description: `${match.home_team_name} ${hs} — ${as_} ${match.away_team_name}` });
    setSaving(false);
    onSaved();
  };

  // Recalcula todas las estadísticas de los equipos de la liga a partir de los partidos finalizados
  const recalcularClasificacion = async (leagueId) => {
    const [allMatches, allTeams] = await Promise.all([
      base44.entities.Match.filter({ league_id: leagueId }),
      base44.entities.Team.filter({ league_id: leagueId }),
    ]);

    // Inicializar stats
    const stats = {};
    allTeams.forEach(t => {
      stats[t.id] = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
    });

    // Calcular a partir de partidos finalizados (incluyendo el recién guardado)
    const finished = allMatches.filter(m =>
      m.status === 'finalizado' && m.home_score != null && m.away_score != null && m.id !== match.id
    );
    // Añadir el partido actual con los nuevos valores
    finished.push({ ...match, status: 'finalizado', home_score: parseInt(homeScore), away_score: parseInt(awayScore) });

    finished.forEach(m => {
      const h = stats[m.home_team_id];
      const a = stats[m.away_team_id];
      if (!h || !a) return;

      h.pj++; a.pj++;
      h.gf += m.home_score; h.gc += m.away_score;
      a.gf += m.away_score; a.gc += m.home_score;

      if (m.home_score > m.away_score) {
        h.pg++; h.pts += 3; a.pp++;
      } else if (m.home_score < m.away_score) {
        a.pg++; a.pts += 3; h.pp++;
      } else {
        h.pe++; h.pts += 1;
        a.pe++; a.pts += 1;
      }
    });

    // Guardar stats en cada equipo
    await Promise.all(
      Object.entries(stats).map(([teamId, s]) =>
        base44.entities.Team.update(teamId, {
          points: s.pts,
          wins: s.pg,
          draws: s.pe,
          losses: s.pp,
          goals_for: s.gf,
          goals_against: s.gc,
        })
      )
    );
  };

  const result = () => {
    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);
    if (isNaN(hs) || isNaN(as_)) return null;
    if (hs > as_) return `Victoria ${match.home_team_name}`;
    if (hs < as_) return `Victoria ${match.away_team_name}`;
    return 'Empate';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="font-oswald font-bold text-xl">Registrar Resultado</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Info partido */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-medium mb-1">{match.league_name} · {match.round}</p>
          </div>

          {/* Marcador */}
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="font-semibold text-sm mb-2 truncate">{match.home_team_name}</p>
              <input
                type="number"
                min="0"
                max="99"
                value={homeScore}
                onChange={e => setHomeScore(e.target.value)}
                placeholder="0"
                className="w-full text-center text-4xl font-oswald font-bold border-2 border-input rounded-xl py-3 bg-background focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">Local</p>
            </div>

            <div className="text-2xl font-oswald font-bold text-muted-foreground pt-4">—</div>

            <div className="flex-1 text-center">
              <p className="font-semibold text-sm mb-2 truncate">{match.away_team_name}</p>
              <input
                type="number"
                min="0"
                max="99"
                value={awayScore}
                onChange={e => setAwayScore(e.target.value)}
                placeholder="0"
                className="w-full text-center text-4xl font-oswald font-bold border-2 border-input rounded-xl py-3 bg-background focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">Visitante</p>
            </div>
          </div>

          {/* Resultado previsto */}
          {result() && (
            <div className="text-center py-2 bg-primary/10 rounded-lg">
              <p className="text-primary font-semibold text-sm">{result()}</p>
            </div>
          )}

          {/* Estado del partido */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Estado del partido</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="programado">Programado</option>
              <option value="en_juego">En juego</option>
              <option value="finalizado">Finalizado</option>
              <option value="aplazado">Aplazado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {status === 'finalizado' && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-xs">
              <Trophy className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Al guardar como <strong>Finalizado</strong>, la tabla de clasificación se actualizará automáticamente.</span>
            </div>
          )}
          {(status === 'aplazado' || status === 'cancelado') && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
              <Bell className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Se enviará un aviso por email a los delegados de ambos equipos notificando el cambio de estado.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-border">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar resultado'}
          </button>
        </div>
      </div>
    </div>
  );
}