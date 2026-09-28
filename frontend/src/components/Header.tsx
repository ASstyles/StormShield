import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  MapPin, 
  Sliders, 
  Navigation, 
  Building2, 
  Camera, 
  BarChart3, 
  Bell, 
  Info,
  PlayCircle,
  Cpu,
  Bot,
  Sparkles,
  Clock,
  Truck,
  Split,
  Globe,
  Lock,
  Play
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRunEmergencySimulation: () => void;
  isSimulating: boolean;
  activeAlertCount: number;
  onOpenAskCommander?: () => void;
  onOpenDataTrust?: () => void;
  onStartJudgeTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRunEmergencySimulation,
  isSimulating,
  activeAlertCount,
  onOpenAskCommander,
  onOpenDataTrust,
  onStartJudgeTour
}) => {
  const tabs = [
    { id: 'command-center', label: 'Command Center', icon: MapPin },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'infrastructure', label: 'Cascade & Assets', icon: Building2 },
    { id: 'routing', label: 'Evacuation Routing', icon: Navigation },
    { id: 'action-clock', label: 'Action Clock', icon: Clock },
    { id: 'resources', label: 'Resource Optimizer', icon: Truck },
    { id: 'before-after', label: 'Before vs After', icon: Split },
    { id: 'multimodal', label: 'Satellite & AI', icon: Camera },
    { id: 'brics', label: 'BRICS Network', icon: Globe },
    { id: 'analytics', label: 'Resilience & Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: activeAlertCount },
    { id: 'overview', label: 'Overview / Landing', icon: Info },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 select-none sticky top-0 z-50 shadow-md">
      {/* Top operational status bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/70 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm tracking-wider text-slate-100">STORMSHIELD X</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold border border-red-500/30">
                  DEFCON 2
                </span>
                <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  DIGITAL TWIN LIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                AI Cyclone Digital Twin & Anticipatory Infrastructure Command Center
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-slate-800">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono">
              Bay of Bengal / Kakinada Coast
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
              SYNTHETIC HYDRODYNAMIC TWIN
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 90-Second Judge Demo Tour Trigger */}
          {onStartJudgeTour && (
            <button
              onClick={onStartJudgeTour}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-slate-950 text-xs font-black px-3 py-1.5 rounded-lg shadow-lg shadow-amber-950/40 transition cursor-pointer"
              title="Launch the exact 90-second judge walkthrough script"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>90s JUDGE DEMO</span>
            </button>
          )}

          {/* Ask StormShield AI Commander Trigger */}
          {onOpenAskCommander && (
            <button
              onClick={onOpenAskCommander}
              className="flex items-center space-x-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
              title="Open Ask StormShield conversational emergency commander"
            >
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              <span>ASK AI COMMANDER</span>
            </button>
          )}

          {/* Data Trust Center Modal Trigger */}
          {onOpenDataTrust && (
            <button
              onClick={onOpenDataTrust}
              className="hidden sm:flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              title="View data provenance badges & privacy by design policy"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>DATA TRUST</span>
            </button>
          )}

          {/* Master Emergency Simulation Action */}
          <button
            onClick={onRunEmergencySimulation}
            disabled={isSimulating}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-red-950/40 transition cursor-pointer disabled:opacity-50"
            title="Advance cyclone 6 hours and recalculate multi-hazard footprint"
          >
            <PlayCircle className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'SIMULATING...' : 'EMERGENCY SIM'}</span>
          </button>
        </div>
      </div>

      {/* Main navigation tabs */}
      <nav className="px-3 flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
