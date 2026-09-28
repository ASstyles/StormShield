import os
import logging
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
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
    allow_origin_regex=r"https://.*\.onrender\.com",
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
        "status": "healthy" if db_ok else "degraded",
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
            "status": "healthy",
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

# -----------------------------------------------------------------------------
# Static Files & React SPA Serving Configuration
# -----------------------------------------------------------------------------
def resolve_static_dir() -> str:
    # 1. Environment variable if set
    env_dir = os.getenv("STATIC_DIR")
    if env_dir and os.path.isdir(env_dir):
        return os.path.abspath(env_dir)
    # 2. Container path /app/static
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app_static = os.path.join(base_dir, "static")
    if os.path.isdir(app_static):
        return app_static
    # 3. Local monorepo sibling frontend/dist
    repo_root = os.path.dirname(base_dir)
    dist_dir = os.path.join(repo_root, "frontend", "dist")
    if os.path.isdir(dist_dir):
        return dist_dir
    return app_static

STATIC_DIR = resolve_static_dir()
logger.info(f"Static assets directory resolved to: {STATIC_DIR} (exists: {os.path.isdir(STATIC_DIR)})")

# Mount /assets if directory exists
assets_dir = os.path.join(STATIC_DIR, "assets")
if os.path.isdir(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    logger.info(f"Mounted static /assets from: {assets_dir}")

@app.get("/", include_in_schema=False)
async def serve_root():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(
            index_file,
            media_type="text/html",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
        )
    return JSONResponse(
        content={
            "platform": settings.APP_NAME,
            "tagline": "From cyclone forecasts to infrastructure decisions.",
            "status": "ONLINE",
            "notice": "Frontend build not detected in static/ directory. Please run 'npm run build' inside frontend/.",
            "docs": "/docs",
            "api_docs": "/api/docs",
            "health": "/health"
        }
    )

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa_route(full_path: str):
    # Guard API endpoints, docs, and health checks
    if (
        full_path.startswith("api")
        or full_path.startswith("docs")
        or full_path.startswith("redoc")
        or full_path.startswith("openapi.json")
        or full_path.startswith("health")
    ):
        raise HTTPException(status_code=404, detail=f"API resource '/{full_path}' not found")

    # If the requested path is an existing static file (e.g. favicon.svg, icons.svg)
    file_path = os.path.join(STATIC_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)

    # Otherwise return index.html for SPA client-side routing (React Router)
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(
            index_file,
            media_type="text/html",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
        )

    raise HTTPException(status_code=404, detail="Page not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
