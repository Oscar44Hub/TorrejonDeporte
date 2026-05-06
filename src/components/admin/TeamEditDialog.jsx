import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const FIELDS = [
  { key: 'name',           label: 'Nombre del equipo',  type: 'text',   required: true },
  { key: 'colors',         label: 'Colores',             type: 'text' },
  { key: 'delegate_name',  label: 'Nombre del delegado', type: 'text',   required: true },
  { key: 'delegate_email', label: 'Email del delegado',  type: 'email',  required: true },
  { key: 'delegate_phone', label: 'Teléfono del delegado', type: 'tel' },
  { key: 'notes',          label: 'Notas internas',      type: 'textarea' },
];

export default function TeamEditDialog({ team, leagues, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name:           team.name || '',
      league_id:      team.league_id || '',
      colors:         team.colors || '',
      delegate_name:  team.delegate_name || '',
      delegate_email: team.delegate_email || '',
      delegate_phone: team.delegate_phone || '',
      status:         team.status || 'pendiente',
      notes:          team.notes || '',
    });
  }, [team]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name || !form.delegate_name || !form.delegate_email) {
      toast({ title: 'Campos requeridos', description: 'Nombre, delegado y email son obligatorios.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const leagueName = leagues.find(l => l.id === form.league_id)?.name || team.league_name || '';
    await base44.entities.Team.update(team.id, { ...form, league_name: leagueName });
    toast({ title: 'Equipo actualizado', description: `${form.name} guardado correctamente.` });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-oswald font-bold text-xl">Editar equipo</h2>
            <p className="text-xs text-muted-foreground">{team.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">

          {/* Liga */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Liga / Competición</label>
            <select
              value={form.league_id}
              onChange={e => set('league_id', e.target.value)}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Sin asignar</option>
              {leagues.map(l => <option key={l.id} value={l.id}>{l.name} ({l.season})</option>)}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Estado de inscripción</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

          {/* Dynamic fields */}
          {FIELDS.map(({ key, label, type, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">
                {label}{required && <span className="text-destructive ml-1">*</span>}
              </label>
              {type === 'textarea' ? (
                <textarea
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              ) : (
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-input hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}