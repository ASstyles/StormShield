import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.db_models import AlertModel, RiskZoneModel, InfrastructureModel
from app.services.infrastructure_service import infra_service

class AlertService:
    def get_all_alerts(self, db: Session) -> List[Dict[str, Any]]:
        alerts = db.query(AlertModel).order_by(AlertModel.created_at.desc()).all()
        return [
            {
                "id": a.id,
                "severity": a.severity,
                "zone_id": a.zone_id,
                "district": a.district,
                "title": a.title,
                "message": a.message,
                "affected_summary": a.affected_summary or {},
                "recommended_action": a.recommended_action,
                "status": a.status,
                "created_at": a.created_at.isoformat() if hasattr(a.created_at, "isoformat") else str(a.created_at)
            }
            for a in alerts
        ]

    def generate_alerts_for_zones(self, db: Session) -> List[Dict[str, Any]]:
        """
        Evaluates risk zones and infrastructure exposures to synthesize tactical alerts.
        """
        zones = db.query(RiskZoneModel).all()
        new_alerts = []

        for z in zones:
            if z.overall_risk >= 80.0:
                severity = "CRITICAL"
            elif z.overall_risk >= 60.0:
                severity = "HIGH"
            elif z.overall_risk >= 40.0:
                severity = "MEDIUM"
            else:
                continue

            impact = infra_service.analyze_zone_impact(db, z.id)
            hosp = impact.get("hospitals_at_risk", 0)
            pwr = impact.get("power_stations_at_risk", 0)
            roads = impact.get("roads_disrupted_km", 0.0)
            pop = z.population_exposed

            title = f"{severity} HAZARD ALERT: {z.zone_name}"
            reason_parts = []
            if z.surge_risk > 70:
                reason_parts.append(f"Storm Surge ({z.surge_risk}%)")
            if z.flood_risk > 70:
                reason_parts.append(f"Torrential Inundation ({z.flood_risk}%)")
            if z.wind_risk > 70:
                reason_parts.append(f"Gale Winds ({z.wind_risk}%)")
            reason_str = " + ".join(reason_parts) if reason_parts else "Compound atmospheric pressure and rain"

            message = (
                f"Zone {z.zone_name} has entered {severity} threat threshold ({z.overall_risk}/100) due to {reason_str}. "
                f"Anticipated impact encompasses {hosp} hospitals, {pwr} power facilities, and {roads} km of road corridors."
            )

            if severity == "CRITICAL":
                rec = "Enforce immediate mandatory evacuation of non-elevated housing. Divert medical transport to Samalkot inland transit camp."
            elif severity == "HIGH":
                rec = "Pre-position backup diesel generating sets, seal ground-level electrical conduits, and place rescue boats on 30-min standby."
            else:
                rec = "Clear local storm culverts and monitor district radio updates."

            alert_id = f"ALERT-GEN-{uuid.uuid4().hex[:6].upper()}"
            alert_dict = {
                "id": alert_id,
                "severity": severity,
                "zone_id": z.id,
                "district": z.district,
                "title": title,
                "message": message,
                "affected_summary": {
                    "population_exposed": pop,
                    "hospitals_at_risk": hosp,
                    "power_stations_affected": pwr,
                    "roads_disrupted_km": roads
                },
                "recommended_action": rec,
                "status": "ACTIVE",
                "created_at": "2026-09-28T21:10:00Z"
            }
            new_alerts.append(alert_dict)

        return new_alerts

alert_service = AlertService()
