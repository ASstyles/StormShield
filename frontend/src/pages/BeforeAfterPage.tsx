import React, { useState, useEffect, useCallback } from 'react';
import { 
  Split, 
  ShieldCheck, 
  AlertTriangle, 
  HeartPulse, 
  Navigation, 
  Clock, 
  Zap, 
  Home, 
  CheckCircle2, 
  Info
} from 'lucide-react';
import { fetchBeforeAfterIntervention } from '../services/api';
import { BeforeAfterIntervention } from '../types';

export const BeforeAfterPage: React.FC = () => {
  const [data, setData] = useState<BeforeAfterIntervention | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchBeforeAfterIntervention();
      setData(res);
    } catch (err) {
      console.error('Failed to load before/after intervention data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading simulated intervention comparison...
      </div>
    );
  }

  const before = data.before_intervention;
  const after = data.after_intervention;
  const diff = data.improvements;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Split className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-100">Anticipatory Intervention Simulator: Before vs After</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulating the quantitative consequence reduction achieved by acting before landfall rather than post-disaster response.
          </p>
        </div>

        {/* Prototype Transparency Notice */}
        <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-300 text-xs">
          <Info className="w-4 h-4 shrink-0" />
          <span className="font-semibold">Simulated Scenario Results — Prototype Decision Support</span>
        </div>
      </div>

      {/* Summary Headline Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Hospitals Saved From Isolation</div>
          <div className="text-2xl font-black text-emerald-400 flex items-center space-x-2">
            <span>+{diff.hospitals_saved_from_isolation}</span>
            <span className="text-xs text-slate-400 font-normal">facilities</span>
          </div>
          <p className="text-[10px] text-slate-500">8 isolated → reduced to 3 via bypass causeways</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Ambulance Latency Saved</div>
          <div className="text-2xl font-black text-emerald-400 flex items-center space-x-2">
            <span>-{diff.response_time_saved_mins}</span>
            <span className="text-xs text-slate-400 font-normal">minutes</span>
          </div>
          <p className="text-[10px] text-slate-500">42 min response cut to 27 min via early diversion</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Lifeline Road Restored</div>
          <div className="text-2xl font-black text-emerald-400 flex items-center space-x-2">
            <span>+{diff.road_access_restored_km}</span>
            <span className="text-xs text-slate-400 font-normal">km</span>
          </div>
          <p className="text-[10px] text-slate-500">64 km blocked reduced to 14.5 km protected</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Power Grid Continuity</div>
          <div className="text-2xl font-black text-emerald-400 flex items-center space-x-2">
            <span>+{diff.power_continuity_gain_pct}%</span>
          </div>
          <p className="text-[10px] text-slate-500">Sandbag berms prevent 3 substation catastrophic trips</p>
        </div>
      </div>

      {/* Side-by-Side Comparison Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: BEFORE INTERVENTION */}
        <div className="bg-slate-900/90 border-2 border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-red-300">BEFORE INTERVENTION</h2>
                <span className="text-[10px] text-red-400 font-mono">Unmitigated Cyclone Landfall Footprint</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30">
              Vulnerability: {before.unmitigated_risk_index}/100
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-2">
                <HeartPulse className="w-4 h-4 text-red-400" />
                <span>Hospitals Isolated by Flood Cutoffs</span>
              </span>
              <span className="font-mono text-sm font-bold text-red-400">{before.hospitals_isolated} Facilities</span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-orange-400" />
                <span>Road Network Blocked / Impassable</span>
              </span>
              <span className="font-mono text-sm font-bold text-orange-400">{before.roads_blocked_km} km</span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Emergency Ambulance Response Time</span>
              </span>
              <span className="font-mono text-sm font-bold text-amber-400">{before.emergency_response_time_mins} minutes</span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>High-Voltage Substations Tripped</span>
              </span>
              <span className="font-mono text-sm font-bold text-yellow-400">{before.power_substations_failed} Substations</span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-2">
                <Home className="w-4 h-4 text-purple-400" />
                <span>Cyclone Shelters Inaccessible</span>
              </span>
              <span className="font-mono text-sm font-bold text-purple-400">{before.critical_shelters_inaccessible} Shelters</span>
            </div>
          </div>
        </div>

        {/* RIGHT: AFTER AI-RECOMMENDED ACTIONS */}
        <div className="bg-slate-900/90 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-emerald-300">AFTER AI-RECOMMENDED ACTIONS</h2>
                <span className="text-[10px] text-emerald-400 font-mono">Anticipatory Execution (T-18h to T-6h)</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              Vulnerability: {after.mitigated_risk_index}/100 (-44%)
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-300 flex items-center space-x-2">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                <span>Hospitals Isolated by Flood Cutoffs</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-slate-500 line-through">8</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{after.hospitals_isolated} Facilities</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-300 flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span>Road Network Blocked / Impassable</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-slate-500 line-through">64 km</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{after.roads_blocked_km} km</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-300 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Emergency Ambulance Response Time</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-slate-500 line-through">42 min</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{after.emergency_response_time_mins} minutes</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-300 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>High-Voltage Substations Tripped</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-slate-500 line-through">4</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{after.power_substations_failed} Substation</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-300 flex items-center space-x-2">
                <Home className="w-4 h-4 text-emerald-400" />
                <span>Cyclone Shelters Inaccessible</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-slate-500 line-through">6</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{after.critical_shelters_inaccessible} Shelter</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Key Interventions Applied */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Key Anticipatory Interventions Modeled</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.key_interventions.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start space-x-2.5 text-xs text-slate-300"
            >
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">
                {idx + 1}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
