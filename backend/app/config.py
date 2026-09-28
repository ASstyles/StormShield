import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    APP_NAME: str = "StormShield X"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENV: str = "development"
    
    # Database
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "stormshield")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "stormshield")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "St0rmSh1eld_X_Secur3_2026_Postgres!")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "postgres")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    
    # Gemini AI Configuration (Default: gemini-3.8-flash)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    GEMINI_TEMPERATURE: float = float(os.getenv("GEMINI_TEMPERATURE", "0.2"))
    GEMINI_MAX_OUTPUT_TOKENS: int = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "2048"))
    GEMINI_TIMEOUT_SECONDS: int = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "60"))
    
    # Google Earth Engine (Optional)
    GEE_ENABLED: bool = os.getenv("GEE_ENABLED", "false").lower() in ("true", "1", "yes")
    GEE_SERVICE_ACCOUNT: str = os.getenv("GEE_SERVICE_ACCOUNT", "")
    GEE_PRIVATE_KEY_PATH: str = os.getenv("GEE_PRIVATE_KEY_PATH", "")
    GEE_PROJECT_ID: str = os.getenv("GEE_PROJECT_ID", "")
    
    # Frontend URL
    FRONTEND_PORT: int = int(os.getenv("FRONTEND_PORT", "3000"))
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    FRONTEND_API_URL: str = os.getenv("FRONTEND_API_URL", "http://localhost:8000")

    # Data Providers
    WEATHER_PROVIDER: str = os.getenv("WEATHER_PROVIDER", "demo")
    SATELLITE_PROVIDER: str = os.getenv("SATELLITE_PROVIDER", "demo")
    INFRASTRUCTURE_PROVIDER: str = os.getenv("INFRASTRUCTURE_PROVIDER", "demo")
    CYCLONE_PROVIDER: str = os.getenv("CYCLONE_PROVIDER", "demo")

    # CORS Origins (Configurable via comma-separated string or list)
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://frontend:80",
        "http://frontend",
        "https://stormshield.onrender.com",
        "https://stormshield-frontend.onrender.com",
        "https://stormshield-api.onrender.com"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        defaults = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://frontend:80",
            "http://frontend",
            "https://stormshield.onrender.com",
            "https://stormshield-frontend.onrender.com",
            "https://stormshield-api.onrender.com"
        ]
        if isinstance(v, str):
            custom = [i.strip() for i in v.split(",") if i.strip()]
            return list(dict.fromkeys(defaults + custom))
        if isinstance(v, list):
            return list(dict.fromkeys(defaults + v))
        return defaults
    
    # Risk Parameters (Configurable thresholds)
    RISK_WEIGHT_FLOOD: float = 0.35
    RISK_WEIGHT_SURGE: float = 0.25
    RISK_WEIGHT_WIND: float = 0.20
    RISK_WEIGHT_INFRASTRUCTURE: float = 0.20
    
    FLOOD_WEIGHT_RAINFALL: float = 0.35
    FLOOD_WEIGHT_ELEVATION: float = 0.30
    FLOOD_WEIGHT_COASTAL: float = 0.20
    FLOOD_WEIGHT_HISTORICAL: float = 0.15

    # Upload Limits
    MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
