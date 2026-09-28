import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cyclone, 
  RiskZone, 
  InfrastructureAtRisk, 
  Alert, 
  EmergencyRoute 
} from './types';
import { 
  fetchCyclones, 
  fetchRiskZones, 
  fetchInfrastructureAtRisk, 
  fetchAlerts, 
  analyzeEmergencyRoute,
  simulateCycloneImpact
} from './services/api';

import { Header } from './components/Header';
import { CycloneSidebar } from './components/CycloneSidebar';
import { MapLibreMap } from './components/MapLibreMap';
import { MapErrorBoundary } from './components/MapErrorBoundary';
import { TIME_STEPS } from './constants/timeSteps';
import { ZoneDetailPanel } from './components/ZoneDetailPanel';

// Signature Feature Pages
import { ScenarioSimulatorPage } from './pages/ScenarioSimulatorPage';
import { EmergencyRoutingPage } from './pages/EmergencyRoutingPage';
import { InfrastructurePage } from './pages/InfrastructurePage';
import { ActionClockPage } from './pages/ActionClockPage';
import { ResourceOptimizerPage } from './pages/ResourceOptimizerPage';
import { BeforeAfterPage } from './pages/BeforeAfterPage';
import { MultimodalPage } from './pages/MultimodalPage';
import { BricsNetworkPage } from './pages/BricsNetworkPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { OverviewPage } from './pages/OverviewPage';

