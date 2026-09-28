import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles,
  Volume2
} from 'lucide-react';

interface JudgeDemoTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onTriggerSimulation?: () => void;
  onOpenAskAI?: () => void;
}

export const JudgeDemoTour: React.FC<JudgeDemoTourProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onTriggerSimulation: _onTriggerSimulation,
  onOpenAskAI: _onOpenAskAI
}) => {

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const steps = [
    {
      timeRange: '0–10s',
      title: 'Phase 1: Forecast to Digital Twin',
      narration: '“Existing systems can tell us where the cyclone is. StormShield asks what happens next.”',
      actionNote: 'Observing approaching Category-3 cyclone track, central pressure, and coastal ETA in Bay of Bengal.',
      tabId: 'command-center',
      duration: 10
    },
    {
      timeRange: '10–25s',
      title: 'Phase 2: Multi-Hazard Digital Twin',
      narration: '“We fuse 30m terrain, population density, hydrodynamic surge, and road networks into a live operational twin.”',
      actionNote: 'Toggling compound hazard layers: Flood inundation, storm surge boundaries, and exposed critical infrastructure.',
      tabId: 'command-center',
      duration: 15
    },
    {
      timeRange: '25–40s',
      title: 'Phase 3: Critical Asset Vulnerability',
      narration: '“Notice Hospital Central: the hospital building itself is safe, but its primary access corridors will submerge under 0.6m of surge.”',
      actionNote: 'Inspecting Kakinada General Hospital lifeline corridor and flood cutoff probability.',
      tabId: 'infrastructure',
      duration: 15
    },
    {
      timeRange: '40–55s',
      title: 'Phase 4: What-If Simulator & Cascade',
      narration: '“What happens if surge intensifies from 2.8m to 3.5m? Downstream power failure trips water pumps and hospital ICUs.”',
      actionNote: 'Simulating intensified surge escalation and triggering the infrastructure dependency cascade.',
      tabId: 'simulator',
      duration: 15
    },
    {
      timeRange: '55–70s',
      title: 'Phase 5: AI Emergency Commander',
      narration: '“We ask Ask StormShield: What should we do in the next 6 hours? Grounded AI generates a prioritized operational plan.”',
      actionNote: 'Querying grounded emergency decision engine for pre-positioning directives and evacuation timelines.',
      tabId: 'action-clock',
      duration: 15
    },
    {
      timeRange: '70–80s',
      title: 'Phase 6: Risk-Aware Route Intelligence',
      narration: '“The normal evacuation arterial is blocked by floodwaters. StormShield calculates a safe risk-aware inland bypass route.”',
      actionNote: 'Comparing normal compromised route vs risk-aware route avoiding high-inundation sectors (+4.2 min delta).',
      tabId: 'routing',
      duration: 10
    },
    {
      timeRange: '80–90s',
      title: 'Phase 7: Before vs After Anticipatory Impact',
      narration: '“StormShield doesn’t predict the storm alone. It predicts the consequences of the storm — and helps authorities act before those consequences happen.”',
      actionNote: 'Demonstrating modeled reduction: isolated hospitals cut from 8 to 3, response time cut from 42 min to 27 min.',
      tabId: 'before-after',
      duration: 10
    }
  ];

  const currentStep = steps[currentStepIndex];

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= 90) {
          setIsPlaying(false);
          return 90;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying]);

  // Sync step with elapsed seconds
  useEffect(() => {
    let accum = 0;
    for (let i = 0; i < steps.length; i++) {
      accum += steps[i].duration;
      if (elapsedSeconds < accum || i === steps.length - 1) {
        if (currentStepIndex !== i) {
          setCurrentStepIndex(i);
          onNavigateTab(steps[i].tabId);
        }
        break;
      }
    }
  }, [elapsedSeconds]);

  if (!isOpen) return null;

  const handleStepJump = (idx: number) => {
    setCurrentStepIndex(idx);
    let startSec = 0;
    for (let i = 0; i < idx; i++) {
      startSec += steps[i].duration;
    }
    setElapsedSeconds(startSec);
    onNavigateTab(steps[idx].tabId);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4 select-none animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-slate-900/95 border-2 border-red-500/80 rounded-2xl shadow-2xl p-4 backdrop-blur-xl text-slate-100 flex flex-col space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold text-xs uppercase tracking-wider text-red-400">
              90-Second Judge Demo Tour
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Step {currentStepIndex + 1} of 7 • {elapsedSeconds}s / 90s
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={() => {
                setElapsedSeconds(0);
                setCurrentStepIndex(0);
                onNavigateTab(steps[0].tabId);
                setIsPlaying(true);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              title="Restart Demo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timeline Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-red-500 via-amber-500 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${(elapsedSeconds / 90) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-slate-100 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentStep.title}</span>
            </h3>
            <span className="font-mono text-red-400 font-semibold text-[11px]">
              {currentStep.timeRange}
            </span>
          </div>

          {/* Voice Narration Script */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-slate-400">
              <Volume2 className="w-3 h-3 text-blue-400" />
              <span>Presenter Voice Script:</span>
            </div>
            <p className="text-xs text-amber-200 italic font-serif leading-relaxed">
              {currentStep.narration}
            </p>
          </div>

          <p className="text-[11px] text-slate-400">
            {currentStep.actionNote}
          </p>
        </div>

        {/* Step Navigation Dots */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => handleStepJump(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <div className="flex items-center space-x-1.5">
            {steps.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleStepJump(idx)}
                className={`w-2.5 h-2.5 rounded-full transition cursor-pointer ${
                  currentStepIndex === idx ? 'bg-red-500 scale-125' : 'bg-slate-700 hover:bg-slate-500'
                }`}
                title={s.title}
              />
            ))}
          </div>

          <button
            onClick={() => handleStepJump(Math.min(steps.length - 1, currentStepIndex + 1))}
            disabled={currentStepIndex === steps.length - 1}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
