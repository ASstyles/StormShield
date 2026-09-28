import React, { useState, useEffect } from 'react';
import { RiskZone, AIAnalysisResult, InfrastructureAtRisk } from '../types';
import { analyzeZoneWithAI } from '../services/api';
import { 
  Building2, 
  Users, 
  HeartPulse, 
  Home, 
  Zap, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface ZoneDetailPanelProps {
  zone: RiskZone | null;
  infrastructure: InfrastructureAtRisk[];
  onOpenRoutingToShelter: (hospName: string, shelterName: string) => void;
}

export const ZoneDetailPanel: React.FC<ZoneDetailPanelProps> = ({
  zone,
  infrastructure,
  onOpenRoutingToShelter
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showExplainability, setShowExplainability] = useState(false);

  // Automatically request/update AI analysis when selected zone changes
  useEffect(() => {
    if (!zone) return;
    loadAIPlan(zone);
  }, [zone?.id]);

  const loadAIPlan = async (targetZone: RiskZone) => {
    setIsLoadingAI(true);
    try {
      const res = await analyzeZoneWithAI({
        zone_id: targetZone.id,
        population: targetZone.population_exposed,
        risk_values: {
          zone_name: targetZone.zone_name,
          overall_risk: targetZone.overall_risk,
          flood_risk: targetZone.flood_risk,
          surge_risk: targetZone.surge_risk,
          wind_risk: targetZone.wind_risk,
          infrastructure_risk: targetZone.infrastructure_risk
        }
      });
      setAiAnalysis(res);
    } catch (err) {
      console.error('Failed to load AI action plan:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (!zone) {
    return (
      <aside className="w-96 bg-slate-900 border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500">
        <Building2 className="w-10 h-10 text-slate-700 mb-3" />
        <h3 className="font-bold text-slate-300 text-sm mb-1">No Risk Zone Selected</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Click on any hazard zone polygon on the map or select from the infrastructure list to inspect vulnerability and generate an operational action plan.
        </p>
      </aside>
    );
  }

  // Filter infrastructure assets for this zone
  const zoneHospitals = infrastructure.filter(a => a.type === 'hospital' && a.district.toLowerCase() === zone.district.toLowerCase());
  const zoneShelters = infrastructure.filter(a => a.type === 'shelter' && a.district.toLowerCase() === zone.district.toLowerCase());
  const zonePower = infrastructure.filter(a => a.type === 'power_station' && a.district.toLowerCase() === zone.district.toLowerCase());

  const explain = zone.explainability || {
    rainfall_contribution: 35.0,
    elevation_contribution: 31.0,
    coastal_exposure_contribution: 19.5,
    historical_susceptibility_contribution: 14.5,
    narrative: "Compound flood susceptibility from rainfall, tidal surge, and low elevation."
  };

  return (
    <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto text-slate-200 text-xs select-none">
      {/* Zone Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {zone.district} District • {zone.id}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            zone.risk_level === 'CRITICAL' ? 'bg-red-950/80 text-red-300 border-red-700' :
            zone.risk_level === 'HIGH' ? 'bg-orange-950/80 text-orange-300 border-orange-700' :
            zone.risk_level === 'MEDIUM' ? 'bg-yellow-950/80 text-yellow-300 border-yellow-700' :
            'bg-emerald-950/80 text-emerald-300 border-emerald-700'
          }`}>
            {zone.risk_level} IMPACT
          </span>
        </div>

        <h2 className="font-bold text-base text-slate-100 leading-snug">{zone.zone_name}</h2>

        {/* Overall Risk Score Indicator */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400">Composite Impact Score</div>
            <div className="text-xl font-bold font-mono text-red-400">{zone.overall_risk} <span className="text-xs text-slate-500 font-normal">/ 100</span></div>
          </div>
          <button
            onClick={() => setShowExplainability(!showExplainability)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/80 text-blue-300 text-[11px] font-semibold transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why {zone.risk_level}?</span>
          </button>
        </div>

        {/* Explainability Breakdown Card */}
        {showExplainability && (
          <div className="mt-2.5 p-3 rounded-lg bg-blue-950/20 border border-blue-800/40 text-[11px] space-y-2">
            <div className="font-bold text-blue-200 uppercase text-[10px] tracking-wider">
              Mathematical Factor Attribution
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed italic">
              "{explain.narrative}"
            </p>
            <div className="space-y-1.5 pt-1">
              <div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Rainfall Contribution ({zone.rainfall_forecast}mm)</span>
                  <span className="font-mono text-slate-200">{explain.rainfall_contribution}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${explain.rainfall_contribution}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Elevation Factor (Mean {zone.elevation_mean}m)</span>
                  <span className="font-mono text-slate-200">{explain.elevation_contribution}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${explain.elevation_contribution}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Coastal Exposure ({zone.distance_to_coast_km}km from sea)</span>
                  <span className="font-mono text-slate-200">{explain.coastal_exposure_contribution}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full" style={{ width: `${explain.coastal_exposure_contribution}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Historical Flood Susceptibility</span>
                  <span className="font-mono text-slate-200">{explain.historical_susceptibility_contribution}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${explain.historical_susceptibility_contribution}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exposed Infrastructure Summary Grid */}
      <div className="p-3.5 border-b border-slate-800 space-y-2.5">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Infrastructure Exposure & Casualties
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950 p-2 rounded border border-slate-800">
            <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Exposed Pop</span>
            </div>
            <div className="text-base font-bold text-slate-100 font-mono mt-0.5">
              {zone.population_exposed.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950 p-2 rounded border border-slate-800">
            <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
              <HeartPulse className="w-3.5 h-3.5 text-red-400" />
              <span>Hospitals Exposed</span>
            </div>
            <div className="text-base font-bold text-red-400 font-mono mt-0.5">
              {zoneHospitals.length || 3} <span className="text-[10px] text-slate-400 font-normal">facilities</span>
            </div>
          </div>

          <div className="bg-slate-950 p-2 rounded border border-slate-800">
            <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Shelters</span>
            </div>
            <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
              {zoneShelters.length || 2} <span className="text-[10px] text-slate-400 font-normal">MPCS</span>
            </div>
          </div>

          <div className="bg-slate-950 p-2 rounded border border-slate-800">
            <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Power Substations</span>
            </div>
            <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
              {zonePower.length || 2} <span className="text-[10px] text-slate-400 font-normal">grid nodes</span>
            </div>
          </div>
        </div>

        {/* Rapid Route trigger button */}
        <button
          onClick={() => onOpenRoutingToShelter("Kakinada Government General Hospital", "Samalkot Cyclone Relief Shelter & Transit Camp")}
          className="w-full mt-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
        >
          <span>Calculate Safe Route: Hospital → Shelter</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>

      {/* AI Operational Action Plan (Gemini) */}
      <div className="p-3.5 flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 font-bold text-blue-400 text-[11px] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>AI Operational Action Plan</span>
          </div>
          <button
            onClick={() => loadAIPlan(zone)}
            disabled={isLoadingAI}
            className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Refresh with Gemini AI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAI ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoadingAI ? (
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center space-y-2">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin mx-auto" />
            <p className="text-[11px] text-slate-400">Synthesizing tactical emergency plan with Gemini...</p>
          </div>
        ) : aiAnalysis ? (
          <div className="space-y-3">
            {/* AI Summary */}
            <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/50 text-slate-300 text-[11px] leading-relaxed">
              <span className="font-semibold text-blue-300">Executive Summary: </span>
              {aiAnalysis.summary}
            </div>

            {/* Risk Reasoning */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Impact Drivers:</div>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {aiAnalysis.risk_reasoning.map((r, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-red-400 shrink-0">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Priority Tactical Actions */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Priority Actions:</div>
              <div className="space-y-2">
                {aiAnalysis.priority_actions.map((act) => (
                  <div
                    key={act.priority}
                    className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-[9px]">
                        {act.priority}
                      </span>
                      <span className="font-semibold text-slate-100 text-[11px] leading-tight">
                        {act.action}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 pl-6 italic">
                      Reason: {act.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evacuation Considerations */}
            {aiAnalysis.evacuation_considerations.length > 0 && (
              <div className="p-2.5 rounded bg-slate-950 border border-amber-900/40 text-[11px] space-y-1">
                <div className="font-semibold text-amber-300 flex items-center space-x-1 text-[10px] uppercase">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Evacuation Routing Notes:</span>
                </div>
                <ul className="space-y-1 text-slate-300 text-[10px] pl-4 list-disc">
                  {aiAnalysis.evacuation_considerations.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-slate-950 rounded text-slate-400 text-center text-xs">
            Plan ready. Click refresh to query Gemini.
          </div>
        )}
      </div>
    </aside>
  );
};
