from abc import ABC, abstractmethod
from typing import Dict, Any, List

class WeatherProvider(ABC):
    @abstractmethod
    def get_cyclone_weather_field(self, lat: float, lon: float) -> Dict[str, Any]:
        """Fetch precipitation, wind speed, pressure grid around cyclone eye."""
        pass

class SatelliteProvider(ABC):
    @abstractmethod
    def get_satellite_layer(self, layer_type: str, bbox: List[float]) -> Dict[str, Any]:
        """Fetch Sentinel-1 SAR flood imagery, Sentinel-2 optical, or cloud cover."""
        pass

class InfrastructureProvider(ABC):
    @abstractmethod
    def get_infrastructure_assets(self, bbox: List[float]) -> List[Dict[str, Any]]:
        """Fetch critical infrastructure points (OSM or internal register)."""
        pass

class PopulationProvider(ABC):
    @abstractmethod
    def get_population_grid(self, bbox: List[float]) -> Dict[str, Any]:
        """Fetch WorldPop / census population density surface."""
        pass

class CycloneProvider(ABC):
    @abstractmethod
    def get_active_cyclone_track(self, cyclone_id: str) -> Dict[str, Any]:
        """Fetch official forecast track and intensity advisory."""
        pass
