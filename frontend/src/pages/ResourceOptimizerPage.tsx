import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, 
  LifeBuoy, 
  Zap, 
  Package, 
  PlayCircle, 
  CheckCircle2, 
  MapPin 
} from 'lucide-react';
import { optimizeResources } from '../services/api';
import { ResourceOptimizationResponse } from '../types';

export const ResourceOptimizerPage: React.FC = () => {
  const [ambulances, setAmbulances] = useState<number>(20);
  const [rescueBoats, setRescueBoats] = useState<number>(12);
  const [generators, setGenerators] = useState<number>(10);
  const [medicalKits, setMedicalKits] = useState<number>(30);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResourceOptimizationResponse | null>(null);

  const handleOptimize = useCallback(async () => {
    setLoading(true);
    try {
      const res = await optimizeResources({
        ambulances_available: ambulances,
        rescue_boats_available: rescueBoats,
        generators_available: generators,
        medical_kits_available: medicalKits
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ambulances, rescueBoats, generators, medicalKits]);

  useEffect(() => {
    handleOptimize();
  }, [handleOptimize]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100">Resource Pre-Positioning Optimizer</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Heuristic allocation model: distributing ambulances, amphibious rescue boats, generators, and trauma kits based on population exposure & cutoff latency.
          </p>
        </div>

        <button
          onClick={handleOptimize}
          disabled={loading}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
        >
          <PlayCircle className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'CALCULATING...' : 'RUN RESOURCE OPTIMIZER'}</span>
        </button>
      </div>

      {/* Available Fleet Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h2 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center space-x-2">
          <Package className="w-4 h-4 text-emerald-400" />
          <span>Total Regional Available Emergency Inventory</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Ambulances */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center space-x-1.5 font-semibold">
                <Truck className="w-4 h-4 text-red-400" />
                <span>ALS Ambulances</span>
              </span>
              <span className="font-mono font-bold text-red-400 text-sm">{ambulances}</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={ambulances}
              onChange={(e) => setAmbulances(Number(e.target.value))}
              className="w-full accent-red-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          {/* Rescue Boats */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center space-x-1.5 font-semibold">
                <LifeBuoy className="w-4 h-4 text-cyan-400" />
                <span>Rescue Boats</span>
              </span>
              <span className="font-mono font-bold text-cyan-400 text-sm">{rescueBoats}</span>
            </div>
            <input
              type="range"
              min="2"
              max="30"
              value={rescueBoats}
              onChange={(e) => setRescueBoats(Number(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          {/* Heavy Generators */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center space-x-1.5 font-semibold">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Mobile 500kVA Gensets</span>
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">{generators}</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              value={generators}
              onChange={(e) => setGenerators(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          {/* Medical Kits */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center space-x-1.5 font-semibold">
                <Package className="w-4 h-4 text-purple-400" />
                <span>Trauma Supply Kits</span>
              </span>
              <span className="font-mono font-bold text-purple-400 text-sm">{medicalKits}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={medicalKits}
              onChange={(e) => setMedicalKits(Number(e.target.value))}
              className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Optimization Score & Summary Banner */}
      {result && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {result.optimization_score}%
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">OPTIMIZED PRE-POSITIONING STRATEGY</div>
              <p className="text-xs text-slate-400">{result.deployment_summary}</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Latency Penalty Minimized: -24.5 min
          </span>
        </div>
      )}

      {/* Allocation Cards Grid */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {result.allocations.map((alloc) => (
            <div
              key={alloc.zone_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span>{alloc.zone_name}</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">{alloc.zone_id}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    alloc.risk_level === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : alloc.risk_level === 'HIGH'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  }`}
                >
                  {alloc.risk_level}
                </span>
              </div>

              {/* Resource Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Truck className="w-3.5 h-3.5 text-red-400" />
                    <span>Ambulances</span>
                  </span>
                  <span className="font-mono font-bold text-red-400 text-sm">{alloc.ambulances}</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <LifeBuoy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Boats</span>
                  </span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">{alloc.rescue_boats}</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gensets</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{alloc.generators}</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Package className="w-3.5 h-3.5 text-purple-400" />
                    <span>Med Kits</span>
                  </span>
                  <span className="font-mono font-bold text-purple-400 text-sm">{alloc.medical_kits}</span>
                </div>
              </div>

              {/* Allocation Rationale */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-xs">
                <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deployment Rationale</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {alloc.rationale}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
