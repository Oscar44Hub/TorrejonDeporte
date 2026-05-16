import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { AlertCircle, ArrowRight, Mail, UserCheck, Users, RefreshCw } from 'lucide-react';

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
        </h2>
        <button onClick={load} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : total === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm font-medium">¡Todo confirmado!</p>
          <p className="text-xs mt-1">No hay cuentas pendientes de verificar.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-border">
            {tabs.map(tab => (
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
              </button>
            ))}
          </div>

          {/* List */}
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {currentItems.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Sin pendientes en esta categoría
              </div>
            ) : currentItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs flex-shrink-0">
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
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  Sin confirmar
                </span>
              </div>
            ))}
          </div>

          {/* Footer link */}
          <div className="px-6 py-3 border-t border-border bg-muted/20">
            <Link
              to={tabs.find(t => t.key === activeTab)?.link}
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              Gestionar {tabs.find(t => t.key === activeTab)?.label.toLowerCase()}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}