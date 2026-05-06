import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Users, Trophy, Calendar, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pendiente: 0, aprobado: 0, rechazado: 0, leagues: 0, matches: 0 });
  const [pendingTeams, setPendingTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [teams, leagues, matches] = await Promise.all([
      base44.entities.Team.list('-created_date', 50),
      base44.entities.League.list(),
      base44.entities.Match.filter({ status: 'programado' }, 'match_date', 5),
    ]);
    setStats({
      total:     teams.length,
      pendiente: teams.filter(t => t.status === 'pendiente').length,
      aprobado:  teams.filter(t => t.status === 'aprobado').length,
      rechazado: teams.filter(t => t.status === 'rechazado').length,
      leagues:   leagues.length,
      matches:   matches.length,
    });
    setPendingTeams(teams.filter(t => t.status === 'pendiente').slice(0, 5));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (team) => {
    await base44.entities.Team.update(team.id, { status: 'aprobado' });
    load();
  };

  const handleReject = async (team) => {
    await base44.entities.Team.update(team.id, { status: 'rechazado' });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(272,35%,14%)] to-[hsl(274,45%,24%)] rounded-2xl p-8 text-white">
        <p className="text-[hsl(44,95%,55%)] text-xs font-semibold tracking-widest uppercase mb-1">Panel de Administración</p>
        <h1 className="font-oswald font-bold text-4xl">Concejalía de Deportes</h1>
        <p className="text-white/60 mt-1 text-sm">Ayuntamiento de Torrejón de Ardoz</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Equipos totales',      value: stats.total,     icon: Users,        color: 'text-primary',       bg: 'bg-primary/10' },
          { label: 'Pendientes de revisión', value: stats.pendiente, icon: Clock,        color: 'text-amber-600',    bg: 'bg-amber-100' },
          { label: 'Aprobados',            value: stats.aprobado,  icon: CheckCircle,  color: 'text-emerald-600',  bg: 'bg-emerald-100' },
          { label: 'Ligas activas',        value: stats.leagues,   icon: Trophy,       color: 'text-blue-600',     bg: 'bg-blue-100' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            {loading ? (
              <div className="h-8 w-12 bg-muted animate-pulse rounded mb-1" />
            ) : (
              <p className={`text-3xl font-oswald font-bold ${color}`}>{value}</p>
            )}
            <p className="text-muted-foreground text-sm">{label}</p>
          </div>
        ))}
      </div>

      {/* Inscripciones pendientes */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-oswald font-bold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Inscripciones pendientes de revisión
          </h2>
          <Link to="/admin/equipos" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : pendingTeams.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <p className="text-sm">No hay inscripciones pendientes. ¡Todo al día!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pendingTeams.map(team => (
              <div key={team.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center font-oswald font-bold text-amber-700 text-sm flex-shrink-0">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{team.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{team.league_name} · {team.delegate_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleReject(team)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                  </button>
                  <button
                    onClick={() => handleApprove(team)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Gestionar Equipos',  desc: 'Revisar inscripciones y editar clubes', icon: Users,    link: '/admin/equipos', color: 'border-primary/30 hover:border-primary' },
          { label: 'Gestionar Ligas',    desc: 'Crear y configurar competiciones',      icon: Trophy,   link: '/ligas',         color: 'border-blue-200 hover:border-blue-400' },
          { label: 'Gestionar Partidos', desc: 'Programar y registrar resultados',      icon: Calendar, link: '/partidos',      color: 'border-emerald-200 hover:border-emerald-400' },
        ].map(({ label, desc, icon: Icon, link, color }) => (
          <Link key={label} to={link}
            className={`bg-card border-2 ${color} rounded-xl p-5 transition-colors group`}>
            <Icon className="w-6 h-6 text-primary mb-3" />
            <p className="font-semibold text-sm mb-1">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}