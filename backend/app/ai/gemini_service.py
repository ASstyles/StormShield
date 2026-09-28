"""
Gemini AI Service for StormShield X.
Uses Google's latest stable Flash model (gemini-3.8-flash) via the official google-genai SDK.
Enforces strict Pydantic validation, retry mechanics, and deterministic domain-expert fallbacks.
"""

import json
import logging
import asyncio
from typing import Dict, Any, List, Optional

from app.config import settings
from app.ai.config import GeminiConfig, gemini_config
from app.ai.schemas import (
    GeminiSchemas,
    AIAnalyzeZoneResponse,
    AIPriorityAction,
    AIAnalyzeImageResponse,
    AskAIResponse
)
from app.ai.fallback import GeminiFallback

logger = logging.getLogger("stormshield.ai.service")

# Attempt importing modern official google-genai SDK
try:
    from google import genai
    from google.genai import types
    from google.genai.errors import APIError
    GENAI_SDK_AVAILABLE = True
except ImportError:
    GENAI_SDK_AVAILABLE = False
    logger.warning("google-genai SDK not available; operating in fallback-ready mode.")


class GeminiService:
    """
    Dedicated Gemini AI Integration Service.
    Acts as the single point of entry for all LLM and multimodal queries in StormShield X.
    Uses gemini-3.8-flash with deterministic grounding in application telemetry.
    """

    def __init__(self, config: Optional[GeminiConfig] = None):
        self.config = config or gemini_config
        self.model = self.config.model
        self.api_key = self.config.api_key
        self._client: Optional[Any] = None

        if self.config.is_configured and GENAI_SDK_AVAILABLE:
            try:
                self._client = genai.Client(api_key=self.config.api_key)
                logger.info(f"GeminiService initialized with model {self.model} [MODE: LIVE]")
            except Exception as e:
                logger.warning(f"Could not initialize google-genai Client: {e}. Fallback enabled.")
                self._client = None
        else:
            logger.info(f"GeminiService running with model {self.model} [MODE: FALLBACK - No valid API key]")

    def get_client(self) -> Optional[Any]:
        """Lazy re-initialization of genai.Client if API key is provided dynamically."""
        if not self._client and self.config.is_configured and GENAI_SDK_AVAILABLE:
            try:
                self._client = genai.Client(api_key=self.config.api_key)
            except Exception as e:
                logger.error(f"Failed to instantiate genai.Client: {e}")
        return self._client

    # -------------------------------------------------------------
    # 1. ZONE ANALYSIS (POST /api/ai/analyze-zone)
    # -------------------------------------------------------------
    async def analyze_zone(
        self,
        zone_id: str,
        cyclone_info: Optional[Dict[str, Any]] = None,
        risk_values: Optional[Dict[str, Any]] = None,
        infrastructure_exposure: Optional[Dict[str, Any]] = None,
        population: Optional[int] = None,
        road_risk: Optional[Dict[str, Any]] = None,
        hospital_risk: Optional[Dict[str, Any]] = None,
        shelter_risk: Optional[Dict[str, Any]] = None
    ) -> AIAnalyzeZoneResponse:
        """
        Synthesizes an explainable, operational action plan for an exposed geographic zone.
        Grounded strictly in pre-computed quantitative risk engine outputs.
        """
        zone_name = (risk_values or {}).get("zone_name", zone_id)
        overall_risk = (risk_values or {}).get("overall_risk", 75.0)
        pop_count = population or (risk_values or {}).get("population_exposed", 45000)

        prompt = f"""You are the Lead Disaster Management Technical Advisor for Coastal Andhra Pradesh.
Analyze the following quantitative cyclone and infrastructure vulnerability metrics for Zone: {zone_name} (ID: {zone_id}).

QUANTITATIVE DATA:
- Cyclone Info: {json.dumps(cyclone_info or {}, indent=2)}
- Risk Zone Scores: {json.dumps(risk_values or {}, indent=2)}
- Infrastructure Exposed: {json.dumps(infrastructure_exposure or {}, indent=2)}
- Exposed Population: {pop_count}
- Road Risk Assessment: {json.dumps(road_risk or {}, indent=2)}
- Hospital Risk: {json.dumps(hospital_risk or {}, indent=2)}
- Shelter Risk: {json.dumps(shelter_risk or {}, indent=2)}

GROUNDING RULES:
1. Base your reasoning solely on the provided risk engine outputs.
2. Do NOT invent new numerical weather or risk predictions.
3. Every recommendation must be concrete, operational, and actionable.

Return a valid JSON object matching this schema:
{{
  "summary": "Concise high-level tactical situation summary (2-3 sentences)",
  "risk_reasoning": [
    "Compound hazard driver 1 citing specific inputs",
    "Infrastructure vulnerability driver 2"
  ],
  "priority_actions": [
    {{
      "priority": 1,
      "action": "Specific anticipatory action",
      "reason": "Derived directly from input metrics",
      "target_sector": "Sector name",
      "urgency": "IMMEDIATE",
      "responsible_agency": "Agency name",
      "mitigation_impact": "Impact description"
    }}
  ],
  "critical_assets": ["List of endangered facilities/corridors"],
  "evacuation_considerations": ["Tactical evacuation timing, routes, and vulnerable population notes"],
  "confidence_notes": ["Note on data freshness, GIS resolution, and ground verification"]
}}
"""
        client = self.get_client()
        if client:
            for attempt in range(2):
                try:
                    logger.info(f"Dispatching analyze_zone request to Gemini {self.model} (attempt {attempt + 1})...")
                    config = types.GenerateContentConfig(
                        temperature=self.config.temperature,
                        max_output_tokens=self.config.max_output_tokens,
                        response_mime_type="application/json"
                    )
                    # Use asyncio timeout to enforce GEMINI_TIMEOUT_SECONDS
                    response = await asyncio.wait_for(
                        client.aio.models.generate_content(
                            model=self.model,
                            contents=prompt,
                            config=config
                        ),
                        timeout=float(self.config.timeout_seconds)
                    )
                    raw_text = response.text or ""
                    parsed = json.loads(raw_text)
                    validated = AIAnalyzeZoneResponse(**parsed)
                    logger.info(f"Gemini {self.model} zone analysis successfully validated for {zone_id}.")
                    return validated
                except asyncio.TimeoutError:
                    logger.warning(f"Gemini API timeout ({self.config.timeout_seconds}s) on attempt {attempt + 1}.")
                    break
                except (json.JSONDecodeError, ValueError) as ve:
                    logger.warning(f"Schema validation error on attempt {attempt + 1}: {ve}.")
                    if attempt == 0:
                        continue
                except Exception as e:
                    logger.warning(f"Gemini API call failed on attempt {attempt + 1}: {e}")
                    if attempt == 0:
                        await asyncio.sleep(1.0)
                        continue

        logger.info(f"Serving deterministic fallback zone analysis for {zone_id}.")
        return GeminiFallback.analyze_zone(
            zone_id=zone_id,
            cyclone_info=cyclone_info,
            risk_values=risk_values,
            infrastructure_exposure=infrastructure_exposure,
            population=population,
            road_risk=road_risk,
            hospital_risk=hospital_risk,
            shelter_risk=shelter_risk
        )

    # -------------------------------------------------------------
    # 2. EMERGENCY COMMANDER (POST /api/ai/ask)
    # -------------------------------------------------------------
    async def ask_commander(
        self,
        question: str,
        zone_id: Optional[str] = None,
        cyclone_state: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> AskAIResponse:
        """
        Answers operational incident commander inquiries strictly grounded in multi-hazard telemetry.
        """
        provenance = [
            "OFFICIAL: IMD / JTWC Track Telemetry",
            "MODEL: StormShield Hydrodynamic Surge Engine (v1.2)",
            "GIS: OpenStreetMap / 30m ALOS DEM",
            f"AI: Gemini Decision Engine Grounded Synthesis ({self.model})"
        ]

        ctx = context or {}
        active_cyclone = cyclone_state or ctx.get("cyclone", {
            "name": "Cyclone Jal-26",
            "wind_speed": 145.0,
            "rainfall": 280.0,
            "storm_surge": 2.8,
            "eta_hours": 18.0
        })
        wind = active_cyclone.get("wind_speed", 145.0)
        surge = active_cyclone.get("storm_surge", 2.8)
        rain = active_cyclone.get("rainfall", 280.0)
        eta = active_cyclone.get("eta_hours", 18.0)

        prompt = f"""You are the AI Emergency Commander for STORMSHIELD X — an anticipatory disaster operations platform.
You are advising senior incident commanders regarding coastal cyclone impact.

STRICT GROUNDING RULES:
1. Answer strictly using the provided structured facts below.
2. Never invent numbers, casualty estimates, or unmodeled facilities.
3. Every recommendation must be labeled as prototype decision support.

GROUNDED TELEMETRY:
- Active Cyclone: {active_cyclone.get('name', 'Cyclone Jal-26')}
- Current Landfall ETA: {eta} hours
- Sustained Wind: {wind} km/h
- Peak Storm Surge: {surge} m
- Cumulative Rainfall: {rain} mm
- Primary Vulnerable Hospital: Kakinada Government General Hospital (Criticality: 1.0, 350 beds, Elevation: 4.8m)
- Primary Vulnerable Harbor Clinic: Trust Port Health Center (Elevation: 3.2m, Distance to Coast: 1.2km)
- Primary Vulnerable Power Hub: Kakinada 400kV Grid Substation (Pop Served: 450,000, 2 hospitals dependent)
- Critical Road Vulnerability: NH-216 Coastal Spur (Overtopped when surge > 2.2m)
- Safe Evacuation Corridor: SH-73 Inland Bypass via Peddapuram (+4.2 min delta)
- Pre-positioned Shelters: Samalkot Cyclone Shelter (Capacity: 25,000, Elevation: 9.5m)
- Focus Zone: {zone_id or 'Regional Coastal Belt'}

COMMANDER INQUIRY:
"{question}"

Return JSON matching this schema:
{{
  "answer": "Clear, direct, authoritative military-grade tactical brief answering the question (3-5 sentences)",
  "grounded_facts": ["Fact 1 with exact numbers", "Fact 2 with exact numbers"],
  "recommended_actions": ["Specific immediate operational directive 1", "Directive 2"],
  "confidence_score": 0.95
}}
"""
        client = self.get_client()
        if client:
            for attempt in range(2):
                try:
                    logger.info(f"Dispatching ask_commander query to Gemini {self.model} (attempt {attempt + 1})...")
                    config = types.GenerateContentConfig(
                        temperature=0.1,
                        max_output_tokens=self.config.max_output_tokens,
                        response_mime_type="application/json"
                    )
                    response = await asyncio.wait_for(
                        client.aio.models.generate_content(
                            model=self.model,
                            contents=prompt,
                            config=config
                        ),
                        timeout=float(self.config.timeout_seconds)
                    )
                    raw_text = response.text or ""
                    parsed = json.loads(raw_text)
                    validated = AskAIResponse(
                        answer=parsed.get("answer", "Tactical assessment completed."),
                        grounded_facts=parsed.get("grounded_facts", []),
                        recommended_actions=parsed.get("recommended_actions", []),
                        data_provenance=provenance,
                        confidence_score=float(parsed.get("confidence_score", 0.95))
                    )
                    logger.info("Gemini ask_commander successfully answered inquiry.")
                    return validated
                except asyncio.TimeoutError:
                    logger.warning(f"Gemini API timeout ({self.config.timeout_seconds}s) on ask_commander attempt {attempt + 1}.")
                    break
                except (json.JSONDecodeError, ValueError) as ve:
                    logger.warning(f"ask_commander validation error on attempt {attempt + 1}: {ve}.")
                    if attempt == 0:
                        continue
                except Exception as e:
                    logger.warning(f"Gemini ask_commander call failed on attempt {attempt + 1}: {e}")
                    if attempt == 0:
                        await asyncio.sleep(1.0)
                        continue

        logger.info("Serving deterministic fallback commander assessment.")
        return GeminiFallback.ask_commander(
            question=question,
            zone_id=zone_id,
            cyclone_state=active_cyclone,
            context=context
        )

    # -------------------------------------------------------------
    # 3. MULTIMODAL IMAGE ANALYSIS (POST /api/ai/analyze-image)
    # -------------------------------------------------------------
    async def analyze_satellite_image(
        self,
        image_bytes: Optional[bytes] = None,
        image_mime: str = "image/jpeg",
        image_name: Optional[str] = "aerial_survey.jpg"
    ) -> AIAnalyzeImageResponse:
        """
        Multimodal analysis of satellite/aerial/drone imagery for visible flood extent and damaged infrastructure.
        """
        client = self.get_client()
        if client and image_bytes:
            for attempt in range(2):
                try:
                    logger.info(f"Dispatching multimodal image analysis to Gemini {self.model} (attempt {attempt + 1})...")
                    image_part = types.Part.from_bytes(data=image_bytes, mime_type=image_mime)
                    prompt = (
                        "You are an expert geospatial and satellite imagery analyst for emergency disaster response. "
                        "Inspect this aerial/satellite image of a coastal cyclone impact zone. "
                        "Analyze visible flooding, submerged roads, building damage, blocked routes, and environmental changes. "
                        "Return a JSON object with keys: "
                        "'observations' (list of strings describing visible water, road, building features), "
                        "'potential_risks' (list of strings describing structural/access risks), "
                        "'recommended_verification' (list of strings describing field checks), "
                        "'gis_ground_truth_comparison' (string describing how this compares with GIS inundation boundaries), "
                        "'confidence_level' (string: 'HIGH', 'MEDIUM', or 'LOW')."
                    )

                    config = types.GenerateContentConfig(
                        temperature=0.2,
                        max_output_tokens=self.config.max_output_tokens,
                        response_mime_type="application/json"
                    )
                    response = await asyncio.wait_for(
                        client.aio.models.generate_content(
                            model=self.model,
                            contents=[image_part, prompt],
                            config=config
                        ),
                        timeout=float(self.config.timeout_seconds)
                    )
                    raw_text = response.text or ""
                    parsed = json.loads(raw_text)
                    validated = AIAnalyzeImageResponse(**parsed)
                    logger.info("Gemini multimodal image analysis successfully validated.")
                    return validated
                except asyncio.TimeoutError:
                    logger.warning(f"Gemini API timeout on image analysis attempt {attempt + 1}.")
                    break
                except (json.JSONDecodeError, ValueError) as ve:
                    logger.warning(f"Image analysis parse error on attempt {attempt + 1}: {ve}.")
                    if attempt == 0:
                        continue
                except Exception as e:
                    logger.warning(f"Gemini image analysis failed on attempt {attempt + 1}: {e}")
                    if attempt == 0:
                        await asyncio.sleep(1.0)
                        continue

        logger.info("Serving deterministic fallback image analysis.")
        return GeminiFallback.analyze_satellite_image(
            image_bytes=image_bytes,
            image_mime=image_mime,
            image_name=image_name
        )


gemini_service = GeminiService()
