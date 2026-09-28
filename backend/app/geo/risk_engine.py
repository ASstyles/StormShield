"""
Deterministic Geospatial Risk Engine for StormShield.
Implements modular, explainable mathematical models for:
- Flood Susceptibility
- Storm Surge Susceptibility
- Wind Field Hazard
- Infrastructure Vulnerability & Exposure
- Multi-hazard Overall Risk & Explainability Breakdown

NOTE: This is a prototype/model parameter engine designed for decision-support intelligence.
It is explicitly labeled as prototype simulation logic and does not claim to replace official meteorological warnings.
"""

from typing import Dict, Any, List, Tuple
from app.config import settings
import math

class RiskEngine:
    def __init__(self):
        # Configurable weights from settings
        self.w_flood = settings.RISK_WEIGHT_FLOOD
        self.w_surge = settings.RISK_WEIGHT_SURGE
        self.w_wind = settings.RISK_WEIGHT_WIND
        self.w_infra = settings.RISK_WEIGHT_INFRASTRUCTURE

        self.w_rain = settings.FLOOD_WEIGHT_RAINFALL
        self.w_elev = settings.FLOOD_WEIGHT_ELEVATION
        self.w_coast = settings.FLOOD_WEIGHT_COASTAL
        self.w_hist = settings.FLOOD_WEIGHT_HISTORICAL

        # Asset criticality dictionary
        self.criticality_map = {
            "hospital": 1.0,
            "emergency_center": 1.0,
            "power_station": 0.95,
            "shelter": 0.90,
            "bridge": 0.90,
            "road": 0.85,
            "school": 0.70,
            "warehouse": 0.30
        }

    def calculate_flood_risk(
        self,
        rainfall_mm: float,
        elevation_m: float,
        distance_to_coast_km: float,
        historical_flood_score: float = 50.0
    ) -> Tuple[float, Dict[str, float]]:
        """
        Prototype flood susceptibility model:
        flood_risk = rainfall_score * 0.35 + elevation_score * 0.30 + coastal_exposure * 0.20 + historical_flood_score * 0.15
        Normalized to 0 - 100.
        """
        # 1. Rainfall score: 0 to 400mm mapped to 0-100
        rain_score = min(100.0, max(0.0, (rainfall_mm / 350.0) * 100.0))
        
        # 2. Elevation score: 0m = 100 risk, >= 30m = 0 risk (exponential decay)
        elev_score = max(0.0, min(100.0, 100.0 * math.exp(-0.12 * max(0.0, elevation_m))))
        
        # 3. Coastal proximity exposure: 0km = 100 risk, >= 25km = 0 risk
        coast_score = max(0.0, min(100.0, 100.0 * (1.0 - min(25.0, distance_to_coast_km) / 25.0)))
        
        # 4. Historical flood score (default ~50-80 for deltaic coastal AP)
        hist_score = max(0.0, min(100.0, historical_flood_score))
        
        raw_flood_risk = (
            rain_score * self.w_rain +
            elev_score * self.w_elev +
            coast_score * self.w_coast +
            hist_score * self.w_hist
        )
        flood_risk = round(min(100.0, max(0.0, raw_flood_risk)), 1)
        
        # Factor contribution percentages for explainability
        total_points = (
            rain_score * self.w_rain +
            elev_score * self.w_elev +
            coast_score * self.w_coast +
            hist_score * self.w_hist
        )
        if total_points <= 0:
            total_points = 1.0

        contributions = {
            "rainfall_contribution": round((rain_score * self.w_rain / total_points) * 100.0, 1),
            "elevation_contribution": round((elev_score * self.w_elev / total_points) * 100.0, 1),
            "coastal_exposure_contribution": round((coast_score * self.w_coast / total_points) * 100.0, 1),
            "historical_susceptibility_contribution": round((hist_score * self.w_hist / total_points) * 100.0, 1)
        }

        return flood_risk, contributions

    def calculate_surge_risk(
        self,
        cyclone_wind_kmh: float,
        central_pressure_hpa: float,
        distance_to_eye_km: float,
        distance_to_coast_km: float,
        elevation_m: float
    ) -> float:
        """
        Prototype storm-surge susceptibility model:
        Surge risk combines cyclone intensity (wind & central pressure drop),
        radial distance to storm center, distance to coastline, and terrain elevation.
        """
        # Pressure drop factor: 1013 hPa normal, down to 920 hPa extreme
        delta_p = max(0.0, 1013.0 - central_pressure_hpa)
        pressure_factor = min(1.0, delta_p / 70.0) # 0 to 1
        
        # Wind stress factor: 80 km/h to 220 km/h
        wind_factor = min(1.0, max(0.0, (cyclone_wind_kmh - 60.0) / 140.0))
        intensity_score = (pressure_factor * 0.4 + wind_factor * 0.6) * 100.0

        # Proximity to eye (decay beyond 150km)
        eye_proximity = max(0.0, 1.0 - (distance_to_eye_km / 220.0))

        # Coastal penetration limit (surge rapidly dissipates inland, > 10km rarely sees surge)
        surge_coastal_reach = max(0.0, 1.0 - (distance_to_coast_km / 8.0))

        # Elevation dampening (elevation > 5m buffers most storm surges in Bay of Bengal)
        elev_attenuation = max(0.0, 1.0 - (elevation_m / 6.0))

        raw_surge = intensity_score * 0.40 + (eye_proximity * 100.0) * 0.25 + (surge_coastal_reach * 100.0) * 0.25 + (elev_attenuation * 100.0) * 0.10
        # If far inland (>10km) or elevation > 7m, surge drops towards 0
        if distance_to_coast_km > 10.0 or elevation_m > 7.0:
            raw_surge *= 0.2
        if distance_to_coast_km > 20.0:
            raw_surge = 0.0

        return round(min(100.0, max(0.0, raw_surge)), 1)

    def calculate_wind_risk(
        self,
        cyclone_wind_kmh: float,
        distance_to_eye_km: float,
        radius_max_wind_km: float = 45.0
    ) -> float:
        """
        Modified Rankine vortex model approximation for radial wind degradation.
        """
        if distance_to_eye_km <= radius_max_wind_km:
            local_wind = cyclone_wind_kmh * (distance_to_eye_km / max(1.0, radius_max_wind_km))
        else:
            # Decay with distance exponent ~0.5
            decay = (radius_max_wind_km / distance_to_eye_km) ** 0.5
            local_wind = cyclone_wind_kmh * decay

        # Map local wind speed (km/h) to 0 - 100 risk score
        # 60 km/h = 20, 120 km/h = 60, 180 km/h = 95
        wind_risk = min(100.0, max(0.0, (local_wind / 180.0) * 100.0))
        return round(wind_risk, 1)

    def calculate_infrastructure_risk(
        self,
        asset_type: str,
        hazard_score: float,
        distance_to_coast_km: float,
        elevation_m: float
    ) -> Tuple[float, str, Dict[str, Any]]:
        """
        Calculates hazard exposure * criticality for a specific infrastructure asset.
        """
        criticality = self.criticality_map.get(asset_type.lower(), 0.5)
        raw_risk = hazard_score * criticality
        risk_score = round(min(100.0, max(0.0, raw_risk)), 1)

        level = self.get_risk_level(risk_score)

        explanation = {
            "hazard_score": hazard_score,
            "criticality": criticality,
            "elevation_m": elevation_m,
            "distance_to_coast_km": distance_to_coast_km,
            "risk_score": risk_score
        }

        return risk_score, level, explanation

    def calculate_overall_risk(
        self,
        flood_risk: float,
        surge_risk: float,
        wind_risk: float,
        infra_risk: float
    ) -> Tuple[float, str]:
        """
        Computes weighted multi-hazard overall risk score:
        overall_risk = 0.35*flood + 0.25*surge + 0.20*wind + 0.20*infra
        """
        overall = (
            self.w_flood * flood_risk +
            self.w_surge * surge_risk +
            self.w_wind * wind_risk +
            self.w_infra * infra_risk
        )
        score = round(min(100.0, max(0.0, overall)), 1)
        level = self.get_risk_level(score)
        return score, level

    def get_risk_level(self, score: float) -> str:
        """
        0-30 = LOW
        30-60 = MEDIUM
        60-80 = HIGH
        80-100 = CRITICAL
        """
        if score >= 80.0:
            return "CRITICAL"
        elif score >= 60.0:
            return "HIGH"
        elif score >= 30.0:
            return "MEDIUM"
        else:
            return "LOW"

risk_engine = RiskEngine()
