export default function Clasificacion({ teams, matches }) {
  const approved = teams.filter(t => t.status === 'aprobado');

  // Build table from matches
  const table = approved.map(team => {
    const played = matches.filter(m => m.status === 'finalizado' && (m.home_team_id === team.id || m.away_team_id === team.id));
    let pts = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0;
    played.forEach(m => {
      const isHome = m.home_team_id === team.id;
      const ts = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
      const os = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
      gf += ts; ga += os;
      if (ts > os) { w++; pts += 3; }
      else if (ts === os) { d++; pts += 1; }
      else { l++; }
    });
    return { ...team, pts, w, d, l, gf, ga, gd: gf - ga, played: played.length };
  }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

  if (table.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No hay equipos aprobados en esta liga</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-8">#</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Equipo</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground">PJ</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground">G</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground">E</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground">P</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground">GF</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground">GC</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground">DG</th>
            <th className="text-center px-3 py-3 font-semibold text-primary font-bold">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {table.map((t, i) => (
            <tr key={t.id} className={`${i < 3 ? 'bg-primary/5' : 'bg-card'} hover:bg-muted/50 transition-colors`}>
              <td className="px-4 py-3 text-muted-foreground font-medium">{i + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {i === 0 && <span>🥇</span>}
                  {i === 1 && <span>🥈</span>}
                  {i === 2 && <span>🥉</span>}
                  <span className="font-semibold">{t.name}</span>
                </div>
              </td>
              <td className="px-3 py-3 text-center text-muted-foreground">{t.played}</td>
              <td className="px-3 py-3 text-center text-emerald-600 font-medium">{t.w}</td>
              <td className="px-3 py-3 text-center text-amber-600 font-medium">{t.d}</td>
              <td className="px-3 py-3 text-center text-red-500 font-medium">{t.l}</td>
              <td className="px-3 py-3 text-center">{t.gf}</td>
              <td className="px-3 py-3 text-center">{t.ga}</td>
              <td className="px-3 py-3 text-center text-muted-foreground">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
              <td className="px-3 py-3 text-center font-oswald font-bold text-primary text-lg">{t.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}