import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  X,
  Database,
  Cpu
} from 'lucide-react';
import { askAICommander } from '../services/api';
import { AskAIResponse } from '../types';

interface AskCommanderModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeZoneId?: string;
  cycloneState?: any;
}

export const AskCommanderModal: React.FC<AskCommanderModalProps> = ({
  isOpen,
  onClose,
  activeZoneId,
  cycloneState
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskAIResponse | null>(null);

  if (!isOpen) return null;

  const sampleQuestions = [
    "Which hospitals are most vulnerable?",
    "What happens if rainfall increases by 30%?",
    "Which evacuation routes are likely to fail?",
    "Where should we pre-position ambulances?",
    "Why is Zone 7 critical?",
    "What should we do in the next 6 hours?"
  ];

  const handleAsk = async (qText?: string) => {
    const query = qText || question;
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await askAICommander({
        question: query,
        zone_id: activeZoneId || 'ZONE-AP-01',
        cyclone_state: cycloneState
      });
      setResponse(res);
    } catch (err) {
      console.error('Error querying AI Commander:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-100">ASK STORMSHIELD</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  AI EMERGENCY COMMANDER
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  GROUNDED DATA ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Grounded strictly in real-time multi-hazard telemetry, infrastructure dependencies, and digital twin state.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Query Sample Pills */}
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Recommended Tactical Queries</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    handleAsk(q);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-900/40 text-slate-300 hover:text-blue-300 border border-slate-700/80 hover:border-blue-500/50 transition cursor-pointer text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chat Output */}
          {response && (
            <div className="space-y-4 pt-2">
              {/* Tactical Brief Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="font-bold text-slate-200 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Tactical Incident Commander Brief</span>
                  </span>
                  <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    Confidence: {(response.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {response.answer}
                </p>
              </div>

              {/* Grounded Factual Evidence */}
              {response.grounded_facts && response.grounded_facts.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5 text-sky-400" />
                    <span>Grounded Quantitative Telemetry</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {response.grounded_facts.map((fact, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Operational Directives */}
              {response.recommended_actions && response.recommended_actions.length > 0 && (
                <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                    <span>Immediate Action Directives (Next 1-6 Hours)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-blue-200">
                    {response.recommended_actions.map((act, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">
                          {idx + 1}
                        </span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Data Provenance Badges */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-wrap items-center gap-2 text-[10px]">
                <span className="text-slate-500 font-semibold uppercase">Data Provenance:</span>
                {response.data_provenance.map((badge, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-10 space-x-3 text-slate-400 text-sm">
              <Cpu className="w-5 h-5 text-blue-400 animate-spin" />
              <span>Grounding query against active geospatial digital twin & infrastructure dependencies...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask StormShield anything (e.g. 'Which hospitals are most vulnerable?', 'What should we do in next 6h?')..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ASK</span>
            </button>
          </form>

          {/* AI Safety Disclaimer */}
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              Decision-support only — verify against official IMD/JTWC forecasts and local emergency protocols.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
