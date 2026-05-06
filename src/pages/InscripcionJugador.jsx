import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { CheckCircle, ChevronRight, ChevronLeft, User, Shield, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STEPS = ['Equipo', 'Jugador', 'Confirmación'];

const POSITIONS_BY_SPORT = {
  'Fútbol Sala': ['Portero', 'Cierre', 'Ala', 'Pívot'],
  'Fútbol 7': ['Portero', 'Defensa', 'Centrocampista', 'Delantero'],
  'Fútbol 11': ['Portero', 'Defensa', 'Centrocampista', 'Extremo', 'Delantero'],
  'Baloncesto': ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'],
  'Balonmano': ['Portero', 'Lateral', 'Central', 'Extremo', 'Pívot'],
  'Voleibol': ['Colocador', 'Opuesto', 'Central', 'Receptor', 'Libero'],
  'Tenis de Mesa': ['Atacante', 'Defensor', 'Mixto'],
  'Pádel': ['Derecha', 'Revés'],
};

export default function InscripcionJugador() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    full_name: '',
    dni: '',
    birth_date: '',
    phone: '',
    email: '',
    jersey_number: '',
    position: '',
    notes: '',
  });

  useEffect(() => {
    // Si el usuario es delegado, mostrar sólo sus equipos. Si admin, todos.
    const load = async () => {
      let data;
      if (user?.role === 'admin') {
        data = await base44.entities.Team.filter({ status: 'aprobado' });
      } else {
        data = await base44.entities.Team.filter({ delegate_email: user?.email, status: 'aprobado' });
      }
      setTeams(data);
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Nombre requerido';
    if (!form.dni.trim()) e.dni = 'DNI/NIE requerido';
    if (!form.birth_date) e.birth_date = 'Fecha de nacimiento requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    await base44.entities.Player.create({
      ...form,
      jersey_number: form.jersey_number ? Number(form.jersey_number) : undefined,
      team_id: selectedTeam.id,
      team_name: selectedTeam.name,
      league_id: selectedTeam.league_id,
      sport_name: selectedTeam.sport_name,
      status: 'activo',
    });
    setSaving(false);
    setSubmitted(true);
  };

  const Field = ({ label, field, type = 'text', placeholder = '', required = false }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}{required && <span className="text-destructive ml-1">*</span>}</label>
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

  const positions = selectedTeam ? (POSITIONS_BY_SPORT[selectedTeam.sport_name] || []) : [];

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="font-oswald font-bold text-2xl">¡Jugador inscrito!</h2>
          <p className="text-muted-foreground">
            <strong>{form.full_name}</strong> ha sido inscrito en <strong>{selectedTeam?.name}</strong>.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => { setSubmitted(false); setStep(0); setSelectedTeam(null); setForm({ full_name: '', dni: '', birth_date: '', phone: '', email: '', jersey_number: '', position: '', notes: '' }); }}
              variant="outline" className="flex-1">
              Inscribir otro jugador
            </Button>
            <Button onClick={() => window.history.back()} className="flex-1">Volver</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-oswald font-bold text-3xl">Inscripción de Jugador</h1>
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

        {/* Paso 0 — Elegir equipo */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-oswald font-bold text-xl">Selecciona el equipo</h2>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : teams.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No hay equipos aprobados disponibles</p>
                <p className="text-xs mt-1">El equipo debe estar aprobado por la Concejalía</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map(t => (
                  <button key={t.id}
                    onClick={() => { setSelectedTeam(t); setStep(1); }}
                    className="w-full text-left bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:border-primary/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-oswald font-semibold">{t.name}</p>
                        <p className="text-sm text-muted-foreground">{t.sport_name} · {t.league_name}</p>
                        <p className="text-xs text-muted-foreground">Delegado: {t.delegate_name}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Paso 1 — Datos jugador */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-accent/50 border border-accent rounded-xl p-4">
              <p className="text-sm font-medium text-accent-foreground">
                Inscribiendo en: <strong>{selectedTeam?.name}</strong> · {selectedTeam?.sport_name}
              </p>
            </div>

            <h2 className="font-oswald font-bold text-xl">Datos del jugador</h2>

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                <User className="w-4 h-4" /> DATOS PERSONALES
              </div>
              <Field label="Nombre completo" field="full_name" placeholder="Nombre y apellidos" required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="DNI / NIE" field="dni" placeholder="12345678A" required />
                <Field label="Fecha de nacimiento" field="birth_date" type="date" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Teléfono" field="phone" type="tel" placeholder="600 000 000" />
                <Field label="Email" field="email" type="email" placeholder="jugador@mail.com" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                <UserCheck className="w-4 h-4" /> DATOS DEPORTIVOS
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Dorsal</label>
                  <Input
                    type="number"
                    min="1" max="99"
                    placeholder="Nº camiseta"
                    value={form.jersey_number}
                    onChange={e => setForm(f => ({ ...f, jersey_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Posición / Rol</label>
                  {positions.length > 0 ? (
                    <Select value={form.position} onValueChange={v => setForm(f => ({ ...f, position: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input placeholder="Posición" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observaciones</label>
                <textarea
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[70px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Notas adicionales sobre el jugador..."
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
                Revisar <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 2 — Confirmación */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-oswald font-bold text-xl">Confirma la inscripción</h2>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Equipo</span><span className="font-medium">{selectedTeam?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Liga</span><span className="font-medium">{selectedTeam?.league_name}</span></div>
              <div className="border-t my-2" />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Jugador</span><span className="font-medium">{form.full_name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">DNI/NIE</span><span className="font-medium">{form.dni}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Nacimiento</span><span className="font-medium">{form.birth_date}</span></div>
              {form.phone && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Teléfono</span><span className="font-medium">{form.phone}</span></div>}
              {form.jersey_number && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Dorsal</span><span className="font-medium">#{form.jersey_number}</span></div>}
              {form.position && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Posición</span><span className="font-medium">{form.position}</span></div>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              El jugador quedará inscrito con estado <strong>activo</strong> en el equipo seleccionado.
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Editar</Button>
              <Button onClick={handleSubmit} disabled={saving} className="flex-1">
                {saving ? 'Guardando...' : 'Confirmar inscripción'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}