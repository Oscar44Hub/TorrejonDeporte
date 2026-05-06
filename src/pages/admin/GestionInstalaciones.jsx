import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Plus, Pencil, Trash2, MapPin, Phone, Users, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import FacilityFormDialog from '@/components/admin/FacilityFormDialog';

export default function GestionInstalaciones() {
  const [facilities, setFacilities] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [f, l] = await Promise.all([
      base44.entities.Facility.list('-created_date'),
      base44.entities.League.list(),
    ]);
    setFacilities(f);
    setLeagues(l);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.Facility.update(editing.id, data);
      toast.success('Instalación actualizada');
    } else {
      await base44.entities.Facility.create(data);
      toast.success('Instalación creada');
    }
    setDialogOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta instalación?')) return;
    await base44.entities.Facility.delete(id);
    toast.success('Instalación eliminada');
    load();
  };

  const handleEdit = (facility) => {
    setEditing(facility);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const TYPE_ICONS = {
    'pabellón': '🏟️',
    'campo': '⚽',
    'pista': '🎾',
    'piscina': '🏊',
    'sala': '🏋️',
    'otro': '📍',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Exclusivo Ayuntamiento
          </p>
          <h1 className="font-oswald font-bold text-3xl">Gestión de Instalaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Administra las instalaciones deportivas y su asignación a ligas</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva instalación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: facilities.length, color: 'text-primary' },
          { label: 'Activas', value: facilities.filter(f => f.is_active !== false).length, color: 'text-emerald-600' },
          { label: 'Inactivas', value: facilities.filter(f => f.is_active === false).length, color: 'text-red-500' },
          { label: 'Con liga', value: facilities.filter(f => f.league_ids?.length > 0).length, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-bold font-oswald ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : facilities.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No hay instalaciones registradas</p>
          <Button onClick={handleNew} variant="outline" className="mt-4 gap-2">
            <Plus className="w-4 h-4" /> Añadir instalación
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {facilities.map(f => (
            <div key={f.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{TYPE_ICONS[f.type] || '📍'}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-oswald font-semibold text-lg leading-tight">{f.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{f.type}</span>
                      {f.is_active === false ? (
                        <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="w-3 h-3" /> Inactiva</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="w-3 h-3" /> Activa</span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      {f.address && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> {f.address}
                        </p>
                      )}
                      {f.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3 h-3 flex-shrink-0" /> {f.phone}
                        </p>
                      )}
                      {f.capacity && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="w-3 h-3 flex-shrink-0" /> Aforo: {f.capacity}
                        </p>
                      )}
                    </div>

                    {/* Ligas asignadas */}
                    {f.league_names?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {f.league_names.map((ln, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            🏆 {ln}
                          </span>
                        ))}
                      </div>
                    )}
                    {(!f.league_names || f.league_names.length === 0) && (
                      <p className="text-xs text-muted-foreground/60 mt-2 italic">Sin ligas asignadas</p>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(f)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(f.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FacilityFormDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        facility={editing}
        leagues={leagues}
        onSave={handleSave}
      />
    </div>
  );
}