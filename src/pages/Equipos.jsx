import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Search, Users, UserPlus, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import PlayerFormDialog from '@/components/PlayerFormDialog';

const STATUS_COLORS = { aprobado: 'bg-emerald-100 text-emerald-700', pendiente: 'bg-amber-100 text-amber-700', rechazado: 'bg-red-100 text-red-600' };

export default function Equipos() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [players, setPlayers] = useState({});
  const [playerDialog, setPlayerDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const load = async () => {
    const data = await base44.entities.Team.list('-created_date');
    setTeams(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadPlayers = async (teamId) => {
    if (players[teamId]) return;
    const data = await base44.entities.Player.filter({ team_id: teamId });
    setPlayers(p => ({ ...p, [teamId]: data }));
  };

  const handleExpand = async (teamId) => {
    if (expanded === teamId) { setExpanded(null); return; }
    setExpanded(teamId);
    await loadPlayers(teamId);
  };

  const onPlayerSaved = async () => {
    if (selectedTeam) {
      const data = await base44.entities.Player.filter({ team_id: selectedTeam });
      setPlayers(p => ({ ...p, [selectedTeam]: data }));
    }
  };

  const filtered = teams.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.league_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.delegate_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-oswald font-bold text-3xl">Equipos</h1>
          <p className="text-muted-foreground text-sm mt-1">Equipos inscritos en todas las competiciones</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por equipo, liga o delegado..." className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No se encontraron equipos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleExpand(t.id)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{t.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                      {t.status === 'aprobado' ? 'Aprobado' : t.status === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{t.league_name} · {t.sport_name}</p>
                  <p className="text-xs text-muted-foreground">👤 {t.delegate_name} · {t.delegate_email}</p>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expanded === t.id ? 'rotate-90' : ''}`} />
              </div>

              {expanded === t.id && (
                <div className="border-t border-border p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Jugadores</h4>
                    <Button
                      size="sm" variant="outline"
                      className="gap-1 text-xs"
                      onClick={() => { setSelectedTeam(t.id); setEditingPlayer(null); setPlayerDialog(true); }}
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Añadir jugador
                    </Button>
                  </div>
                  {!players[t.id] ? (
                    <div className="h-8 bg-muted rounded animate-pulse" />
                  ) : players[t.id].length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">Sin jugadores registrados</p>
                  ) : (
                    <div className="grid gap-2">
                      {players[t.id].map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 bg-card rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            {p.jersey_number && (
                              <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{p.jersey_number}</span>
                            )}
                            <div>
                              <p className="text-sm font-medium">{p.full_name}</p>
                              <p className="text-xs text-muted-foreground">{p.position || 'Sin posición'} · DNI: {p.dni}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'activo' ? 'bg-emerald-100 text-emerald-700' : p.status === 'sancionado' ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <PlayerFormDialog
        open={playerDialog}
        onOpenChange={setPlayerDialog}
        editing={editingPlayer}
        teamId={selectedTeam}
        teams={teams}
        onSaved={onPlayerSaved}
      />
    </div>
  );
}