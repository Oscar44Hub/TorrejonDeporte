import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = { home_team_id: '', away_team_id: '', match_date: '', venue: '', round: '', status: 'programado', home_score: '', away_score: '', referee: '', notes: '' };

export default function MatchFormDialog({ open, onOpenChange, editing, league, teams, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (editing) {
      const dt = editing.match_date ? new Date(editing.match_date).toISOString().slice(0, 16) : '';
      setForm({ home_team_id: editing.home_team_id || '', away_team_id: editing.away_team_id || '', match_date: dt, venue: editing.venue || '', round: editing.round || '', status: editing.status || 'programado', home_score: editing.home_score ?? '', away_score: editing.away_score ?? '', referee: editing.referee || '', notes: editing.notes || '' });
    } else {
      setForm(EMPTY);
    }
  }, [editing, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.home_team_id || !form.away_team_id || !form.match_date) {
      toast({ title: 'Equipos y fecha son obligatorios', variant: 'destructive' });
      return;
    }
    if (form.home_team_id === form.away_team_id) {
      toast({ title: 'Los equipos no pueden ser el mismo', variant: 'destructive' });
      return;
    }
    const ht = teams.find(t => t.id === form.home_team_id);
    const at = teams.find(t => t.id === form.away_team_id);
    const data = {
      ...form,
      league_id: league.id, league_name: league.name, sport_name: league.sport_name,
      home_team_name: ht?.name || '', away_team_name: at?.name || '',
      home_score: form.home_score !== '' ? Number(form.home_score) : undefined,
      away_score: form.away_score !== '' ? Number(form.away_score) : undefined,
    };
    if (editing) { await base44.entities.Match.update(editing.id, data); }
    else { await base44.entities.Match.create(data); }
    onOpenChange(false);
    onSaved();
    toast({ title: editing ? 'Partido actualizado' : 'Partido creado' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-oswald text-xl">{editing ? 'Editar partido' : 'Nuevo partido'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Equipo local *</Label>
              <Select value={form.home_team_id} onValueChange={v => set('home_team_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {teams.filter(t => t.status === 'aprobado').map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Equipo visitante *</Label>
              <Select value={form.away_team_id} onValueChange={v => set('away_team_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {teams.filter(t => t.status === 'aprobado').map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha y hora *</Label>
              <Input type="datetime-local" value={form.match_date} onChange={e => set('match_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Jornada</Label>
              <Input value={form.round} onChange={e => set('round', e.target.value)} placeholder="Jornada 1" className="mt-1" />
            </div>
            <div>
              <Label>Instalación</Label>
              <Input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Polideportivo..." className="mt-1" />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="programado">Programado</SelectItem>
                  <SelectItem value="en_juego">En juego</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="aplazado">Aplazado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(form.status === 'finalizado' || form.status === 'en_juego') && <>
              <div>
                <Label>Goles local</Label>
                <Input type="number" min="0" value={form.home_score} onChange={e => set('home_score', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Goles visitante</Label>
                <Input type="number" min="0" value={form.away_score} onChange={e => set('away_score', e.target.value)} className="mt-1" />
              </div>
            </>}
            <div>
              <Label>Árbitro</Label>
              <Input value={form.referee} onChange={e => set('referee', e.target.value)} placeholder="Nombre árbitro" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Notas / Acta</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="mt-1" />
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