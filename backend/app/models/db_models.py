from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class CycloneModel(Base):
    __tablename__ = "cyclones"
    
    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    wind_speed = Column(Float, nullable=False)        # km/h
    pressure = Column(Float, nullable=False)          # hPa
    rainfall = Column(Float, nullable=False)          # mm/24h
    storm_surge = Column(Float, nullable=False)       # meters
    movement_direction = Column(Float, nullable=False)# degrees
    movement_speed = Column(Float, nullable=False)    # km/h
    radius = Column(Float, nullable=False)            # km
    eta_hours = Column(Float, nullable=False)         # hours to landfall
    track = Column(JSON, default=list)                # list of waypoints
    cone_of_uncertainty = Column(JSON, default=dict)  # GeoJSON polygon
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    risk_zones = relationship("RiskZoneModel", back_populates="cyclone", cascade="all, delete-orphan")


class InfrastructureModel(Base):
    __tablename__ = "infrastructure"
    
    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    type = Column(String(64), nullable=False)         # hospital, shelter, road, bridge, power_station, school, emergency_center
    district = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    criticality = Column(Float, default=0.5)          # 0.0 to 1.0
    capacity = Column(Integer, default=0)
    elevation = Column(Float, default=5.0)            # meters
    distance_to_coast_km = Column(Float, default=10.0)
    metadata_json = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class RiskZoneModel(Base):
    __tablename__ = "risk_zones"
    
    id = Column(String(64), primary_key=True)
    zone_name = Column(String(128), nullable=False)
    district = Column(String(128), nullable=False)
    cyclone_id = Column(String(64), ForeignKey("cyclones.id", ondelete="CASCADE"), nullable=True)
    flood_risk = Column(Float, nullable=False)
    surge_risk = Column(Float, nullable=False)
    wind_risk = Column(Float, nullable=False)
    infrastructure_risk = Column(Float, nullable=False)
    overall_risk = Column(Float, nullable=False)
    risk_level = Column(String(32), nullable=False)   # LOW, MEDIUM, HIGH, CRITICAL
    population_exposed = Column(Integer, default=0)
    geometry = Column(JSON, nullable=False)           # GeoJSON Polygon
    elevation_mean = Column(Float, default=5.0)
    rainfall_forecast = Column(Float, default=0.0)
    distance_to_coast_km = Column(Float, default=0.0)
    explainability = Column(JSON, default=dict)       # factor contribution percentages
    created_at = Column(DateTime, default=datetime.utcnow)
    
    cyclone = relationship("CycloneModel", back_populates="risk_zones")


class AlertModel(Base):
    __tablename__ = "alerts"
    
    id = Column(String(64), primary_key=True)
    severity = Column(String(32), nullable=False)     # LOW, MEDIUM, HIGH, CRITICAL
    zone_id = Column(String(64), nullable=True)
    district = Column(String(128), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    affected_summary = Column(JSON, default=dict)     # count of hospitals, roads, population
    recommended_action = Column(Text, nullable=False)
    status = Column(String(32), default="ACTIVE")     # ACTIVE, ACKNOWLEDGED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow)


class EmergencyRouteModel(Base):
    __tablename__ = "emergency_routes"
    
    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    start_point = Column(JSON, nullable=False)
    end_point = Column(JSON, nullable=False)
    normal_route = Column(JSON, nullable=False)
    risk_aware_route = Column(JSON, nullable=False)
    hazard_avoided = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
