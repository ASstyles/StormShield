"""
Realistic Synthetic Geospatial and Infrastructure Dataset for Coastal Andhra Pradesh, India.
Clearly designated as DEMO / SYNTHETIC DATA for simulation and decision-support demonstration.
"""

from typing import List, Dict, Any

DEMO_CYCLONE = {
    "id": "CYCLONE-2026-AP01",
    "name": "Cyclone Jal-26",
    "category": "Very Severe Cyclonic Storm (VSCS)",
    "latitude": 16.45,
    "longitude": 83.10,
    "wind_speed": 145.0,        # km/h
    "pressure": 962.0,          # hPa
    "rainfall": 280.0,          # mm/24h
    "storm_surge": 2.8,         # meters
    "movement_direction": 305.0,# WNW
    "movement_speed": 16.0,     # km/h
    "radius": 180.0,            # km
    "eta_hours": 18.0,
    "track": [
        {"time": "-18h", "latitude": 15.20, "longitude": 84.80, "wind_speed": 110.0, "pressure": 985.0, "intensity": "SCS", "status": "OBSERVED"},
        {"time": "-12h", "latitude": 15.60, "longitude": 84.20, "wind_speed": 125.0, "pressure": 978.0, "intensity": "VSCS", "status": "OBSERVED"},
        {"time": "-6h",  "latitude": 16.05, "longitude": 83.65, "wind_speed": 135.0, "pressure": 970.0, "intensity": "VSCS", "status": "OBSERVED"},
        {"time": "NOW",  "latitude": 16.45, "longitude": 83.10, "wind_speed": 145.0, "pressure": 962.0, "intensity": "VSCS", "status": "OBSERVED"},
        {"time": "+6h",  "latitude": 16.80, "longitude": 82.55, "wind_speed": 150.0, "pressure": 958.0, "intensity": "VSCS", "status": "FORECAST"},
        {"time": "+12h", "latitude": 17.05, "longitude": 82.15, "wind_speed": 140.0, "pressure": 965.0, "intensity": "VSCS (Landfall)", "status": "FORECAST"},
        {"time": "+18h", "latitude": 17.30, "longitude": 81.75, "wind_speed": 105.0, "pressure": 982.0, "intensity": "SCS (Inland)", "status": "FORECAST"},
        {"time": "+24h", "latitude": 17.55, "longitude": 81.30, "wind_speed": 75.0,  "pressure": 995.0, "intensity": "CS (Depression)", "status": "FORECAST"}
    ],
    "cone_of_uncertainty": {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [83.10, 16.45],
                [82.90, 16.85],
                [82.60, 17.35],
                [82.10, 17.65],
                [81.40, 17.85],
                [80.95, 17.60],
                [81.45, 17.05],
                [82.00, 16.70],
                [82.50, 16.30],
                [83.10, 16.45]
            ]]
        },
        "properties": {
            "description": "70% Confidence Uncertainty Cone"
        }
    }
}

