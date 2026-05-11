import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, Star, Trophy, TrendingUp, MessageSquare, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardArbitro() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const refName = user.full_name;
      const [allMatches, allReviews] = await Promise.all([
        base44.entities.Match.filter({ referee: refName }),
        base44.entities.MatchTeamReview.filter({ referee_name: refName }),
      ]);
      setMatches(allMatches);
      setReviews(allReviews);
      setLoading(false);
    };
    load();
  }, [user]);

  const now = new Date();
  const upcoming = matches.filter(m => m.status === 'programado' && m.match_date && new Date(m.match_date) > now);
  const finished = matches.filter(m => m.status === 'finalizado');
  const avgRating = reviews.filter(r => r.referee_rating).length > 0
    ? (reviews.reduce((s, r) => s + (r.referee_rating || 0), 0) / reviews.filter(r => r.referee_rating).length).toFixed(1)
    : '—';

  const pendingReviews = reviews.filter(r => r.status === 'pendiente');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-oswald font-bold text-3xl text-foreground">Mi Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Bienvenido, {user?.full_name}</p>
        </div>
        <div className="bg-[hsl(272,35%,14%)] rounded-xl px-4 py-2 text-center">
          <p className="text-[hsl(44,95%,55%)] text-xs font-semibold uppercase tracking-wide">Árbitro</p>
          <p className="text-white text-sm font-bold">{user?.full_name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Partidos arbitrados', value: loading ? '...' : finished.length, icon: Trophy, color: 'text-primary' },
          { label: 'Próximos partidos', value: loading ? '...' : upcoming.length, icon: Calendar, color: 'text-blue-600' },
          { label: 'Valoración media', value: loading ? '...' : avgRating, icon: Star, color: 'text-amber-500' },
          { label: 'Valoraciones recibidas', value: loading ? '...' : reviews.length, icon: MessageSquare, color: 'text-emerald-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <p className="font-oswald font-bold text-2xl">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Próximos partidos */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-oswald font-bold text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Próximos partidos
            </h2>
            <Link to="/arbitro/partidos" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay partidos próximos</p>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 4).map(m => (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{m.home_team_name} vs {m.away_team_name}</p>
                    <p className="text-xs text-muted-foreground">{m.league_name}</p>
                    {m.venue && <p className="text-xs text-muted-foreground">📍 {m.venue}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-primary">{format(new Date(m.match_date), "EEE d MMM", { locale: es })}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(m.match_date), 'HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas valoraciones */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-oswald font-bold text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> Últimas valoraciones
            </h2>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay valoraciones aún</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 4).map(r => (
                <div key={r.id} className="p-3 bg-muted/40 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{r.team_name}</span>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={`w-3.5 h-3.5 ${n <= (r.referee_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground italic">"{r.comment}"</p>}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{r.league_name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      r.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                      r.status === 'verificado_admin' ? 'bg-blue-100 text-blue-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {r.status === 'pendiente' ? 'Pendiente' : r.status === 'verificado_admin' ? 'Verificado' : 'Corroborado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pendientes de respuesta */}
      {pendingReviews.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4" /> {pendingReviews.length} valoración(es) pendiente(s) de revisión
          </h3>
          <div className="space-y-2">
            {pendingReviews.map(r => (
              <div key={r.id} className="bg-white border border-amber-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{r.team_name}</span>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-3 h-3 ${n <= (r.referee_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-xs text-muted-foreground mt-1">"{r.comment}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}