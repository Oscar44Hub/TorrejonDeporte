import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Pencil, Shield, UserCheck, CheckCircle, Clock, XCircle, AlertTriangle, History, RefreshCw } from 'lucide-react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';

const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700',     icon: Clock },
  activo:     { label: 'Activo',     color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  suspendido: { label: 'Suspendido', color: 'bg-orange-100 text-orange-700',   icon: AlertTriangle },
  baja:       { label: 'Baja',       color: 'bg-red-100 text-red-700',         icon: XCircle },
};

const Row = ({ label, value, valueClass }) => value ? (
  <div className="grid grid-cols-2 gap-2 py-2 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-medium ${valueClass || ''}`}>{value}</span>
  </div>
) : null;

// Historial de auditoría derivado de los campos del delegado
function buildAuditLog(delegate) {
  const logs = [];
  const fmtDate = (d) => {
    try { return format(new Date(d), "dd/MM/yyyy 'a las' HH:mm", { locale: es }); } catch { return d; }
  };
  if (delegate.created_date) logs.push({ date: delegate.created_date, text: 'Delegado registrado en el sistema', icon: '📋' });
  if (delegate.lopd_consent && delegate.lopd_consent_date) logs.push({ date: delegate.lopd_consent_date, text: 'Consentimiento LOPD firmado', icon: '✅' });
  if (delegate.app_user_invited && delegate.invitation_date) logs.push({ date: delegate.invitation_date, text: 'Invitación de acceso enviada', icon: '📧' });
  if (delegate.confirmed) logs.push({ date: delegate.updated_date || delegate.created_date, text: 'Email confirmado', icon: '🔓' });
  if (delegate.reminder_sent && delegate.reminder_sent_date) logs.push({ date: delegate.reminder_sent_date, text: 'Recordatorio de confirmación enviado', icon: '🔔' });
  return logs.sort((a, b) => new Date(b.date) - new Date(a.date)).map(l => ({ ...l, dateStr: fmtDate(l.date) }));
}

