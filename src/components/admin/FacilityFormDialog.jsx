import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const EMPTY = {
  name: '', type: 'pabellón', address: '', capacity: '', phone: '',
  league_ids: [], league_names: [], is_active: true, notes: '',
};

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

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      capacity: form.capacity ? Number(form.capacity) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input placeholder="91 000 00 00" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            {/* Aforo */}
            <div className="space-y-1.5">
              <Label>Aforo</Label>
              <Input type="number" placeholder="500" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2">
            <Checkbox id="active" checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
            <Label htmlFor="active" className="cursor-pointer">Instalación activa</Label>
          </div>

          {/* Ligas asignadas */}
          {leagues.length > 0 && (
            <div className="space-y-2">
              <Label>Ligas asignadas</Label>
              <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border">
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
              {(form.league_ids?.length || 0) > 0 && (
                <p className="text-xs text-primary">{form.league_ids.length} liga(s) seleccionada(s)</p>
              )}
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