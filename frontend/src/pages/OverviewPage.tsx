import React from 'react';
import { 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Navigation, 
  Sparkles, 
  Database,
  Cpu,
  Globe2,
  Sliders,
  Clock,
  GitBranch,
  Bot,
  Lock,
  ChevronRight,
  TrendingDown,
  Activity
} from 'lucide-react';

interface OverviewPageProps {
  onEnterCommandCenter: () => void;
  onEnterSimulator?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ 
  onEnterCommandCenter,
  onEnterSimulator 
}) => {
  const pillars = [
    {
      title: 'Disaster Digital Twin',
      contrast: 'Not just a weather forecast.',
      desc: 'Live 2D geospatial digital twin fusing 30m terrain elevation, population, and infrastructure lifelines.'
    },
    {
      title: 'Infrastructure Dependency Graph',
      contrast: 'Not just static dots on a map.',
      desc: 'Directed graph modeling systemic cascade failures: Power Substation → Hospital ICU → Potable Water Supply.'
    },
    {
      title: 'What-If Simulation Engine',
      contrast: 'Not passive meteorological visualization.',
      desc: 'Interactive scenario stress-testing: scrub intensity, storm surge, and landfall tracks with real-time consequence deltas.'
    },
    {
      title: 'Risk-Aware Evacuation Routing',
      contrast: 'Not generic administrative zones.',
      desc: 'Dijkstra route optimization penalizing inundated road links to guarantee continuous hospital access.'
    },
    {
      title: 'Anticipatory Action Clock',
      contrast: 'Not unprioritized flood alerts.',
      desc: 'Phased operational directives from T-24h to Landfall allocating agency actions before wind cutoffs.'
    },
    {
      title: 'AI Emergency Commander',
      contrast: 'Not ungrounded generic chatbot text.',
      desc: 'Grounded operational briefings answering tactical commander inquiries conditioned strictly on application metrics.'
    },
    {
      title: 'Explainable Transparent Risk',
      contrast: 'Not opaque black-box AI.',
      desc: 'Verifiable multi-hazard formulation: 0.30 Flood + 0.25 Surge + 0.20 Wind + 0.15 Infra + 0.10 Accessibility.'
    },
    {
      title: 'BRICS Federated Resilience',
      contrast: 'Not cross-border citizen data transfer.',
      desc: 'Decentralized parameter aggregation enabling sovereign nations to exchange model weights with privacy by design.'
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-14 select-none">
      {/* SECTION 26: CINEMATIC LANDING OPENING */}
      <div className="text-center space-y-5 pt-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-500/80 text-red-300 text-xs font-bold tracking-wide shadow-lg">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>STORMSHIELD X • AI CYCLONE DIGITAL TWIN</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-slate-100 tracking-tight leading-tight uppercase font-sans">
          Before the storm,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-400 to-rose-400">
            See the consequences.
          </span>
        </h1>

        <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
          StormShield X transforms cyclone forecasts into infrastructure-level impact intelligence and anticipatory action.
        </p>

        {/* Action Buttons from Section 26 */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            onClick={onEnterCommandCenter}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold rounded-xl shadow-2xl text-xs md:text-sm inline-flex items-center space-x-2 transition cursor-pointer"
          >
            <span>ENTER COMMAND CENTER</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onEnterSimulator || onEnterCommandCenter}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-xl shadow-lg text-xs md:text-sm inline-flex items-center space-x-2 transition cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>RUN DISASTER SIMULATION</span>
          </button>
        </div>
      </div>

      {/* SECTION 38: PARADIGM SHIFT COMPARISON */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Existing Approach</div>
          <div className="text-lg font-black text-slate-300 flex items-center space-x-2">
            <span>Forecast</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span>Warning</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span className="text-red-400">Reactive Response</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Conventional disaster management focuses on "What happened?". Response begins only after seawalls are breached, hospital power is lost, and roads are submerged.
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">StormShield X Paradigm</div>
          <div className="text-xs sm:text-sm font-black text-slate-100 flex flex-wrap items-center gap-1.5">
            <span>Forecast</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Understand</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Prioritize</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">Act Before Impact</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Moving disaster intelligence to "What is likely to happen?" and finally: <strong>"What should we do before it happens?"</strong>
          </p>
        </div>
      </div>

      {/* SECTION 3: THE 5 SYSTEM LAYERS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-100">The 5 Unified Layers of StormShield X</h2>
          <p className="text-xs text-slate-400">Comprehensive end-to-end disaster impact intelligence architecture</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-blue-400 font-bold">LAYER 1</span>
            <div className="font-bold text-slate-100">Observe</div>
            <p className="text-[11px] text-slate-400">Cyclone track, satellite DEM, roads, hospitals, shelters, and power grid.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-indigo-400 font-bold">LAYER 2</span>
            <div className="font-bold text-slate-100">Predict</div>
            <p className="text-[11px] text-slate-400">Hydrodynamic storm surge, flood inundation, and wind shear decay surfaces.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-purple-400 font-bold">LAYER 3</span>
            <div className="font-bold text-slate-100">Understand</div>
            <p className="text-[11px] text-slate-400">Infrastructure dependency graph, isolated hospitals, and cascade blast radius.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-amber-400 font-bold">LAYER 4</span>
            <div className="font-bold text-slate-100">Simulate</div>
            <p className="text-[11px] text-slate-400">What-if scenarios manipulating wind, surge, rainfall, and landfall ETA.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-emerald-400 font-bold">LAYER 5</span>
            <div className="font-bold text-slate-100">Act</div>
            <p className="text-[11px] text-slate-400">6-Hour Action Clock, risk-aware routing, and resource pre-positioning.</p>
          </div>
        </div>
      </div>

      {/* SECTION 37: WHAT MAKES THIS DIFFERENT (8 PILLARS) */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-100">What Makes StormShield X Different</h2>
          <p className="text-xs text-slate-400">Eight core technical differentiators elevating decision intelligence</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition"
            >
              <div className="font-bold text-sm text-slate-100 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>{pillar.title}</span>
              </div>
              <div className="text-[10px] font-mono font-bold text-amber-400">
                {pillar.contrast}
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
