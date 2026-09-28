import React, { useState } from 'react';
import { Alert, RiskLevel } from '../types';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Users, 
  HeartPulse, 
  Zap, 
  Milestone, 
  Clock 
} from 'lucide-react';

interface AlertsPageProps {
  alerts: Alert[];
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ alerts }) => {
  const [filter, setFilter] = useState<string>('all');
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    return a.severity === filter;
  });

  const toggleAcknowledge = (id: string) => {
    setAcknowledged(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">Tactical Emergency Alerts Feed</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated threshold triggers: Generated when multi-hazard composite risk exceeds HIGH (≥60) or CRITICAL (≥80).
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-800 text-white border-slate-600'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
              filter === 'CRITICAL'
                ? 'bg-red-950 text-red-300 border-red-700'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Critical Only
          </button>
          <button
            onClick={() => setFilter('HIGH')}
            className={`px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
              filter === 'HIGH'
                ? 'bg-orange-950 text-orange-300 border-orange-700'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            High Threat
          </button>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
            No alerts matching the selected filter.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isAck = acknowledged[alert.id];
            const isCritical = alert.severity === 'CRITICAL';
            return (
              <div
                key={alert.id}
                className={`bg-slate-900 border rounded-xl p-5 shadow-xl transition space-y-3 ${
                  isAck ? 'opacity-60 border-slate-800' :
                  isCritical ? 'border-red-900/80 bg-red-950/10' : 'border-orange-900/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className={`p-1.5 rounded-lg ${
                      isCritical ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-orange-950 text-orange-400 border border-orange-800'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">{alert.title}</h3>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span>Zone: {alert.zone_id}</span>
                        <span>•</span>
                        <span>District: {alert.district}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1 font-mono text-[10px]">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{alert.created_at}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isCritical ? 'bg-red-950 text-red-300 border-red-700' : 'bg-orange-950 text-orange-300 border-orange-700'
                    }`}>
                      {alert.severity}
                    </span>
                    <button
                      onClick={() => toggleAcknowledge(alert.id)}
                      className={`px-3 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
                        isAck
                          ? 'bg-slate-800 text-emerald-400 border-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {isAck ? 'Acknowledged ✓' : 'Acknowledge'}
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {alert.message}
                </p>

                {/* Affected Summary Chips */}
                {alert.affected_summary && (
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                    {alert.affected_summary.population_exposed && (
                      <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 flex items-center space-x-1.5 text-blue-300 font-mono">
                        <Users className="w-3 h-3 text-blue-400" />
                        <span>{alert.affected_summary.population_exposed.toLocaleString()} exposed</span>
                      </span>
                    )}
                    {alert.affected_summary.hospitals_at_risk !== undefined && (
                      <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 flex items-center space-x-1.5 text-red-300 font-mono">
                        <HeartPulse className="w-3 h-3 text-red-400" />
                        <span>{alert.affected_summary.hospitals_at_risk} hospitals</span>
                      </span>
                    )}
                    {alert.affected_summary.power_stations_affected !== undefined && (
                      <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 flex items-center space-x-1.5 text-yellow-300 font-mono">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span>{alert.affected_summary.power_stations_affected} substations</span>
                      </span>
                    )}
                    {alert.affected_summary.roads_disrupted_km !== undefined && (
                      <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 flex items-center space-x-1.5 text-purple-300 font-mono">
                        <Milestone className="w-3 h-3 text-purple-400" />
                        <span>{alert.affected_summary.roads_disrupted_km} km disrupted</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Tactical Recommended Action Order */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                  <span className="font-bold text-amber-300 uppercase text-[10px] tracking-wider block mb-1">
                    Emergency Operational Order:
                  </span>
                  <div className="text-slate-200 text-[11px] leading-relaxed">
                    {alert.recommended_action}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