export default function DelegateDetailDialog({ open, onOpenChange, delegate, onInvite, onEdit }) {
  const [resending, setResending] = useState(false);
  const [activeTab, setActiveTab] = useState('datos');

  if (!delegate) return null;

  const sc = STATUS_CONFIG[delegate.status] || STATUS_CONFIG.pendiente;
  const Icon = sc.icon;

  const fmtDate = (d) => {
    if (!d) return null;
    try { return format(new Date(d), 'dd/MM/yyyy', { locale: es }); } catch { return d; }
  };

  // Calcular caducidad
  const createdAt = delegate.created_date ? new Date(delegate.created_date) : null;
  const now = new Date();
  const daysOld = createdAt ? differenceInDays(now, createdAt) : 0;
  const hoursOld = createdAt ? differenceInHours(now, createdAt) : 0;
  const isExpired = !delegate.confirmed && daysOld >= 4;
  const isNearExpiry = !delegate.confirmed && daysOld >= 2 && !isExpired;
  const needsReminder = !delegate.confirmed && hoursOld >= 48;

  const handleResend = async () => {
    setResending(true);
    await base44.functions.invoke('enviarConfirmacion', {
      entity_type: 'Delegate',
      entity_id: delegate.id,
      entity_data: { email: delegate.email, full_name: delegate.full_name, club_name: delegate.club_name },
    });
    setResending(false);
  };

  const auditLog = buildAuditLog(delegate);

  const tabs = [
    { id: 'datos', label: 'Datos personales' },
    { id: 'sistema', label: 'Estado sistema' },
    { id: 'auditoria', label: `Auditoría (${auditLog.length})` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha del delegado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Avatar + nombre */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {delegate.photo_url
                ? <img src={delegate.photo_url} alt={delegate.full_name} className="w-full h-full object-cover" />
                : <UserCheck className="w-8 h-8 text-primary" />
              }
            </div>
            <div>
              <h2 className="font-oswald font-bold text-xl">{delegate.full_name}</h2>
              <p className="text-muted-foreground text-sm">🏟️ {delegate.club_name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.color}`}>
                  <Icon className="w-3 h-3" /> {sc.label}
                </span>
                {delegate.confirmed && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3 h-3" /> Email confirmado
                  </span>
                )}
                {isExpired && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                    ⚠️ Enlace caducado
                  </span>
                )}
                {isNearExpiry && !isExpired && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    🕐 Caduca pronto
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Aviso caducidad */}
          {isExpired && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-red-700 font-semibold">Enlace de confirmación caducado ({daysOld} días sin confirmar)</p>
                <p className="text-xs text-red-600 mt-0.5">Puedes reenviar un nuevo enlace de confirmación.</p>
              </div>
              <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5 flex-shrink-0"
                onClick={handleResend} disabled={resending}>
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Enviando...' : 'Reenviar'}
              </Button>
            </div>
          )}

          {isNearExpiry && (
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
              <Clock className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                <strong>Atención:</strong> El delegado lleva {daysOld} días sin confirmar. El enlace caducará en {4 - daysOld} día(s).
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-border">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Datos personales */}
          {activeTab === 'datos' && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-4">
                <Row label="DNI / NIE" value={delegate.dni} />
                <Row label="Fecha de nacimiento" value={fmtDate(delegate.birth_date)} />
                <Row label="Email" value={delegate.email} />
                <Row label="Teléfono" value={delegate.phone} />
                <Row label="Dirección" value={delegate.address} />
              </div>

              {delegate.dni_image_url && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documento DNI/NIE <span className="text-primary">(restringido)</span></h3>
                  </div>
                  <a href={delegate.dni_image_url} target="_blank" rel="noopener noreferrer">
                    <img src={delegate.dni_image_url} alt="DNI" className="w-full rounded-lg border border-border max-h-48 object-contain hover:opacity-90 transition-opacity cursor-zoom-in" />
                  </a>
                </div>
              )}

              {delegate.notes && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notas internas</h3>
                  <p className="text-sm">{delegate.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Estado sistema */}
          {activeTab === 'sistema' && (
            <div className="bg-muted/30 rounded-xl p-4">
              <Row label="Estado" value={sc.label} valueClass={delegate.status === 'activo' ? 'text-emerald-700' : delegate.status === 'baja' ? 'text-red-600' : ''} />
              <Row label="Invitación enviada" value={delegate.app_user_invited ? `Sí — ${fmtDate(delegate.invitation_date)}` : 'No'} />
              <Row label="Email confirmado" value={delegate.confirmed ? 'Sí ✅' : 'No ⚠️'} />
              <Row label="Consentimiento LOPD" value={delegate.lopd_consent ? `Sí — ${fmtDate(delegate.lopd_consent_date)}` : '⚠️ Pendiente'} />
              <Row label="Alta en sistema" value={fmtDate(delegate.created_date)} />
              {!delegate.confirmed && (
                <Row label="Tiempo sin confirmar" value={daysOld > 0 ? `${daysOld} día(s)` : `${hoursOld}h`} valueClass={isExpired ? 'text-red-600 font-semibold' : isNearExpiry ? 'text-orange-600' : ''} />
              )}
              {delegate.reminder_sent && (
                <Row label="Recordatorio enviado" value={fmtDate(delegate.reminder_sent_date) || 'Sí'} />
              )}
            </div>
          )}

          {/* Tab: Auditoría */}
          {activeTab === 'auditoria' && (
            <div className="space-y-2">
              {auditLog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin eventos registrados</p>
              ) : auditLog.map((log, i) => (
                <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                  <span className="text-base flex-shrink-0">{log.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{log.text}</p>
                    <p className="text-xs text-muted-foreground">{log.dateStr}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => onEdit(delegate)}>
              <Pencil className="w-4 h-4" /> Editar
            </Button>
            {!delegate.app_user_invited && delegate.status !== 'baja' && (
              <Button className="flex-1 gap-2" onClick={() => { onInvite(delegate); onOpenChange(false); }}>
                <Mail className="w-4 h-4" /> Enviar invitación
              </Button>
            )}
            {delegate.app_user_invited && (
              <div className="flex-1 flex items-center justify-center gap-1.5 text-emerald-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Invitación enviada
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}