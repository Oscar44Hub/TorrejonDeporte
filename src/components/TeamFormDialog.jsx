import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = { name: '', delegate_name: '', delegate_email: '', delegate_phone: '', colors: '', status: 'pendiente', notes: '' };

export default function TeamFormDialog({ open, onOpenChange, editing, league, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (editing) {
      setForm({ name: editing.name || '', delegate_name: editing.delegate_name || '', delegate_email: editing.delegate_email || '', delegate_phone: editing.delegate_phone || '', colors: editing.colors || '', status: editing.status || 'pendiente', notes: editing.notes || '' });
    } else {
      setForm(EMPTY);
    }
  }, [editing, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.delegate_name || !form.delegate_email) {
      toast({ title: 'Nombre del equipo, delegado y email son obligatorios', variant: 'destructive' });
      return;
    }
    const data = { ...form, league_id: league.id, league_name: league.name, sport_name: league.sport_name };
    if (editing) { await base44.entities.Team.update(editing.id, data); }
    else { await base44.entities.Team.create(data); }
    onOpenChange(false);
    onSaved();
    toast({ title: editing ? 'Equipo actualizado' : 'Equipo inscrito correctamente' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-oswald text-xl">{editing ? 'Editar equipo' : 'Inscribir equipo'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div>
            <Label>Nombre del equipo *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: C.D. Atlético Torrejón" className="mt-1" />
          </div>
          <div>
            <Label>Nombre del delegado *</Label>
            <Input value={form.delegate_name} onChange={e => set('delegate_name', e.target.value)} placeholder="Nombre y apellidos" className="mt-1" />
          </div>
          <div>
            <Label>Email del delegado *</Label>
            <Input type="email" value={form.delegate_email} onChange={e => set('delegate_email', e.target.value)} placeholder="delegado@email.com" className="mt-1" />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={form.delegate_phone} onChange={e => set('delegate_phone', e.target.value)} placeholder="600 000 000" className="mt-1" />
          </div>
          <div>
            <Label>Colores del equipo</Label>
            <Input value={form.colors} onChange={e => set('colors', e.target.value)} placeholder="Rojo y blanco" className="mt-1" />
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente de revisión</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observaciones</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="mt-1" />
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