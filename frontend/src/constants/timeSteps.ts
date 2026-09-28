// Time machine timeline steps (grounded in Kakinada coastal geography)
export interface TimeStep {
  id: string;
  label: string;
  wind: number;
  surge: number;
  rain: number;
  pop: number;
  hosp: number;
  roads: number;
  lat: number;
  lon: number;
}

export const TIME_STEPS: TimeStep[] = [
  { id: 'T-24h', label: 'T - 24h', wind: 120, surge: 1.4, rain: 120, pop: 48500, hosp: 1, roads: 12, lat: 16.50, lon: 83.10 },
  { id: 'T-18h', label: 'T - 18h', wind: 145, surge: 2.8, rain: 280, pop: 142500, hosp: 3, roads: 28, lat: 16.80, lon: 82.60 },
  { id: 'T-12h', label: 'T - 12h', wind: 155, surge: 3.2, rain: 340, pop: 185000, hosp: 5, roads: 44, lat: 16.90, lon: 82.40 },
  { id: 'T-6h', label: 'T - 6h', wind: 165, surge: 3.6, rain: 390, pop: 215000, hosp: 8, roads: 64, lat: 16.98, lon: 82.30 },
  { id: 'LANDFALL', label: 'Landfall', wind: 175, surge: 4.1, rain: 450, pop: 260000, hosp: 10, roads: 82, lat: 17.02, lon: 82.25 },
  { id: 'T+6h', label: 'T + 6h', wind: 110, surge: 2.1, rain: 180, pop: 95000, hosp: 4, roads: 36, lat: 17.25, lon: 82.10 },
];
