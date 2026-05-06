import { useMemo } from 'react';
import { Trophy, Minus, TrendingUp, TrendingDown } from 'lucide-react';

export default function ClasificacionCompleta({ teams, matches }) {
  const standings = useMemo(() => {
    const approved = teams.filter(t => t.status === 'aprobado');
    const stats = {};
    approved.forEach(t => {
      stats[t.id] = {
        team: t,
        pj: 0, pg: 0, pe: 0, pp: 0,
        gf: 0, gc: 0, pts: 0,
        form: [], // últimos 5 resultados
      };
    });

    const finished = matches.filter(m => m.status === 'finalizado' && m.home_score != null && m.away_score != null);
    finished.forEach(m => {
      const h = stats[m.home_team_id];
      const a = stats[m.away_team_id];
      if (!h || !a) return;

      h.pj++; a.pj++;
      h.gf += m.home_score; h.gc += m.away_score;
      a.gf += m.away_score; a.gc += m.home_score;

      if (m.home_score > m.away_score) {
        h.pg++; h.pts += 3; h.form.unshift('W');
        a.pp++; a.form.unshift('L');
      } else if (m.home_score < m.away_score) {
        a.pg++; a.pts += 3; a.form.unshift('W');
        h.pp++; h.form.unshift('L');
      } else {
        h.pe++; h.pts += 1; h.form.unshift('D');
        a.pe++; a.pts += 1; a.form.unshift('D');
      }
    });

    return Object.values(stats)
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        const gdA = a.gf - a.gc;
        const gdB = b.gf - b.gc;
        if (gdB !== gdA) return gdB - gdA;
        return b.gf - a.gf;
      });
  }, [teams, matches]);

  if (standings.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No hay equipos aprobados en esta liga todavía</p>
      </div>
    );
  }

  const FORM_COLORS = { W: 'bg-emerald-500 text-white', D: 'bg-amber-400 text-white', L: 'bg-red-400 text-white' };
  const FORM_LABELS = { W: 'V', D: 'E', L: 'D' };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground w-8">#</th>
            <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground">Equipo</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground">PJ</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground">PG</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground">PE</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground">PP</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground">GF</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground">GC</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground">DG</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground font-bold">Pts</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground hidden md:table-cell">Forma</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const isTop3 = i < 3;
            const isLast = i === standings.length - 1 && standings.length > 1;
            const dg = s.gf - s.gc;
            return (
              <tr key={s.team.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${isTop3 ? 'bg-emerald-50/30' : isLast ? 'bg-red-50/30' : ''}`}>
                <td className="py-3 px-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-700 text-white' : 'text-muted-foreground'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                </td>
                <td className="py-3 px-2 font-medium">{s.team.name}</td>
                <td className="py-3 px-2 text-center text-muted-foreground">{s.pj}</td>
                <td className="py-3 px-2 text-center text-emerald-600 font-medium">{s.pg}</td>
                <td className="py-3 px-2 text-center text-amber-600 font-medium">{s.pe}</td>
                <td className="py-3 px-2 text-center text-red-500 font-medium">{s.pp}</td>
                <td className="py-3 px-2 text-center">{s.gf}</td>
                <td className="py-3 px-2 text-center">{s.gc}</td>
                <td className="py-3 px-2 text-center">
                  <span className={dg > 0 ? 'text-emerald-600 font-medium' : dg < 0 ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                    {dg > 0 ? `+${dg}` : dg}
                  </span>
                </td>
                <td className="py-3 px-2 text-center font-oswald font-bold text-base text-primary">{s.pts}</td>
                <td className="py-3 px-2 hidden md:table-cell">
                  <div className="flex gap-0.5 justify-center">
                    {s.form.slice(0, 5).map((r, ri) => (
                      <span key={ri} className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${FORM_COLORS[r]}`}>
                        {FORM_LABELS[r]}
                      </span>
                    ))}
                    {s.form.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Leyenda */}
      <div className="flex gap-4 mt-4 text-xs text-muted-foreground px-2 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 inline-block" /> Zona ascenso/campeón</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Zona descenso</span>
        <span>PJ=Jugados · PG=Ganados · PE=Empatados · PP=Perdidos · DG=Diferencia goles · Pts=Puntos</span>
      </div>
    </div>
  );
}