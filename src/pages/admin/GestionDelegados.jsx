import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Users, Plus, Pencil, Trash2, Mail, CheckCircle,
  XCircle, Clock, UserCheck, Shield, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DelegateFormDialog from '@/components/admin/DelegateFormDialog';
import DelegateDetailDialog from '@/components/admin/DelegateDetailDialog';

const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700',  icon: Clock },
  activo:     { label: 'Activo',     color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  suspendido: { label: 'Suspendido', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  baja:       { label: 'Baja',       color: 'bg-red-100 text-red-700',      icon: XCircle },
};

export default function GestionDelegados() {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('todos');

  const load = async () => {
    const data = await base44.entities.Delegate.list('-created_date');
    setDelegates(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.Delegate.update(editing.id, data);
      toast.success('Delegado actualizado');
    } else {
      await base44.entities.Delegate.create({ ...data, status: 'pendiente', app_user_invited: false });
      toast.success('Delegado registrado correctamente');
    }
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este delegado? Esta acción no se puede deshacer.')) return;
    await base44.entities.Delegate.delete(id);
    toast.success('Delegado eliminado');
    load();
  };

  const handleInvite = async (delegate) => {
    if (delegate.app_user_invited) {
      toast.info('Ya se envió la invitación a este delegado');
      return;
    }
    try {
      await base44.users.inviteUser(delegate.email, 'user');
      await base44.entities.Delegate.update(delegate.id, {
        app_user_invited: true,
        invitation_date: new Date().toISOString(),
        status: 'activo',
      });

      // Enviar email de bienvenida con instrucciones de acceso
      await base44.integrations.Core.SendEmail({
        to: delegate.email,
        subject: '🏆 Acceso al sistema de delegados — TorrejónDeportes',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #4a1d7a; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #f5c518; margin: 0; font-size: 22px;">🏆 Bienvenido al Panel de Delegados</h1>
              <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 14px;">Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz</p>
            </div>
            <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0;">
              <p>Hola <strong>${delegate.full_name}</strong>,</p>
              <p>Has sido registrado como delegado de <strong>${delegate.club_name}</strong> en el sistema de gestión deportiva de Torrejón de Ardoz.</p>
              <p>Desde tu panel podrás gestionar tu equipo, consultar partidos, inscribir jugadores y mucho más.</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${window.location.origin}/mi-panel" style="background: #4a1d7a; color: #f5c518; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Acceder a mi panel
                </a>
              </div>
              <p style="font-size: 13px; color: #6b7280;">Si el botón no funciona, copia y pega esta dirección en tu navegador:<br/><a href="${window.location.origin}/mi-panel">${window.location.origin}/mi-panel</a></p>
              <p style="font-size: 13px; color: #6b7280;">Utiliza el email <strong>${delegate.email}</strong> para iniciar sesión.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="font-size: 12px; color: #9ca3af;">Ayuntamiento de Torrejón de Ardoz · Concejalía de Deportes</p>
            </div>
          </div>
        `,
      });

      toast.success(`Invitación y email de acceso enviados a ${delegate.email}`);
      load();
    } catch (e) {
      toast.error('Error al enviar la invitación: ' + e.message);
    }
  };

  const handleEdit = (d) => { setEditing(d); setFormOpen(true); };
  const handleView = (d) => { setViewing(d); setDetailOpen(true); };

  const filtered = filterStatus === 'todos'
    ? delegates
    : delegates.filter(d => d.status === filterStatus);

  const counts = {
    todos: delegates.length,
    pendiente: delegates.filter(d => d.status === 'pendiente').length,
    activo: delegates.filter(d => d.status === 'activo').length,
    suspendido: delegates.filter(d => d.status === 'suspendido').length,
    baja: delegates.filter(d => d.status === 'baja').length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Panel Administración
          </p>
          <h1 className="font-oswald font-bold text-3xl">Gestión de Delegados</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registro de representantes de clubes deportivos · Datos protegidos conforme a LOPD/RGPD
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo delegado
        </Button>
      </div>

      {/* Aviso LOPD */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Protección de datos:</strong> La información de los delegados, incluyendo imágenes del DNI, está protegida conforme al Reglamento General de Protección de Datos (RGPD) y la LOPDGDD. Acceso restringido exclusivamente al personal autorizado del Ayuntamiento.
        </p>
      </div>

      {/* Filtros / Stats */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'pendiente', label: 'Pendientes' },
          { key: 'activo', label: 'Activos' },
          { key: 'suspendido', label: 'Suspendidos' },
          { key: 'baja', label: 'Baja' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              filterStatus === f.key
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-card border border-border hover:bg-muted'
            }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filterStatus === f.key ? 'bg-white/20' : 'bg-muted'
            }`}>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No hay delegados en este estado</p>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} variant="outline" className="mt-4 gap-2">
            <Plus className="w-4 h-4" /> Registrar delegado
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.pendiente;
            const Icon = sc.icon;
            return (
              <div key={d.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {d.photo_url
                      ? <img src={d.photo_url} alt={d.full_name} className="w-full h-full object-cover" />
                      : <UserCheck className="w-6 h-6 text-primary" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base">{d.full_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${sc.color}`}>
                        <Icon className="w-3 h-3" /> {sc.label}
                      </span>
                      {d.lopd_consent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> LOPD ✓
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      <p className="text-sm text-muted-foreground">🏟️ {d.club_name}</p>
                      <p className="text-sm text-muted-foreground">📧 {d.email}</p>
                      {d.phone && <p className="text-sm text-muted-foreground">📞 {d.phone}</p>}
                      <p className="text-sm text-muted-foreground">🪪 {d.dni}</p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleView(d)}>
                      Ver ficha
                    </Button>
                    {!d.app_user_invited && d.status !== 'baja' && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
                        onClick={() => handleInvite(d)}>
                        <Mail className="w-3.5 h-3.5" /> Invitar
                      </Button>
                    )}
                    {d.app_user_invited && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Invitado
                      </span>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(d)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(d.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DelegateFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        delegate={editing}
        onSave={handleSave}
      />

      <DelegateDetailDialog
        open={detailOpen}
        onOpenChange={(o) => { setDetailOpen(o); if (!o) setViewing(null); }}
        delegate={viewing}
        onInvite={handleInvite}
        onEdit={(d) => { setDetailOpen(false); handleEdit(d); }}
      />
    </div>
  );
}