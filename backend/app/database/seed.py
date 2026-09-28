import logging
from app.database.session import SessionLocal, init_db
from app.models.db_models import CycloneModel, InfrastructureModel, RiskZoneModel, AlertModel
from app.providers.demo_data import DEMO_CYCLONE, DEMO_INFRASTRUCTURE, DEMO_RISK_ZONES, DEMO_ALERTS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stormshield.seed")

def seed_database():
    logger.info("Initializing database tables...")
    init_db()
    
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_cyclone = db.query(CycloneModel).filter(CycloneModel.id == DEMO_CYCLONE["id"]).first()
        if existing_cyclone:
            logger.info("Database is already seeded with demo cyclone scenario.")
            return

        logger.info("Seeding demo cyclone...")
        cyclone = CycloneModel(
            id=DEMO_CYCLONE["id"],
            name=DEMO_CYCLONE["name"],
            category=DEMO_CYCLONE["category"],
            latitude=DEMO_CYCLONE["latitude"],
            longitude=DEMO_CYCLONE["longitude"],
            wind_speed=DEMO_CYCLONE["wind_speed"],
            pressure=DEMO_CYCLONE["pressure"],
            rainfall=DEMO_CYCLONE["rainfall"],
            storm_surge=DEMO_CYCLONE["storm_surge"],
            movement_direction=DEMO_CYCLONE["movement_direction"],
            movement_speed=DEMO_CYCLONE["movement_speed"],
            radius=DEMO_CYCLONE["radius"],
            eta_hours=DEMO_CYCLONE["eta_hours"],
            track=DEMO_CYCLONE["track"],
            cone_of_uncertainty=DEMO_CYCLONE["cone_of_uncertainty"]
        )
        db.add(cyclone)
        db.flush()

        logger.info(f"Seeding {len(DEMO_INFRASTRUCTURE)} infrastructure assets...")
        for infra_data in DEMO_INFRASTRUCTURE:
            infra = InfrastructureModel(
                id=infra_data["id"],
                name=infra_data["name"],
                type=infra_data["type"],
                district=infra_data["district"],
                latitude=infra_data["latitude"],
                longitude=infra_data["longitude"],
                criticality=infra_data["criticality"],
                capacity=infra_data.get("capacity", 0),
                elevation=infra_data.get("elevation", 5.0),
                distance_to_coast_km=infra_data.get("distance_to_coast_km", 10.0),
                metadata_json=infra_data.get("metadata_json", {})
            )
            db.add(infra)

        logger.info(f"Seeding {len(DEMO_RISK_ZONES)} risk zones...")
        for zone_data in DEMO_RISK_ZONES:
            zone = RiskZoneModel(
                id=zone_data["id"],
                zone_name=zone_data["zone_name"],
                district=zone_data["district"],
                cyclone_id=DEMO_CYCLONE["id"],
                flood_risk=zone_data["flood_risk"],
                surge_risk=zone_data["surge_risk"],
                wind_risk=zone_data["wind_risk"],
                infrastructure_risk=zone_data["infrastructure_risk"],
                overall_risk=zone_data["overall_risk"],
                risk_level=zone_data["risk_level"],
                population_exposed=zone_data["population_exposed"],
                geometry=zone_data["geometry"],
                elevation_mean=zone_data.get("elevation_mean", 5.0),
                rainfall_forecast=zone_data.get("rainfall_forecast", 0.0),
                distance_to_coast_km=zone_data.get("distance_to_coast_km", 0.0),
                explainability=zone_data.get("explainability", {})
            )
            db.add(zone)

        logger.info(f"Seeding {len(DEMO_ALERTS)} alerts...")
        for alert_data in DEMO_ALERTS:
            alert = AlertModel(
                id=alert_data["id"],
                severity=alert_data["severity"],
                zone_id=alert_data.get("zone_id"),
                district=alert_data["district"],
                title=alert_data["title"],
                message=alert_data["message"],
                affected_summary=alert_data.get("affected_summary", {}),
                recommended_action=alert_data["recommended_action"],
                status=alert_data.get("status", "ACTIVE")
            )
            db.add(alert)

        db.commit()
        logger.info("Successfully seeded StormShield database!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
