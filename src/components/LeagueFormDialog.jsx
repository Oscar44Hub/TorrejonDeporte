import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = { name: '', sport_id: '', sport_name: '', season: '2025-2026', category: '', gender: 'mixto', status: 'inscripcion', start_date: '', end_date: '', max_teams: '', description: '', venue: '' };

export default function LeagueFormDialog({ open, onOpenChange, editing, sports, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (editing) {
      setForm({ name: editing.name || '', sport_id: editing.sport_id || '', sport_name: editing.sport_name || '', season: editing.season || '2025-2026', category: editing.category || '', gender: editing.gender || 'mixto', status: editing.status || 'inscripcion', start_date: editing.start_date || '', end_date: editing.end_date || '', max_teams: editing.max_teams || '', description: editing.description || '', venue: editing.venue || '' });
    } else {
      setForm(EMPTY);
    }
  }, [editing, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.sport_id) { toast({ title: 'Nombre y deporte son obligatorios', variant: 'destructive' }); return; }
    const sport = sports.find(s => s.id === form.sport_id);
    const data = { ...form, sport_name: sport?.name || form.sport_name, max_teams: form.max_teams ? Number(form.max_teams) : undefined };
    if (editing) { await base44.entities.League.update(editing.id, data); } 
    else { await base44.entities.League.create(data); }
    onOpenChange(false);
    onSaved();
    toast({ title: editing ? 'Liga actualizada' : 'Liga creada correctamente' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-oswald text-xl">{editing ? 'Editar liga' : 'Nueva liga'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nombre de la liga *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Liga Municipal de Fútbol 7" className="mt-1" />
            </div>
            <div>
              <Label>Deporte *</Label>
              <Select value={form.sport_id} onValueChange={v => set('sport_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {sports.map(s => <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temporada</Label>
              <Input value={form.season} onChange={e => set('season', e.target.value)} placeholder="2025-2026" className="mt-1" />
            </div>
            <div>
              <Label>Categoría</Label>
              <Input value={form.category} onChange={e => set('category', e.target.value)} placeholder="Sénior, Juvenil..." className="mt-1" />
            </div>
            <div>
              <Label>Género</Label>
              <Select value={form.gender} onValueChange={v => set('gender', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="mixto">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inscripcion">Inscripción abierta</SelectItem>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                  <SelectItem value="suspendida">Suspendida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha inicio</Label>
              <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Máx. equipos</Label>
              <Input type="number" value={form.max_teams} onChange={e => set('max_teams', e.target.value)} placeholder="16" className="mt-1" />
            </div>
            <div>
              <Label>Instalación</Label>
              <Input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Polideportivo..." className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="mt-1" />
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