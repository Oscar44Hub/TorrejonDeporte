import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

const EMPTY = {
  name: '', type: 'pabellón', address: '', capacity: '', phone: '',
  league_ids: [], league_names: [], is_active: true, notes: '', fields: [],
};

const emptyField = () => ({ name: '', sport: '', surface: '', capacity: '', notes: '' });

const SPORTS_LIST = ['Fútbol 11', 'Fútbol 7', 'Fútbol Sala', 'Baloncesto', 'Balonmano', 'Voleibol', 'Pádel', 'Tenis', 'Tenis de Mesa', 'Natación', 'Atletismo', 'Otro'];
const SURFACES = ['Césped natural', 'Césped artificial', 'Parqué', 'Hormigón', 'Tartan', 'Arena', 'Agua', 'Otro'];

export default function FacilityFormDialog({ open, onOpenChange, facility, leagues, onSave }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (facility) {
      setForm({
        ...EMPTY,
        ...facility,
        capacity: facility.capacity || '',
        league_ids: facility.league_ids || [],
        league_names: facility.league_names || [],
        fields: (facility.fields || []).map(f => ({ ...f, capacity: f.capacity || '' })),
      });
    } else {
      setForm(EMPTY);
    }
  }, [facility, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleLeague = (league) => {
    const ids = form.league_ids || [];
    const names = form.league_names || [];
    if (ids.includes(league.id)) {
      set('league_ids', ids.filter(id => id !== league.id));
      set('league_names', names.filter(n => n !== league.name));
    } else {
      set('league_ids', [...ids, league.id]);
      set('league_names', [...names, league.name]);
    }
  };

  const addField = () => setForm(f => ({ ...f, fields: [...(f.fields || []), emptyField()] }));
  const removeField = (idx) => setForm(f => ({ ...f, fields: f.fields.filter((_, i) => i !== idx) }));
  const updateField = (idx, key, val) => setForm(f => ({
    ...f,
    fields: f.fields.map((fld, i) => i === idx ? { ...fld, [key]: val } : fld),
  }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      fields: form.fields.map(fld => ({ ...fld, capacity: fld.capacity ? Number(fld.capacity) : undefined })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{facility ? 'Editar instalación' : 'Nueva instalación'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="Ej: Pabellón Municipal Norte" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={v => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['pabellón', 'campo', 'pista', 'piscina', 'sala', 'otro'].map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label>Dirección</Label>
            <Input placeholder="Calle, número..." value={form.address} onChange={e => set('address', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input placeholder="91 000 00 00" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Aforo total</Label>
              <Input type="number" placeholder="500" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2">
            <Checkbox id="active" checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
            <Label htmlFor="active" className="cursor-pointer">Instalación activa</Label>
          </div>

          {/* ── CAMPOS / PISTAS INDIVIDUALES ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">🏟️ Campos / Pistas individuales</Label>
              <Button type="button" size="sm" variant="outline" onClick={addField} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Añadir campo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Registra cada campo o pista por separado, p.ej. 1 Fútbol 11 + 2 Fútbol 7</p>

            {(form.fields || []).length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-xl py-6 text-center text-muted-foreground text-sm">
                Sin campos registrados. Pulsa "Añadir campo" para detallar cada pista.
              </div>
            ) : (
              <div className="space-y-3">
                {(form.fields || []).map((fld, idx) => (
                  <div key={idx} className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">Campo {idx + 1}</span>
                      <button type="button" onClick={() => removeField(idx)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nombre del campo</Label>
                        <Input placeholder="Ej: Campo Principal, Pista A..." value={fld.name} onChange={e => updateField(idx, 'name', e.target.value)} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Deporte</Label>
                        <select
                          value={fld.sport}
                          onChange={e => updateField(idx, 'sport', e.target.value)}
                          className="w-full border border-input rounded-md px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                          <option value="">— Seleccionar —</option>
                          {SPORTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Superficie</Label>
                        <select
                          value={fld.surface}
                          onChange={e => updateField(idx, 'surface', e.target.value)}
                          className="w-full border border-input rounded-md px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                          <option value="">— Seleccionar —</option>
                          {SURFACES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Aforo (este campo)</Label>
                        <Input type="number" placeholder="200" value={fld.capacity} onChange={e => updateField(idx, 'capacity', e.target.value)} className="text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notas</Label>
                      <Input placeholder="Medidas, iluminación artificial, etc." value={fld.notes} onChange={e => updateField(idx, 'notes', e.target.value)} className="text-sm" />
                    </div>
                  </div>
                ))}

                {/* Resumen */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm">
                  <p className="font-medium text-primary mb-1">Resumen de campos:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(
                      (form.fields || []).reduce((acc, fld) => {
                        const sport = fld.sport || 'Sin especificar';
                        acc[sport] = (acc[sport] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([sport, count]) => (
                      <span key={sport} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {count}× {sport}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ligas asignadas */}
          {leagues.length > 0 && (
            <div className="space-y-2">
              <Label>Ligas asignadas</Label>
              <div className="border border-border rounded-lg max-h-40 overflow-y-auto divide-y divide-border">
                {leagues.map(league => (
                  <label key={league.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={(form.league_ids || []).includes(league.id)}
                      onCheckedChange={() => toggleLeague(league)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{league.name}</p>
                      <p className="text-xs text-muted-foreground">{league.sport_name} · {league.season}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Input placeholder="Observaciones..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!form.name.trim()}>
              {facility ? 'Guardar cambios' : 'Crear instalación'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}