DEMO_INFRASTRUCTURE: List[Dict[str, Any]] = [
    # --- Hospitals ---
    {
        "id": "INFRA-HOSP-01",
        "name": "Kakinada Government General Hospital",
        "type": "hospital",
        "district": "Kakinada",
        "latitude": 16.9535,
        "longitude": 82.2352,
        "criticality": 1.0,
        "capacity": 1100,
        "elevation": 3.2,
        "distance_to_coast_km": 2.1,
        "metadata_json": {
            "icu_beds": 120,
            "backup_generators": 4,
            "generator_fuel_hours": 72,
            "oxygen_tank_level_pct": 92,
            "ambulances": 14,
            "contact": "+91-884-2361000",
            "flood_barrier_installed": True
        }
    },
    {
        "id": "INFRA-HOSP-02",
        "name": "Apollo Speciality Hospital Kakinada",
        "type": "hospital",
        "district": "Kakinada",
        "latitude": 16.9742,
        "longitude": 82.2415,
        "criticality": 1.0,
        "capacity": 350,
        "elevation": 4.1,
        "distance_to_coast_km": 1.8,
        "metadata_json": {
            "icu_beds": 65,
            "backup_generators": 3,
            "generator_fuel_hours": 48,
            "oxygen_tank_level_pct": 88,
            "ambulances": 6,
            "contact": "+91-884-2388888",
            "flood_barrier_installed": False
        }
    },
    {
        "id": "INFRA-HOSP-03",
        "name": "King George Hospital (KGH) Visakhapatnam",
        "type": "hospital",
        "district": "Visakhapatnam",
        "latitude": 17.7082,
        "longitude": 83.3051,
        "criticality": 1.0,
        "capacity": 1250,
        "elevation": 8.5,
        "distance_to_coast_km": 1.2,
        "metadata_json": {
            "icu_beds": 150,
            "backup_generators": 6,
            "generator_fuel_hours": 96,
            "oxygen_tank_level_pct": 95,
            "ambulances": 20,
            "contact": "+91-891-2564891"
        }
    },
    {
        "id": "INFRA-HOSP-04",
        "name": "District Hospital Machilipatnam",
        "type": "hospital",
        "district": "Krishna",
        "latitude": 16.1824,
        "longitude": 81.1352,
        "criticality": 0.95,
        "capacity": 500,
        "elevation": 2.8,
        "distance_to_coast_km": 4.5,
        "metadata_json": {
            "icu_beds": 40,
            "backup_generators": 2,
            "generator_fuel_hours": 36,
            "oxygen_tank_level_pct": 75,
            "ambulances": 8
        }
    },
    {
        "id": "INFRA-HOSP-05",
        "name": "Trust Port Health Center Kakinada",
        "type": "hospital",
        "district": "Kakinada",
        "latitude": 16.9385,
        "longitude": 82.2514,
        "criticality": 0.90,
        "capacity": 180,
        "elevation": 2.1,
        "distance_to_coast_km": 0.6,
        "metadata_json": {
            "icu_beds": 18,
            "backup_generators": 2,
            "generator_fuel_hours": 30,
            "high_inundation_exposure": True
        }
    },

    # --- Cyclone Shelters (MPCS) ---
    {
        "id": "INFRA-SHELTER-01",
        "name": "Samalkot Cyclone Relief Shelter & Transit Camp",
        "type": "shelter",
        "district": "Kakinada",
        "latitude": 17.0521,
        "longitude": 82.1685,
        "criticality": 0.90,
        "capacity": 2500,
        "elevation": 14.2,
        "distance_to_coast_km": 15.6,
        "metadata_json": {
            "kitchen_facility": True,
            "water_purification_plant": True,
            "stock_ration_days": 10,
            "helipad_nearby": True,
            "current_occupancy": 0
        }
    },
    {
        "id": "INFRA-SHELTER-02",
        "name": "Kakinada Deep Water Port Cyclone Center",
        "type": "shelter",
        "district": "Kakinada",
        "latitude": 16.9421,
        "longitude": 82.2605,
        "criticality": 0.90,
        "capacity": 1800,
        "elevation": 2.5,
        "distance_to_coast_km": 0.4,
        "metadata_json": {
            "kitchen_facility": True,
            "stock_ration_days": 5,
            "warning": "Vulnerable to storm surge exceeding 2.5m"
        }
    },
    {
        "id": "INFRA-SHELTER-03",
        "name": "Coringa Estuary Community MPCS",
        "type": "shelter",
        "district": "Kakinada",
        "latitude": 16.8902,
        "longitude": 82.2704,
        "criticality": 0.85,
        "capacity": 1200,
        "elevation": 1.9,
        "distance_to_coast_km": 0.8,
        "metadata_json": {
            "kitchen_facility": True,
            "stock_ration_days": 4,
            "warning": "Isolated if NH-216 coastal bridge floods"
        }
    },
    {
        "id": "INFRA-SHELTER-04",
        "name": "Uppada Coastal Community Shelter",
        "type": "shelter",
        "district": "Kakinada",
        "latitude": 17.0854,
        "longitude": 82.3251,
        "criticality": 0.85,
        "capacity": 1500,
        "elevation": 3.8,
        "distance_to_coast_km": 0.3,
        "metadata_json": {
            "reinforced_concrete": True,
            "sea_wall_proximity": "Directly adjacent to erosion barrier"
        }
    },
    {
        "id": "INFRA-SHELTER-05",
        "name": "Peddapuram Government Junior College Safe Camp",
        "type": "shelter",
        "district": "Kakinada",
        "latitude": 17.0782,
        "longitude": 82.1352,
        "criticality": 0.90,
        "capacity": 3200,
        "elevation": 22.0,
        "distance_to_coast_km": 19.5,
        "metadata_json": {
            "high_elevation_hub": True,
            "primary_evacuation_destination": True,
            "warehouse_capacity_tons": 500
        }
    },
    {
        "id": "INFRA-SHELTER-06",
        "name": "Machilipatnam Gilakaladindi Fishing Harbor Shelter",
        "type": "shelter",
        "district": "Krishna",
        "latitude": 16.1652,
        "longitude": 81.1550,
        "criticality": 0.85,
        "capacity": 2200,
        "elevation": 2.2,
        "distance_to_coast_km": 0.5,
        "metadata_json": {
            "kitchen_facility": True,
            "boat_tethering_yard": True
        }
    },

    # --- Power Infrastructure ---
    {
        "id": "INFRA-PWR-01",
        "name": "Kakinada 400/220kV Grid Substation",
        "type": "power_station",
        "district": "Kakinada",
        "latitude": 16.9850,
        "longitude": 82.2020,
        "criticality": 0.95,
        "capacity": 800, # MW
        "elevation": 5.2,
        "distance_to_coast_km": 5.4,
        "metadata_json": {
            "serves_population": 450000,
            "critical_feeder_to_hospitals": True,
            "flood_bund_height_m": 1.2
        }
    },
    {
        "id": "INFRA-PWR-02",
        "name": "Coringa Coastal Switching Station",
        "type": "power_station",
        "district": "Kakinada",
        "latitude": 16.9125,
        "longitude": 82.2450,
        "criticality": 0.90,
        "capacity": 320,
        "elevation": 1.8,
        "distance_to_coast_km": 1.5,
        "metadata_json": {
            "risk_of_short_circuit_inundation": "High",
            "transformer_elevated": False
        }
    },
    {
        "id": "INFRA-PWR-03",
        "name": "Simhadri 2000MW Super Thermal Grid Intertie",
        "type": "power_station",
        "district": "Visakhapatnam",
        "latitude": 17.6012,
        "longitude": 83.0821,
        "criticality": 0.95,
        "capacity": 2000,
        "elevation": 12.0,
        "distance_to_coast_km": 4.8,
        "metadata_json": {
            "national_grid_connector": True
        }
    },

    # --- Emergency Centers & Bridges ---
    {
        "id": "INFRA-EOC-01",
        "name": "District Disaster Management Center (DDMC) Kakinada",
        "type": "emergency_center",
        "district": "Kakinada",
        "latitude": 16.9652,
        "longitude": 82.2385,
        "criticality": 1.0,
        "capacity": 250,
        "elevation": 4.5,
        "distance_to_coast_km": 2.0,
        "metadata_json": {
            "satellite_phones": 12,
            "ham_radio_base": True,
            "drone_recon_team": 3
        }
    },
    {
        "id": "INFRA-BRG-01",
        "name": "NH-216 Godavari Creek Bypass Bridge",
        "type": "bridge",
        "district": "Kakinada",
        "latitude": 16.9180,
        "longitude": 82.2310,
        "criticality": 0.90,
        "capacity": 0,
        "elevation": 3.0,
        "distance_to_coast_km": 1.1,
        "metadata_json": {
            "vulnerability": "Tidal surge backflow causes structural scouring",
            "clearance_above_high_tide_m": 1.8
        }
    },
    {
        "id": "INFRA-ROAD-01",
        "name": "Kakinada Port Arterial Expressway (NH-216 Spur)",
        "type": "road",
        "district": "Kakinada",
        "latitude": 16.9450,
        "longitude": 82.2420,
        "criticality": 0.90,
        "capacity": 0,
        "elevation": 2.2,
        "distance_to_coast_km": 0.9,
        "metadata_json": {
            "length_km": 14.5,
            "lanes": 4,
            "primary_heavy_evacuation_corridor": True
        }
    },
    {
        "id": "INFRA-ROAD-02",
        "name": "Samalkot - Kakinada Inland Bypass Road",
        "type": "road",
        "district": "Kakinada",
        "latitude": 17.0150,
        "longitude": 82.1950,
        "criticality": 0.85,
        "capacity": 0,
        "elevation": 11.5,
        "distance_to_coast_km": 11.0,
        "metadata_json": {
            "length_km": 18.2,
            "lanes": 2,
            "flood_resilient_embankment": True
        }
    }
]

