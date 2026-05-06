import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Calendar, Shuffle, Save, Trash2, AlertCircle, CheckCircle2, Plus, X } from 'lucide-react';
import { format, addDays, addWeeks, parseISO, isBefore, isAfter, isEqual } from 'date-fns';
import { es } from 'date-fns/locale';

// Genera el calendario round-robin (algoritmo de rotación)
function generarRoundRobin(equipos) {
  const eq = [...equipos];
  if (eq.length % 2 !== 0) eq.push({ id: '__bye__', name: 'Descanso' });
  const n = eq.length;
  const jornadas = [];
  for (let r = 0; r < n - 1; r++) {
    const partidos = [];
    for (let i = 0; i < n / 2; i++) {
      const local = eq[i];
      const visitante = eq[n - 1 - i];
      if (local.id !== '__bye__' && visitante.id !== '__bye__') {
        partidos.push({ home: local, away: visitante });
      }
    }
    jornadas.push(partidos);
    // Rotar: fijo el primero, rotar el resto
    eq.splice(1, 0, eq.pop());
  }
  return jornadas;
}

// Distribuye jornadas en fechas disponibles
function distribuirJornadas(jornadasIda, startDate, endDate, excludedDates, dayOfWeek) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const excluded = new Set(excludedDates);

  // Recopilar fechas disponibles (del día de semana elegido)
  const fechasDisponibles = [];
  let d = new Date(start);
  // Ajustar al primer día de semana correcto
  while (d.getDay() !== dayOfWeek) d = addDays(d, 1);
  while (!isAfter(d, end)) {
    const key = format(d, 'yyyy-MM-dd');
    if (!excluded.has(key)) fechasDisponibles.push(new Date(d));
    d = addWeeks(d, 1);
  }

  const todasJornadas = [...jornadasIda, ...jornadasIda.map(j => j.map(p => ({ home: p.away, away: p.home })))];
  const resultado = todasJornadas.map((partidos, idx) => ({
    numero: idx + 1,
    vuelta: idx >= jornadasIda.length ? 2 : 1,
    fecha: fechasDisponibles[idx] || null,
    partidos,
  }));
  return resultado;
}

