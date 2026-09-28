import pytest
import os
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_root_serves_html(client):
    """Verify GET / returns index.html (React frontend) rather than JSON."""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "<!doctype html>" in response.text.lower() or "<div id=\"root\">" in response.text.lower()

def test_spa_routes_serve_html(client):
    """Verify SPA client-side routes return index.html for React Router."""
    for route in ["/command-center", "/simulator", "/cascade", "/ai", "/brics", "/resilience", "/alerts"]:
        response = client.get(route)
        assert response.status_code == 200, f"Route {route} failed with {response.status_code}"
        assert "text/html" in response.headers.get("content-type", "")
        assert "<div id=\"root\">" in response.text.lower() or "<!doctype html>" in response.text.lower()

def test_health_endpoints_not_intercepted(client):
    """Verify /health and /health/ready are served by FastAPI directly."""
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json().get("status") in ["healthy", "degraded"]

    res_ready = client.get("/health/ready")
    assert res_ready.status_code in [200, 503]

def test_docs_and_openapi_not_intercepted(client):
    """Verify /docs and /openapi.json are served by FastAPI directly."""
    res_docs = client.get("/docs")
    assert res_docs.status_code == 200

    res_openapi = client.get("/openapi.json")
    assert res_openapi.status_code == 200
    assert "openapi" in res_openapi.json()

def test_api_endpoints_not_intercepted(client):
    """Verify /api/* endpoints return valid API JSON responses."""
    res_cyclones = client.get("/api/cyclones")
    assert res_cyclones.status_code == 200
    assert isinstance(res_cyclones.json(), list)

    res_risk_zones = client.get("/api/risk/zones")
    assert res_risk_zones.status_code == 200

def test_static_assets_served(client):
    """Verify assets in /assets/* are served as static files."""
    dist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist", "assets")
    if os.path.isdir(dist_dir):
        files = os.listdir(dist_dir)
        if files:
            sample_asset = files[0]
            res = client.get(f"/assets/{sample_asset}")
            assert res.status_code == 200
