import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, ChevronRight, ChevronLeft, Shield, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS = {
  inscripcion: 'bg-blue-100 text-blue-700',
  activa: 'bg-emerald-100 text-emerald-700',
};

const STEPS = ['Liga', 'Equipo', 'Confirmación'];

export default function Inscripcion() {
  const [step, setStep] = useState(0);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    delegate_name: '',
    delegate_email: '',
    delegate_phone: '',
    colors: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    base44.entities.League.list().then(data => {
      setLeagues(data.filter(l => l.status === 'inscripcion' || l.status === 'activa'));
      setLoading(false);
    });
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nombre del equipo requerido';
    if (!form.delegate_name.trim()) e.delegate_name = 'Nombre del delegado requerido';
    if (!form.delegate_email.trim() || !form.delegate_email.includes('@')) e.delegate_email = 'Email válido requerido';
    if (!form.delegate_phone.trim()) e.delegate_phone = 'Teléfono requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    await base44.entities.Team.create({
      ...form,
      league_id: selectedLeague.id,
      league_name: selectedLeague.name,
      sport_name: selectedLeague.sport_name,
      status: 'pendiente',
    });
    setSaving(false);
    setSubmitted(true);
  };

  const Field = ({ label, field, type = 'text', placeholder = '' }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Input
        type={type}
        placeholder={placeholder}
        value={form[field]}
        onChange={e => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(er => ({ ...er, [field]: '' })); }}
        className={errors[field] ? 'border-destructive' : ''}
      />
      {errors[field] && <p className="text-destructive text-xs mt-1">{errors[field]}</p>}
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="font-oswald font-bold text-2xl">¡Solicitud enviada!</h2>
          <p className="text-muted-foreground">
            La inscripción de <strong>{form.name}</strong> en <strong>{selectedLeague?.name}</strong> ha sido registrada. El equipo quedará en estado <em>pendiente</em> hasta que la Concejalía de Deportes la apruebe.
          </p>
          <p className="text-sm text-muted-foreground">Recibirás confirmación en <strong>{form.delegate_email}</strong>.</p>
          <Button onClick={() => { setSubmitted(false); setStep(0); setSelectedLeague(null); setForm({ name: '', delegate_name: '', delegate_email: '', delegate_phone: '', colors: '', notes: '' }); }}
            variant="outline" className="w-full">
            Inscribir otro equipo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-oswald font-bold text-3xl">Inscripción de Equipos</h1>
          <p className="text-muted-foreground text-sm mt-1">Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Paso 0 — Elegir liga */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-oswald font-bold text-xl">Selecciona la competición</h2>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : leagues.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No hay competiciones abiertas en este momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leagues.map(l => (
                  <button key={l.id}
                    onClick={() => { setSelectedLeague(l); setStep(1); }}
                    className={`w-full text-left bg-card border rounded-xl p-4 hover:shadow-md transition-all hover:border-primary/40 ${selectedLeague?.id === l.id ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-oswald font-semibold">{l.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[l.status] || ''}`}>
                            {l.status === 'inscripcion' ? 'Abierta inscripción' : 'En curso'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{l.sport_name} · {l.category} · {l.season}</p>
                        {l.venue && <p className="text-xs text-muted-foreground mt-0.5">📍 {l.venue}</p>}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Paso 1 — Datos del equipo */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-accent/50 border border-accent rounded-xl p-4">
              <p className="text-sm font-medium text-accent-foreground">
                Inscribiendo en: <strong>{selectedLeague?.name}</strong> · {selectedLeague?.sport_name}
              </p>
            </div>

            <h2 className="font-oswald font-bold text-xl">Datos del equipo</h2>

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                <Users className="w-4 h-4" /> INFORMACIÓN DEL EQUIPO
              </div>
              <Field label="Nombre del equipo *" field="name" placeholder="Ej: Club Deportivo San Fernando" />
              <Field label="Colores del equipo" field="colors" placeholder="Ej: Rojo y blanco" />
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                <User className="w-4 h-4" /> DATOS DEL DELEGADO
              </div>
              <Field label="Nombre completo *" field="delegate_name" placeholder="Nombre y apellidos" />
              <Field label="Email de contacto *" field="delegate_email" type="email" placeholder="email@ejemplo.com" />
              <Field label="Teléfono *" field="delegate_phone" type="tel" placeholder="600 000 000" />
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="text-sm font-semibold text-muted-foreground mb-2">OBSERVACIONES</div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas adicionales</label>
                <textarea
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Cualquier información adicional relevante..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Atrás
              </Button>
              <Button onClick={() => { if (validate()) setStep(2); }} className="flex-1 gap-2">
                Revisar solicitud <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 2 — Confirmación */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-oswald font-bold text-xl">Confirma tu solicitud</h2>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Competición</span>
                <span className="font-medium text-right">{selectedLeague?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deporte</span>
                <span className="font-medium">{selectedLeague?.sport_name}</span>
              </div>
              <div className="border-t my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Equipo</span>
                <span className="font-medium">{form.name}</span>
              </div>
              {form.colors && <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Colores</span>
                <span className="font-medium">{form.colors}</span>
              </div>}
              <div className="border-t my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delegado</span>
                <span className="font-medium">{form.delegate_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{form.delegate_email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Teléfono</span>
                <span className="font-medium">{form.delegate_phone}</span>
              </div>
              {form.notes && <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Notas</span>
                <span className="font-medium text-right max-w-[60%]">{form.notes}</span>
              </div>}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              Tu solicitud quedará en estado <strong>pendiente</strong> hasta que sea revisada y aprobada por la Concejalía de Deportes.
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Editar
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="flex-1">
                {saving ? 'Enviando...' : 'Enviar solicitud de inscripción'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}