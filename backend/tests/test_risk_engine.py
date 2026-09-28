import pytest
from app.geo.risk_engine import RiskEngine

def test_flood_risk_calculation():
    engine = RiskEngine()
    # High rainfall, low elevation, close to coast
    score_high, factors_high = engine.calculate_flood_risk(
        rainfall_mm=320.0,
        elevation_m=1.5,
        distance_to_coast_km=0.8,
        historical_flood_score=60.0
    )
    assert 70.0 <= score_high <= 100.0
    assert factors_high["rainfall_contribution"] > 0
    assert factors_high["elevation_contribution"] > 0
    # Factors should sum close to 100%
    total_pct = sum(factors_high.values())
    assert 99.0 <= total_pct <= 101.0

    # Low rainfall, high elevation, inland
    score_low, factors_low = engine.calculate_flood_risk(
        rainfall_mm=20.0,
        elevation_m=50.0,
        distance_to_coast_km=30.0,
        historical_flood_score=10.0
    )
    assert score_low < 30.0

def test_storm_surge_risk():
    engine = RiskEngine()
    # Direct eye proximity, high wind, low central pressure, near coast
    surge_critical = engine.calculate_surge_risk(
        cyclone_wind_kmh=165.0,
        central_pressure_hpa=950.0,
        distance_to_eye_km=25.0,
        distance_to_coast_km=0.5,
        elevation_m=1.8
    )
    assert surge_critical >= 75.0

    # Inland asset 25km away should have negligible storm surge
    surge_inland = engine.calculate_surge_risk(
        cyclone_wind_kmh=165.0,
        central_pressure_hpa=950.0,
        distance_to_eye_km=120.0,
        distance_to_coast_km=25.0,
        elevation_m=20.0
    )
    assert surge_inland == 0.0

def test_wind_risk_decay():
    engine = RiskEngine()
    # At radius of max winds
    wind_eye = engine.calculate_wind_risk(cyclone_wind_kmh=150.0, distance_to_eye_km=45.0)
    # Further away 180km
    wind_distant = engine.calculate_wind_risk(cyclone_wind_kmh=150.0, distance_to_eye_km=180.0)
    assert wind_eye > wind_distant

def test_infrastructure_criticality():
    engine = RiskEngine()
    # Hospital has criticality 1.0
    hosp_risk, hosp_level, _ = engine.calculate_infrastructure_risk("hospital", hazard_score=80.0, distance_to_coast_km=2.0, elevation_m=3.0)
    assert hosp_risk == 80.0
    assert hosp_level == "CRITICAL"

    # Warehouse has criticality 0.30
    wh_risk, wh_level, _ = engine.calculate_infrastructure_risk("warehouse", hazard_score=80.0, distance_to_coast_km=2.0, elevation_m=3.0)
    assert wh_risk == 24.0
    assert wh_level == "LOW"

def test_overall_risk_weighting():
    engine = RiskEngine()
    # All hazards at 100 -> overall must be 100
    overall_max, level_max = engine.calculate_overall_risk(100.0, 100.0, 100.0, 100.0)
    assert overall_max == 100.0
    assert level_max == "CRITICAL"

    # All hazards at 0 -> overall must be 0
    overall_min, level_min = engine.calculate_overall_risk(0.0, 0.0, 0.0, 0.0)
    assert overall_min == 0.0
    assert level_min == "LOW"

def test_risk_level_boundaries():
    """Validates exact deterministic boundary thresholds: 0-30 LOW, 30-60 MEDIUM, 60-80 HIGH, 80-100 CRITICAL"""
    engine = RiskEngine()
    assert engine.get_risk_level(0.0) == "LOW"
    assert engine.get_risk_level(29.9) == "LOW"
    assert engine.get_risk_level(30.0) == "MEDIUM"
    assert engine.get_risk_level(59.9) == "MEDIUM"
    assert engine.get_risk_level(60.0) == "HIGH"
    assert engine.get_risk_level(79.9) == "HIGH"
    assert engine.get_risk_level(80.0) == "CRITICAL"
    assert engine.get_risk_level(100.0) == "CRITICAL"

def test_geospatial_validation():
    """Validates geometry validator, coordinate ranges, and repair utility."""
    from app.geo.validator import GeospatialValidator
    # Valid Polygon
    valid_poly = {
        "type": "Polygon",
        "coordinates": [
            [[82.0, 16.0], [83.0, 16.0], [83.0, 17.0], [82.0, 17.0], [82.0, 16.0]]
        ]
    }
    is_valid, _, err = GeospatialValidator.validate_geometry(valid_poly)
    assert is_valid is True
    assert err is None

    # Invalid coordinates out of WGS84
    invalid_coords = {
        "type": "Point",
        "coordinates": [250.0, 120.0]
    }
    is_valid, _, err = GeospatialValidator.validate_geometry(invalid_coords)
    assert is_valid is False
    assert "out of WGS84 bounds" in err

    # Self-intersecting polygon (bowtie) with auto-repair
    bowtie = {
        "type": "Polygon",
        "coordinates": [
            [[0.0, 0.0], [2.0, 2.0], [2.0, 0.0], [0.0, 2.0], [0.0, 0.0]]
        ]
    }
    is_valid, repaired, err = GeospatialValidator.validate_geometry(bowtie, auto_repair=True)
    assert is_valid is True
    assert "repaired" in err

