import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { X, Star, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function MatchTeamReviewDialog({ match, report, team, onClose, onSaved }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('delegado');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [acceptsResult, setAcceptsResult] = useState(true);
  const [protestReason, setProtestReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!signerName.trim() || rating === 0) {
      toast({ title: 'Completa los campos obligatorios', description: 'Nombre del firmante y valoración son requeridos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    await base44.entities.MatchTeamReview.create({
      match_id: match.id,
      match_report_id: report?.id || null,
      team_id: team.id,
      team_name: team.name,
      signer_name: signerName.trim(),
      signer_role: signerRole,
      referee_rating: rating,
      comment: comment.trim(),
      accepts_result: acceptsResult,
      protest_reason: acceptsResult ? '' : protestReason.trim(),
      status: 'pendiente',
      league_id: match.league_id,
      league_name: match.league_name,
      referee_name: match.referee || report?.referee || '',
      match_date: match.match_date,
    });
    toast({ title: 'Firma registrada', description: 'Tu valoración ha sido enviada para revisión' });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-oswald font-bold text-xl">Firma del Acta</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{team.name} · {match.home_team_name} vs {match.away_team_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Resultado */}
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Resultado del partido</p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-semibold text-sm">{match.home_team_name}</span>
              <div className="font-oswald font-bold text-2xl bg-card border border-border rounded-lg px-4 py-1">
                {match.home_score ?? 0} — {match.away_score ?? 0}
              </div>
              <span className="font-semibold text-sm">{match.away_team_name}</span>
            </div>
            {match.referee && <p className="text-xs text-muted-foreground mt-2">Árbitro: {match.referee}</p>}
          </div>

          {/* Firmante */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Nombre del firmante *</label>
              <input
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="Capitán o delegado"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Rol</label>
              <select
                value={signerRole}
                onChange={e => setSignerRole(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="capitan">Capitán</option>
                <option value="delegado">Delegado</option>
              </select>
            </div>
          </div>

          {/* Valoración árbitro */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Valoración del árbitro *</label>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`w-8 h-8 transition-colors ${
                    n <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'
                  }`} />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm font-semibold ml-2">{rating}/5</span>
              )}
            </div>
          </div>

          {/* Comentario */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Comentario sobre el árbitro</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Observaciones sobre la actuación arbitral..."
              rows={3}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* Aceptar resultado */}
          <div className="border border-border rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">¿Acepta el resultado?</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAcceptsResult(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    acceptsResult ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}>
                  <CheckCircle2 className="w-4 h-4" /> Sí
                </button>
                <button
                  onClick={() => setAcceptsResult(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !acceptsResult ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}>
                  <AlertTriangle className="w-4 h-4" /> Protesta
                </button>
              </div>
            </div>
            {!acceptsResult && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Motivo de la protesta</label>
                <textarea
                  value={protestReason}
                  onChange={e => setProtestReason(e.target.value)}
                  placeholder="Describe el motivo de la protesta..."
                  rows={2}
                  className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-red-300 resize-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <button onClick={onClose}
            className="flex-1 py-2 border border-input rounded-lg text-sm hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? 'Firmando...' : 'Firmar acta'}
          </button>
        </div>
      </div>
    </div>
  );
}