from typing import List, Dict, Any, Optional
from shapely.geometry import shape, Point
from sqlalchemy.orm import Session
from app.models.db_models import InfrastructureModel, RiskZoneModel
from app.geo.risk_engine import risk_engine

class InfrastructureService:
    def get_all_infrastructure(self, db: Session) -> List[Dict[str, Any]]:
        assets = db.query(InfrastructureModel).all()
        return [
            {
                "id": a.id,
                "name": a.name,
                "type": a.type,
                "district": a.district,
                "latitude": a.latitude,
                "longitude": a.longitude,
                "criticality": a.criticality,
                "capacity": a.capacity,
                "elevation": a.elevation,
                "distance_to_coast_km": a.distance_to_coast_km,
                "metadata_json": a.metadata_json or {}
            }
            for a in assets
        ]

    def get_infrastructure_at_risk(
        self,
        db: Session,
        cyclone_lat: float = 16.45,
        cyclone_lon: float = 83.10,
        rainfall_mm: float = 280.0,
        wind_kmh: float = 145.0
    ) -> List[Dict[str, Any]]:
        """
        Calculates exposure, individual risk scores, and tactical actions for all infrastructure assets.
        Uses spatial intersection with risk zones or proximity buffering.
        """
        assets = db.query(InfrastructureModel).all()
        zones = db.query(RiskZoneModel).all()
        
        parsed_zones = []
        for z in zones:
            try:
                poly = shape(z.geometry)
                parsed_zones.append((z, poly))
            except Exception:
                pass

        results = []
        for a in assets:
            pt = Point(a.longitude, a.latitude)
            intersecting_zone = None
            for z, poly in parsed_zones:
                if poly.contains(pt) or poly.touches(pt):
                    intersecting_zone = z
                    break

            if intersecting_zone:
                hazard_score = intersecting_zone.overall_risk
                exposed_hazards = []
                if intersecting_zone.flood_risk > 50:
                    exposed_hazards.append(f"Inundation ({intersecting_zone.flood_risk}%)")
                if intersecting_zone.surge_risk > 40:
                    exposed_hazards.append(f"Storm Surge ({intersecting_zone.surge_risk}%)")
                if intersecting_zone.wind_risk > 60:
                    exposed_hazards.append(f"High Winds ({intersecting_zone.wind_risk}%)")
            else:
                # Calculate distance-based baseline
                dist_km = ((a.latitude - cyclone_lat)**2 + (a.longitude - cyclone_lon)**2)**0.5 * 111.0
                hazard_score = max(10.0, min(100.0, 100.0 - (dist_km * 0.4)))
                exposed_hazards = ["Peripheral Gale Winds"]

            risk_score, level, explanation = risk_engine.calculate_infrastructure_risk(
                asset_type=a.type,
                hazard_score=hazard_score,
                distance_to_coast_km=a.distance_to_coast_km,
                elevation_m=a.elevation
            )

            # Recommend actionable emergency actions based on type and severity
            action = self._determine_action(a.type, level, a.name)

            results.append({
                "id": a.id,
                "name": a.name,
                "type": a.type,
                "district": a.district,
                "latitude": a.latitude,
                "longitude": a.longitude,
                "criticality": a.criticality,
                "capacity": a.capacity,
                "elevation": a.elevation,
                "distance_to_coast_km": a.distance_to_coast_km,
                "metadata_json": a.metadata_json or {},
                "risk_score": risk_score,
                "hazard_level": level,
                "exposed_hazards": exposed_hazards,
                "recommended_action": action,
                "explanation": explanation
            })

        # Sort by risk score descending
        results.sort(key=lambda x: x["risk_score"], reverse=True)
        return results

    def _determine_action(self, asset_type: str, level: str, name: str) -> str:
        if asset_type == "hospital":
            if level in ("CRITICAL", "HIGH"):
                return "Activate auxiliary generators on upper floors; prepare patient transfer to Samalkot safe corridor; stockpile 72h oxygen & dialysis water."
            return "Test backup power transfer switches and secure pharmacy supply on elevated shelving."
        elif asset_type == "shelter":
            if level in ("CRITICAL", "HIGH"):
                return "If surge exceeds 2.5m, divert evacuees inland to Peddapuram Hub; inspect potable water reserve tanks."
            return "Verify food rations, solar lanterns, and medical triage station readiness."
        elif asset_type == "power_station":
            if level in ("CRITICAL", "HIGH"):
                return "Implement selective load-shedding for low-lying feeders; erect temporary sandbag flood berms around 220kV transformers."
            return "Place rapid mobile response restoration crews on 1-hour standby."
        elif asset_type == "bridge":
            if level in ("CRITICAL", "HIGH"):
                return "Close bridge to high-profile commercial trucks; deploy structural deflection sensors."
            return "Monitor tidal stream debris accumulation."
        elif asset_type == "road":
            if level in ("CRITICAL", "HIGH"):
                return "Impose emergency travel ban; place police barricades at inundation entry points; divert to elevated inland routes."
            return "Position towing units and water pumps at known low-spots."
        return "Conduct routine structural integrity check and secure exterior fixtures."

    def analyze_zone_impact(self, db: Session, zone_id: str) -> Dict[str, Any]:
        """
        Deep analysis for a single selected risk zone:
        Calculates affected population, exposed hospitals, roads disrupted (km), shelters, power assets.
        """
        zone = db.query(RiskZoneModel).filter(RiskZoneModel.id == zone_id).first()
        if not zone:
            return {}

        poly = shape(zone.geometry)
        assets = db.query(InfrastructureModel).all()

        hospitals_count = 0
        shelters_count = 0
        power_count = 0
        bridges_count = 0
        roads_km = 0.0
        critical_assets = []

        for a in assets:
            pt = Point(a.longitude, a.latitude)
            if poly.contains(pt) or poly.touches(pt):
                critical_assets.append({
                    "id": a.id,
                    "name": a.name,
                    "type": a.type,
                    "criticality": a.criticality,
                    "elevation": a.elevation
                })
                if a.type == "hospital":
                    hospitals_count += 1
                elif a.type == "shelter":
                    shelters_count += 1
                elif a.type == "power_station":
                    power_count += 1
                elif a.type == "bridge":
                    bridges_count += 1
                elif a.type == "road":
                    length = a.metadata_json.get("length_km", 12.0)
                    roads_km += length

        if roads_km == 0.0 and (zone.flood_risk > 60 or zone.surge_risk > 60):
            # Reasonable spatial model estimate of disrupted municipal road network in km
            roads_km = round((zone.population_exposed / 8000.0) * 1.2, 1)

        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "district": zone.district,
            "overall_risk": zone.overall_risk,
            "risk_level": zone.risk_level,
            "population_exposed": zone.population_exposed,
            "hospitals_at_risk": hospitals_count,
            "shelters_at_risk": shelters_count,
            "power_stations_at_risk": power_count,
            "bridges_at_risk": bridges_count,
            "roads_disrupted_km": roads_km,
            "critical_assets": critical_assets,
            "explainability": zone.explainability
        }

infra_service = InfrastructureService()
