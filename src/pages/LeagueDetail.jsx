import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Users, Calendar, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TeamFormDialog from '@/components/TeamFormDialog';
import MatchFormDialog from '@/components/MatchFormDialog';
import ClasificacionCompleta from '@/components/ClasificacionCompleta';
import MatchList from '@/components/MatchList';

export default function LeagueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState('equipos');
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);

  const load = async () => {
    const [leagues, t, m] = await Promise.all([
      base44.entities.League.list(),
      base44.entities.Team.filter({ league_id: id }),
      base44.entities.Match.filter({ league_id: id }),
    ]);
    setLeague(leagues.find(l => l.id === id));
    setTeams(t);
    setMatches(m);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!league) return <div className="p-6 text-center text-muted-foreground">Liga no encontrada</div>;

  const tabs = [
    { id: 'equipos', label: 'Equipos', icon: Users },
    { id: 'partidos', label: 'Partidos', icon: Calendar },
    { id: 'clasificacion', label: 'Clasificación', icon: BarChart3 },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to="/ligas" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a ligas
      </Link>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-oswald font-bold text-3xl">{league.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{league.sport_name} · {league.category} · {league.season}</p>
            {league.description && <p className="text-sm mt-2 text-foreground/80">{league.description}</p>}
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${league.status === 'activa' ? 'bg-emerald-100 text-emerald-700' : league.status === 'inscripcion' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>
            {league.status === 'inscripcion' ? 'Inscripción' : league.status === 'activa' ? 'Activa' : league.status}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6">
        {tabs.map(({ id: tid, label, icon: Icon }) => (
          <button key={tid} onClick={() => setTab(tid)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === tid ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'equipos' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{teams.length} equipo(s) inscrito(s){league.max_teams ? ` / máx. ${league.max_teams}` : ''}</p>
            {(isAdmin || true) && (
              <Button onClick={() => { setEditingTeam(null); setTeamDialogOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" /> Inscribir equipo
              </Button>
            )}
          </div>
          {teams.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No hay equipos inscritos aún</div>
          ) : (
            <div className="space-y-3">
              {teams.map(t => (
                <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="text-sm text-muted-foreground">{t.delegate_name} · {t.delegate_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'aprobado' ? 'bg-emerald-100 text-emerald-700' : t.status === 'rechazado' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {t.status === 'aprobado' ? 'Aprobado' : t.status === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                    </span>
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => { setEditingTeam(t); setTeamDialogOpen(true); }}>Editar</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <TeamFormDialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen} editing={editingTeam} league={league} onSaved={load} />
        </div>
      )}

      {tab === 'partidos' && (
        <div>
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditingMatch(null); setMatchDialogOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" /> Añadir partido
              </Button>
            </div>
          )}
          <MatchList matches={matches} teams={teams} isAdmin={isAdmin} onEdit={(m) => { setEditingMatch(m); setMatchDialogOpen(true); }} onSaved={load} />
          <MatchFormDialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen} editing={editingMatch} league={league} teams={teams} onSaved={load} />
        </div>
      )}

      {tab === 'clasificacion' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <ClasificacionCompleta teams={teams} matches={matches} />
        </div>
      )}
    </div>
  );
}