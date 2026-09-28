-- StormShield: AI Cyclone Impact & Infrastructure Intelligence Platform
-- PostgreSQL / PostGIS Schema

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Cyclone Table
CREATE TABLE IF NOT EXISTS cyclones (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    wind_speed DOUBLE PRECISION NOT NULL,       -- in km/h
    pressure DOUBLE PRECISION NOT NULL,         -- in hPa
    rainfall DOUBLE PRECISION NOT NULL,         -- in mm/24h
    storm_surge DOUBLE PRECISION NOT NULL,      -- in meters
    movement_direction DOUBLE PRECISION NOT NULL,-- in degrees (0-360)
    movement_speed DOUBLE PRECISION NOT NULL,    -- in km/h
    radius DOUBLE PRECISION NOT NULL,           -- in km
    eta_hours DOUBLE PRECISION NOT NULL,        -- hours to landfall
    track JSONB NOT NULL DEFAULT '[]'::jsonb,   -- sequence of historical & forecast points
    cone_of_uncertainty JSONB,                 -- GeoJSON Polygon
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial point for cyclone eye if PostGIS geometry column is used
-- ALTER TABLE cyclones ADD COLUMN IF NOT EXISTS geom geometry(Point, 432 digits);

-- 2. Infrastructure Table
CREATE TABLE IF NOT EXISTS infrastructure (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL,                  -- hospital, shelter, road, bridge, power_station, school, emergency_center
    district VARCHAR(128) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    criticality DOUBLE PRECISION NOT NULL DEFAULT 0.5, -- 0.0 to 1.0 (Hospital=1.0, Shelter=0.9, Power=0.95, Road=0.9/0.4)
    capacity INTEGER DEFAULT 0,                 -- beds, shelter capacity, MW
    elevation DOUBLE PRECISION DEFAULT 5.0,     -- meters above sea level
    distance_to_coast_km DOUBLE PRECISION DEFAULT 10.0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_infra_type ON infrastructure(type);
CREATE INDEX IF NOT EXISTS idx_infra_district ON infrastructure(district);
CREATE INDEX IF NOT EXISTS idx_infra_coords ON infrastructure(latitude, longitude);

-- 3. RiskZone Table
CREATE TABLE IF NOT EXISTS risk_zones (
    id VARCHAR(64) PRIMARY KEY,
    zone_name VARCHAR(128) NOT NULL,
    district VARCHAR(128) NOT NULL,
    cyclone_id VARCHAR(64) REFERENCES cyclones(id) ON DELETE CASCADE,
    flood_risk DOUBLE PRECISION NOT NULL,       -- 0 to 100
    surge_risk DOUBLE PRECISION NOT NULL,       -- 0 to 100
    wind_risk DOUBLE PRECISION NOT NULL,        -- 0 to 100
    infrastructure_risk DOUBLE PRECISION NOT NULL,-- 0 to 100
    overall_risk DOUBLE PRECISION NOT NULL,     -- 0 to 100
    risk_level VARCHAR(32) NOT NULL,            -- LOW, MEDIUM, HIGH, CRITICAL
    population_exposed INTEGER NOT NULL DEFAULT 0,
    geometry JSONB NOT NULL,                   -- GeoJSON Polygon or MultiPolygon
    elevation_mean DOUBLE PRECISION DEFAULT 5.0,
    rainfall_forecast DOUBLE PRECISION DEFAULT 0.0,
    distance_to_coast_km DOUBLE PRECISION DEFAULT 0.0,
    explainability JSONB DEFAULT '{}'::jsonb,   -- Factor contribution percentages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_level ON risk_zones(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_district ON risk_zones(district);

-- 4. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    severity VARCHAR(32) NOT NULL,              -- LOW, MEDIUM, HIGH, CRITICAL
    zone_id VARCHAR(64),
    district VARCHAR(128) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    affected_summary JSONB DEFAULT '{}'::jsonb, -- count of hospitals, roads, population
    recommended_action TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',-- ACTIVE, ACKNOWLEDGED, RESOLVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alert_status ON alerts(status);

-- 5. Emergency Routes Table
CREATE TABLE IF NOT EXISTS emergency_routes (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_point JSONB NOT NULL,                 -- {name, lat, lon}
    end_point JSONB NOT NULL,                   -- {name, lat, lon}
    normal_route JSONB NOT NULL,               -- GeoJSON LineString + stats
    risk_aware_route JSONB NOT NULL,           -- GeoJSON LineString + stats
    hazard_avoided TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
