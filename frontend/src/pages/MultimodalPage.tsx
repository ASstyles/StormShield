import React, { useState } from 'react';
import { AIImageAnalysisResult } from '../types';
import { analyzeSatelliteImage } from '../services/api';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Eye, 
  FileText,
  ShieldAlert,
  RefreshCw,
  Info
} from 'lucide-react';

export const MultimodalPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIImageAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('port-inundation');

  // Realistic sample captures
  const presets = [
    {
      id: 'port-inundation',
      title: 'Kakinada Deepwater Port & Lowland Arterial',
      description: 'Sentinel-2 & High-Res aerial capture showing sheet flow across port spur road.',
      tags: ['Storm Surge', 'Road Submergence', 'Dock Inundation'],
      imageSvg: (
        <svg viewBox="0 0 600 340" className="w-full h-full object-cover bg-slate-950">
          <rect width="600" height="340" fill="#0f172a" />
          {/* Sea / Harbor water */}
          <path d="M0,180 C150,160 350,220 600,190 L600,340 L0,340 Z" fill="#0369a1" fillOpacity="0.7" />
          {/* Submerged coastal road */}
          <path d="M50,300 L550,140" stroke="#f59e0b" strokeWidth="14" strokeDasharray="10 5" opacity="0.8" />
          {/* High water overlay */}
          <ellipse cx="320" cy="210" rx="140" ry="60" fill="#38bdf8" fillOpacity="0.4" />
          {/* Port terminal buildings */}
          <rect x="80" y="80" width="70" height="50" fill="#475569" stroke="#94a3b8" />
          <rect x="170" y="70" width="90" height="60" fill="#334155" stroke="#94a3b8" />
          {/* Substation yard */}
          <rect x="380" y="90" width="80" height="50" fill="#eab308" fillOpacity="0.3" stroke="#eab308" />
          <text x="390" y="120" fill="#fef08a" fontSize="12" fontFamily="sans-serif">⚡ 220kV Grid</text>
          <text x="90" y="110" fill="#f1f5f9" fontSize="11" fontFamily="sans-serif">Warehouses</text>
          <text x="250" y="240" fill="#ffffff" fontSize="13" fontWeight="bold" fontFamily="sans-serif">⚠️ 0.6m Sheet Waterlogging</text>
        </svg>
      )
    },
    {
      id: 'bridge-approach',
      title: 'NH-216 Godavari Creek Bypass Approach',
      description: 'Drone recon frame showing tidal backwater scouring bridge embankments.',
      tags: ['Bridge Scour', 'Debris Dam', 'Tidal Surge'],
      imageSvg: (
        <svg viewBox="0 0 600 340" className="w-full h-full object-cover bg-slate-950">
          <rect width="600" height="340" fill="#1e293b" />
          {/* Tidal river creek */}
          <path d="M180,0 C220,120 190,240 240,340 L380,340 C340,240 370,120 330,0 Z" fill="#0284c7" fillOpacity="0.8" />
          {/* Bridge structure across creek */}
          <rect x="60" y="150" width="480" height="24" fill="#64748b" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="190" y="145" width="20" height="34" fill="#94a3b8" />
          <rect x="330" y="145" width="20" height="34" fill="#94a3b8" />
          {/* Flood backflow pool */}
          <circle cx="170" cy="210" r="45" fill="#38bdf8" fillOpacity="0.5" />
          <text x="70" y="140" fill="#34d399" fontSize="12" fontWeight="bold">NH-216 Bridge Deck (Elevated)</text>
          <text x="70" y="210" fill="#f87171" fontSize="12" fontWeight="bold">⚠️ Southern Abutment Scour</text>
        </svg>
      )
    }
  ];

  const handleSelectPreset = (presetId: string) => {
    setActivePreset(presetId);
    setSelectedFile(null);
    setPreviewUrl(null);
    runAnalysis();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setActivePreset('');
    }
  };

  const runAnalysis = async () => {
    setIsLoading(true);
    try {
      const res = await analyzeSatelliteImage(selectedFile || undefined);
      setAnalysis(res);
    } catch (err) {
      console.error('Multimodal analysis failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Camera className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold text-slate-100">Multimodal Satellite & Drone Damage Inspection</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Gemini multimodal optical intelligence: detects visible flood extents, submerged arterial roads, power transformer waterlogging, and structural scour to validate GIS ground-truth models.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Viewer & Upload (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-slate-200">Reconnaissance Imagery Feed</h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              SENTINEL-2 / DRONE RTK
            </span>
          </div>

          {/* Sample Preset Buttons */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-semibold">Demo Feeds:</span>
            {presets.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer border ${
                  activePreset === p.id
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {p.title.split('&')[0]}
              </button>
            ))}
          </div>

          {/* Viewport Frame */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Uploaded recon" className="w-full h-full object-contain" />
            ) : (
              presets.find(p => p.id === activePreset)?.imageSvg || (
                <div className="text-slate-500 text-xs">No image loaded</div>
              )
            )}

            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-slate-950/80 border border-slate-700 text-[10px] text-slate-300 font-mono">
              Coordinates: 16.945°N, 82.242°E (Coastal AP)
            </div>
          </div>

          {/* Upload Custom Recon Image */}
          <div className="border border-dashed border-slate-700 hover:border-slate-500 rounded-lg p-3 text-center bg-slate-950/50 transition">
            <label className="cursor-pointer flex flex-col items-center space-y-1">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Upload Drone / Satellite Photo</span>
              <span className="text-[10px] text-slate-500">Max size 10MB (JPEG, PNG, GeoTIFF)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Run Analysis Button */}
          <button
            onClick={runAnalysis}
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-xs rounded-lg shadow-lg flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'ANALYZING WITH GEMINI MULTIMODAL...' : 'RUN GEMINI IMAGE ANALYSIS'}</span>
          </button>
        </div>

        {/* Right Column: AI Analysis Report (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {analysis ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 font-bold text-sm text-slate-100">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Gemini Multimodal Observations</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700 font-mono font-bold text-[10px]">
                  CONFIDENCE: {analysis.confidence_level}
                </span>
              </div>

              {/* GIS Ground Truth Comparison */}
              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-800/40 text-xs space-y-1">
                <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>GIS Ground-Truth Comparison</span>
                </div>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  {analysis.gis_ground_truth_comparison}
                </p>
              </div>

              {/* Visual Observations */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Visual Features Identified:
                </div>
                <div className="space-y-1">
                  {analysis.observations.map((obs, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-950 border border-slate-800 flex items-start space-x-2 text-slate-300 text-[11px]"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{obs}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Potential Risks */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Potential Structural & Access Risks:
                </div>
                <div className="space-y-1">
                  {analysis.possible_risks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-950 border border-amber-900/40 flex items-start space-x-2 text-slate-300 text-[11px]"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Verification Steps */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Recommended Field Verification:
                </div>
                <div className="space-y-1">
                  {analysis.recommended_verification_steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-950 border border-emerald-950 flex items-start space-x-2 text-slate-300 text-[11px]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory GIS Distinction Notice (From Section 19) */}
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex items-start space-x-2">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-tight italic">
                  Notice: {analysis.notice}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center flex flex-col items-center justify-center space-y-3 min-h-[420px]">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200 text-sm">Visual Inspection Ready</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Click <strong>Run Gemini Image Analysis</strong> to interpret visible sheet flooding, road closures, and transformer inundation on the selected aerial capture.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
