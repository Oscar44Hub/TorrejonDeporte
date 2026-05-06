import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_COLORS = {
  programado: 'bg-blue-500',
  en_juego: 'bg-emerald-500',
  finalizado: 'bg-gray-400',
  aplazado: 'bg-amber-400',
  cancelado: 'bg-red-400',
};

export default function CalendarioVista({ matches }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const matchesByDay = useMemo(() => {
    const map = {};
    matches.forEach(m => {
      if (!m.match_date) return;
      const key = format(new Date(m.match_date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [matches]);

  const startPad = getDay(startOfMonth(currentMonth)); // 0=Sunday
  const selectedKey = selected ? format(selected, 'yyyy-MM-dd') : null;
  const selectedMatches = selectedKey ? (matchesByDay[selectedKey] || []) : [];

  const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-4">
      {/* Header mes */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-oswald font-bold text-xl capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Grid días semana */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
        ))}
        {/* Padding inicial */}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {/* Días */}
        {daysInMonth.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayMatches = matchesByDay[key] || [];
          const isSelected = selected && isSameDay(day, selected);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={key}
              onClick={() => setSelected(isSelected ? null : day)}
              className={`relative flex flex-col items-center py-1.5 rounded-lg transition-colors min-h-[52px] ${isSelected ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted'} ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}`}
            >
              <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : ''}`}>
                {format(day, 'd')}
              </span>
              {dayMatches.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[40px]">
                  {dayMatches.slice(0, 3).map((m, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[m.status] || 'bg-gray-400'}`} />
                  ))}
                  {dayMatches.length > 3 && <span className="text-[9px] text-muted-foreground">+{dayMatches.length - 3}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Partidos del día seleccionado */}
      {selected && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3 capitalize">
            {format(selected, "EEEE, d MMMM", { locale: es })}
            {selectedMatches.length === 0 && <span className="ml-2 font-normal text-muted-foreground">— Sin partidos</span>}
          </h4>
          <div className="space-y-2">
            {selectedMatches.map(m => (
              <div key={m.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground flex-1">{m.league_name}</span>
                  {m.round && <span className="text-xs text-muted-foreground">· {m.round}</span>}
                  <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[m.status]}`} />
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium flex-1 text-right truncate">{m.home_team_name}</span>
                  <div className="flex-shrink-0 font-oswald font-bold text-base px-2">
                    {m.status === 'finalizado' || m.status === 'en_juego'
                      ? `${m.home_score ?? '-'} — ${m.away_score ?? '-'}`
                      : m.match_date ? format(new Date(m.match_date), 'HH:mm') : 'TBD'}
                  </div>
                  <span className="font-medium flex-1 text-left truncate">{m.away_team_name}</span>
                </div>
                {m.venue && <p className="text-xs text-muted-foreground mt-1 text-center">📍 {m.venue}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex gap-4 flex-wrap text-xs text-muted-foreground pt-2">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Programado</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> En juego</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> Finalizado</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Aplazado</span>
      </div>
    </div>
  );
}