import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Pencil, Search, Filter, Users, Clock, AlertCircle } from 'lucide-react';
import TeamEditDialog from '@/components/admin/TeamEditDialog';
import { useToast } from '@/components/ui/use-toast';

const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  aprobado:   { label: 'Aprobado',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rechazado:  { label: 'Rechazado',  color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function GestionEquipos() {
  const { toast } = useToast();
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterLeague, setFilterLeague] = useState('todas');
  const [editTeam, setEditTeam] = useState(null);

  const load = async () => {
    const [t, l] = await Promise.all([
      base44.entities.Team.list('-created_date'),
      base44.entities.League.list(),
    ]);
    setTeams(t);
    setLeagues(l);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (team) => {
    await base44.entities.Team.update(team.id, { status: 'aprobado' });
    toast({ title: 'Equipo aprobado', description: `${team.name} ha sido aprobado.` });
    load();
  };

  const handleReject = async (team) => {
    await base44.entities.Team.update(team.id, { status: 'rechazado' });
    toast({ title: 'Inscripción rechazada', description: `${team.name} ha sido rechazado.`, variant: 'destructive' });
    load();
  };

  const filtered = teams.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.delegate_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.delegate_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'todos' || t.status === filterStatus;
    const matchLeague = filterLeague === 'todas' || t.league_id === filterLeague;
    return matchSearch && matchStatus && matchLeague;
  });

  const counts = {
    pendiente: teams.filter(t => t.status === 'pendiente').length,
    aprobado:  teams.filter(t => t.status === 'aprobado').length,
    rechazado: teams.filter(t => t.status === 'rechazado').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-oswald font-bold text-3xl text-foreground">Gestión de Equipos</h1>
        <p className="text-muted-foreground text-sm mt-1">Aprueba, rechaza o edita las inscripciones de clubes</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendientes de revisión', count: counts.pendiente, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', action: () => setFilterStatus('pendiente') },
          { label: 'Equipos aprobados',      count: counts.aprobado,  icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', action: () => setFilterStatus('aprobado') },
          { label: 'Rechazados',             count: counts.rechazado, icon: XCircle,   color: 'text-red-500',     bg: 'bg-red-50 border-red-200',       action: () => setFilterStatus('rechazado') },
        ].map(({ label, count, icon: Icon, color, bg, action }) => (
          <button key={label} onClick={action}
            className={`${bg} border rounded-xl p-4 text-left hover:opacity-80 transition-opacity`}>
            <div className="flex items-center justify-between mb-1">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className={`text-3xl font-oswald font-bold ${color}`}>{loading ? '—' : count}</span>
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, delegado o email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
          <select
            value={filterLeague}
            onChange={e => setFilterLeague(e.target.value)}
            className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring max-w-48">
            <option value="todas">Todas las ligas</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        {(filterStatus !== 'todos' || filterLeague !== 'todas' || search) && (
          <button onClick={() => { setSearch(''); setFilterStatus('todos'); setFilterLeague('todas'); }}
            className="text-xs text-primary hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted/50 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No hay equipos que coincidan con los filtros</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Equipo</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Liga</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Delegado</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(team => (
                <tr key={team.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 font-oswald font-bold text-primary text-xs">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{team.name}</p>
                        {team.colors && <p className="text-xs text-muted-foreground">{team.colors}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{team.league_name || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-foreground">{team.delegate_name}</p>
                    <p className="text-xs text-muted-foreground">{team.delegate_email}</p>
                    {team.delegate_phone && <p className="text-xs text-muted-foreground">{team.delegate_phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[team.status]?.color || ''}`}>
                      {STATUS_CONFIG[team.status]?.label || team.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {team.status === 'pendiente' && (
                        <>
                          <button
                            onClick={() => handleApprove(team)}
                            title="Aprobar inscripción"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(team)}
                            title="Rechazar inscripción"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {team.status === 'rechazado' && (
                        <button
                          onClick={() => handleApprove(team)}
                          title="Aprobar de todas formas"
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {team.status === 'aprobado' && (
                        <button
                          onClick={() => handleReject(team)}
                          title="Revocar aprobación"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditTeam(team)}
                        title="Editar información"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
            Mostrando {filtered.length} de {teams.length} equipos
          </div>
        )}
      </div>

      {/* Alert equipos pendientes */}
      {!loading && counts.pendiente > 0 && filterStatus !== 'pendiente' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Hay <strong>{counts.pendiente} inscripción(es) pendiente(s)</strong> de revisión.{' '}
            <button onClick={() => setFilterStatus('pendiente')} className="underline font-semibold">Ver ahora</button>
          </p>
        </div>
      )}

      {/* Edit dialog */}
      {editTeam && (
        <TeamEditDialog
          team={editTeam}
          leagues={leagues}
          onClose={() => setEditTeam(null)}
          onSaved={() => { setEditTeam(null); load(); }}
        />
      )}
    </div>
  );
}