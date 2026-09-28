import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  Building, 
  Truck, 
  Users, 
  Zap, 
  HeartPulse,
  Activity,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';
import { fetchActionClock } from '../services/api';
import { ActionClockStage } from '../types';

export const ActionClockPage: React.FC = () => {
  const [stages, setStages] = useState<ActionClockStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<ActionClockStage | null>(null);
  const [filterUrgency, setFilterUrgency] = useState<string>('all');

  useEffect(() => {
    loadActionClock();
  }, []);

  const loadActionClock = async () => {
    try {
      const data = await fetchActionClock();
      setStages(data);
      if (data.length > 0) {
        // Default select active or T-18h stage
        const active = data.find(s => s.status === 'ACTIVE_NOW') || data[1];
        setSelectedStage(active);
      }
    } catch (err) {
      console.error('Failed to load action clock:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStages = stages.filter(s => {
    if (filterUrgency === 'all') return true;
    return s.urgency === filterUrgency;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">Anticipatory Action Clock</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Phased multi-agency operational timeline: moving disaster response from post-event relief to pre-landfall mitigation.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">T - 18h Window Active</span>
          </div>
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="bg-transparent text-slate-300 text-xs px-2 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value="all">All Urgency Levels</option>
              <option value="MAXIMUM">Maximum (T-3h, Landfall)</option>
              <option value="CRITICAL">Critical (T-12h, T-6h)</option>
              <option value="HIGH">High (T-24h, T-18h)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Horizontal Phase Timeline Ribbon */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between min-w-[750px] relative">
          {/* Connector Line */}
          <div className="absolute top-5 left-8 right-8 h-1 bg-slate-800 z-0" />

          {stages.map((stage, idx) => {
            const isSelected = selectedStage?.time_id === stage.time_id;
            const isExecuted = stage.status === 'COMPLETED';
            const isActive = stage.status === 'ACTIVE_NOW';

            return (
              <button
                key={stage.time_id}
                onClick={() => setSelectedStage(stage)}
                className="relative z-10 flex flex-col items-center group cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30 scale-110 shadow-lg'
                      : isActive
                      ? 'bg-red-600 text-white ring-4 ring-red-500/30 animate-pulse'
                      : isExecuted
                      ? 'bg-emerald-950 border-2 border-emerald-500 text-emerald-400'
                      : 'bg-slate-800 border-2 border-slate-700 text-slate-400 group-hover:border-slate-500'
                  }`}
                >
                  {isExecuted ? <CheckCircle2 className="w-5 h-5" /> : stage.time_id}
                </div>
                <span className="mt-2 text-xs font-bold text-slate-200">{stage.label}</span>
                <span className="text-[10px] text-slate-400 font-mono uppercase">{stage.phase}</span>
                <span
                  className={`mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                    stage.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : stage.status === 'ACTIVE_NOW'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {stage.status_badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Window Deep-Dive */}
      {selectedStage && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Directives & Actions (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold text-xs">
                    {selectedStage.label}
                  </span>
                  <h2 className="text-base font-bold text-slate-100">{selectedStage.title}</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Phase: <span className="font-semibold text-slate-300 uppercase">{selectedStage.phase}</span> • Target Window: <span className="font-mono text-slate-300">{selectedStage.window_hours}h prior to landfall</span>
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedStage.urgency === 'MAXIMUM'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                    : selectedStage.urgency === 'CRITICAL'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                }`}
              >
                {selectedStage.urgency} URGENCY
              </span>
            </div>

            {/* Directives List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Mandatory Operational Directives</span>
              </h3>
              <div className="space-y-2.5">
                {selectedStage.directives.map((dir, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start space-x-3 hover:border-slate-700 transition"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {dir}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Assets Affected */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center space-x-2">
                <Building className="w-4 h-4 text-sky-400" />
                <span>Primary Target Facilities & Lifelines</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedStage.target_assets.map((asset, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-medium flex items-center space-x-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span>{asset}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Responsible Agencies & Execution Checklist (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Responsible Agencies Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Inter-Agency Coordination</span>
              </h3>
              <div className="space-y-2">
                {selectedStage.responsible_agencies.map((agency, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center space-x-2 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{agency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Timeline Logic Brief */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
              <div className="font-bold text-slate-200 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>Anticipatory Timing Justification</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Gale-force winds exceeding 65 km/h render civilian transport buses inoperable past T-8h. 
                Evacuating before T-12h ensures zero highway traffic bottlenecks and prevents ambulances from being trapped on flooded causeways.
              </p>
              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-blue-300 text-[11px] font-mono">
                Model: StormShield Lead-Time Optimization Engine
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
