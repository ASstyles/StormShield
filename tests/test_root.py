"""
Root test runner and verification suite for StormShield X.
Allows running `pytest` directly from the repository root.
"""
import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Verify health endpoint format
def test_root_environment_verification():
    from app.config import settings
    assert settings.APP_NAME in ["StormShield", "StormShield X"]
    assert "http://localhost:3000" in settings.CORS_ORIGINS

def test_root_geospatial_validator():
    from app.geo.validator import GeospatialValidator
    valid, err = GeospatialValidator.validate_coordinates(82.25, 16.95)
    assert valid is True
    assert err is None

