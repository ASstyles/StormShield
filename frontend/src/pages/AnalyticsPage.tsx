import React, { useState, useEffect } from 'react';
import { AnalyticsSummary } from '../types';
import { fetchAnalyticsSummary } from '../services/api';
import { 
  BarChart3, 
  Users, 
  HeartPulse, 
  Home, 
  Zap, 
  Milestone, 
  PieChart as PieIcon, 
  LineChart as LineIcon,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const summary = await fetchAnalyticsSummary();
      setData(summary);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
        Loading regional analytics data...
      </div>
    );
  }

  // Hazard composition colors
  const HAZARD_COLORS = ['#3b82f6', '#06b6d4', '#eab308', '#ef4444'];
  const hazardPieData = Object.entries(data.hazard_composition).map(([name, value]) => ({
    name,
    value
  }));

  // Risk distribution colors
  const distributionData = [
    { name: 'Critical (80-100)', count: data.risk_distribution['CRITICAL'] || 2, color: '#ef4444' },
    { name: 'High (60-80)', count: data.risk_distribution['HIGH'] || 3, color: '#f97316' },
    { name: 'Medium (30-60)', count: data.risk_distribution['MEDIUM'] || 2, color: '#eab308' },
    { name: 'Low (0-30)', count: data.risk_distribution['LOW'] || 1, color: '#10b981' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-slate-100">Disaster Exposure & Vulnerability Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated exposure metrics across Coastal Andhra Pradesh districts (Kakinada, Visakhapatnam, Konaseema, Krishna).
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Exposed Population</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {data.total_population_exposed.toLocaleString()}
          </div>
          <div className="text-[10px] text-red-400 font-semibold mt-1">In High/Critical Zones</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <HeartPulse className="w-4 h-4 text-red-400" />
            <span>Hospitals At-Risk</span>
          </div>
          <div className="text-xl font-bold font-mono text-red-400 mt-1">
            {data.total_hospitals_at_risk}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">3,450 Bed Capacity</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Home className="w-4 h-4 text-cyan-400" />
            <span>Active Shelters</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {data.total_shelters_active}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">11,200 Capacity</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Milestone className="w-4 h-4 text-purple-400" />
            <span>Road Disruption</span>
          </div>
          <div className="text-xl font-bold font-mono text-purple-300 mt-1">
            {data.total_roads_disrupted_km} km
          </div>
          <div className="text-[10px] text-amber-400 mt-1">NH-216 Spur Impassable</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Power Substations</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {data.total_power_stations_exposed}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">1,570 MW at Risk</div>
        </div>
      </div>

      {/* Charts Grid 1: Timeline Forecast & Hazard Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Landfall Timeline Trend (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <LineIcon className="w-4 h-4 text-blue-400" />
              <h2 className="font-bold text-sm text-slate-100">Temporal Impact Projection (T-18h to T+24h)</h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              COMPOSITE RISK INDEX
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeline_forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="risk_index" name="Risk Index (0-100)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="wind_kmh" name="Wind (km/h)" stroke="#38bdf8" strokeWidth={2} />
                <Line type="monotone" dataKey="surge_m" name="Surge (m × 10)" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hazard Composition Donut (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <PieIcon className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold text-sm text-slate-100">Multi-Hazard Composition Model</h2>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hazardPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }: any) => `${(((percent as number) || 0) * 100).toFixed(0)}%`}
                >
                  {hazardPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={HAZARD_COLORS[index % HAZARD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SIGNATURE FEATURE #8: INFRASTRUCTURE RESILIENCE INDEX */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>DISTRICT RESILIENCE SCORES</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Composite indices evaluating exposure, infrastructure hardening, accessibility, emergency cover, and redundancy.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            StormShield Resilience Index — Prototype
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {[
            {
              district: 'Kakinada',
              resilience: 61,
              exposure: 82,
              infra: 54,
              access: 47,
              cover: 68,
              redundancy: 42,
              vulnerability: 'Primary 400kV substation feeder bottleneck; coastal road cutoff.'
            },
            {
              district: 'Visakhapatnam',
              resilience: 75,
              exposure: 58,
              infra: 83,
              access: 71,
              cover: 85,
              redundancy: 78,
              vulnerability: 'Headlands buffer surge; port chemical storage vulnerable to wind.'
            },
            {
              district: 'Konaseema',
              resilience: 53,
              exposure: 76,
              infra: 52,
              access: 39,
              cover: 58,
              redundancy: 39,
              vulnerability: 'Estuarine delta island isolation; tidal causeway overtopping.'
            },
            {
              district: 'Krishna',
              resilience: 59,
              exposure: 72,
              infra: 60,
              access: 54,
              cover: 64,
              redundancy: 48,
              vulnerability: 'Flat coastal plain; seawater intrusion into municipal canals.'
            }
          ].map((d) => (
            <div
              key={d.district}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-100 text-sm">{d.district}</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {d.resilience}/100
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Exposure Hazard:</span>
                  <span className="font-mono font-bold text-red-400">{d.exposure}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Infrastructure Quality:</span>
                  <span className="font-mono font-bold text-slate-200">{d.infra}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Transport Accessibility:</span>
                  <span className="font-mono font-bold text-amber-400">{d.access}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Emergency Cover:</span>
                  <span className="font-mono font-bold text-sky-400">{d.cover}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Grid Redundancy:</span>
                  <span className="font-mono font-bold text-purple-400">{d.redundancy}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Key Vulnerability:</span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{d.vulnerability}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
