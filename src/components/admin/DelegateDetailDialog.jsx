import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Pencil, Shield, UserCheck, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700',     icon: Clock },
  activo:     { label: 'Activo',     color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  suspendido: { label: 'Suspendido', color: 'bg-orange-100 text-orange-700',   icon: AlertTriangle },
  baja:       { label: 'Baja',       color: 'bg-red-100 text-red-700',         icon: XCircle },
};

const Row = ({ label, value }) => value ? (
  <div className="grid grid-cols-2 gap-2 py-2 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
) : null;

export default function DelegateDetailDialog({ open, onOpenChange, delegate, onInvite, onEdit }) {
  if (!delegate) return null;

  const sc = STATUS_CONFIG[delegate.status] || STATUS_CONFIG.pendiente;
  const Icon = sc.icon;

  const fmtDate = (d) => {
    if (!d) return null;
    try { return format(new Date(d), 'dd/MM/yyyy', { locale: es }); } catch { return d; }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha del delegado</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
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
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 ${sc.color}`}>
                <Icon className="w-3 h-3" /> {sc.label}
              </span>
            </div>
          </div>

          {/* Datos personales */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Datos personales</h3>
            <Row label="DNI / NIE" value={delegate.dni} />
            <Row label="Fecha de nacimiento" value={fmtDate(delegate.birth_date)} />
            <Row label="Email" value={delegate.email} />
            <Row label="Teléfono" value={delegate.phone} />
            <Row label="Dirección" value={delegate.address} />
          </div>

          {/* Estado del sistema */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Estado en el sistema</h3>
            <Row label="Invitación enviada" value={delegate.app_user_invited ? `Sí — ${fmtDate(delegate.invitation_date)}` : 'No'} />
            <Row label="Consentimiento LOPD" value={delegate.lopd_consent ? `Sí — ${fmtDate(delegate.lopd_consent_date)}` : '⚠️ Pendiente'} />
            <Row label="Alta en sistema" value={fmtDate(delegate.created_date)} />
          </div>

          {/* Imagen DNI — protegida */}
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

          {/* Notas */}
          {delegate.notes && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notas internas</h3>
              <p className="text-sm">{delegate.notes}</p>
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