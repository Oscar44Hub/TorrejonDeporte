import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, UserCheck, Star, FileText, Mail, Phone, Trash2, Edit2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  activo: { label: 'Activo', cls: 'bg-emerald-100 text-emerald-700' },
  inactivo: { label: 'Inactivo', cls: 'bg-gray-100 text-gray-600' },
  suspendido: { label: 'Suspendido', cls: 'bg-red-100 text-red-700' },
};

const emptyForm = { full_name: '', email: '', phone: '', license_number: '', sport_names: [], status: 'activo', notes: '' };

export default function GestionArbitros() {
  const { toast } = useToast();
  const [referees, setReferees] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRef, setEditingRef] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedRef, setSelectedRef] = useState(null);

  const load = async () => {
    const [refs, revs] = await Promise.all([
      base44.entities.Referee.list(),
      base44.entities.MatchTeamReview.list(),
    ]);
    setReferees(refs);
    setReviews(revs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = referees.filter(r =>
    r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );

  const avgForRef = (name) => {
    const refRevs = reviews.filter(r => r.referee_name === name && r.referee_rating);
    if (!refRevs.length) return null;
    return (refRevs.reduce((s, r) => s + r.referee_rating, 0) / refRevs.length).toFixed(1);
  };

  const openCreate = () => { setEditingRef(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (ref) => { setEditingRef(ref); setForm({ ...emptyForm, ...ref }); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editingRef) {
      await base44.entities.Referee.update(editingRef.id, form);
    } else {
      await base44.entities.Referee.create(form);
    }
    toast({ title: editingRef ? 'Árbitro actualizado' : 'Árbitro creado' });
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este árbitro?')) return;
    await base44.entities.Referee.delete(id);
    setReferees(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Árbitro eliminado' });
  };

  const handleInvite = async (ref) => {
    await base44.users.inviteUser(ref.email, 'arbitro');
    await base44.entities.Referee.update(ref.id, { app_user_invited: true });
    setReferees(prev => prev.map(r => r.id === ref.id ? { ...r, app_user_invited: true } : r));
    toast({ title: 'Invitación enviada', description: `Se ha invitado a ${ref.email} como árbitro` });
  };

  // Reviews del árbitro seleccionado
  const refReviews = selectedRef ? reviews.filter(r => r.referee_name === selectedRef.full_name) : [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-oswald font-bold text-3xl">Gestión de Árbitros</h1>
          <p className="text-muted-foreground text-sm mt-1">{referees.length} árbitro{referees.length !== 1 ? 's' : ''} registrado{referees.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo árbitro
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar árbitro..."
          className="w-full pl-9 pr-4 py-2.5 border border-input rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring text-sm"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-muted-foreground">
            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay árbitros registrados</p>
          </div>
        ) : filtered.map(ref => {
          const avg = avgForRef(ref.full_name);
          const refRevCount = reviews.filter(r => r.referee_name === ref.full_name).length;
          const statusCfg = STATUS_CONFIG[ref.status] || STATUS_CONFIG.activo;
          return (
            <div key={ref.id}
              className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selectedRef?.id === ref.id ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
              onClick={() => setSelectedRef(selectedRef?.id === ref.id ? null : ref)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {ref.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{ref.full_name}</p>
                    {ref.license_number && <p className="text-xs text-muted-foreground">Licencia: {ref.license_number}</p>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); openEdit(ref); }}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(ref.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {ref.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /><span className="truncate">{ref.email}</span></div>}
                {ref.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /><span>{ref.phone}</span></div>}
                {ref.sport_names?.length > 0 && (
                  <div className="col-span-2 flex flex-wrap gap-1 mt-1">
                    {ref.sport_names.map(s => <span key={s} className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-xs">{s}</span>)}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-semibold">{avg ?? '—'}</span>
                  <span className="text-xs text-muted-foreground">({refRevCount} valoración{refRevCount !== 1 ? 'es' : ''})</span>
                </div>
                {!ref.app_user_invited ? (
                  <button onClick={e => { e.stopPropagation(); handleInvite(ref); }}
                    className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-medium hover:bg-primary/20 transition-colors">
                    <Mail className="w-3 h-3" /> Invitar al sistema
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <Check className="w-3 h-3" /> Invitado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel de valoraciones del árbitro seleccionado */}
      {selectedRef && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-oswald font-bold text-xl flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" /> Valoraciones de {selectedRef.full_name}
            </h3>
            <button onClick={() => setSelectedRef(null)} className="p-1.5 hover:bg-muted rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          {refReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay valoraciones para este árbitro</p>
          ) : (
            <div className="space-y-3">
              {refReviews.map(r => <ReviewCard key={r.id} review={r} onVerify={async () => {
                await base44.entities.MatchTeamReview.update(r.id, { status: 'verificado_admin' });
                setReviews(prev => prev.map(rv => rv.id === r.id ? { ...rv, status: 'verificado_admin' } : rv));
                toast({ title: 'Valoración verificada' });
              }} />)}
            </div>
          )}
        </div>
      )}

      {/* Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-oswald font-bold text-xl">{editingRef ? 'Editar árbitro' : 'Nuevo árbitro'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-muted rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { key: 'full_name', label: 'Nombre completo *', type: 'text' },
                { key: 'email', label: 'Email *', type: 'email' },
                { key: 'phone', label: 'Teléfono', type: 'text' },
                { key: 'license_number', label: 'Nº de licencia', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key] || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Estado</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Notas internas</label>
                <textarea
                  value={form.notes || ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-border">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2 border border-input rounded-lg text-sm hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.full_name || !form.email}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? 'Guardando...' : editingRef ? 'Actualizar' : 'Crear árbitro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review: r, onVerify }) {
  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-semibold text-sm">{r.team_name}</span>
          <span className="text-xs text-muted-foreground ml-2">· {r.signer_name} ({r.signer_role === 'capitan' ? 'Capitán' : 'Delegado'})</span>
        </div>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(n => (
            <Star key={n} className={`w-3.5 h-3.5 ${n <= (r.referee_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
          ))}
        </div>
      </div>
      {r.comment && <p className="text-sm italic text-foreground bg-muted/50 rounded px-3 py-2 mb-2">"{r.comment}"</p>}
      {!r.accepts_result && r.protest_reason && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 mb-2">⚠️ Protesta: {r.protest_reason}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{r.league_name} · {r.match_date ? format(new Date(r.match_date), "d MMM yyyy", { locale: es }) : ''}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            r.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
            r.status === 'verificado_admin' ? 'bg-blue-100 text-blue-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            {r.status === 'pendiente' ? 'Pendiente' : r.status === 'verificado_admin' ? 'Verificado' : 'Corroborado'}
          </span>
          {r.status === 'pendiente' && (
            <button onClick={onVerify}
              className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium hover:bg-blue-100 transition-colors">
              <Check className="w-3 h-3" /> Verificar
            </button>
          )}
        </div>
      </div>
      {r.referee_response && (
        <div className="mt-2 bg-primary/5 border border-primary/20 rounded px-3 py-1.5">
          <p className="text-xs font-semibold text-primary mb-0.5">Respuesta del árbitro:</p>
          <p className="text-xs">{r.referee_response}</p>
        </div>
      )}
    </div>
  );
}