import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Users, UserPlus, Pencil, Trash2, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import PlayerFormDialog from '@/components/PlayerFormDialog';
import { useToast } from '@/components/ui/use-toast';

const STATUS_COLORS = {
  activo: 'bg-emerald-100 text-emerald-700',
  sancionado: 'bg-red-100 text-red-600',
  lesionado: 'bg-amber-100 text-amber-700',
  baja: 'bg-gray-100 text-gray-500',
};

export default function MisJugadores() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('all');

  const load = async () => {
    const myTeams = await base44.entities.Team.filter({ delegate_email: user?.email });
    setTeams(myTeams);
    const teamIds = myTeams.map(t => t.id);
    const allPlayers = await base44.entities.Player.list();
    setPlayers(allPlayers.filter(p => teamIds.includes(p.team_id)));
    setLoading(false);
  };

  useEffect(() => { if (user?.email) load(); }, [user]);

  const handleDelete = async (player) => {
    if (!confirm(`¿Eliminar a ${player.full_name} de la plantilla?`)) return;
    await base44.entities.Player.delete(player.id);
    toast({ title: 'Jugador eliminado' });
    load();
  };

  const filtered = players.filter(p => {
    const matchSearch = !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.dni?.includes(search);
    const matchTeam = selectedTeamId === 'all' || p.team_id === selectedTeamId;
    return matchSearch && matchTeam;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-oswald font-bold text-3xl">Mis jugadores</h1>
          <p className="text-muted-foreground text-sm mt-1">{players.length} jugadores en tu plantilla</p>
        </div>
        <Link to="/inscripcion-jugador">
          <Button className="gap-2"><UserPlus className="w-4 h-4" /> Inscribir jugador</Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o DNI..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {teams.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSelectedTeamId('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTeamId === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              Todos
            </button>
            {teams.map(t => (
              <button key={t.id} onClick={() => setSelectedTeamId(t.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTeamId === t.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay jugadores en tu plantilla</p>
          <Link to="/inscripcion-jugador">
            <Button size="sm" className="mt-4 gap-2"><UserPlus className="w-4 h-4" /> Inscribir primer jugador</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className={`bg-card rounded-xl p-4 flex items-center gap-4 border ${!p.confirmed ? 'border-red-300 bg-red-50/40' : 'border-border'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${!p.confirmed ? 'bg-red-100 text-red-600' : 'bg-muted'}`}>
                {p.jersey_number ? `#${p.jersey_number}` : p.full_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-semibold text-sm ${!p.confirmed ? 'text-red-600' : 'text-foreground'}`}>{p.full_name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-muted text-muted-foreground'}`}>
                    {p.status}
                  </span>
                  {!p.confirmed && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                      <AlertCircle className="w-3 h-3" /> Sin confirmar
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  <span>{p.team_name}</span>
                  {p.position && <span>· {p.position}</span>}
                  {p.dni && <span>· {p.dni}</span>}
                </div>
                {!p.confirmed && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Pendiente de confirmar email · No puede participar en partidos</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => { setEditingPlayer(p); setShowForm(true); }}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(p)}
                  className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PlayerFormDialog
          player={editingPlayer}
          teamId={editingPlayer?.team_id || teams[0]?.id}
          teams={teams}
          open={showForm}
          onClose={() => { setShowForm(false); setEditingPlayer(null); }}
          onSaved={() => { setShowForm(false); setEditingPlayer(null); load(); }}
        />
      )}
    </div>
  );
}