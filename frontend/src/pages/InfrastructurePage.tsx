import React, { useState, useEffect } from 'react';
import { InfrastructureAsset, InfrastructureAtRisk, InfrastructureCascadeResult, WhatBreaksFirstItem } from '../types';
import { fetchInfrastructureCascade, fetchWhatBreaksFirst } from '../services/api';
import { 
  Building2, 
  Search, 
  Filter, 
  HeartPulse, 
  Home, 
  Zap, 
  ShieldAlert, 
  MapPin, 
  ChevronRight,
  GitBranch,
  AlertTriangle,
  PlayCircle,
  Activity,
  CheckCircle2,
  Droplets,
  Layers,
  ArrowRight
} from 'lucide-react';

interface InfrastructurePageProps {
  infrastructure: InfrastructureAtRisk[];
  onFocusOnMap?: (asset: InfrastructureAtRisk) => void;
}

export const InfrastructurePage: React.FC<InfrastructurePageProps> = ({
  infrastructure,
  onFocusOnMap
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'cascade' | 'breaks-first' | 'registry'>('cascade');
  const [selectedRootAsset, setSelectedRootAsset] = useState<string>('INFRA-PWR-01');
  const [cascadeResult, setCascadeResult] = useState<InfrastructureCascadeResult | null>(null);
  const [whatBreaksFirstList, setWhatBreaksFirstList] = useState<WhatBreaksFirstItem[]>([]);
  const [loadingCascade, setLoadingCascade] = useState<boolean>(false);

  // Registry filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const loadWhatBreaksFirst = async () => {
    try {
      const data = await fetchWhatBreaksFirst();
      setWhatBreaksFirstList(data);
    } catch (err) {
      console.error('Failed to load what-breaks-first:', err);
    }
  };

  const loadCascade = async (assetId: string) => {
    setLoadingCascade(true);
    setSelectedRootAsset(assetId);
    try {
      const res = await fetchInfrastructureCascade(assetId, 'CRITICAL');
      setCascadeResult(res);
    } catch (err) {
      console.error('Failed to load cascade analysis:', err);
    } finally {
      setLoadingCascade(false);
    }
  };

  useEffect(() => {
    loadWhatBreaksFirst();
    loadCascade('INFRA-PWR-01');
  }, []);

  const filteredAssets = infrastructure.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    const matchesRisk = riskFilter === 'all' || a.hazard_level === riskFilter;
    return matchesSearch && matchesType && matchesRisk;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'hospital': return <HeartPulse className="w-4 h-4 text-red-400" />;
      case 'shelter': return <Home className="w-4 h-4 text-cyan-400" />;
      case 'power_station': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'water_facility': return <Droplets className="w-4 h-4 text-blue-400" />;
      default: return <Building2 className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-100">Infrastructure Resilience & Cascade Command</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing cross-infrastructure failure cascades, dependency graphs, and prototype prioritization ranking.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveSubTab('cascade')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeSubTab === 'cascade'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Cascade Engine</span>
          </button>
          <button
            onClick={() => setActiveSubTab('breaks-first')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeSubTab === 'breaks-first'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>What Breaks First?</span>
          </button>
          <button
            onClick={() => setActiveSubTab('registry')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeSubTab === 'registry'
                ? 'bg-slate-800 text-blue-400 shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Asset Registry</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: INFRASTRUCTURE CASCADE ENGINE */}
      {activeSubTab === 'cascade' && (
        <div className="space-y-6">
          {/* Root Asset Trigger Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-red-400" />
                  <span>Select Root Failure Node to Simulate Cascade</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any lifeline facility to evaluate downstream knock-on effects across hospitals, water supply, and population.
                </p>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                ACTIVE CASCADE SIMULATOR
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: 'INFRA-PWR-01', name: 'Kakinada 400kV Grid Substation', type: 'power_station', tag: 'Primary Grid Hub' },
                { id: 'INFRA-BRG-01', name: 'NH-216 Godavari Creek Bridge', type: 'bridge', tag: 'Southern Access Chokepoint' },
                { id: 'INFRA-WTR-01', name: 'Kakinada Water Treatment Plant', type: 'water_facility', tag: 'Municipal Potable Supply' },
                { id: 'INFRA-PWR-02', name: 'Coringa Coastal Switching Station', type: 'power_station', tag: 'Estuary Lowland Node' },
              ].map((root) => {
                const isSelected = selectedRootAsset === root.id;
                return (
                  <button
                    key={root.id}
                    onClick={() => loadCascade(root.id)}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/40 border-red-500/80 ring-2 ring-red-500/30 shadow-lg'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-400">{getIcon(root.type)}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {root.tag}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-200 truncate">{root.name}</div>
                    <span className="text-[10px] text-slate-500 font-mono">{root.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SIGNATURE FEATURE #2: CASCADE ALERT BANNER */}
          {cascadeResult && cascadeResult.cascade_alerts && cascadeResult.cascade_alerts[0] && (
            <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-2 border-red-500 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-500/30 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 font-bold animate-pulse">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-red-200 tracking-wider">
                      CASCADE ALERT — SYSTEMIC FAILURE BLAST RADIUS
                    </h2>
                    <p className="text-xs text-red-300 font-medium">
                      Simulated failure of {cascadeResult.root_asset_name} triggers downstream lifeline collapse.
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white animate-pulse">
                  CRITICAL IMPACT
                </span>
              </div>

              {/* Exact Cascade Alert Numbers as requested in Section 5 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-950/80 border border-red-500/30 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Hospitals Affected</div>
                  <div className="text-2xl font-black text-red-400 font-mono mt-1">
                    {cascadeResult.cascade_alerts[0].affected_hospitals}
                  </div>
                  <div className="text-[10px] text-slate-500">ICU & Surgical Suites</div>
                </div>

                <div className="bg-slate-950/80 border border-red-500/30 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Water Facilities</div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                    {cascadeResult.cascade_alerts[0].affected_water_facilities || 1}
                  </div>
                  <div className="text-[10px] text-slate-500">Municipal Pumps Tripped</div>
                </div>

                <div className="bg-slate-950/80 border border-red-500/30 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Emergency Centers</div>
                  <div className="text-2xl font-black text-yellow-400 font-mono mt-1">
                    {cascadeResult.cascade_alerts[0].affected_emergency_centers || 3}
                  </div>
                  <div className="text-[10px] text-slate-500">EOC Operations Rooms</div>
                </div>

                <div className="bg-slate-950/80 border border-red-500/30 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Population at Risk</div>
                  <div className="text-2xl font-black text-rose-400 font-mono mt-1">
                    {cascadeResult.total_population_at_risk.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">Dependent Civilians</div>
                </div>
              </div>

              {/* Cascade Failure Chain */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-red-400" />
                  <span>Sequential Dependency Failure Chain</span>
                </div>
                <div className="space-y-2">
                  {cascadeResult.cascade_chain.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 font-bold flex items-center justify-center text-[10px] mt-0.5 shrink-0">
                        {idx + 1}
                      </div>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Mitigation */}
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-start space-x-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase tracking-wider text-[11px] block">AI-Recommended Mitigation Action:</span>
                  <p className="mt-0.5 text-slate-200">{cascadeResult.cascade_alerts[0].mitigation_action}</p>
                </div>
              </div>
            </div>
          )}

          {/* Downstream Compromised Nodes Grid */}
          {cascadeResult && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Downstream Compromised Dependent Nodes</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cascadeResult.downstream_nodes.map((node) => (
                  <div
                    key={node.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getIcon(node.type)}
                        <h4 className="font-bold text-xs text-slate-100 truncate">{node.name}</h4>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                        {node.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Failure Probability:</span>
                      <span className="font-mono font-bold text-red-400">{(node.failure_probability * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Criticality Weight:</span>
                      <span className="font-mono font-bold text-slate-200">{node.criticality.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: WHAT BREAKS FIRST? PRIORITIZATION */}
      {activeSubTab === 'breaks-first' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>TOP CRITICAL ASSETS — WHAT BREAKS FIRST?</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Formulation: <span className="font-mono text-slate-300">Risk = Hazard Exposure × Criticality × Population Dependency × Accessibility Risk</span>
                </p>
              </div>

              {/* Mandatory Prototype Label from Section 6 */}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                AI-Generated Prototype Prioritization
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {whatBreaksFirstList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-sm shrink-0">
                      0{item.rank}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getIcon(item.type)}
                        <h3 className="font-bold text-sm text-slate-100">{item.name}</h3>
                        <span className="text-[10px] font-mono text-slate-500">{item.district}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">{item.primary_driver}</p>
                      <div className="text-[11px] text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Mitigation: {item.mitigation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 md:border-l md:border-slate-800 md:pl-4 shrink-0 justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Dependent Pop</div>
                      <div className="font-mono font-bold text-xs text-slate-300">{item.population_dependent.toLocaleString()}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Failure Impact</div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.failure_impact === 'VERY HIGH'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                        }`}
                      >
                        {item.failure_impact}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Risk Score</div>
                      <div className="font-mono font-black text-lg text-amber-400">{item.risk_score}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ASSET REGISTRY TABLE */}
      {activeSubTab === 'registry' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by facility name, district, or road link..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Asset Types</option>
                  <option value="hospital">Hospitals (1.0)</option>
                  <option value="shelter">Cyclone Shelters (0.9)</option>
                  <option value="power_station">Power Substations (0.95)</option>
                  <option value="bridge">Bridges (0.90)</option>
                  <option value="road">Arterial Roads (0.85)</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="CRITICAL">Critical Hazard</option>
                  <option value="HIGH">High Hazard</option>
                  <option value="MEDIUM">Medium Hazard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Registry Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Facility Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Elevation</th>
                    <th className="px-4 py-3">Coast Distance</th>
                    <th className="px-4 py-3">Risk Level</th>
                    <th className="px-4 py-3">Composite Score</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-semibold text-slate-100 flex items-center space-x-2">
                        {getIcon(asset.type)}
                        <span>{asset.name}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] capitalize">{asset.type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-slate-400">{asset.district}</td>
                      <td className="px-4 py-3 font-mono">{asset.elevation}m</td>
                      <td className="px-4 py-3 font-mono">{asset.distance_to_coast_km} km</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            asset.hazard_level === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-300 border-red-500/40'
                              : asset.hazard_level === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                              : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                          }`}
                        >
                          {asset.hazard_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">{asset.risk_score}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedRootAsset(asset.id);
                            setActiveSubTab('cascade');
                            loadCascade(asset.id);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 text-[10px] font-bold transition cursor-pointer"
                        >
                          Simulate Cascade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
