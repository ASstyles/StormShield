import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Map as MapLibreInstance, 
  setWorkerUrl, 
  NavigationControl, 
  ScaleControl, 
  Marker, 
  Popup, 
  GeoJSONSource, 
  StyleSpecification 
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Register MapLibre v6 Web Worker URL via Vite asset bundler
try {
  setWorkerUrl(workerUrl);
} catch (e) {
  console.warn('[MAP_INIT] Note on setWorkerUrl:', e);
}

import { 
  Cyclone, 
  RiskZone, 
  InfrastructureAsset, 
  InfrastructureAtRisk, 
  EmergencyRoute 
} from '../types';
import { TIME_STEPS, TimeStep } from '../constants/timeSteps';
import { 
  Layers, 
  Play, 
  Pause, 
  Clock, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

// Standalone safe WebGL2 capability check
function isWebGL2Available(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

// Dark basemap raster style specification with Carto Dark tiles
const CARTO_DARK_RASTER_STYLE: StyleSpecification = {
  version: 8,
  name: 'StormShield Dark Basemap',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      attribution: '&copy; Carto &copy; OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'carto-dark-tiles',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

// Tactical offline fallback style (no external network dependencies)
const LOCAL_DARK_FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  name: 'StormShield Tactical Grid',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#090d16'
      }
    }
  ]
};

interface MapProps {
  cyclone: Cyclone | null;
  riskZones: RiskZone[];
  infrastructure: (InfrastructureAsset | InfrastructureAtRisk)[];
  selectedZone: RiskZone | null;
  onSelectZone: (zone: RiskZone) => void;
  emergencyRoute: EmergencyRoute | null;
  onSelectInfrastructure?: (asset: any) => void;
  onScrubTimeStep?: (step: TimeStep) => void;
}

