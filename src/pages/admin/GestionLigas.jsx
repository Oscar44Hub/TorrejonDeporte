import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Trophy, Search, Filter, Lock, CalendarDays, Bell } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import LeagueFormDialog from '@/components/LeagueFormDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  inscripcion: { label: 'Inscripción abierta', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  activa:      { label: 'Activa',              color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  finalizada:  { label: 'Finalizada',          color: 'bg-gray-100 text-gray-600 border-gray-200' },
  suspendida:  { label: 'Suspendida',          color: 'bg-red-100 text-red-700 border-red-200' },
};

const FILTER_STATUSES = ['todos', 'inscripcion', 'activa', 'finalizada', 'suspendida'];

export default function GestionLigas() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leagues, setLeagues] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [l, s] = await Promise.all([
      base44.entities.League.list('-created_date'),
      base44.entities.Sport.filter({ is_active: true }),
    ]);
    setLeagues(l);
    setSports(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleNew = () => { setEditing(null); setDialogOpen(true); };
  const handleEdit = (league) => { setEditing(league); setDialogOpen(true); };

  const handleNotify = async (league) => {
    if (!window.confirm(`¿Enviar notificación de cambio de estado a todos los delegados de "${league.name}"?`)) return;
    const res = await base44.functions.invoke('notificarCambioLiga', {
      leagueId: league.id,
      leagueName: league.name,
      changeType: league.status,
      details: '',
    });
    toast({ title: `Notificación enviada a ${res.data?.sent || 0} delegados` });
  };

  const handleDelete = async (league) => {
    if (!window.confirm(`¿Eliminar la liga "${league.name}"? Esta acción no se puede deshacer.`)) return;
    await base44.entities.League.delete(league.id);
    toast({ title: 'Liga eliminada', description: `${league.name} ha sido eliminada.`, variant: 'destructive' });
    load();
  };

  const filtered = leagues.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.sport_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.category?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'todos' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = Object.fromEntries(
    FILTER_STATUSES.slice(1).map(s => [s, leagues.filter(l => l.status === s).length])
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-[hsl(44,60%,35%)]" />
            <span className="text-xs font-semibold text-[hsl(44,60%,35%)] uppercase tracking-widest">Exclusivo Ayuntamiento</span>
          </div>
          <h1 className="font-oswald font-bold text-3xl text-foreground">Gestión de Competiciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Crea y administra todas las ligas y campeonatos del municipio</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm flex-shrink-0">
          <Plus className="w-4 h-4" /> Nueva competición
        </button>
      </div>

      {/* KPIs por estado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { status: 'inscripcion', label: 'Inscripción abierta', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
          { status: 'activa',      label: 'Activas',             color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { status: 'finalizada',  label: 'Finalizadas',         color: 'text-gray-500',    bg: 'bg-gray-50 border-gray-200' },
          { status: 'suspendida',  label: 'Suspendidas',         color: 'text-red-500',     bg: 'bg-red-50 border-red-200' },
        ].map(({ status, label, color, bg }) => (
          <button key={status} onClick={() => setFilterStatus(filterStatus === status ? 'todos' : status)}
            className={`${bg} border rounded-xl p-3 text-left transition-all ${filterStatus === status ? 'ring-2 ring-offset-1 ring-primary' : 'hover:opacity-80'}`}>
            <p className={`text-2xl font-oswald font-bold ${color}`}>{loading ? '—' : counts[status]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
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
            placeholder="Buscar por nombre, deporte o categoría..."
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
            <option value="inscripcion">Inscripción abierta</option>
            <option value="activa">Activas</option>
            <option value="finalizada">Finalizadas</option>
            <option value="suspendida">Suspendidas</option>
          </select>
        </div>
        {(filterStatus !== 'todos' || search) && (
          <button onClick={() => { setSearch(''); setFilterStatus('todos'); }}
            className="text-xs text-primary hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla / lista */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted/50 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="mb-3">No hay competiciones que coincidan con los filtros</p>
            <button onClick={handleNew}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Crear primera competición
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Competición</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Deporte</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Temporada</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Fechas</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(league => (
                <tr key={league.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{league.name}</p>
                        {league.category && <p className="text-xs text-muted-foreground">{league.category} · {league.gender}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-muted-foreground">{league.sport_name || '—'}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{league.season || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {league.start_date ? format(new Date(league.start_date), 'dd MMM yy', { locale: es }) : '—'}
                    {league.end_date ? ` → ${format(new Date(league.end_date), 'dd MMM yy', { locale: es })}` : ''}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[league.status]?.color || 'bg-muted text-muted-foreground'}`}>
                      {STATUS_CONFIG[league.status]?.label || league.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/admin/ligas/${league.id}/calendario`)}
                        title="Generar calendario"
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                        <CalendarDays className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleNotify(league)}
                        title="Notificar cambio a delegados"
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors">
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(league)}
                        title="Editar"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(league)}
                        title="Eliminar"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
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
            Mostrando {filtered.length} de {leagues.length} competiciones
          </div>
        )}
      </div>

      <LeagueFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        sports={sports}
        onSaved={load}
      />
    </div>
  );
}