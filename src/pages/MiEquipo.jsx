import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Mail, Phone, Trophy, Users, Calendar, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function MiEquipo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    const myTeams = await base44.entities.Team.filter({ delegate_email: user?.email });
    setTeams(myTeams);
    setLoading(false);
  };

  useEffect(() => { if (user?.email) load(); }, [user]);

  const startEdit = (team) => {
    setEditingTeam(team.id);
    setForm({ colors: team.colors || '', notes: team.notes || '', delegate_phone: team.delegate_phone || '' });
  };

  const handleSave = async (teamId) => {
    setSaving(true);
    await base44.entities.Team.update(teamId, form);
    toast({ title: 'Equipo actualizado correctamente' });
    setSaving(false);
    setEditingTeam(null);
    load();
  };

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      {[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-oswald font-bold text-3xl">Mi equipo</h1>
        <p className="text-muted-foreground text-sm mt-1">Información y datos de tus equipos inscritos</p>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No tienes equipos inscritos</p>
          <p className="text-xs mt-1">Usa el formulario de inscripción para registrar tu equipo</p>
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Header equipo */}
              <div className="bg-sidebar p-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-oswald font-bold text-sidebar-foreground text-xl">{t.name}</h2>
                  <p className="text-sidebar-foreground/60 text-sm mt-0.5">{t.sport_name} · {t.league_name}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${t.status === 'aprobado' ? 'bg-emerald-500/20 text-emerald-300' : t.status === 'rechazado' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {t.status === 'aprobado' ? 'Aprobado' : t.status === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                </span>
              </div>

              <div className="p-5 space-y-4">
                {/* Info fija */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Liga:</span>
                      <span className="font-medium">{t.league_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{t.delegate_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Delegado:</span>
                      <span className="font-medium">{t.delegate_name}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {editingTeam === t.id ? (
                      <>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Teléfono de contacto</label>
                          <Input value={form.delegate_phone} onChange={e => setForm(f => ({ ...f, delegate_phone: e.target.value }))} placeholder="600 000 000" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Colores del equipo</label>
                          <Input value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} placeholder="Ej: Rojo y blanco" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Notas</label>
                          <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones..." />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingTeam(null)} className="flex-1">Cancelar</Button>
                          <Button size="sm" onClick={() => handleSave(t.id)} disabled={saving} className="flex-1">
                            {saving ? 'Guardando...' : 'Guardar'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {t.delegate_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Teléfono:</span>
                            <span className="font-medium">{t.delegate_phone}</span>
                          </div>
                        )}
                        {t.colors && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">🎨 Colores:</span>
                            <span className="font-medium">{t.colors}</span>
                          </div>
                        )}
                        {t.notes && <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2">{t.notes}</p>}
                        <Button size="sm" variant="outline" onClick={() => startEdit(t)}>Editar información</Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}