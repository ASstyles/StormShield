import {
  Cyclone,
  RiskZone,
  InfrastructureAsset,
  InfrastructureAtRisk,
  Alert,
  EmergencyRoute,
  AIAnalysisResult,
  AIImageAnalysisResult,
  SimulateImpactResult,
  AnalyticsSummary
} from '../types';

const BASE_URL = '/api';

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}

export async function fetchCyclones(): Promise<Cyclone[]> {
  const res = await fetch(`${BASE_URL}/cyclones`);
  if (!res.ok) throw new Error('Failed to load cyclones');
  return res.json();
}

export async function fetchRiskZones(): Promise<RiskZone[]> {
  const res = await fetch(`${BASE_URL}/risk/zones`);
  if (!res.ok) throw new Error('Failed to load risk zones');
  return res.json();
}

export async function fetchRiskZoneDetails(id: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/risk/zones/${id}`);
  if (!res.ok) throw new Error(`Failed to load risk zone ${id}`);
  return res.json();
}

export async function fetchInfrastructure(): Promise<InfrastructureAsset[]> {
  const res = await fetch(`${BASE_URL}/infrastructure`);
  if (!res.ok) throw new Error('Failed to load infrastructure');
  return res.json();
}

export async function fetchInfrastructureAtRisk(): Promise<InfrastructureAtRisk[]> {
  const res = await fetch(`${BASE_URL}/infrastructure/at-risk`);
  if (!res.ok) throw new Error('Failed to load at-risk infrastructure');
  return res.json();
}

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(`${BASE_URL}/alerts`);
  if (!res.ok) throw new Error('Failed to load alerts');
  return res.json();
}

export async function analyzeEmergencyRoute(
  start_point?: string,
  destination_point?: string
): Promise<EmergencyRoute> {
  const res = await fetch(`${BASE_URL}/routes/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start_point, destination_point })
  });
  if (!res.ok) throw new Error('Failed to compute emergency route');
  return res.json();
}

export async function simulateCycloneImpact(params: {
  latitude?: number;
  longitude?: number;
  wind_speed?: number;
  pressure?: number;
  rainfall?: number;
  storm_surge?: number;
  eta_hours?: number;
}): Promise<SimulateImpactResult> {
  const res = await fetch(`${BASE_URL}/cyclones/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to simulate cyclone impact');
  return res.json();
}

export async function analyzeZoneWithAI(payload: {
  zone_id: string;
  population?: number;
  cyclone_info?: any;
  risk_values?: any;
  infrastructure_exposure?: any;
}): Promise<AIAnalysisResult> {
  const res = await fetch(`${BASE_URL}/ai/analyze-zone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('AI zone analysis failed');
  return res.json();
}

export async function analyzeSatelliteImage(file?: File): Promise<AIImageAnalysisResult> {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  const res = await fetch(`${BASE_URL}/ai/analyze-image`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Multimodal image analysis failed');
  return res.json();
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${BASE_URL}/analytics/summary`);
  if (!res.ok) throw new Error('Failed to load analytics summary');
  return res.json();
}

// ----------------- Infrastructure Cascade & What Breaks First -----------------
export async function fetchInfrastructureCascade(assetId: string, hazardLevel: string = 'CRITICAL'): Promise<any> {
  const res = await fetch(`${BASE_URL}/infrastructure/cascade/${assetId}?hazard_level=${hazardLevel}`);
  if (!res.ok) throw new Error('Failed to load infrastructure cascade analysis');
  return res.json();
}

export async function fetchWhatBreaksFirst(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/infrastructure/what-breaks-first`);
  if (!res.ok) throw new Error('Failed to load what-breaks-first prioritization');
  return res.json();
}

// ----------------- Ask AI Emergency Commander -----------------
export async function askAICommander(payload: {
  question: string;
  zone_id?: string;
  cyclone_state?: any;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/ai/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('AI Commander query failed');
  return res.json();
}

// ----------------- Resource Pre-Positioning Optimizer -----------------
export async function optimizeResources(payload: {
  ambulances_available?: number;
  rescue_boats_available?: number;
  generators_available?: number;
  medical_kits_available?: number;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/resources/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to compute resource optimization');
  return res.json();
}

// ----------------- Resilience Index -----------------
export async function fetchResilienceScores(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/resilience/scores`);
  if (!res.ok) throw new Error('Failed to load resilience scores');
  return res.json();
}

// ----------------- BRICS Federated Resilience -----------------
export async function simulateFederatedExchange(): Promise<any> {
  const res = await fetch(`${BASE_URL}/federated/simulate`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to simulate federated learning exchange');
  return res.json();
}

// ----------------- 6-Hour Anticipatory Action Clock -----------------
export async function fetchActionClock(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/action-clock`);
  if (!res.ok) throw new Error('Failed to load action clock');
  return res.json();
}

// ----------------- Before vs After Intervention -----------------
export async function fetchBeforeAfterIntervention(): Promise<any> {
  const res = await fetch(`${BASE_URL}/simulation/before-after`);
  if (!res.ok) throw new Error('Failed to load before/after intervention data');
  return res.json();
}

// ----------------- Time Machine Steps -----------------
export async function fetchTimeMachineSteps(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/time-machine/steps`);
  if (!res.ok) throw new Error('Failed to load time machine steps');
  return res.json();
}

