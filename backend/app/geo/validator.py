"""
Geospatial Validation Utility for StormShield X.
Validates GeoJSON geometries, coordinate ranges, CRS expectations,
and repairs simple invalid geometries using Shapely make_valid.
"""

import logging
from typing import Dict, Any, Tuple, Optional
from shapely.geometry import shape, mapping
from shapely.validation import make_valid

logger = logging.getLogger("stormshield.geo.validator")

class GeospatialValidator:
    """
    Validates geometries for consistency, coordinate ranges (EPSG:4326),
    valid topology, non-emptiness, and attempts repair on corrupted polygons.
    """

    ALLOWED_TYPES = {
        "Point", "MultiPoint",
        "LineString", "MultiLineString",
        "Polygon", "MultiPolygon",
        "GeometryCollection"
    }

    @classmethod
    def validate_coordinates(cls, lon: float, lat: float) -> Tuple[bool, Optional[str]]:
        """Validates that a coordinate pair falls within valid WGS84 EPSG:4326 bounds."""
        if not (-180.0 <= lon <= 180.0):
            return False, f"Longitude {lon} out of bounds [-180, 180]"
        if not (-90.0 <= lat <= 90.0):
            return False, f"Latitude {lat} out of bounds [-90, 90]"
        return True, None

    @classmethod
    def validate_geometry(
        cls, 
        geom_dict: Dict[str, Any], 
        auto_repair: bool = True
    ) -> Tuple[bool, Dict[str, Any], Optional[str]]:
        """
        Validates GeoJSON geometry dictionary.
        Checks:
        1. Non-empty dictionary with 'type' and 'coordinates'
        2. Recognized geometry type
        3. Shapely parseability
        4. is_empty check
        5. is_valid check (with optional auto_repair via make_valid)
        6. Coordinate bounds in WGS84 range

        Returns: (is_valid, geometry_dict, error_or_warning_message)
        """
        if not isinstance(geom_dict, dict):
            return False, geom_dict, "Geometry must be a dictionary"

        geom_type = geom_dict.get("type")
        if not geom_type or geom_type not in cls.ALLOWED_TYPES:
            return False, geom_dict, f"Invalid or missing geometry type: {geom_type}"

        if "coordinates" not in geom_dict:
            return False, geom_dict, "Geometry missing 'coordinates' field"

        try:
            geom_obj = shape(geom_dict)
        except Exception as e:
            return False, geom_dict, f"Failed to parse GeoJSON geometry: {e}"

        if geom_obj.is_empty:
            return False, geom_dict, "Geometry is empty"

        # Check coordinate bounds (WGS84)
        minx, miny, maxx, maxy = geom_obj.bounds
        if minx < -180.0 or maxx > 180.0 or miny < -90.0 or maxy > 90.0:
            return False, geom_dict, f"Coordinates out of WGS84 bounds: ({minx}, {miny}, {maxx}, {maxy})"

        # Check topological validity
        if not geom_obj.is_valid:
            if auto_repair:
                try:
                    repaired_geom = make_valid(geom_obj)
                    if repaired_geom.is_valid and not repaired_geom.is_empty:
                        logger.info(f"Successfully repaired invalid {geom_type} geometry.")
                        return True, mapping(repaired_geom), "Geometry repaired with make_valid"
                except Exception as repair_err:
                    logger.warning(f"Geometry repair failed: {repair_err}")
            return False, geom_dict, f"Topology is invalid: {geom_obj.is_valid}"

        return True, geom_dict, None

validator = GeospatialValidator()
