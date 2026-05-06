import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = { full_name: '', dni: '', birth_date: '', phone: '', email: '', jersey_number: '', position: '', status: 'activo', notes: '' };

export default function PlayerFormDialog({ open, onOpenChange, editing, teamId, teams, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const team = teams?.find(t => t.id === teamId);

  useEffect(() => {
    if (editing) {
      setForm({ full_name: editing.full_name || '', dni: editing.dni || '', birth_date: editing.birth_date || '', phone: editing.phone || '', email: editing.email || '', jersey_number: editing.jersey_number || '', position: editing.position || '', status: editing.status || 'activo', notes: editing.notes || '' });
    } else {
      setForm(EMPTY);
    }
  }, [editing, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.full_name || !form.dni) {
      toast({ title: 'Nombre y DNI son obligatorios', variant: 'destructive' });
      return;
    }
    const data = {
      ...form,
      team_id: teamId,
      team_name: team?.name || '',
      league_id: team?.league_id || '',
      sport_name: team?.sport_name || '',
      jersey_number: form.jersey_number ? Number(form.jersey_number) : undefined,
    };
    if (editing) { await base44.entities.Player.update(editing.id, data); }
    else { await base44.entities.Player.create(data); }
    onOpenChange(false);
    onSaved();
    toast({ title: editing ? 'Jugador actualizado' : 'Jugador registrado correctamente' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-oswald text-xl">{editing ? 'Editar jugador' : 'Registrar jugador'}</DialogTitle>
          {team && <p className="text-sm text-muted-foreground">Equipo: {team.name}</p>}
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div>
            <Label>Nombre completo *</Label>
            <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Nombre y apellidos" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>DNI / NIE *</Label>
              <Input value={form.dni} onChange={e => set('dni', e.target.value)} placeholder="12345678A" className="mt-1" />
            </div>
            <div>
              <Label>Fecha nacimiento</Label>
              <Input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Nº Camiseta</Label>
              <Input type="number" min="1" max="99" value={form.jersey_number} onChange={e => set('jersey_number', e.target.value)} placeholder="7" className="mt-1" />
            </div>
            <div>
              <Label>Posición</Label>
              <Input value={form.position} onChange={e => set('position', e.target.value)} placeholder="Ej: Delantero" className="mt-1" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="600 000 000" className="mt-1" />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="sancionado">Sancionado</SelectItem>
                  <SelectItem value="lesionado">Lesionado</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}