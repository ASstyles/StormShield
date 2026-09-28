import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Cpu, 
  ShieldCheck, 
  Lock, 
  RotateCw, 
  Database, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Network
} from 'lucide-react';
import { simulateFederatedExchange } from '../services/api';
import { FederatedSimulationResponse, FederatedNode } from '../types';

export const BricsNetworkPage: React.FC = () => {
  const [data, setData] = useState<FederatedSimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [roundCounter, setRoundCounter] = useState(48);

  useEffect(() => {
    handleRunExchange();
  }, []);

  const handleRunExchange = async () => {
    setLoading(true);
    try {
      const res = await simulateFederatedExchange();
      setData(res);
      setRoundCounter(prev => prev + 1);
    } catch (err) {
      console.error('Failed to simulate federated learning exchange:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Globe className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-slate-100">BRICS Disaster Resilience Network</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Decentralized federated machine learning architecture across sovereign coastal disaster response nodes without cross-border citizen data transfer.
          </p>
        </div>

        <button
          onClick={handleRunExchange}
          disabled={loading}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'AGGREGATING GRADIENTS...' : 'TRIGGER FEDERATED ROUND'}</span>
        </button>
      </div>

      {/* Conceptual Architecture Flow Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center space-x-2">
            <Network className="w-4 h-4 text-blue-400" />
            <span>Federated Parameter Exchange Pipeline</span>
          </h2>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            PRIVACY GUARANTEE: SMPC + DIFFERENTIAL PRIVACY
          </span>
        </div>

        {/* Diagram Flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center text-xs">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <Database className="w-5 h-5 text-blue-400 mx-auto" />
            <div className="font-bold text-slate-200">1. Local Data</div>
            <p className="text-[10px] text-slate-500">Telemetry remains strictly in-country</p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <Cpu className="w-5 h-5 text-indigo-400 mx-auto" />
            <div className="font-bold text-slate-200">2. Local Training</div>
            <p className="text-[10px] text-slate-500">Hydrodynamic ML models fit on sovereign nodes</p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <Lock className="w-5 h-5 text-emerald-400 mx-auto" />
            <div className="font-bold text-slate-200">3. Weight Updates</div>
            <p className="text-[10px] text-slate-500">Differentially private gradient vectors</p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <Network className="w-5 h-5 text-amber-400 mx-auto" />
            <div className="font-bold text-slate-200">4. Global Model</div>
            <p className="text-[10px] text-slate-500">FedAvg aggregation creates generalized twin</p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <ShieldCheck className="w-5 h-5 text-purple-400 mx-auto" />
            <div className="font-bold text-slate-200">5. Early Action</div>
            <p className="text-[10px] text-slate-500">Enhanced cyclone impact accuracy</p>
          </div>
        </div>
      </div>

      {/* Global Aggregation Stats */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Global Model Version</div>
            <div className="text-sm font-mono font-bold text-blue-400">{data.global_model_version}</div>
            <p className="text-[10px] text-slate-500">Multinational Hydrodynamic Surge Network</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Federated Aggregation Rounds</div>
            <div className="text-2xl font-black text-slate-100 font-mono">{roundCounter}</div>
            <p className="text-[10px] text-slate-500">Consensus reached via FedAvg algorithm</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Global Model F1-Score</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{(data.global_f1_score * 100).toFixed(1)}%</div>
            <p className="text-[10px] text-slate-500">+12.8% gain over single-country baseline</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Sovereign Node Status</div>
            <div className="text-2xl font-black text-emerald-400 flex items-center space-x-1.5">
              <span>5 / 5</span>
              <span className="text-xs text-slate-400 font-normal">nodes synced</span>
            </div>
            <p className="text-[10px] text-slate-500">India, Brazil, South Africa, China, Russia</p>
          </div>
        </div>
      )}

      {/* Participating Country Nodes Grid */}
      {data && (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center space-x-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Participating Sovereign Model Nodes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.nodes.map((node) => (
              <div
                key={node.country}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{node.flag}</span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">{node.country}</h3>
                      <span className="text-[10px] text-slate-400 font-medium">{node.institution}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {node.training_status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Specialized Coastal Profile:</span>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">{node.region_profile}</p>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Local Neural Model:</span>
                    <p className="font-mono text-blue-300 text-[11px] mt-0.5">{node.model_type}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="text-slate-500 text-[10px]">Local Training Samples:</span>
                      <div className="font-mono font-bold text-slate-200">{node.local_samples.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">Accuracy Gain:</span>
                      <div className="font-mono font-bold text-emerald-400">+{node.accuracy_gain_pct}%</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transparency & Disclaimer Box */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start space-x-3 text-xs text-slate-400">
        <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-200">Demonstration Architecture Notice:</span>
          <p className="text-[11px] leading-relaxed">
            {data?.notice || 'Raw citizen data and exact municipal infrastructure coordinates remain strictly on local sovereign nodes. Only generalized model weights are aggregated.'}
          </p>
        </div>
      </div>
    </div>
  );
};
