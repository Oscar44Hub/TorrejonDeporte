import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ResultadoInlineForm({ match, onSaved, onCancel }) {
  const [homeScore, setHomeScore] = useState(match.home_score ?? '');
  const [awayScore, setAwayScore] = useState(match.away_score ?? '');
  const [status, setStatus] = useState(match.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Match.update(match.id, {
      home_score: homeScore !== '' ? Number(homeScore) : null,
      away_score: awayScore !== '' ? Number(awayScore) : null,
      status,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-accent/30 border border-accent rounded-xl p-4 mt-2">
      <p className="text-xs font-semibold text-muted-foreground mb-3">REGISTRAR RESULTADO</p>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1 text-center truncate">{match.home_team_name}</p>
            <Input
              type="number" min="0" max="99"
              value={homeScore}
              onChange={e => setHomeScore(e.target.value)}
              className="text-center font-oswald font-bold text-xl h-12"
              placeholder="0"
            />
          </div>
          <span className="font-bold text-muted-foreground text-lg mt-4">—</span>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1 text-center truncate">{match.away_team_name}</p>
            <Input
              type="number" min="0" max="99"
              value={awayScore}
              onChange={e => setAwayScore(e.target.value)}
              className="text-center font-oswald font-bold text-xl h-12"
              placeholder="0"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 min-w-[160px]">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="programado">Programado</SelectItem>
              <SelectItem value="en_juego">En juego</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
              <SelectItem value="aplazado">Aplazado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onCancel} className="flex-1 gap-1">
              <X className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1 gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> {saving ? '...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}