const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export default function GeneradorCalendario() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [liga, setLiga] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Config generador
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(6); // Sábado por defecto
  const [excludedDates, setExcludedDates] = useState([]);
  const [newExcluded, setNewExcluded] = useState('');

  // Resultado generado
  const [jornadas, setJornadas] = useState([]);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [l, teams] = await Promise.all([
        base44.entities.League.filter({ id: leagueId }),
        base44.entities.Team.filter({ league_id: leagueId, status: 'aprobado' }),
      ]);
      const league = l[0] || null;
      setLiga(league);
      setEquipos(teams);
      if (league?.start_date) setStartDate(league.start_date);
      if (league?.end_date) setEndDate(league.end_date);
      setLoading(false);
    };
    load();
  }, [leagueId]);

  const handleAddExcluded = () => {
    if (!newExcluded || excludedDates.includes(newExcluded)) return;
    setExcludedDates(prev => [...prev, newExcluded].sort());
    setNewExcluded('');
  };

  const handleRemoveExcluded = (date) => {
    setExcludedDates(prev => prev.filter(d => d !== date));
  };

  const handleGenerar = () => {
    if (!startDate || !endDate) {
      toast({ title: 'Indica fecha de inicio y fin', variant: 'destructive' });
      return;
    }
    if (equipos.length < 2) {
      toast({ title: 'Se necesitan al menos 2 equipos aprobados', variant: 'destructive' });
      return;
    }
    setGenerating(true);

    // Mezclar equipos aleatoriamente para el sorteo
    const mezclados = [...equipos].sort(() => Math.random() - 0.5);
    const jornadasIda = generarRoundRobin(mezclados);
    const resultado = distribuirJornadas(jornadasIda, startDate, endDate, excludedDates, dayOfWeek);

    setJornadas(resultado);
    setGenerated(true);
    setGenerating(false);
  };

  const handleResortear = () => {
    setGenerated(false);
    setJornadas([]);
    setTimeout(handleGenerar, 50);
  };

  const handleGuardar = async () => {
    setSaving(true);
    // Eliminar partidos existentes de esta liga
    const existing = await base44.entities.Match.filter({ league_id: leagueId });
    await Promise.all(existing.map(m => base44.entities.Match.delete(m.id)));

    // Crear todos los partidos
    const toCreate = [];
    jornadas.forEach(jornada => {
      jornada.partidos.forEach(partido => {
        toCreate.push({
          league_id: leagueId,
          league_name: liga.name,
          sport_name: liga.sport_name || '',
          home_team_id: partido.home.id,
          home_team_name: partido.home.name,
          away_team_id: partido.away.id,
          away_team_name: partido.away.name,
          match_date: jornada.fecha ? jornada.fecha.toISOString() : null,
          round: `Jornada ${jornada.numero} (${jornada.vuelta === 1 ? 'Ida' : 'Vuelta'})`,
          status: 'programado',
          venue: null,
        });
      });
    });

    await base44.entities.Match.bulkCreate(toCreate);

    // Cambiar estado de liga a activa
    await base44.entities.League.update(leagueId, { status: 'activa' });

    setSaving(false);
    toast({ title: '¡Calendario guardado!', description: `${toCreate.length} partidos creados en ${jornadas.length} jornadas.` });
    navigate('/admin/ligas');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (!liga) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <AlertCircle className="w-10 h-10 mx-auto mb-2" />
        <p>Liga no encontrada.</p>
      </div>
    );
  }

  const equiposAprobados = equipos.filter(e => e.status === 'aprobado');
  const totalJornadas = equiposAprobados.length >= 2 ? (equiposAprobados.length % 2 === 0 ? equiposAprobados.length - 1 : equiposAprobados.length) * 2 : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/ligas')} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Generador de Calendario</p>
          <h1 className="font-oswald font-bold text-2xl">{liga.name}</h1>
        </div>
      </div>

      {/* Info equipos */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Equipos participantes aprobados
          </h2>
          <span className="text-xs text-muted-foreground">{equiposAprobados.length} equipos · {totalJornadas} jornadas totales (ida y vuelta)</span>
        </div>
        {equiposAprobados.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>No hay equipos aprobados en esta liga. Aprueba equipos antes de generar el calendario.</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {equiposAprobados.map(e => (
              <span key={e.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                  {e.name.charAt(0)}
                </span>
                {e.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Configuración */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-5">
        <h2 className="font-oswald font-bold text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Configuración del calendario
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de inicio *</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de fin *</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Día de competición</label>
            <select value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
              {DIAS_SEMANA.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>

        {/* Fechas excluidas */}
        <div>
          <label className="block text-sm font-medium mb-2">Fechas sin competición (festivos, vacaciones...)</label>
          <div className="flex gap-2 mb-2">
            <input type="date" value={newExcluded} onChange={e => setNewExcluded(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            <button onClick={handleAddExcluded}
              className="flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /> Añadir
            </button>
          </div>
          {excludedDates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {excludedDates.map(date => (
                <span key={date} className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                  {format(parseISO(date), "dd MMM yyyy", { locale: es })}
                  <button onClick={() => handleRemoveExcluded(date)} className="hover:text-red-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleGenerar}
            disabled={generating || equiposAprobados.length < 2}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
            <Shuffle className="w-4 h-4" />
            {generated ? 'Regenerar sorteo' : 'Generar calendario'}
          </button>
          {generated && (
            <button onClick={handleResortear}
              className="flex items-center gap-2 border border-border hover:bg-muted px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Shuffle className="w-4 h-4" /> Nuevo sorteo aleatorio
            </button>
          )}
        </div>
      </div>

      {/* Resultado del calendario */}
      {generated && jornadas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-oswald font-bold text-xl">
              Calendario generado — {jornadas.length} jornadas
            </h2>
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar y activar liga'}
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2 text-amber-800 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>La instalación y hora de cada partido quedan <strong>pendientes de definir</strong>. Podrás completarlos desde la gestión de partidos una vez guardado el calendario.</span>
          </div>

          {/* Dividir en ida y vuelta */}
          {[1, 2].map(vuelta => {
            const jornadasVuelta = jornadas.filter(j => j.vuelta === vuelta);
            return (
              <div key={vuelta} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className={`px-5 py-3 font-oswald font-bold text-sm uppercase tracking-wider border-b border-border ${vuelta === 1 ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                  {vuelta === 1 ? '🏠 Primera vuelta — Equipos locales en casa' : '✈️ Segunda vuelta — Equipos visitantes en casa'}
                </div>
                <div className="divide-y divide-border">
                  {jornadasVuelta.map(jornada => (
                    <div key={jornada.numero} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-sm">
                          Jornada {jornada.numero}
                          {vuelta === 2 ? ` (Jornada ${jornada.numero - jornadasVuelta.length} — vuelta)` : ''}
                        </span>
                        {jornada.fecha ? (
                          <span className="text-xs bg-muted px-3 py-1 rounded-full font-medium">
                            📅 {format(jornada.fecha, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                          </span>
                        ) : (
                          <span className="text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded-full font-medium">
                            ⚠️ Sin fecha disponible
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {jornada.partidos.map((partido, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm py-1.5 px-3 bg-muted/40 rounded-lg">
                            <span className="flex-1 text-right font-medium">{partido.home.name}</span>
                            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded font-bold">vs</span>
                            <span className="flex-1 font-medium">{partido.away.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">🏟️ Por definir</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pb-4">
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar calendario y activar liga'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}