import logging
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.session import init_db
from app.database.seed import seed_database
from app.api.endpoints import router as api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("stormshield.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Environment Validation
    logger.info("Validating StormShield environment configuration...")
    if not settings.DATABASE_URL:
        logger.critical("Configuration Error: DATABASE_URL must be configured.")
        raise RuntimeError("Configuration Error: DATABASE_URL must be configured.")

    if not settings.GEMINI_MODEL:
        settings.GEMINI_MODEL = "gemini-3.8-flash"

    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        logger.info(f"AI SERVICE: LIVE mode active with model '{settings.GEMINI_MODEL}'")
    else:
        logger.info(f"AI SERVICE: Demo fallback mode active (GEMINI_API_KEY is not configured; active model: '{settings.GEMINI_MODEL}')")

    # 2. Database Initialization & Seed
    logger.info("Initializing StormShield database and verifying seed datasets...")
    try:
        init_db()
        seed_database()
        logger.info("StormShield ready for operations.")
    except Exception as e:
        logger.error(f"Startup initialization warning: {e}")
    yield
    logger.info("Shutting down StormShield.")

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "StormShield: AI Cyclone Impact & Infrastructure Intelligence Platform. "
        "Transforms meteorological forecasts and geospatial layers into deterministic infrastructure exposure, "
        "quantified risk indices, emergency routing, and AI-driven operational action plans."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Global Unhandled Exception Handler (Security Hardening: No raw stack traces to users)
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    logger.error(f"req_id={req_id} Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server processing error. The incident has been logged.",
            "request_id": req_id
        }
    )

# Request ID & Observability Middleware
@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.perf_counter()
    
    response: Response = await call_next(request)
    
    process_time_ms = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"
    
    if not request.url.path.startswith("/api/health"):
        logger.info(
            f"req_id={request_id[:8]} {request.method} {request.url.path} "
            f"status={response.status_code} latency={process_time_ms:.2f}ms"
        )
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redirect /api/docs -> /docs for backwards compatibility
@app.get("/api/docs", include_in_schema=False)
def redirect_api_docs():
    return RedirectResponse(url="/docs")

@app.get("/api/openapi.json", include_in_schema=False)
def redirect_api_openapi():
    return RedirectResponse(url="/openapi.json")

# Include API Router
app.include_router(api_router, prefix="/api")

@app.get("/health")
def root_health():
    from app.database.session import is_db_connected
    from app.providers.gee_provider import gee_provider
    from app.ai.gemini_service import gemini_service
    db_ok = is_db_connected()
    return {
        "status": "ok",
        "database": "connected" if db_ok else "disconnected",
        "version": settings.APP_VERSION,
        "service": "StormShield Emergency Impact Engine",
        "gee_connected": gee_provider.is_connected,
        "ai_model": gemini_service.model
    }

@app.get("/health/ready")
def root_health_ready():
    from app.database.session import is_db_connected, SessionLocal
    from app.models.db_models import CycloneModel, InfrastructureModel
    from app.providers.gee_provider import gee_provider
    from app.ai.gemini_service import gemini_service
    if not is_db_connected():
        return JSONResponse(status_code=503, content={"status": "error", "detail": "Database connection unavailable"})
    db = SessionLocal()
    try:
        cyclones_count = db.query(CycloneModel).count()
        infra_count = db.query(InfrastructureModel).count()
        return {
            "status": "ok",
            "ready": True,
            "database": "connected",
            "version": settings.APP_VERSION,
            "seeded_scenario_ready": cyclones_count > 0 and infra_count > 0,
            "active_cyclones": cyclones_count,
            "monitored_infrastructure": infra_count,
            "gee_service": "connected" if gee_provider.is_connected else "synthetic_demo_mode",
            "ai_service": "gemini_ready" if gemini_service.api_key else "offline_rule_engine_ready"
        }
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "error", "detail": f"Readiness check failed: {e}"})
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "platform": settings.APP_NAME,
        "tagline": "From cyclone forecasts to infrastructure decisions.",
        "status": "ONLINE",
        "docs": "/docs",
        "api_docs": "/api/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