export const MapLibreMap: React.FC<MapProps> = ({
  cyclone,
  riskZones,
  infrastructure,
  selectedZone,
  onSelectZone,
  emergencyRoute,
  onSelectInfrastructure,
  onScrubTimeStep
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreInstance | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const isLoadedRef = useRef<boolean>(false);

  // Status flags
  const [webGL2Supported, setWebGL2Supported] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isUsingFallbackStyle, setIsUsingFallbackStyle] = useState<boolean>(false);

  // Time Machine Digital Twin state
  const [timeIndex, setTimeIndex] = useState(1); // default T-18h
  const [isPlayingTime, setIsPlayingTime] = useState(false);

  // Layer toggle states
  const [layers, setLayers] = useState({
    cycloneTrack: true,
    uncertaintyCone: true,
    riskZones: true,
    hospitals: true,
    shelters: true,
    powerGrid: true,
    roadsBridges: true,
    emergencyRoutes: true,
  });

  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const handleStepSelect = useCallback((idx: number) => {
    setTimeIndex(idx);
    const step = TIME_STEPS[idx];
    if (onScrubTimeStep) {
      onScrubTimeStep(step);
    }
    if (map.current) {
      map.current.easeTo({
        center: [step.lon, step.lat],
        zoom: 9.3,
        duration: 800
      });
    }
  }, [onScrubTimeStep]);

  // Time machine playback loop
  useEffect(() => {
    if (!isPlayingTime) return;
    const interval = setInterval(() => {
      setTimeIndex((prev) => {
        const next = (prev + 1) % TIME_STEPS.length;
        handleStepSelect(next);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlayingTime, handleStepSelect]);

  // Render GeoJSON Layers onto the Map
  const renderGeoJSONLayers = useCallback((m: MapLibreInstance) => {
    if (!m || !m.isStyleLoaded()) return;

    try {
      // 1. Multi-Hazard Risk Zones GeoJSON
      const zonesGeoJSON: any = {
        type: 'FeatureCollection',
        features: (riskZones || []).map(z => ({
          type: 'Feature',
          id: z.id,
          properties: {
            id: z.id,
            name: z.zone_name,
            risk_level: z.risk_level,
            overall_risk: z.overall_risk,
            color: z.risk_level === 'CRITICAL' ? '#ef4444' :
                   z.risk_level === 'HIGH' ? '#f97316' :
                   z.risk_level === 'MEDIUM' ? '#eab308' : '#10b981'
          },
          geometry: z.geometry
        }))
      };

      if (m.getSource('risk-zones-source')) {
        (m.getSource('risk-zones-source') as GeoJSONSource).setData(zonesGeoJSON);
      } else {
        m.addSource('risk-zones-source', {
          type: 'geojson',
          data: zonesGeoJSON
        });

        if (!m.getLayer('risk-zones-fill')) {
          m.addLayer({
            id: 'risk-zones-fill',
            type: 'fill',
            source: 'risk-zones-source',
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.38
            }
          });
        }

        if (!m.getLayer('risk-zones-line')) {
          m.addLayer({
            id: 'risk-zones-line',
            type: 'line',
            source: 'risk-zones-source',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 2.5,
              'line-opacity': 0.95
            }
          });
        }

        // Zone click handler
        m.on('click', 'risk-zones-fill', (e) => {
          if (e.features && e.features.length > 0) {
            const zoneId = e.features[0].properties?.id;
            const target = riskZones.find(z => z.id === zoneId);
            if (target) onSelectZone(target);
          }
        });

        m.on('mouseenter', 'risk-zones-fill', () => {
          m.getCanvas().style.cursor = 'pointer';
        });
        m.on('mouseleave', 'risk-zones-fill', () => {
          m.getCanvas().style.cursor = '';
        });
      }

      // Update visibility based on layers toggle
      if (m.getLayer('risk-zones-fill')) {
        m.setLayoutProperty('risk-zones-fill', 'visibility', layers.riskZones ? 'visible' : 'none');
        m.setLayoutProperty('risk-zones-line', 'visibility', layers.riskZones ? 'visible' : 'none');
      }

      // 2. Cone of Uncertainty
      if (cyclone?.cone_of_uncertainty) {
        const coneData: any = {
          type: 'FeatureCollection',
          features: [cyclone.cone_of_uncertainty]
        };

        if (m.getSource('cone-source')) {
          (m.getSource('cone-source') as GeoJSONSource).setData(coneData);
        } else {
          m.addSource('cone-source', { type: 'geojson', data: coneData });

          if (!m.getLayer('cone-fill')) {
            m.addLayer({
              id: 'cone-fill',
              type: 'fill',
              source: 'cone-source',
              paint: {
                'fill-color': '#dc2626',
                'fill-opacity': 0.18
              }
            });
          }

          if (!m.getLayer('cone-line')) {
            m.addLayer({
              id: 'cone-line',
              type: 'line',
              source: 'cone-source',
              paint: {
                'line-color': '#ef4444',
                'line-width': 1.8,
                'line-dasharray': [3, 2]
              }
            });
          }
        }

        if (m.getLayer('cone-fill')) {
          m.setLayoutProperty('cone-fill', 'visibility', layers.uncertaintyCone ? 'visible' : 'none');
          m.setLayoutProperty('cone-line', 'visibility', layers.uncertaintyCone ? 'visible' : 'none');
        }
      }

      // 3. Cyclone Track Line
      if (cyclone?.track && cyclone.track.length > 0) {
        const lineCoords = cyclone.track.map(t => [t.longitude, t.latitude]);
        const trackData: any = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: lineCoords
              },
              properties: {}
            }
          ]
        };

        if (m.getSource('cyclone-track-source')) {
          (m.getSource('cyclone-track-source') as GeoJSONSource).setData(trackData);
        } else {
          m.addSource('cyclone-track-source', { type: 'geojson', data: trackData });

          if (!m.getLayer('cyclone-track-line')) {
            m.addLayer({
              id: 'cyclone-track-line',
              type: 'line',
              source: 'cyclone-track-source',
              paint: {
                'line-color': '#f87171',
                'line-width': 3,
                'line-opacity': 0.85
              }
            });
          }
        }

        if (m.getLayer('cyclone-track-line')) {
          m.setLayoutProperty('cyclone-track-line', 'visibility', layers.cycloneTrack ? 'visible' : 'none');
        }
      }

      // 4. Emergency Route Lines
      if (emergencyRoute && layers.emergencyRoutes) {
        const normalCoords = emergencyRoute.normal_route.path_coordinates.map(([lat, lon]) => [lon, lat]);
        const riskCoords = emergencyRoute.risk_aware_route.path_coordinates.map(([lat, lon]) => [lon, lat]);

        const routeData: any = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { type: 'normal' },
              geometry: { type: 'LineString', coordinates: normalCoords }
            },
            {
              type: 'Feature',
              properties: { type: 'risk_aware' },
              geometry: { type: 'LineString', coordinates: riskCoords }
            }
          ]
        };

        if (m.getSource('routes-source')) {
          (m.getSource('routes-source') as GeoJSONSource).setData(routeData);
        } else {
          m.addSource('routes-source', { type: 'geojson', data: routeData });

          if (!m.getLayer('route-normal-line')) {
            m.addLayer({
              id: 'route-normal-line',
              type: 'line',
              source: 'routes-source',
              filter: ['==', 'type', 'normal'],
              paint: {
                'line-color': '#ef4444',
                'line-width': 4,
                'line-dasharray': [2, 2],
                'line-opacity': 0.85
              }
            });
          }

          if (!m.getLayer('route-safe-line')) {
            m.addLayer({
              id: 'route-safe-line',
              type: 'line',
              source: 'routes-source',
              filter: ['==', 'type', 'risk_aware'],
              paint: {
                'line-color': '#10b981',
                'line-width': 5,
                'line-opacity': 0.95
              }
            });
          }
        }

        if (m.getLayer('route-normal-line')) {
          m.setLayoutProperty('route-normal-line', 'visibility', 'visible');
          m.setLayoutProperty('route-safe-line', 'visibility', 'visible');
        }
      } else {
        if (m.getLayer('route-normal-line')) {
          m.setLayoutProperty('route-normal-line', 'visibility', 'none');
          m.setLayoutProperty('route-safe-line', 'visibility', 'none');
        }
      }
    } catch (err) {
      console.warn('[SOURCE_LOAD] Safe warning updating GeoJSON layers:', err);
    }
  }, [cyclone, riskZones, layers, emergencyRoute, onSelectZone]);

  // Render Infrastructure and Cyclone Markers
  const renderMarkers = useCallback((m: MapLibreInstance) => {
    // Clear previous markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // 1. Cyclone Center Radar Eye
    if (cyclone) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer';
      el.style.width = '52px';
      el.style.height = '52px';
      el.innerHTML = `
        <div class="cyclone-radar-ring"></div>
        <div class="cyclone-radar-ring-2"></div>
        <div class="w-6 h-6 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg text-white font-bold text-[11px]">
          🌀
        </div>
      `;

      const popup = new Popup({ offset: 25 }).setHTML(`
        <div class="p-1 space-y-1 text-xs">
          <div class="flex items-center space-x-1.5 font-bold text-red-400">
            <span>🌀 ${cyclone.name}</span>
            <span class="text-[10px] px-1 bg-red-900/50 text-red-200 border border-red-700 rounded">${cyclone.category}</span>
          </div>
          <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-300 font-mono text-[11px] pt-1">
            <div>Wind: <span class="text-white font-semibold">${cyclone.wind_speed} km/h</span></div>
            <div>Pressure: <span class="text-white font-semibold">${cyclone.pressure} hPa</span></div>
            <div>Surge: <span class="text-amber-400 font-semibold">${cyclone.storm_surge}m</span></div>
            <div>ETA: <span class="text-red-400 font-semibold">${cyclone.eta_hours}h</span></div>
          </div>
          <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-700">
            Movement: WNW at ${cyclone.movement_speed} km/h
          </div>
        </div>
      `);

      const cycloneMarker = new Marker({ element: el })
        .setLngLat([cyclone.longitude, cyclone.latitude])
        .setPopup(popup)
        .addTo(m);

      markersRef.current.push(cycloneMarker);
    }

    // 2. Track forecast point markers
    if (cyclone?.track && layers.cycloneTrack) {
      cyclone.track.forEach((pt) => {
        if (pt.time === 'NOW') return;
        const ptEl = document.createElement('div');
        ptEl.className = 'w-3 h-3 rounded-full border border-slate-900 shadow text-[8px] flex items-center justify-center';
        ptEl.style.backgroundColor = pt.status === 'OBSERVED' ? '#94a3b8' : '#f87171';

        const ptMarker = new Marker({ element: ptEl })
          .setLngLat([pt.longitude, pt.latitude])
          .setPopup(new Popup({ offset: 10 }).setHTML(`
            <div class="text-[11px] text-slate-200">
              <span class="font-bold text-white">${pt.time}</span>: ${pt.intensity} (${pt.wind_speed} km/h)
            </div>
          `))
          .addTo(m);

        markersRef.current.push(ptMarker);
      });
    }

    // 3. Infrastructure Markers
    (infrastructure || []).forEach((asset) => {
      // Check layer filters
      if (asset.type === 'hospital' && !layers.hospitals) return;
      if (asset.type === 'shelter' && !layers.shelters) return;
      if (asset.type === 'power_station' && !layers.powerGrid) return;
      if ((asset.type === 'road' || asset.type === 'bridge') && !layers.roadsBridges) return;

      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-125 transition-transform';

      let bg = '#3b82f6';
      let icon = '📍';
      if (asset.type === 'hospital') {
        bg = '#ef4444';
        icon = '🏥';
      } else if (asset.type === 'shelter') {
        bg = '#06b6d4';
        icon = '⛺';
      } else if (asset.type === 'power_station') {
        bg = '#eab308';
        icon = '⚡';
      } else if (asset.type === 'bridge') {
        bg = '#a855f7';
        icon = '🌉';
      } else if (asset.type === 'emergency_center') {
        bg = '#10b981';
        icon = '🛡️';
      }

      const riskScore = (asset as any).risk_score;
      const riskBadge = riskScore ? `
        <span class="ml-1 px-1 py-0.2 rounded text-[9px] font-bold ${
          riskScore >= 80 ? 'bg-red-950 text-red-400 border border-red-700' :
          riskScore >= 60 ? 'bg-orange-950 text-orange-400 border border-orange-700' :
          riskScore >= 30 ? 'bg-yellow-950 text-yellow-400 border border-yellow-700' :
          'bg-emerald-950 text-emerald-400 border border-emerald-700'
        }">${riskScore}</span>
      ` : '';

      el.innerHTML = `
        <div class="px-1.5 py-0.5 rounded-full text-white text-[11px] font-bold flex items-center shadow-md border border-white/30" style="background-color: ${bg};">
          <span>${icon}</span>
          ${riskBadge}
        </div>
      `;

      el.addEventListener('click', () => {
        if (onSelectInfrastructure) onSelectInfrastructure(asset);
      });

      const popupHtml = `
        <div class="p-1 space-y-1.5 text-xs max-w-[240px]">
          <div class="flex items-center space-x-1.5 border-b border-slate-700 pb-1">
            <span class="text-sm">${icon}</span>
            <div class="font-bold text-white leading-tight">${asset.name}</div>
          </div>
          <div class="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
            <div>Type: <span class="text-slate-100 font-semibold capitalize">${asset.type.replace('_', ' ')}</span></div>
            <div>Criticality: <span class="text-amber-400 font-semibold">${asset.criticality}</span></div>
            <div>Elevation: <span class="text-slate-100 font-mono">${asset.elevation}m</span></div>
            <div>Coast Dist: <span class="text-slate-100 font-mono">${asset.distance_to_coast_km}km</span></div>
          </div>
          ${riskScore ? `
            <div class="pt-1 border-t border-slate-700/80">
              <div class="flex items-center justify-between">
                <span class="text-slate-400 text-[10px]">Risk Score:</span>
                <span class="font-bold ${
                  riskScore >= 80 ? 'text-red-400' :
                  riskScore >= 60 ? 'text-orange-400' : 'text-emerald-400'
                }">${riskScore} / 100 (${(asset as any).hazard_level || 'EVALUATED'})</span>
              </div>
              <div class="text-[10px] text-amber-200/90 italic mt-0.5">
                ${(asset as any).recommended_action || 'Inspect physical protection.'}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      const marker = new Marker({ element: el })
        .setLngLat([asset.longitude, asset.latitude])
        .setPopup(new Popup({ offset: 15 }).setHTML(popupHtml))
        .addTo(m);

      markersRef.current.push(marker);
    });
  }, [cyclone, infrastructure, layers, onSelectInfrastructure]);

  // Main Map Initialization Effect (runs on mount)
  const initMap = useCallback(() => {
    if (!mapContainer.current || map.current) return;

    // 1. Verify WebGL2 Support
    if (!isWebGL2Available()) {
      setWebGL2Supported(false);
      return;
    }

    try {
      console.log('[MAP_INIT] Initializing MapLibre v6 instance...');

      // 2. Instantiate MapLibre Map with Carto Dark raster style
      const mapInstance = new MapLibreInstance({
        container: mapContainer.current,
        style: CARTO_DARK_RASTER_STYLE,
        center: [82.35, 16.92], // Kakinada / Coastal Andhra Pradesh
        zoom: 9.4,
        attributionControl: false
      });

      // Synchronously assign map.current so subsequent effects have reference immediately
      map.current = mapInstance;
      setInitError(null);

      // Controls
      mapInstance.addControl(new NavigationControl({ showCompass: true }), 'top-right');
      mapInstance.addControl(new ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

      // Error handling & fallback mechanism
      mapInstance.on('error', (event) => {
        console.warn('[MAP_ERROR] MapLibre error event:', event.error?.message || event);
        if (
          !isUsingFallbackStyle &&
          event.error &&
          (event.error.message?.includes('Failed to fetch') || event.error.message?.includes('NetworkError'))
        ) {
          console.warn('[STYLE_LOAD] Falling back to offline tactical grid basemap...');
          setIsUsingFallbackStyle(true);
          mapInstance.setStyle(LOCAL_DARK_FALLBACK_STYLE);
        }
      });

      // Load & Style Load Handlers
      mapInstance.on('load', () => {
        console.log('[MAP_LOAD] MapLibre map successfully loaded.');
        isLoadedRef.current = true;
        mapInstance.resize();
        renderGeoJSONLayers(mapInstance);
        renderMarkers(mapInstance);
      });

      mapInstance.on('style.load', () => {
        console.log('[STYLE_LOAD] Map style ready.');
        if (isLoadedRef.current) {
          renderGeoJSONLayers(mapInstance);
          renderMarkers(mapInstance);
        }
      });
    } catch (err: any) {
      console.error('[MAP_INIT] Exception creating MapLibre map:', err);
      setInitError(err.message || 'Failed to instantiate MapLibre WebGL canvas');
    }
  }, [isUsingFallbackStyle, renderGeoJSONLayers, renderMarkers]);

  useEffect(() => {
    initMap();

    // Set up safe ResizeObserver to prevent 0x0 container collapse
    let animFrame: number;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(animFrame);
      animFrame = requestAnimationFrame(() => {
        if (map.current) {
          map.current.resize();
        }
      });
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    const t = setTimeout(() => {
      if (map.current) map.current.resize();
    }, 150);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(animFrame);
      resizeObserver.disconnect();
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      isLoadedRef.current = false;
    };
  }, [initMap]);

  // Update GeoJSON Layers & Markers whenever data or layer toggles change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    renderGeoJSONLayers(map.current);
    renderMarkers(map.current);
  }, [cyclone, riskZones, infrastructure, layers, emergencyRoute, selectedZone, renderGeoJSONLayers, renderMarkers]);

  // If WebGL2 is not supported, show informative UI
  if (!webGL2Supported) {
    return (
      <div className="relative w-full h-full min-h-[500px] flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">MAP RENDERING UNAVAILABLE</h3>
        <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">
          This browser/device does not currently provide WebGL2 (required by MapLibre v6).
        </p>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg p-3 text-left space-y-1">
          <div className="font-semibold text-slate-300">Try:</div>
          <div>• Enabling hardware acceleration in browser settings</div>
          <div>• Updating your graphics drivers and browser</div>
          <div>• Using Google Chrome, Microsoft Edge, or Mozilla Firefox</div>
        </div>
      </div>
    );
  }

  // If Map instantiation threw a catchable error
  if (initError) {
    return (
      <div className="relative w-full h-full min-h-[500px] flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 text-center border border-red-900/40">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Map Unavailable</h3>
        <p className="text-xs text-red-400 font-mono mb-2">Map initialization failed</p>
        <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
          {initError}
        </p>
        <button
          onClick={() => {
            setInitError(null);
            initMap();
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-lg cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Map Initialization</span>
        </button>
      </div>
    );
  }

  return (
    <div className="stormshield-map-wrapper relative w-full h-full min-h-[500px] flex-1 bg-slate-950 overflow-hidden">
      {/* MapLibre DOM Node */}
      <div 
        ref={mapContainer} 
        className="stormshield-map-canvas absolute inset-0 w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      />

      {/* Fallback Basemap Notice Badge */}
      {isUsingFallbackStyle && (
        <div className="absolute top-3 right-14 z-20 bg-amber-950/90 border border-amber-600/80 text-amber-200 px-3 py-1.5 rounded-lg text-[10px] font-semibold flex items-center space-x-1.5 shadow-xl backdrop-blur">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>BASEMAP UNAVAILABLE — Showing StormShield Local Simulation Layers</span>
        </div>
      )}

      {/* Floating Layer Toggles Control */}
      <div className="absolute top-3 left-3 z-10">
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 shadow-xl backdrop-blur cursor-pointer"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">Layers & Hazards</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-mono">
              {Object.values(layers).filter(Boolean).length}
            </span>
          </button>

          {showLayerMenu && (
            <div className="absolute top-11 left-0 w-64 bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl p-3 backdrop-blur z-20 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800 flex justify-between items-center">
                <span>Hazard Layers</span>
                <button
                  onClick={() => setShowLayerMenu(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {[
                  { key: 'cycloneTrack', label: 'Cyclone Track & Centers', color: '#f87171' },
                  { key: 'uncertaintyCone', label: 'Uncertainty Cone', color: '#dc2626' },
                  { key: 'riskZones', label: 'Risk Inundation Zones', color: '#f97316' },
                  { key: 'hospitals', label: 'Hospitals (1.0 Criticality)', color: '#ef4444' },
                  { key: 'shelters', label: 'Cyclone Shelters (MPCS)', color: '#06b6d4' },
                  { key: 'powerGrid', label: 'Power Grid Substations', color: '#eab308' },
                  { key: 'roadsBridges', label: 'Roads & Bridges', color: '#a855f7' },
                  { key: 'emergencyRoutes', label: 'Emergency Evacuation Routes', color: '#10b981' },
                ].map(({ key, label, color }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-1 rounded hover:bg-slate-800/80 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-slate-200">{label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={(layers as any)[key]}
                      onChange={(e) => setLayers({ ...layers, [key]: e.target.checked })}
                      className="rounded border-slate-700 text-blue-500 focus:ring-0 focus:ring-offset-0 bg-slate-800"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs backdrop-blur shadow-xl max-w-[210px]">
        <div className="font-bold text-slate-300 mb-1 text-[11px] uppercase tracking-wider flex items-center justify-between">
          <span>Multi-Hazard Risk</span>
          <span className="text-[10px] text-slate-500 font-mono">0-100</span>
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-red-600 border border-red-400" />
            <span className="text-slate-200 font-semibold">CRITICAL (80-100)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-orange-500 border border-orange-300" />
            <span className="text-slate-200 font-semibold">HIGH (60-80)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-yellow-500 border border-yellow-300" />
            <span className="text-slate-200 font-semibold">MEDIUM (30-60)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-300" />
            <span className="text-slate-200 font-semibold">LOW (0-30)</span>
          </div>
        </div>

        {emergencyRoute && (
          <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 text-[10px]">
            <div className="font-bold text-slate-400 uppercase">Routing Legend</div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-0.5 bg-red-500 border border-dashed border-red-300" />
              <span className="text-red-300">Normal (Flood Blocked)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-1 bg-emerald-400 rounded" />
              <span className="text-emerald-300">Risk-Aware (Safe Route)</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Time Machine Slider Control Bar */}
      <div className="absolute bottom-4 left-4 z-20 w-[calc(100%-240px)] max-w-xl bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3 shadow-2xl backdrop-blur-xl space-y-2">
        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-black text-slate-100 uppercase tracking-wider text-[11px]">TIME MACHINE</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-500/30">
              {TIME_STEPS[timeIndex].label}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-mono">
            <span className="text-sky-400 font-bold">{TIME_STEPS[timeIndex].wind} km/h</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-bold">{TIME_STEPS[timeIndex].surge}m surge</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400 font-bold">{TIME_STEPS[timeIndex].pop.toLocaleString()} pop</span>
          </div>
        </div>

        {/* Timeline Slider Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlayingTime(!isPlayingTime)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer shrink-0"
            title={isPlayingTime ? 'Pause Time Machine' : 'Play Time Machine Animation'}
          >
            {isPlayingTime ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <div className="flex-1 flex items-center justify-between bg-slate-950/80 rounded-xl p-1 border border-slate-800">
            {TIME_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => handleStepSelect(idx)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                  timeIndex === idx
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-105'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
