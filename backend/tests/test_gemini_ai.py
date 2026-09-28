"""
Tests for Gemini AI Integration (gemini-3.8-flash) in StormShield X.
Verifies GeminiService, GeminiConfig, GeminiSchemas, GeminiFallback, and AI endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ai.config import gemini_config, GeminiConfig
from app.ai.schemas import GeminiSchemas, AIAnalyzeZoneResponse, AskAIResponse, AIAnalyzeImageResponse
from app.ai.fallback import GeminiFallback
from app.ai.gemini_service import gemini_service

client = TestClient(app)

def test_gemini_model_configuration():
    """Verify that the active model is configured to gemini-3.8-flash."""
    assert gemini_config.model == "gemini-3.8-flash"
    assert gemini_service.model == "gemini-3.8-flash"
    # Ensure no deprecated model strings are present
    assert "gemini-1" not in gemini_config.model
    assert "gemini-2" not in gemini_config.model
    assert "gemini-3.5" not in gemini_config.model
    assert "gemini-3.6" not in gemini_config.model
    assert "gemini-3.7" not in gemini_config.model

def test_gemini_config_fallback_mode():
    """Verify fallback detection when API key is empty."""
    cfg = GeminiConfig(api_key="", model="gemini-3.8-flash")
    assert cfg.is_configured is False
    assert cfg.ai_mode == "FALLBACK"

def test_gemini_schemas_namespace():
    """Verify GeminiSchemas namespace exposes expected models."""
    assert GeminiSchemas.ZoneAnalysis == AIAnalyzeZoneResponse
    assert GeminiSchemas.AskCommander == AskAIResponse
    assert GeminiSchemas.ImageAnalysis == AIAnalyzeImageResponse

def test_fallback_zone_analysis():
    """Test deterministic domain-expert zone analysis."""
    res = GeminiFallback.analyze_zone(
        zone_id="ZONE-AP-01",
        population=42000,
        risk_values={"zone_name": "Kakinada Lowlands", "overall_risk": 88.5, "risk_level": "CRITICAL"}
    )
    assert isinstance(res, AIAnalyzeZoneResponse)
    assert len(res.summary) > 20
    assert len(res.risk_reasoning) >= 3
    assert len(res.priority_actions) >= 3
    assert len(res.critical_assets) >= 2
    assert len(res.evacuation_considerations) >= 2
    assert len(res.confidence_notes) >= 1
    assert res.confidence_score >= 0.90

@pytest.mark.parametrize("question,expected_snippet", [
    ("Which hospitals are most vulnerable?", "Kakinada Government General Hospital"),
    ("What happens if rainfall increases by 30%?", "30%"),
    ("Which evacuation route should be avoided?", "NH-216"),
    ("Where should ambulances be positioned?", "ambulances"),
    ("Why is Zone 7 critical?", "CRITICAL"),
    ("What should authorities do in the next six hours?", "6-hour"),
])
def test_fallback_ask_commander_scenarios(question, expected_snippet):
    """Test that all 6 core hackathon commander questions receive grounded answers."""
    res = GeminiFallback.ask_commander(question=question)
    assert isinstance(res, AskAIResponse)
    assert len(res.grounded_facts) >= 2
    assert len(res.recommended_actions) >= 2
    assert len(res.data_provenance) >= 2
    assert res.confidence_score >= 0.90
    assert expected_snippet.lower() in res.answer.lower() or any(expected_snippet.lower() in f.lower() for f in res.grounded_facts)

def test_api_analyze_zone_endpoint():
    """Test POST /api/ai/analyze-zone endpoint."""
    payload = {
        "zone_id": "ZONE-AP-01",
        "population": 42000,
        "risk_values": {"overall_risk": 85.0, "risk_level": "CRITICAL"}
    }
    resp = client.post("/api/ai/analyze-zone", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "summary" in data
    assert "priority_actions" in data
    assert len(data["priority_actions"]) >= 1
    assert "critical_assets" in data

def test_api_ask_commander_endpoint():
    """Test POST /api/ai/ask endpoint."""
    payload = {
        "question": "Which evacuation route should be avoided?",
        "zone_id": "ZONE-AP-01"
    }
    resp = client.post("/api/ai/ask", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert len(data["grounded_facts"]) >= 1
    assert len(data["recommended_actions"]) >= 1

def test_api_analyze_image_endpoint():
    """Test POST /api/ai/analyze-image endpoint."""
    resp = client.post("/api/ai/analyze-image")
    assert resp.status_code == 200
    data = resp.json()
    assert "observations" in data
    assert len(data["observations"]) >= 1
    # Both potential_risks and possible_risks are present
    assert "potential_risks" in data
    assert "possible_risks" in data
    assert "recommended_verification" in data
    assert "recommended_verification_steps" in data
