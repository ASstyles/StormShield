"""
Gemini AI Configuration Module for StormShield X.
Manages model settings, credentials, timeouts, and API endpoints for gemini-3.8-flash.
"""

from typing import Optional
from app.config import settings

class GeminiConfig:
    """Encapsulates configuration parameters for Gemini AI integration."""
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_output_tokens: Optional[int] = None,
        timeout_seconds: Optional[int] = None
    ):
        self.api_key: str = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.model: str = model or settings.GEMINI_MODEL or "gemini-3.8-flash"
        self.temperature: float = temperature if temperature is not None else settings.GEMINI_TEMPERATURE
        self.max_output_tokens: int = max_output_tokens if max_output_tokens is not None else settings.GEMINI_MAX_OUTPUT_TOKENS
        self.timeout_seconds: int = timeout_seconds if timeout_seconds is not None else settings.GEMINI_TIMEOUT_SECONDS
        self.base_url: str = "https://generativelanguage.googleapis.com/v1beta/models"

    @property
    def is_configured(self) -> bool:
        """Returns True if a non-empty API key is present."""
        return bool(self.api_key and self.api_key.strip())

    @property
    def generate_endpoint(self) -> str:
        """Returns the full generateContent REST URL."""
        return f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"

    @property
    def ai_mode(self) -> str:
        """Returns LIVE if API key is configured, else FALLBACK."""
        return "LIVE" if self.is_configured else "FALLBACK"

gemini_config = GeminiConfig()