DEMO_RISK_ZONES: List[Dict[str, Any]] = [
    {
        "id": "ZONE-AP-01",
        "zone_name": "Kakinada Coastal Lowlands & Harbor",
        "district": "Kakinada",
        "cyclone_id": "CYCLONE-2026-AP01",
        "flood_risk": 88.5,
        "surge_risk": 91.0,
        "wind_risk": 82.0,
        "infrastructure_risk": 85.0,
        "overall_risk": 87.2,
        "risk_level": "CRITICAL",
        "population_exposed": 142500,
        "elevation_mean": 2.4,
        "rainfall_forecast": 310.0,
        "distance_to_coast_km": 1.2,
        "explainability": {
            "rainfall_contribution": 35.5,
            "elevation_contribution": 31.0,
            "coastal_exposure_contribution": 19.5,
            "historical_susceptibility_contribution": 14.0,
            "narrative": "Critical compound hazard: 310mm localized rainfall combined with 2.8m storm surge over mean elevation of only 2.4m directly threatens dense municipal center and port."
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [82.205, 16.920],
                [82.270, 16.920],
                [82.285, 16.995],
                [82.225, 17.010],
                [82.195, 16.960],
                [82.205, 16.920]
            ]]
        }
    },
    {
        "id": "ZONE-AP-02",
        "zone_name": "Coringa Mangrove & Tidal Estuary Belt",
        "district": "Kakinada",
        "cyclone_id": "CYCLONE-2026-AP01",
        "flood_risk": 94.0,
        "surge_risk": 96.5,
        "wind_risk": 85.0,
        "infrastructure_risk": 86.0,
        "overall_risk": 91.8,
        "risk_level": "CRITICAL",
        "population_exposed": 48200,
        "elevation_mean": 1.5,
        "rainfall_forecast": 340.0,
        "distance_to_coast_km": 0.5,
        "explainability": {
            "rainfall_contribution": 36.0,
            "elevation_contribution": 32.5,
            "coastal_exposure_contribution": 21.0,
            "historical_susceptibility_contribution": 10.5,
            "narrative": "Maximum inundation susceptibility due to ultra-low topography (1.5m), direct marine exposure, and high estuarine tidal amplification."
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [82.220, 16.820],
                [82.300, 16.820],
                [82.290, 16.920],
                [82.205, 16.920],
                [82.220, 16.820]
            ]]
        }
    },
    {
        "id": "ZONE-AP-03",
        "zone_name": "Uppada Beach & Coastal Erosion Corridor",
        "district": "Kakinada",
        "cyclone_id": "CYCLONE-2026-AP01",
        "flood_risk": 74.0,
        "surge_risk": 86.0,
        "wind_risk": 84.0,
        "infrastructure_risk": 72.0,
        "overall_risk": 78.6,
        "risk_level": "HIGH",
        "population_exposed": 36000,
        "elevation_mean": 3.8,
        "rainfall_forecast": 275.0,
        "distance_to_coast_km": 0.4,
        "explainability": {
            "rainfall_contribution": 30.0,
            "elevation_contribution": 25.0,
            "coastal_exposure_contribution": 30.0,
            "historical_susceptibility_contribution": 15.0,
            "narrative": "Severe beach scouring and wave overtopping along coastal highway. High wave impact on seawalls."
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [82.280, 17.010],
                [82.355, 17.060],
                [82.330, 17.120],
                [82.250, 17.060],
                [82.280, 17.010]
            ]]
        }
    },
    {
        "id": "ZONE-AP-04",
        "zone_name": "Amalapuram Godavari Delta Plains",
        "district": "Konaseema",
        "cyclone_id": "CYCLONE-2026-AP01",
        "flood_risk": 68.0,
        "surge_risk": 55.0,
        "wind_risk": 70.0,
        "infrastructure_risk": 62.0,
        "overall_risk": 64.5,
        "risk_level": "HIGH",
        "population_exposed": 95000,
        "elevation_mean": 5.2,
        "rainfall_forecast": 240.0,
        "distance_to_coast_km": 14.0,
        "explainability": {
            "rainfall_contribution": 38.0,
            "elevation_contribution": 22.0,
            "coastal_exposure_contribution": 18.0,
            "historical_susceptibility_contribution": 22.0,
            "narrative": "Riverine overflow from Godavari channels driven by catchment rainfall; high agricultural and rural settlement exposure."
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [81.900, 16.480],
                [82.150, 16.500],
                [82.120, 16.680],
                [81.870, 16.650],
                [81.900, 16.480]
            ]]
        }
    },
    {
        "id": "ZONE-AP-05",
        "zone_name": "Samalkot Industrial Transition Corridor",
        "district": "Kakinada",
        "cyclone_id": "CYCLONE-2026-AP01",
        "flood_risk": 34.0,
        "surge_risk": 15.0,
        "wind_risk": 62.0,
        "infrastructure_risk": 48.0,
        "overall_risk": 37.7,
        "risk_level": "MEDIUM",
        "population_exposed": 62000,
        "elevation_mean": 14.5,
        "rainfall_forecast": 180.0,
        "distance_to_coast_km": 16.0,
        "explainability": {
            "rainfall_contribution": 35.0,
            "elevation_contribution": 10.0,
            "coastal_exposure_contribution": 5.0,
            "historical_susceptibility_contribution": 50.0,
            "narrative": "Elevated topography shields from marine surge; primary threat is localized drainage ponding and high wind gusts to light structures."
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [82.120, 17.000],
                [82.210, 17.020],
                [82.190, 17.110],
                [82.100, 17.080],
                [82.120, 17.000]
            ]]
        }
    },
    {
        "id": "ZONE-AP-06",
        "zone_name": "Peddapuram Elevated Relief Ridge",
        "district": "Kakinada",
        "cyclone_id": "CYCLONE-2026-AP01",
        "flood_risk": 18.0,
        "surge_risk": 0.0,
        "wind_risk": 48.0,
        "infrastructure_risk": 22.0,
        "overall_risk": 20.3,
        "risk_level": "LOW",
        "population_exposed": 38000,
        "elevation_mean": 24.0,
        "rainfall_forecast": 140.0,
        "distance_to_coast_km": 21.0,
        "explainability": {
            "rainfall_contribution": 25.0,
            "elevation_contribution": 5.0,
            "coastal_exposure_contribution": 0.0,
            "historical_susceptibility_contribution": 70.0,
            "narrative": "Natural high elevation ridge, well out of storm surge and major inundation zones. Identified as primary tactical staging and triage hub."
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [82.050, 17.040],
                [82.140, 17.060],
                [82.110, 17.150],
                [82.020, 17.120],
                [82.050, 17.040]
            ]]
        }
    },
    {
        "id": "ZONE-AP-07",
        "zone_name": "Visakhapatnam South Port & Coastal Belt",
        "district": "Visakhapatnam",
        "cyclone_id": "CYCLONE-2026-AP01",
        "flood_risk": 52.0,
        "surge_risk": 58.0,
        "wind_risk": 64.0,
        "infrastructure_risk": 60.0,
        "overall_risk": 57.7,
        "risk_level": "MEDIUM",
        "population_exposed": 185000,
        "elevation_mean": 7.5,
        "rainfall_forecast": 210.0,
        "distance_to_coast_km": 1.5,
        "explainability": {
            "rainfall_contribution": 32.0,
            "elevation_contribution": 22.0,
            "coastal_exposure_contribution": 26.0,
            "historical_susceptibility_contribution": 20.0,
            "narrative": "Rocky promontories reduce surge penetration compared to low deltas, but dense industrial infrastructure warrants proactive port shutdown."
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [83.220, 17.650],
                [83.330, 17.680],
                [83.310, 17.750],
                [83.200, 17.720],
                [83.220, 17.650]
            ]]
        }
    },
    {
        "id": "ZONE-AP-08",
        "zone_name": "Machilipatnam Marine Inundation Corridor",
        "district": "Krishna",
        "cyclone_id": "CYCLONE-2026-AP01",
        "flood_risk": 75.0,
        "surge_risk": 82.0,
        "wind_risk": 72.0,
        "infrastructure_risk": 70.0,
        "overall_risk": 75.1,
        "risk_level": "HIGH",
        "population_exposed": 82000,
        "elevation_mean": 2.8,
        "rainfall_forecast": 260.0,
        "distance_to_coast_km": 2.5,
        "explainability": {
            "rainfall_contribution": 34.0,
            "elevation_contribution": 28.0,
            "coastal_exposure_contribution": 24.0,
            "historical_susceptibility_contribution": 14.0,
            "narrative": "Flat deltaic terrain vulnerable to tidal surges and canal backups; fishing communities along Gilakaladindi highly exposed."
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [81.080, 16.120],
                [81.180, 16.140],
                [81.160, 16.230],
                [81.060, 16.210],
                [81.080, 16.120]
            ]]
        }
    }
]