// Signature Modals
import { AskCommanderModal } from './components/AskCommanderModal';
import { DataTrustModal } from './components/DataTrustModal';
import { JudgeDemoTour } from './components/JudgeDemoTour';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('command-center');
  const [cyclone, setCyclone] = useState<Cyclone | null>(null);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(null);
  const [infrastructure, setInfrastructure] = useState<InfrastructureAtRisk[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [emergencyRoute, setEmergencyRoute] = useState<EmergencyRoute | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal Dialog States
  const [isAskCommanderOpen, setIsAskCommanderOpen] = useState(false);
  const [isDataTrustOpen, setIsDataTrustOpen] = useState(false);
  const [isJudgeTourOpen, setIsJudgeTourOpen] = useState(false);

  const loadInitialData = useCallback(async () => {
    try {
      const [cyclonesData, zonesData, infraData, alertsData] = await Promise.all([
        fetchCyclones().catch(() => []),
        fetchRiskZones().catch(() => []),
        fetchInfrastructureAtRisk().catch(() => []),
        fetchAlerts().catch(() => [])
      ]);

      if (cyclonesData.length > 0) {
        setCyclone(cyclonesData[0]);
      }
      setRiskZones(zonesData);
      if (zonesData.length > 0) {
        const primaryZone = zonesData.find(z => z.id === 'ZONE-AP-01') || zonesData[0];
        setSelectedZone(primaryZone);
      }
      setInfrastructure(infraData);
      setAlerts(alertsData);

      // Pre-calculate baseline emergency route
      const routeData = await analyzeEmergencyRoute(
        'Kakinada General Hospital',
        'Samalkot Cyclone Relief Shelter'
      ).catch(() => null);
      if (routeData) {
        setEmergencyRoute(routeData);
      }
    } catch (err) {
      console.error('Failed to load initial StormShield data:', err);
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Master Emergency Simulation trigger
  const handleRunEmergencySimulation = async () => {
    setIsSimulating(true);
    showToast('Advancing Cyclone Track & Recalculating Multi-Hazard Footprint...');
    try {
      const res = await simulateCycloneImpact({
        latitude: 16.80,
        longitude: 82.55,
        wind_speed: 155.0,
        pressure: 955.0,
        rainfall: 330.0,
        storm_surge: 3.4,
        eta_hours: 8.0
      });

      setCyclone(res.cyclone);
      const updatedZones = await fetchRiskZones();
      setRiskZones(updatedZones);
      
      const updatedInfra = await fetchInfrastructureAtRisk();
      setInfrastructure(updatedInfra);

      setAlerts(res.alerts_triggered);

      if (selectedZone) {
        const fresh = updatedZones.find(z => z.id === selectedZone.id);
        if (fresh) setSelectedZone(fresh);
      }

      const updatedRoute = await analyzeEmergencyRoute(
        'Kakinada General Hospital',
        'Samalkot Cyclone Relief Shelter'
      );
      setEmergencyRoute(updatedRoute);

      showToast('⚠️ Emergency Simulation Active: Cyclone advanced to T-8h. Hazard zones & cascade alerts updated.');
    } catch (err) {
      console.error('Simulation error:', err);
      showToast('Error executing emergency simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleScrubTimeStep = (step: typeof TIME_STEPS[0]) => {
    showToast(`Time Machine scrubbed to ${step.label}: Wind ${step.wind} km/h, Surge ${step.surge}m. Population exposed: ${step.pop.toLocaleString()}`);
    if (cyclone) {
      setCyclone({
        ...cyclone,
        latitude: step.lat,
        longitude: step.lon,
        wind_speed: step.wind,
        storm_surge: step.surge,
        rainfall: step.rain,
        eta_hours: step.id === 'LANDFALL' ? 0 : (step.id === 'T-6h' ? 6 : (step.id === 'T-12h' ? 12 : 18))
      });
    }
    if (selectedZone) {
      setSelectedZone({
        ...selectedZone,
        population_exposed: step.pop,
        rainfall_forecast: step.rain,
        surge_risk: Math.min(100, Math.round(step.surge * 25)),
        wind_risk: Math.min(100, Math.round((step.wind / 180) * 100))
      });
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleOpenRouting = (_hosp?: string, _shelter?: string) => {
    setActiveTab('routing');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Operations Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunEmergencySimulation={handleRunEmergencySimulation}
        isSimulating={isSimulating}
        activeAlertCount={alerts.filter(a => a.severity === 'CRITICAL').length}
        onOpenAskCommander={() => setIsAskCommanderOpen(true)}
        onOpenDataTrust={() => setIsDataTrustOpen(true)}
        onStartJudgeTour={() => setIsJudgeTourOpen(true)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 border border-red-500/80 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center space-x-2 font-semibold animate-bounce backdrop-blur">
          <span>🚨</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* 1. Command Center / Digital Twin */}
        {activeTab === 'command-center' && (
          <div className="flex w-full h-full overflow-hidden">
            <CycloneSidebar
              cyclone={cyclone}
              onRunEmergencySimulation={handleRunEmergencySimulation}
              isSimulating={isSimulating}
              selectedZone={selectedZone}
              riskZones={riskZones}
            />

            <div className="flex-1 relative h-full min-h-[500px] overflow-hidden">
              <MapErrorBoundary>
                <MapLibreMap
                  cyclone={cyclone}
                  riskZones={riskZones}
                  infrastructure={infrastructure}
                  selectedZone={selectedZone}
                  onSelectZone={(z) => setSelectedZone(z)}
                  emergencyRoute={emergencyRoute}
                  onSelectInfrastructure={(asset) => {
                    showToast(`Selected asset: ${asset.name} (${asset.type}) - Criticality: ${asset.criticality}`);
                  }}
                  onScrubTimeStep={handleScrubTimeStep}
                />
              </MapErrorBoundary>
            </div>

            <ZoneDetailPanel
              zone={selectedZone}
              infrastructure={infrastructure}
              onOpenRoutingToShelter={handleOpenRouting}
            />
          </div>
        )}

        {/* 2. What-If Scenario Simulator */}
        {activeTab === 'simulator' && (
          <div className="w-full h-full overflow-y-auto">
            <ScenarioSimulatorPage
              currentCyclone={cyclone}
              onSimulationComplete={async (res) => {
                setCyclone(res.cyclone);
                const updatedZones = await fetchRiskZones();
                setRiskZones(updatedZones);
                const updatedInfra = await fetchInfrastructureAtRisk();
                setInfrastructure(updatedInfra);
                setAlerts(res.alerts_triggered);
                showToast(`Simulation Applied: ${res.scenario_id}`);
              }}
            />
          </div>
        )}

        {/* 3. Infrastructure & Cascade Engine */}
        {activeTab === 'infrastructure' && (
          <div className="w-full h-full overflow-y-auto">
            <InfrastructurePage
              infrastructure={infrastructure}
            />
          </div>
        )}

        {/* 4. Evacuation Routing */}
        {activeTab === 'routing' && (
          <div className="w-full h-full overflow-y-auto">
            <EmergencyRoutingPage
              onViewOnMap={(rt) => {
                setEmergencyRoute(rt);
                setActiveTab('command-center');
              }}
            />
          </div>
        )}

        {/* 5. 6-Hour Anticipatory Action Clock */}
        {activeTab === 'action-clock' && (
          <div className="w-full h-full overflow-y-auto">
            <ActionClockPage />
          </div>
        )}

        {/* 6. Resource Pre-Positioning Optimizer */}
        {activeTab === 'resources' && (
          <div className="w-full h-full overflow-y-auto">
            <ResourceOptimizerPage />
          </div>
        )}

        {/* 7. Before vs After Intervention Simulator */}
        {activeTab === 'before-after' && (
          <div className="w-full h-full overflow-y-auto">
            <BeforeAfterPage />
          </div>
        )}

        {/* 8. Satellite & Multimodal AI Analyst */}
        {activeTab === 'multimodal' && (
          <div className="w-full h-full overflow-y-auto">
            <MultimodalPage />
          </div>
        )}

        {/* 9. BRICS Disaster Resilience Network */}
        {activeTab === 'brics' && (
          <div className="w-full h-full overflow-y-auto">
            <BricsNetworkPage />
          </div>
        )}

        {/* 10. Analytics & Resilience Score */}
        {activeTab === 'analytics' && (
          <div className="w-full h-full overflow-y-auto">
            <AnalyticsPage />
          </div>
        )}

        {/* 11. Alerts */}
        {activeTab === 'alerts' && (
          <div className="w-full h-full overflow-y-auto">
            <AlertsPage alerts={alerts} />
          </div>
        )}

        {/* 12. Cinematic Overview & Protocol Landing */}
        {activeTab === 'overview' && (
          <div className="w-full h-full overflow-y-auto">
            <OverviewPage 
              onEnterCommandCenter={() => setActiveTab('command-center')}
              onEnterSimulator={() => setActiveTab('simulator')}
            />
          </div>
        )}
      </main>

      {/* Signature Modals */}
      <AskCommanderModal
        isOpen={isAskCommanderOpen}
        onClose={() => setIsAskCommanderOpen(false)}
        activeZoneId={selectedZone?.id}
        cycloneState={cyclone}
      />

      <DataTrustModal
        isOpen={isDataTrustOpen}
        onClose={() => setIsDataTrustOpen(false)}
      />

      <JudgeDemoTour
        isOpen={isJudgeTourOpen}
        onClose={() => setIsJudgeTourOpen(false)}
        onNavigateTab={(tabId) => setActiveTab(tabId)}
        onTriggerSimulation={handleRunEmergencySimulation}
        onOpenAskAI={() => setIsAskCommanderOpen(true)}
      />
    </div>
  );
}

export default App;
