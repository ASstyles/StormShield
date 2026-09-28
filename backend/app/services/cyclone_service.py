import copy
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.db_models import CycloneModel, RiskZoneModel, InfrastructureModel
from app.geo.risk_engine import risk_engine
from app.services.infrastructure_service import infra_service
from app.services.alert_service import alert_service
from app.models.schemas import SimulateCycloneRequest, BeforeAfterMetric

class CycloneService:
    def get_cyclone(self, db: Session, cyclone_id: str) -> Optional[Dict[str, Any]]:
        c = db.query(CycloneModel).filter(CycloneModel.id == cyclone_id).first()
        if not c:
            return None
        return {
            "id": c.id,
            "name": c.name,
            "category": c.category,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "wind_speed": c.wind_speed,
            "pressure": c.pressure,
            "rainfall": c.rainfall,
            "storm_surge": c.storm_surge,
            "movement_direction": c.movement_direction,
            "movement_speed": c.movement_speed,
            "radius": c.radius,
            "eta_hours": c.eta_hours,
            "track": c.track or [],
            "cone_of_uncertainty": c.cone_of_uncertainty or {}
        }

    def list_cyclones(self, db: Session) -> List[Dict[str, Any]]:
        cyclones = db.query(CycloneModel).all()
        return [self.get_cyclone(db, c.id) for c in cyclones if c]

    def simulate_cyclone_impact(
        self,
        db: Session,
        params: SimulateCycloneRequest,
        cyclone_id: str = "CYCLONE-2026-AP01"
    ) -> Dict[str, Any]:
        """
        Executes deterministic impact simulation given modified cyclone parameters.
        Computes before-and-after comparison metrics for:
        - Population exposed
        - Hospitals at risk
        - Road disruption km
        - Power stations exposed
        - Overall composite hazard index
        """
        cyclone = db.query(CycloneModel).filter(CycloneModel.id == cyclone_id).first()
        zones = db.query(RiskZoneModel).all()

        # Capture BEFORE baseline metrics
        before_pop = sum(z.population_exposed for z in zones if z.overall_risk >= 60.0)
        before_infra = infra_service.get_infrastructure_at_risk(db)
        before_hosp = len([a for a in before_infra if a["type"] == "hospital" and a["risk_score"] >= 60.0])
        before_power = len([a for a in before_infra if a["type"] == "power_station" and a["risk_score"] >= 60.0])
        before_roads_km = 18.5
        before_avg_risk = sum(z.overall_risk for z in zones) / max(1, len(zones))

        # Apply simulation parameters
        sim_lat = params.latitude if params.latitude is not None else cyclone.latitude
        sim_lon = params.longitude if params.longitude is not None else cyclone.longitude
        sim_wind = params.wind_speed if params.wind_speed is not None else cyclone.wind_speed
        sim_press = params.pressure if params.pressure is not None else cyclone.pressure
        sim_rain = params.rainfall if params.rainfall is not None else cyclone.rainfall
        sim_surge = params.storm_surge if params.storm_surge is not None else cyclone.storm_surge
        sim_eta = params.eta_hours if params.eta_hours is not None else cyclone.eta_hours

        # Update cyclone model in DB or transient copy
        cyclone.latitude = sim_lat
        cyclone.longitude = sim_lon
        cyclone.wind_speed = sim_wind
        cyclone.pressure = sim_press
        cyclone.rainfall = sim_rain
        cyclone.storm_surge = sim_surge
        cyclone.eta_hours = sim_eta

        # Recalculate each risk zone based on proximity to simulated cyclone center
        for z in zones:
            # Estimate distance from simulated eye to zone center
            poly_coords = z.geometry.get("coordinates", [[]])[0]
            if poly_coords:
                zone_center_lon = sum(pt[0] for pt in poly_coords) / len(poly_coords)
                zone_center_lat = sum(pt[1] for pt in poly_coords) / len(poly_coords)
            else:
                zone_center_lat, zone_center_lon = 16.95, 82.23

            dist_to_eye_km = ((zone_center_lat - sim_lat)**2 + (zone_center_lon - sim_lon)**2)**0.5 * 111.0

            # 1. Flood risk
            local_rain = max(50.0, sim_rain * max(0.4, 1.0 - (dist_to_eye_km / 220.0)))
            new_flood, flood_factors = risk_engine.calculate_flood_risk(
                rainfall_mm=local_rain,
                elevation_m=z.elevation_mean,
                distance_to_coast_km=z.distance_to_coast_km
            )

            # 2. Surge risk
            new_surge = risk_engine.calculate_surge_risk(
                cyclone_wind_kmh=sim_wind,
                central_pressure_hpa=sim_press,
                distance_to_eye_km=dist_to_eye_km,
                distance_to_coast_km=z.distance_to_coast_km,
                elevation_m=z.elevation_mean
            )

            # 3. Wind risk
            new_wind = risk_engine.calculate_wind_risk(
                cyclone_wind_kmh=sim_wind,
                distance_to_eye_km=dist_to_eye_km
            )

            # 4. Infrastructure risk (zone baseline)
            raw_infra_hazard = (new_flood * 0.4 + new_surge * 0.4 + new_wind * 0.2)
            new_infra_risk = round(min(100.0, raw_infra_hazard * 0.95), 1)

            # 5. Overall composite
            new_overall, new_level = risk_engine.calculate_overall_risk(
                flood_risk=new_flood,
                surge_risk=new_surge,
                wind_risk=new_wind,
                infra_risk=new_infra_risk
            )

            # Update zone
            z.flood_risk = new_flood
            z.surge_risk = new_surge
            z.wind_risk = new_wind
            z.infrastructure_risk = new_infra_risk
            z.overall_risk = new_overall
            z.risk_level = new_level
            z.rainfall_forecast = round(local_rain, 1)

            # Dynamic population exposure scaling
            if new_level == "CRITICAL":
                z.population_exposed = int(z.population_exposed * 1.15) if z.population_exposed < 180000 else z.population_exposed
            elif new_level == "LOW":
                z.population_exposed = max(15000, int(z.population_exposed * 0.9))

            flood_factors["narrative"] = f"Simulated impact for {z.zone_name}: {round(local_rain)}mm rain, {new_surge}m surge index. Overall Risk: {new_overall} ({new_level})."
            z.explainability = flood_factors

        db.commit()

        # Capture AFTER metrics
        after_pop = sum(z.population_exposed for z in zones if z.overall_risk >= 60.0)
        after_infra = infra_service.get_infrastructure_at_risk(db, cyclone_lat=sim_lat, cyclone_lon=sim_lon)
        after_hosp = len([a for a in after_infra if a["type"] == "hospital" and a["risk_score"] >= 60.0])
        after_power = len([a for a in after_infra if a["type"] == "power_station" and a["risk_score"] >= 60.0])
        after_roads_km = round(before_roads_km * (1.0 + (sim_wind - 120.0) / 100.0 + (sim_surge / 3.0)), 1)
        after_avg_risk = sum(z.overall_risk for z in zones) / max(1, len(zones))

        # Comparison metrics
        metrics = [
            BeforeAfterMetric(
                metric_name="Exposed Population",
                unit="Persons",
                before_value=float(before_pop),
                after_value=float(after_pop),
                delta=float(after_pop - before_pop),
                severity_change="INCREASED" if after_pop >= before_pop else "DECREASED"
            ),
            BeforeAfterMetric(
                metric_name="Hospitals at High/Critical Risk",
                unit="Facilities",
                before_value=float(before_hosp),
                after_value=float(after_hosp),
                delta=float(after_hosp - before_hosp),
                severity_change="CRITICAL" if after_hosp > before_hosp else "STABLE"
            ),
            BeforeAfterMetric(
                metric_name="Road Inundation Disruption",
                unit="km",
                before_value=float(before_roads_km),
                after_value=float(after_roads_km),
                delta=round(float(after_roads_km - before_roads_km), 1),
                severity_change="SURGE" if after_roads_km > before_roads_km else "STABLE"
            ),
            BeforeAfterMetric(
                metric_name="Power Substations Vulnerable",
                unit="Grid Assets",
                before_value=float(before_power),
                after_value=float(after_power),
                delta=float(after_power - before_power),
                severity_change="WARNING" if after_power >= before_power else "RESOLVED"
            ),
            BeforeAfterMetric(
                metric_name="Average Coastal Zone Hazard Score",
                unit="Index (0-100)",
                before_value=round(before_avg_risk, 1),
                after_value=round(after_avg_risk, 1),
                delta=round(after_avg_risk - before_avg_risk, 1),
                severity_change="ELEVATED" if after_avg_risk >= before_avg_risk else "SUBSIDING"
            )
        ]

        # Generate updated alerts
        alerts = alert_service.generate_alerts_for_zones(db)

        # Recommended priority actions
        priority_actions = [
            f"ETA to landfall compressed to {sim_eta}h: Order complete shutdown of fishing harbors and coastal port terminals.",
            f"Pre-stage high-clearance SDRF emergency vehicles at Samalkot transit camp to cover {after_hosp} vulnerable hospitals.",
            f"Erect temporary sandbag containment around vulnerable substations to safeguard regional 220kV power distribution.",
            f"Activate emergency broadcast advisory for {after_pop:,} residents in critical inundation sectors."
        ]

        return {
            "scenario_id": f"SCENARIO-SIM-{int(sim_wind)}K-{int(sim_rain)}MM",
            "cyclone": self.get_cyclone(db, cyclone_id),
            "impact_summary": {
                "eta_hours": sim_eta,
                "landfall_wind_kmh": sim_wind,
                "peak_surge_m": sim_surge,
                "total_high_risk_zones": len([z for z in zones if z.overall_risk >= 60.0]),
                "critical_zones": len([z for z in zones if z.overall_risk >= 80.0])
            },
            "metrics_comparison": [m.model_dump() for m in metrics],
            "alerts_triggered": alerts,
            "recommended_priority_actions": priority_actions
        }

cyclone_service = CycloneService()