DEMO_ALERTS: List[Dict[str, Any]] = [
    {
        "id": "ALERT-001",
        "severity": "CRITICAL",
        "zone_id": "ZONE-AP-01",
        "district": "Kakinada",
        "title": "CRITICAL INUNDATION ALERT: Kakinada Coastal Lowlands",
        "message": "Storm surge (2.8m) combined with extreme 24h rainfall (310mm) will cause critical inundation of low-lying port corridors within 12-18 hours.",
        "affected_summary": {
            "population_exposed": 142500,
            "hospitals_at_risk": 3,
            "power_stations_affected": 2,
            "roads_disrupted_km": 18.5
        },
        "recommended_action": "Activate mandatory evacuation for wards 1-12 within 0.8km of coast. Pre-position high-axle emergency ambulances at Samalkot transit camp.",
        "status": "ACTIVE",
        "created_at": "2026-09-28T19:30:00Z"
    },
    {
        "id": "ALERT-002",
        "severity": "CRITICAL",
        "zone_id": "ZONE-AP-02",
        "district": "Kakinada",
        "title": "ESTUARY ISOLATION WARNING: Coringa Mangrove Corridor",
        "message": "Projected water levels will overtop coastal road bridges. High probability of complete road cutoff for Coringa settlement cluster.",
        "affected_summary": {
            "population_exposed": 48200,
            "hospitals_at_risk": 1,
            "power_stations_affected": 1,
            "roads_disrupted_km": 12.0
        },
        "recommended_action": "Pre-stage SDRF amphibious rescue boats and SAT-phone communications before NH-216 low-bridge access is submerged.",
        "status": "ACTIVE",
        "created_at": "2026-09-28T20:00:00Z"
    },
    {
        "id": "ALERT-003",
        "severity": "HIGH",
        "zone_id": "ZONE-AP-03",
        "district": "Kakinada",
        "title": "COASTAL SCOURING & ROAD BREACH: Uppada Corridor",
        "message": "Gale wind speeds (145 km/h) and wave action expected to breach unprotected road sections along Uppada beach.",
        "affected_summary": {
            "population_exposed": 36000,
            "hospitals_at_risk": 0,
            "power_stations_affected": 0,
            "roads_disrupted_km": 8.5
        },
        "recommended_action": "Reroute all civilian vehicular traffic to inland NH-216 bypass. Position earthmoving machinery for embankment reinforcement.",
        "status": "ACTIVE",
        "created_at": "2026-09-28T20:15:00Z"
    },
    {
        "id": "ALERT-004",
        "severity": "HIGH",
        "zone_id": "ZONE-AP-08",
        "district": "Krishna",
        "title": "SURGE SURGE ADVISORY: Machilipatnam Coastal Belt",
        "message": "High tidal amplitude predicted around Gilakaladindi harbor; potential seawater intrusion into municipal water intakes.",
        "affected_summary": {
            "population_exposed": 82000,
            "hospitals_at_risk": 1,
            "power_stations_affected": 1,
            "roads_disrupted_km": 14.2
        },
        "recommended_action": "Secure fishing craft; shut down low-lying drainage sluice gates to prevent backflow into municipal canals.",
        "status": "ACTIVE",
        "created_at": "2026-09-28T20:45:00Z"
    }
]
