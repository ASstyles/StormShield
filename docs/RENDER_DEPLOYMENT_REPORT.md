# STORMSHIELD X — SINGLE RENDER SERVICE DEPLOYMENT REPORT

## 1. Unified Architecture Overview

StormShield X is now configured as **ONE unified Render Web Service** operating inside **ONE multi-stage Docker container**:

```
                       Public URL: https://stormshield.onrender.com
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                  Render Web Service: "stormshield" (0.0.0.0:$PORT)               |
|                                                                                 |
|  Stage 1 (Node 20 Alpine):                                                      |
|    - Builds React 19 + TypeScript + Vite + MapLibre into /app/frontend/dist     |
|                                                                                 |
|  Stage 2 (Python 3.11 Slim):                                                    |
|    - FastAPI ASGI Engine (Uvicorn)                                              |
|    - Static Assets copied to /app/static                                        |
|                                                                                 |
|  Routing Matrix inside FastAPI:                                                 |
|    - GET /                         --> Serves static/index.html (React App)     |
|    - GET /command-center, etc.     --> SPA Fallback to index.html (HTTP 200)    |
|    - GET /assets/*                 --> Serves static JS, CSS, MapLibre worker   |
|    - GET /api/*                    --> Handled by FastAPI REST Router           |
|    - GET /health                   --> Backend Health Probe (HTTP 200)          |
|    - GET /health/ready             --> Database & Seed Readiness Probe          |
|    - GET /docs                     --> Interactive Swagger UI                   |
|    - GET /openapi.json             --> OpenAPI JSON Specification               |
+---------------------------------------------------------------------------------+
```

---

## 2. Root Cause Resolved

| Problem | Root Cause | Permanent Resolution |
| :--- | :--- | :--- |
| `https://stormshield.onrender.com` returned raw FastAPI JSON | FastAPI `GET /` previously returned a dictionary with status metadata, while the React frontend was completely omitted from the image. | Multi-stage root [Dockerfile](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/Dockerfile) compiles the React app and copies it to `/app/static`. FastAPI in [backend/app/main.py](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/backend/app/main.py) serves `index.html` on `GET /` and client routes. |
| SPA routes (e.g. `/simulator`) returning 404 upon browser refresh | FastAPI didn't have a catch-all route for React Router. | Added `@app.get("/{full_path:path}")` returning `index.html` for all client-side paths while strictly safeguarding `/api`, `/health`, and `/docs`. |
| Port mismatch on Render | Hardcoded port 8000. | Root Dockerfile uses `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`. |

---

## 3. Key Components & Implementation

### A. Unified Multi-Stage Dockerfile ([Dockerfile](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/Dockerfile))
1. **Frontend Build Stage**:
   - `node:20-alpine` builds `frontend/package.json` with `npm ci` and `npm run build`.
   - Produces `/app/frontend/dist` with MapLibre worker chunk and optimized CSS/JS.
2. **FastAPI Runtime Stage**:
   - `python:3.11-slim` installs C libraries (`build-essential`, `libpq-dev`, `libgeos-dev`, `curl`).
   - Copies `/app/frontend/dist` into `/app/static`.
   - Binds dynamically to `0.0.0.0:$PORT` provided by Render.

### B. FastAPI Serving Logic ([backend/app/main.py](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/backend/app/main.py))
- **Static Assets**:
  ```python
  app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")
  ```
- **Root Route**:
  ```python
  @app.get("/", include_in_schema=False)
  async def serve_root():
      index_file = os.path.join(STATIC_DIR, "index.html")
      return FileResponse(index_file, media_type="text/html", headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
  ```
- **SPA Catch-All Route**:
  ```python
  @app.get("/{full_path:path}", include_in_schema=False)
  async def serve_spa_route(full_path: str):
      if full_path.startswith(("api", "docs", "redoc", "openapi.json", "health")):
          raise HTTPException(status_code=404, detail="Not Found")
      file_path = os.path.join(STATIC_DIR, full_path)
      if os.path.isfile(file_path):
          return FileResponse(file_path)
      return FileResponse(os.path.join(STATIC_DIR, "index.html"), media_type="text/html")
  ```

### C. Frontend API Client ([frontend/src/services/api.ts](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/frontend/src/services/api.ts))
Since both frontend and backend share the identical origin `https://stormshield.onrender.com`:
- `BASE_URL` resolves to `'/api'`.
- All requests (`fetch('/api/health')`, `fetch('/api/cyclones')`, etc.) are same-origin.
- No cross-origin network hops or CORS issues in production.

---

## 4. Render Blueprint ([render.yaml](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/render.yaml))

Contains only **ONE** Web Service:
```yaml
version: "1"

services:
  - type: web
    name: stormshield
    runtime: docker
    dockerfilePath: Dockerfile
    dockerContext: .
    plan: free
    region: oregon
    healthCheckPath: /health
    envVars:
      - key: PORT
        value: 8000
      - key: DATABASE_URL
        fromDatabase:
          name: stormshield-db
          property: connectionString
      - key: GEMINI_API_KEY
        sync: false
      - key: GEMINI_MODEL
        value: gemini-3.8-flash
      - key: CORS_ORIGINS
        value: "http://localhost:3000,https://stormshield.onrender.com"
      - key: ENV
        value: production

databases:
  - name: stormshield-db
    databaseName: stormshield
    user: stormshield
    plan: free
    region: oregon
```

---

## 5. Verification Matrix (All Passed)

| Route / Capability | Expected Outcome | Verified Test | Status |
| :--- | :--- | :--- | :--- |
| `GET /` | Returns `text/html` (`index.html`) with `<div id="root">` | `tests/test_single_container_serving.py::test_root_serves_html` | **PASS** |
| `GET /command-center` | Returns `index.html` with HTTP 200 | `test_spa_routes_serve_html` | **PASS** |
| `GET /simulator` | Returns `index.html` with HTTP 200 | `test_spa_routes_serve_html` | **PASS** |
| `GET /cascade` | Returns `index.html` with HTTP 200 | `test_spa_routes_serve_html` | **PASS** |
| `GET /ai` | Returns `index.html` with HTTP 200 | `test_spa_routes_serve_html` | **PASS** |
| `GET /brics` | Returns `index.html` with HTTP 200 | `test_spa_routes_serve_html` | **PASS** |
| `GET /resilience` | Returns `index.html` with HTTP 200 | `test_spa_routes_serve_html` | **PASS** |
| `GET /alerts` | Returns `index.html` with HTTP 200 | `test_spa_routes_serve_html` | **PASS** |
| `GET /health` | Returns `{"status": "healthy", ...}` | `test_health_endpoints_not_intercepted` | **PASS** |
| `GET /health/ready` | Returns readiness status JSON | `test_health_endpoints_not_intercepted` | **PASS** |
| `GET /docs` | Returns Swagger HTML UI | `test_docs_and_openapi_not_intercepted` | **PASS** |
| `GET /openapi.json` | Returns OpenAPI schema JSON | `test_docs_and_openapi_not_intercepted` | **PASS** |
| `GET /api/cyclones` | Returns active cyclone records | `test_api_endpoints_not_intercepted` | **PASS** |
| `GET /api/risk/zones` | Returns GeoJSON risk zones | `test_api_endpoints_not_intercepted` | **PASS** |
| `GET /assets/*` | Serves compiled static JavaScript and CSS assets | `test_static_assets_served` | **PASS** |
| **Product Flow** | All 16 end-to-end integration steps | `tests/test_full_product_flow.py` | **PASS** |
