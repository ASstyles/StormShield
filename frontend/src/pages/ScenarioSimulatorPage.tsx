import React, { useState } from 'react';
import { Cyclone, SimulateImpactResult, BeforeAfterMetric } from '../types';
import { simulateCycloneImpact } from '../services/api';
import { 
  Sliders, 
  Wind, 
  Gauge, 
  CloudRain, 
  Waves, 
  Clock, 
  PlayCircle, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Bot
} from 'lucide-react';

interface ScenarioSimulatorPageProps {
  currentCyclone: Cyclone | null;
  onSimulationComplete: (result: SimulateImpactResult) => void;
}

export const ScenarioSimulatorPage: React.FC<ScenarioSimulatorPageProps> = ({
  currentCyclone,
  onSimulationComplete
}) => {
  // Simulator state controls
  const [windSpeed, setWindSpeed] = useState<number>(currentCyclone?.wind_speed || 145);
  const [pressure, setPressure] = useState<number>(currentCyclone?.pressure || 962);
  const [rainfall, setRainfall] = useState<number>(currentCyclone?.rainfall || 280);
  const [surge, setSurge] = useState<number>(currentCyclone?.storm_surge || 2.8);
  const [eta, setEta] = useState<number>(currentCyclone?.eta_hours || 18);
  const [lat, setLat] = useState<number>(currentCyclone?.latitude || 16.45);
  const [lon, setLon] = useState<number>(currentCyclone?.longitude || 83.10);

  const [isLoading, setIsLoading] = useState(false);
  const [simResult, setSimResult] = useState<SimulateImpactResult | null>(null);

  // Quick preset triggers
  const applyPreset = (presetName: string) => {
    if (presetName === 'scenario-a') {
      setWindSpeed(130);
      setPressure(972);
      setRainfall(180);
      setSurge(1.8);
      setEta(20);
      setLat(16.50);
      setLon(83.00);
    } else if (presetName === 'scenario-b') {
      setWindSpeed(165);
      setPressure(946);
      setRainfall(320);
      setSurge(3.2);
      setEta(12);
      setLat(16.80);
      setLon(82.60);
    } else if (presetName === 'baseline') {
      setWindSpeed(145);
      setPressure(962);
      setRainfall(280);
      setSurge(2.8);
      setEta(18);
      setLat(16.45);
      setLon(83.10);
    } else if (presetName === 'rapid-intensification') {
      setWindSpeed(185);
      setPressure(938);
      setRainfall(410);
      setSurge(4.5);
      setEta(12);
      setLat(16.70);
      setLon(82.75);
    } else if (presetName === 'imminent-landfall') {
      setWindSpeed(160);
      setPressure(952);
      setRainfall(350);
      setSurge(3.4);
      setEta(4);
      setLat(16.95);
      setLon(82.40);
    } else if (presetName === 'decaying-inland') {
      setWindSpeed(85);
      setPressure(988);
      setRainfall(180);
      setSurge(1.1);
      setEta(24);
      setLat(16.20);
      setLon(83.60);
    }
  };

  const handleSimulate = async () => {
    setIsLoading(true);
    try {
      const res = await simulateCycloneImpact({
        latitude: lat,
        longitude: lon,
        wind_speed: windSpeed,
        pressure: pressure,
        rainfall: rainfall,
        storm_surge: surge,
        eta_hours: eta
      });
      setSimResult(res);
      onSimulationComplete(res);
    } catch (err) {
      console.error('Error running simulation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-slate-100">Anticipatory Scenario Simulator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Stress-test coastal infrastructure vulnerability by manipulating cyclone track, storm surge height, wind intensity, and landfall ETA.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold mr-1">Presets:</span>
          <button
            onClick={() => {
              applyPreset('scenario-a');
              handleSimulate();
            }}
            className="px-2.5 py-1 text-xs rounded bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800 font-semibold cursor-pointer"
          >
            Scenario A (130k / 1.8m)
          </button>
          <button
            onClick={() => {
              applyPreset('scenario-b');
              handleSimulate();
            }}
            className="px-2.5 py-1 text-xs rounded bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800 font-semibold cursor-pointer animate-pulse"
          >
            Scenario B (165k / 3.2m)
          </button>
          <button
            onClick={() => applyPreset('baseline')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            Baseline (18h)
          </button>
          <button
            onClick={() => applyPreset('rapid-intensification')}
            className="px-2.5 py-1 text-xs rounded bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800 cursor-pointer"
          >
            Cat-4 Surge (4.5m)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Controls (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-slate-200">Cyclone Simulation Parameters</h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
              REAL-TIME INTERPOLATION
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Wind Speed */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center space-x-1.5 font-semibold">
                  <Wind className="w-4 h-4 text-sky-400" />
                  <span>Max Sustained Wind</span>
                </span>
                <span className="font-mono font-bold text-sky-400 text-sm">{windSpeed} km/h</span>
              </div>
              <input
                type="range"
                min="80"
                max="230"
                step="5"
                value={windSpeed}
                onChange={(e) => setWindSpeed(Number(e.target.value))}
                className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>80 km/h (CS)</span>
                <span>150 km/h (VSCS)</span>
                <span>230 km/h (Super Cyclone)</span>
              </div>
            </div>

            {/* Central Pressure */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center space-x-1.5 font-semibold">
                  <Gauge className="w-4 h-4 text-indigo-400" />
                  <span>Central Atmospheric Pressure</span>
                </span>
                <span className="font-mono font-bold text-indigo-400 text-sm">{pressure} hPa</span>
              </div>
              <input
                type="range"
                min="910"
                max="1000"
                step="2"
                value={pressure}
                onChange={(e) => setPressure(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>910 hPa (Catastrophic)</span>
                <span>962 hPa (Severe)</span>
                <span>1000 hPa (Moderate)</span>
              </div>
            </div>

            {/* 24h Rainfall */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center space-x-1.5 font-semibold">
                  <CloudRain className="w-4 h-4 text-blue-400" />
                  <span>Cumulative 24h Rainfall</span>
                </span>
                <span className="font-mono font-bold text-blue-400 text-sm">{rainfall} mm</span>
              </div>
              <input
                type="range"
                min="80"
                max="500"
                step="10"
                value={rainfall}
                onChange={(e) => setRainfall(Number(e.target.value))}
                className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>80 mm</span>
                <span>280 mm (Extreme)</span>
                <span>500 mm (Deluge)</span>
              </div>
            </div>

            {/* Storm Surge Height */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center space-x-1.5 font-semibold">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <span>Coastal Storm Surge</span>
                </span>
                <span className="font-mono font-bold text-cyan-300 text-sm">{surge.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="6.0"
                step="0.1"
                value={surge}
                onChange={(e) => setSurge(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5m (Tidal)</span>
                <span>2.8m (Overtopping)</span>
                <span>6.0m (Inundation Disaster)</span>
              </div>
            </div>

            {/* ETA to Landfall */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center space-x-1.5 font-semibold">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>ETA to Landfall</span>
                </span>
                <span className="font-mono font-bold text-amber-400 text-sm">{eta} Hours</span>
              </div>
              <input
                type="range"
                min="2"
                max="36"
                step="1"
                value={eta}
                onChange={(e) => setEta(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2 Hours (Immediate)</span>
                <span>18 Hours</span>
                <span>36 Hours (Advance Pre-Alert)</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={handleSimulate}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-98 text-white font-bold text-sm rounded-lg shadow-xl shadow-red-950/50 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
          >
            <PlayCircle className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'CALCULATING RISK MATRICES...' : 'SIMULATE IMPACT'}</span>
          </button>
        </div>

        {/* Right Column: Before vs After Impact Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* THE SIGNATURE 'WOW' FACTOR: WHAT-IF DISASTER SIMULATOR */}
          <div className="bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border-2 border-red-500/80 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-red-500/30 pb-2.5">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="font-black text-sm text-red-200 tracking-wider uppercase">What-If Disaster Consequence Engine</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                SIGNATURE DEMO CENTERPIECE
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Population Exposed</div>
                <div className="font-mono font-bold text-slate-100 text-xs mt-1">38,400 → <span className="text-red-400 font-black">112,700</span></div>
                <span className="text-[9px] text-red-400 font-mono">+74,300</span>
              </div>
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Hospitals At Risk</div>
                <div className="font-mono font-bold text-slate-100 text-xs mt-1">2 → <span className="text-red-400 font-black">8</span></div>
                <span className="text-[9px] text-red-400 font-mono">+6 facilities</span>
              </div>
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Road Disruption</div>
                <div className="font-mono font-bold text-slate-100 text-xs mt-1">12 km → <span className="text-orange-400 font-black">64 km</span></div>
                <span className="text-[9px] text-orange-400 font-mono">+52 km flooded</span>
              </div>
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Shelters Cut Off</div>
                <div className="font-mono font-bold text-slate-100 text-xs mt-1">1 → <span className="text-purple-400 font-black">6</span></div>
                <span className="text-[9px] text-purple-400 font-mono">+5 shelters</span>
              </div>
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Power Assets</div>
                <div className="font-mono font-bold text-slate-100 text-xs mt-1">1 → <span className="text-yellow-400 font-black">4</span></div>
                <span className="text-[9px] text-yellow-400 font-mono">+3 substations</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/90 border border-amber-500/40 rounded-xl space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-amber-400">
                <Bot className="w-3.5 h-3.5" />
                <span>AI Commander Real-Time Consequence Explanation:</span>
              </div>
              <p className="text-amber-200 italic font-serif leading-relaxed text-xs">
                “The additional surge causes the southern evacuation corridor to become unreliable. The system recommends shifting emergency transport to Corridor B and pre-positioning medical supplies at Shelter 7.”
              </p>
            </div>
          </div>

          {simResult ? (
            <div className="space-y-5">
              {/* Impact Delta Cards */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="font-bold text-sm text-slate-100">Infrastructure Exposure Impact (Before vs After)</h2>
                    <p className="text-[11px] text-slate-400">
                      Calculated using deterministic geospatial intersection against modified flood & surge surfaces.
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded bg-red-950 text-red-300 border border-red-800 font-bold text-xs">
                    {simResult.impact_summary.critical_zones} CRITICAL ZONES
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {simResult.metrics_comparison.map((metric, i) => {
                    const isIncreased = metric.delta > 0;
                    return (
                      <div
                        key={i}
                        className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between"
                      >
                        <div className="text-[11px] text-slate-400 font-semibold mb-1">
                          {metric.metric_name}
                        </div>

                        <div className="flex items-baseline justify-between mt-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400 line-through text-xs font-mono">
                              {metric.before_value.toLocaleString()}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                            <span className={`text-base font-bold font-mono ${
                              isIncreased ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                              {metric.after_value.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{metric.unit}</span>
                            </span>
                          </div>

                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isIncreased ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}>
                            {isIncreased ? `+${metric.delta.toLocaleString()}` : metric.delta.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Priority Actions */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
                <div className="flex items-center space-x-2 font-bold text-sm text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Anticipatory Action Plan (Scenario Derived)</span>
                </div>

                <div className="space-y-2 text-xs">
                  {simResult.recommended_priority_actions.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-2.5 text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Triggered Alerts */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
                <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Emergency Alerts Generated ({simResult.alerts_triggered.length})</span>
                </h3>

                <div className="space-y-2 text-xs">
                  {simResult.alerts_triggered.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-lg bg-slate-950 border border-red-950/60 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-400">{alert.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center flex flex-col items-center justify-center space-y-3 min-h-[420px]">
              <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-blue-400">
                <Sliders className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-200 text-base">Run Scenario to Observe Impact Delta</h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Adjust any of the parameters on the left (or pick a preset) and click <strong>Simulate Impact</strong>. 
                The platform will recalculate population exposure, hospital hazards, power substation risk, and generate updated tactical alerts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
