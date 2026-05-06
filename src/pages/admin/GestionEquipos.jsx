import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Pencil, Search, Filter, Users, Clock, AlertCircle, ChevronDown, ChevronUp, Phone, Mail, User } from 'lucide-react';
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
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [filterCategory, setFilterCategory] = useState('todas');

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

  // Extraer categorías únicas de las ligas
  const categories = [...new Set(leagues.map(l => l.category).filter(Boolean))].sort();

  // Mapa leagueId → category para filtrar equipos por categoría
  const leagueCategoryMap = leagues.reduce((acc, l) => { acc[l.id] = l.category; return acc; }, {});

  const filtered = teams.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.delegate_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.delegate_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'todos' || t.status === filterStatus;
    const matchLeague = filterLeague === 'todas' || t.league_id === filterLeague;
    const matchCategory = filterCategory === 'todas' || leagueCategoryMap[t.league_id] === filterCategory;
    return matchSearch && matchStatus && matchLeague && matchCategory;
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
          {categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring max-w-40">
              <option value="todas">Todas las categorías</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        {(filterStatus !== 'todos' || filterLeague !== 'todas' || filterCategory !== 'todas' || search) && (
          <button onClick={() => { setSearch(''); setFilterStatus('todos'); setFilterLeague('todas'); setFilterCategory('todas'); }}
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
                <th className="w-8 px-2 py-3"></th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Equipo</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Liga / Categoría</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Delegado</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(team => {
                const isExpanded = expandedTeam === team.id;
                const leagueCategory = leagueCategoryMap[team.league_id];
                return (
                <>
                <tr key={team.id} className={`hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/20' : ''}`}
                  onClick={() => setExpandedTeam(isExpanded ? null : team.id)}>
                  <td className="px-2 py-3 text-center text-muted-foreground">
                    {isExpanded ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
                  </td>
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
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-muted-foreground text-sm">{team.league_name || '—'}</p>
                    {leagueCategory && <p className="text-xs text-primary/70 font-medium capitalize">{leagueCategory}</p>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-foreground">{team.delegate_name}</p>
                    <p className="text-xs text-muted-foreground">{team.delegate_email}</p>
                    {team.delegate_phone && <p className="text-xs text-muted-foreground">{team.delegate_phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[team.status]?.color || ''}`}>
                      {STATUS_CONFIG[team.status]?.label || team.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {team.status === 'pendiente' && (
                        <>
                          <button onClick={() => handleApprove(team)} title="Aprobar inscripción"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleReject(team)} title="Rechazar inscripción"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {team.status === 'rechazado' && (
                        <button onClick={() => handleApprove(team)} title="Aprobar de todas formas"
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {team.status === 'aprobado' && (
                        <button onClick={() => handleReject(team)} title="Revocar aprobación"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setEditTeam(team)} title="Editar información"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Fila expandida con detalle completo */}
                {isExpanded && (
                  <tr key={`${team.id}-detail`} className="bg-muted/10">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Delegado */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contacto del delegado</p>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span className="font-medium">{team.delegate_name || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <a href={`mailto:${team.delegate_email}`} className="text-primary hover:underline truncate">
                              {team.delegate_email || '—'}
                            </a>
                          </div>
                          {team.delegate_phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <a href={`tel:${team.delegate_phone}`} className="hover:underline">{team.delegate_phone}</a>
                            </div>
                          )}
                        </div>

                        {/* Liga y categoría */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Competición</p>
                          <p className="text-sm font-medium">{team.league_name || '—'}</p>
                          {leagueCategory && <p className="text-xs text-primary/70 capitalize">Categoría: {leagueCategory}</p>}
                          {team.sport_name && <p className="text-xs text-muted-foreground">Deporte: {team.sport_name}</p>}
                        </div>

                        {/* Notas + acción editar */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas internas</p>
                          <p className="text-sm text-muted-foreground">{team.notes || 'Sin notas'}</p>
                          <button
                            onClick={() => setEditTeam(team)}
                            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold transition-colors">
                            <Pencil className="w-3 h-3" /> Editar información del delegado
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </>
              )})}
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