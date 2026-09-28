import React from 'react';
import { Cyclone } from '../types';
import { 
  Wind, 
  Gauge, 
  CloudRain, 
  Waves, 
  Compass, 
  HelpCircle,
  PlayCircle
} from 'lucide-react';


import { RiskZone } from '../types';

interface CycloneSidebarProps {
  cyclone: Cyclone | null;
  onRunEmergencySimulation: () => void;
  isSimulating: boolean;
  selectedZone?: RiskZone | null;
  riskZones?: RiskZone[];
}

export const CycloneSidebar: React.FC<CycloneSidebarProps> = ({
  cyclone,
  onRunEmergencySimulation,
  isSimulating,
  selectedZone,
  riskZones
}) => {
  if (!cyclone) {
    return (
      <div className="w-80 bg-slate-900 border-r border-slate-800 p-4 text-slate-400 text-xs">
        Loading cyclone parameters...
      </div>
    );
  }

  // Calculate composite multi-hazard index dynamically from active scenario zone
  const activeZone = selectedZone || (riskZones && riskZones.length > 0 ? riskZones[0] : null);
  const floodRisk = activeZone ? activeZone.flood_risk : 88.5;
  const surgeRisk = activeZone ? activeZone.surge_risk : 91.0;
  const windRisk = activeZone ? activeZone.wind_risk : 82.0;
  const infraRisk = activeZone ? activeZone.infrastructure_risk : 85.0;
  const overallRisk = activeZone ? Math.round(activeZone.overall_risk) : Math.round(0.35 * floodRisk + 0.25 * surgeRisk + 0.20 * windRisk + 0.20 * infraRisk);

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto text-slate-200 text-xs select-none">
      {/* Cyclone Identity Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🌀</span>
            <div>
              <h2 className="font-bold text-sm text-slate-100">{cyclone.name}</h2>
              <div className="text-[11px] text-red-400 font-semibold">{cyclone.category}</div>
            </div>
          </div>
          <div className="px-2 py-1 rounded bg-red-950/80 border border-red-700/80 text-red-300 font-mono text-[11px] font-bold text-center">
            ETA: {cyclone.eta_hours}h
          </div>
        </div>

        <div className="mt-2.5 p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Eye Position:</span>
          <span className="font-mono text-slate-200 font-semibold">
            {cyclone.latitude.toFixed(2)}°N, {cyclone.longitude.toFixed(2)}°E
          </span>
        </div>
      </div>

      {/* Key Meteorological Parameters */}
      <div className="p-3.5 border-b border-slate-800 space-y-2.5">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Observed & Forecast Telemetry
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Wind Speed */}
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              <span>Max Wind</span>
            </div>
            <div className="text-sm font-bold text-slate-100 font-mono mt-1">
              {cyclone.wind_speed} <span className="text-[10px] text-slate-400 font-normal">km/h</span>
            </div>
          </div>

          {/* Central Pressure */}
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" />
              <span>Central Pressure</span>
            </div>
            <div className="text-sm font-bold text-slate-100 font-mono mt-1">
              {cyclone.pressure} <span className="text-[10px] text-slate-400 font-normal">hPa</span>
            </div>
          </div>

          {/* 24h Rainfall */}
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span>24h Rainfall</span>
            </div>
            <div className="text-sm font-bold text-slate-100 font-mono mt-1">
              {cyclone.rainfall} <span className="text-[10px] text-slate-400 font-normal">mm</span>
            </div>
          </div>

          {/* Peak Storm Surge */}
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>Peak Surge</span>
            </div>
            <div className="text-sm font-bold text-amber-300 font-mono mt-1">
              {cyclone.storm_surge} <span className="text-[10px] text-slate-400 font-normal">m</span>
            </div>
          </div>
        </div>

        {/* Motion Vector */}
        <div className="bg-slate-950/80 p-2 rounded border border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Translation:</span>
          </div>
          <div className="font-mono font-semibold text-slate-200">
            WNW (305°) at {cyclone.movement_speed} km/h
          </div>
        </div>
      </div>

      {/* Deterministic Risk Summary */}
      <div className="p-3.5 border-b border-slate-800 space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Risk Indices (0-100)
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
            CRITICAL
          </span>
        </div>

        {/* Overall Composite Score Meter */}
        <div className="bg-slate-950/90 p-2.5 rounded-lg border border-red-900/40">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-200">Overall Composite Impact</span>
            <span className="font-mono font-bold text-red-400 text-sm">{overallRisk} / 100</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-full"
              style={{ width: `${overallRisk}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
            <span>LOW (0-30)</span>
            <span>MED (30-60)</span>
            <span>HIGH (60-80)</span>
            <span>CRIT (80-100)</span>
          </div>
        </div>

        {/* Hazard Breakdown Bars */}
        <div className="space-y-2 pt-1 text-[11px]">
          <div>
            <div className="flex justify-between text-slate-300 mb-0.5">
              <span>Flood Susceptibility (35% weight)</span>
              <span className="font-mono font-semibold text-red-400">{floodRisk}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full rounded-full" style={{ width: `${floodRisk}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-0.5">
              <span>Storm Surge Susceptibility (25% weight)</span>
              <span className="font-mono font-semibold text-red-400">{surgeRisk}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full rounded-full" style={{ width: `${surgeRisk}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-0.5">
              <span>Wind Field Exposure (20% weight)</span>
              <span className="font-mono font-semibold text-amber-400">{windRisk}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${windRisk}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-0.5">
              <span>Infrastructure Exposure (20% weight)</span>
              <span className="font-mono font-semibold text-red-400">{infraRisk}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full rounded-full" style={{ width: `${infraRisk}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Simulation Call-to-action */}
      <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 space-y-2">
        <button
          onClick={onRunEmergencySimulation}
          disabled={isSimulating}
          className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-bold rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <PlayCircle className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'ADVANCING CYCLONE...' : 'RUN EMERGENCY SIMULATION'}</span>
        </button>

        <p className="text-[10px] text-slate-500 leading-tight text-center">
          Advances storm track, triggers flood backwater, recalculates road blockages, and notifies responders.
        </p>

        <div className="p-2 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400 flex items-start space-x-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>
            Prototype parameters. Does not replace IMD/CWC bulletins. For tactical simulation & exercise planning.
          </span>
        </div>
      </div>
    </aside>
  );
};
