from typing import Dict, Any, List
from app.providers.base import (
    WeatherProvider,
    SatelliteProvider,
    InfrastructureProvider,
    PopulationProvider,
    CycloneProvider
)
from app.providers.demo_data import DEMO_CYCLONE, DEMO_INFRASTRUCTURE

class DemoWeatherProvider(WeatherProvider):
    def get_cyclone_weather_field(self, lat: float, lon: float) -> Dict[str, Any]:
        return {
            "source": "Synthetic / Demo Weather Model (Bay of Bengal Radar Simulation)",
            "center": {"lat": lat, "lon": lon},
            "sustained_wind_kmh": 145.0,
            "gusts_kmh": 175.0,
            "central_pressure_hpa": 962.0,
            "accumulated_rain_24h_mm": 280.0,
            "wave_height_meters": 6.8,
            "timestamp": "2026-09-28T21:00:00Z"
        }

class DemoSatelliteProvider(SatelliteProvider):
    def get_satellite_layer(self, layer_type: str, bbox: List[float]) -> Dict[str, Any]:
        return {
            "layer_type": layer_type, # 'sentinel-1-sar-water', 'sentinel-2-truecolor', 'copernicus-dem'
            "bbox": bbox,
            "source": "Demo Synthetic Satellite Raster Layer",
            "tile_url_template": "https://api.stormshield.demo/tiles/{z}/{x}/{y}.png",
            "resolution_m": 10.0,
            "satellite_pass_time": "2026-09-28T18:30:00Z",
            "water_detection_confidence": 0.94
        }

class DemoInfrastructureProvider(InfrastructureProvider):
    def get_infrastructure_assets(self, bbox: List[float]) -> List[Dict[str, Any]]:
        return DEMO_INFRASTRUCTURE

class DemoPopulationProvider(PopulationProvider):
    def get_population_grid(self, bbox: List[float]) -> Dict[str, Any]:
        return {
            "source": "Synthetic High-Resolution Population Grid (Derived from Census/LandScan AP)",
            "bbox": bbox,
            "total_population_in_bbox": 640000,
            "density_hotspots": [
                {"name": "Kakinada Urban Municipality", "lat": 16.989, "lon": 82.247, "population": 420000},
                {"name": "Samalkot Town", "lat": 17.050, "lon": 82.170, "population": 85000},
                {"name": "Peddapuram Ward Cluster", "lat": 17.080, "lon": 82.130, "population": 65000}
            ]
        }

class DemoCycloneProvider(CycloneProvider):
    def get_active_cyclone_track(self, cyclone_id: str) -> Dict[str, Any]:
        return DEMO_CYCLONE
