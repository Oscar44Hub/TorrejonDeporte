import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Pencil, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const SPORT_ICONS = ['⚽', '🏀', '🎾', '🏐', '🏊', '🏃', '🚴', '🏋️', '🥊', '⛳', '🏓', '🤸', '🏒', '🎿', '🏊‍♂️', '🤾'];

// Iconos personalizados (imagen URL)
const CUSTOM_ICONS = [
  { id: 'petanca', url: 'https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/dbe786bb1_generated_image.png', label: 'Petanca' },
  { id: 'tenis', url: 'https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/a982c5105_generated_image.png', label: 'Tenis' },
];

export default function Deportes() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'equipo', icon: '⚽', description: '' });

  const load = async () => {
    const data = await base44.entities.Sport.list();
    setSports(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', type: 'equipo', icon: '⚽', description: '' }); setOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, type: s.type, icon: s.icon || '⚽', description: s.description || '' }); setOpen(true); };

  const handleSave = async () => {
    if (!form.name) return;
    if (editing) {
      await base44.entities.Sport.update(editing.id, form);
    } else {
      await base44.entities.Sport.create({ ...form, is_active: true });
    }
    setOpen(false);
    await load();
    toast({ title: editing ? 'Deporte actualizado' : 'Deporte creado' });
  };

  const handleDelete = async (id) => {
    await base44.entities.Sport.delete(id);
    await load();
    toast({ title: 'Deporte eliminado' });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-oswald font-bold text-3xl text-foreground">Deportes</h1>
          <p className="text-muted-foreground text-sm mt-1">Catálogo de disciplinas deportivas municipales</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" /> Añadir deporte
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : sports.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No hay deportes registrados aún</p>
          {isAdmin && <Button onClick={openCreate} className="mt-4 bg-primary">Añadir primero</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sports.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow group">
              <div className="text-4xl mb-3">
                {s.icon?.startsWith('http')
                  ? <img src={s.icon} alt={s.name} className="w-10 h-10 object-contain" />
                  : (s.icon || '🏅')
                }
              </div>
              <h3 className="font-oswald font-semibold text-foreground">{s.name}</h3>
              <Badge variant="outline" className="mt-1 text-xs capitalize">{s.type}</Badge>
              {s.description && <p className="text-muted-foreground text-xs mt-2 line-clamp-2">{s.description}</p>}
              {isAdmin && (
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-oswald">{editing ? 'Editar deporte' : 'Nuevo deporte'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Fútbol 7" className="mt-1" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipo">Equipo</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Icono</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SPORT_ICONS.map(icon => (
                  <button key={icon} onClick={() => setForm({ ...form, icon })}
                    className={`text-2xl p-1.5 rounded-lg border-2 transition-colors ${form.icon === icon ? 'border-primary bg-primary/10' : 'border-transparent hover:border-border'}`}>
                    {icon}
                  </button>
                ))}
                {CUSTOM_ICONS.map(ci => (
                  <button key={ci.id} onClick={() => setForm({ ...form, icon: ci.url })}
                    title={ci.label}
                    className={`p-1 rounded-lg border-2 transition-colors ${form.icon === ci.url ? 'border-primary bg-primary/10' : 'border-transparent hover:border-border'}`}>
                    <img src={ci.url} alt={ci.label} className="w-8 h-8 object-contain" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Breve descripción" className="mt-1" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}