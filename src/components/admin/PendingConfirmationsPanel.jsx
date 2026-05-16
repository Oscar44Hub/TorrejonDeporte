import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { AlertCircle, ArrowRight, Mail, UserCheck, Users, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

// Umbral en días: ≥ EXPIRY_DAYS → caducado; ≥ WARN_DAYS → próximo a vencer
const EXPIRY_DAYS = 4;
const WARN_DAYS = 2;

function getUrgency(item) {
  if (!item.created_date) return 'normal';
  const days = differenceInDays(new Date(), new Date(item.created_date));
  if (days >= EXPIRY_DAYS) return 'expired';
  if (days >= WARN_DAYS) return 'warning';
  return 'normal';
}

function daysLeft(item) {
  if (!item.created_date) return null;
  const days = differenceInDays(new Date(), new Date(item.created_date));
  return EXPIRY_DAYS - days;
}

export default function PendingConfirmationsPanel() {
  const [data, setData] = useState({ delegates: [], referees: [], players: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('delegates');

  const load = async () => {
    setLoading(true);
    const [delegates, referees, players] = await Promise.all([
      base44.entities.Delegate.filter({ confirmed: false }),
      base44.entities.Referee.filter({ confirmed: false }),
      base44.entities.Player.filter({ confirmed: false }),
    ]);
    setData({ delegates, referees, players });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const total = data.delegates.length + data.referees.length + data.players.length;

  // Conteo de los que están próximos a vencer o ya vencidos (para la alerta global)
  const urgentCount = [...data.delegates, ...data.referees, ...data.players]
    .filter(item => getUrgency(item) !== 'normal').length;

  const tabs = [
    { key: 'delegates', label: 'Delegados', count: data.delegates.length, link: '/admin/delegados', icon: UserCheck },
    { key: 'referees',  label: 'Árbitros',  count: data.referees.length,  link: '/admin/arbitros',  icon: Users },
    { key: 'players',   label: 'Jugadores', count: data.players.length,   link: '/admin/equipos',   icon: Users },
  ];

  const currentItems = data[activeTab === 'delegates' ? 'delegates' : activeTab === 'referees' ? 'referees' : 'players'];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="font-oswald font-bold text-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Confirmaciones pendientes
          {total > 0 && (
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{total}</span>
          )}
          {urgentCount > 0 && (
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <Clock className="w-3 h-3" /> {urgentCount} próximos a vencer
            </span>
          )}
        </h2>
        <button onClick={load} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Alerta global si hay urgentes */}
          {urgentCount > 0 && (
            <div className="mx-6 mt-4 mb-2 flex items-start gap-2 bg-orange-50 border border-orange-300 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-800">
                <strong>{urgentCount} usuario{urgentCount > 1 ? 's' : ''}</strong> {urgentCount > 1 ? 'están' : 'está'} a punto de que su enlace de confirmación caduque (plazo: {EXPIRY_DAYS} días). Considera reenviar el email de confirmación.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-border mt-2">
            {tabs.map(tab => {
              const tabItems = data[tab.key === 'delegates' ? 'delegates' : tab.key === 'referees' ? 'referees' : 'players'];
              const tabUrgent = tabItems.filter(i => getUrgency(i) !== 'normal').length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-b-2 border-primary text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key ? 'bg-primary/15 text-primary' : 'bg-red-100 text-red-600'
                    }`}>{tab.count}</span>
                  )}
                  {tabUrgent > 0 && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />{tabUrgent}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* List */}
          {currentItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {total === 0 ? (
                <>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium">¡Todo confirmado!</p>
                  <p className="text-xs mt-1">No hay cuentas pendientes de verificar.</p>
                </>
              ) : (
                <p className="text-sm">Sin pendientes en esta categoría</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {[...currentItems].sort((a, b) => {
                const order = { expired: 0, warning: 1, normal: 2 };
                return order[getUrgency(a)] - order[getUrgency(b)];
              }).map(item => {
                const urgency = getUrgency(item);
                const left = daysLeft(item);
                const rowStyle =
                  urgency === 'expired' ? 'bg-red-50/60 border-l-4 border-l-red-400' :
                  urgency === 'warning' ? 'bg-orange-50/60 border-l-4 border-l-orange-400' : '';
                const avatarStyle =
                  urgency === 'expired' ? 'bg-red-200 text-red-700' :
                  urgency === 'warning' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-600';
                return (
                  <div key={item.id} className={`flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors ${rowStyle}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${avatarStyle}`}>
                      {item.full_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.full_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        {item.email || '—'}
                        {item.team_name && <span className="ml-1">· {item.team_name}</span>}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {urgency === 'expired' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Caducado
                        </span>
                      )}
                      {urgency === 'warning' && left !== null && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" /> {left}d restante{left !== 1 ? 's' : ''}
                        </span>
                      )}
                      {urgency === 'normal' && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          Sin confirmar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer link */}
          {currentItems.length > 0 && (
            <div className="px-6 py-3 border-t border-border bg-muted/20">
              <Link
                to={tabs.find(t => t.key === activeTab)?.link}
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                Gestionar {tabs.find(t => t.key === activeTab)?.label.toLowerCase()}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}