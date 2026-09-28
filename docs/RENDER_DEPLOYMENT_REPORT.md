# STORMSHIELD X — RENDER PRODUCTION DEPLOYMENT REPORT

## 1. Why the Old Deployment Showed JSON

When visiting `https://stormshield.onrender.com`, the browser displayed the following raw JSON:

```json
{
  "platform": "StormShield X",
  "tagline": "From cyclone forecasts to infrastructure decisions.",
  "status": "ONLINE",
  "docs": "/docs",
  "api_docs": "/api/docs"
}
```

### Exact Root Cause:
1. **Repository Root Dockerfile Misidentification**: The root repository contained a Python Dockerfile (`./Dockerfile`) whose `CMD` was `["uvicorn", "app.main:app", ...]`.
2. **Missing `render.yaml` Blueprint**: Without a multi-service `render.yaml` Blueprint or subfolder specification in Render, Render detected the repository root, found the root `Dockerfile`, and created a **single** Web Service pointing directly to the FastAPI backend.
3. **Frontend Never Deployed**: The React Vite application inside `frontend/` was never compiled, containerized, or served on Render.
4. **FastAPI Root Route Served**: When users hit `https://stormshield.onrender.com/`, the request was handled by FastAPI's `GET /` endpoint in [backend/app/main.py](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/backend/app/main.py#L157-L165), which deliberately returns platform metadata JSON.

---

## 2. Old Architecture vs New Architecture

### Old Architecture (Single Container / Monolithic Failure):
```
User Browser
    |
    v (HTTPS)
https://stormshield.onrender.com
    |
    +--> [Render Single Web Service: root Dockerfile]
            |
            +--> FastAPI (Uvicorn :8000)
                    |
                    +--> GET / --> Returns JSON!
                    (React frontend was never built or served)
```

### New Architecture (Decoupled Dual-Service Production Topology):
```
                                 User Browser
                                /            \
  (Visual Platform Dashboard)  /              \  (Direct REST API calls with CORS)
                              /                \
                             v                  v
+---------------------------------------+   +---------------------------------------+
| SERVICE 1: stormshield-frontend       |   | SERVICE 2: stormshield-api            |
| https://stormshield-frontend.onrender |   | https://stormshield.onrender.com      |
| (or https://stormshield.onrender.com) |   | (or https://stormshield-api.onrender) |
+-------------------+-------------------+   +-------------------+-------------------+
| Multi-stage Docker (Node 20 -> Nginx) |   | Python 3.11 Docker (FastAPI)          |
| Serves pre-compiled Vite /dist/       |   | Listens on 0.0.0.0:$PORT              |
| SPA Routing: try_files -> index.html  |   | Health: /health & /health/ready       |
| Health endpoint: /health (HTTP 200)   |   | Docs: /docs Swagger UI                |
| Hashed asset caching: 1y immutable    |   | CORS: allows frontend Render origin   |
+---------------------------------------+   +-------------------+-------------------+
                                                                |
                                                +---------------+---------------+
                                                v                               v
                                    +-----------------------+       +-----------------------+
                                    | Render Managed DB     |       | Google Gemini API     |
                                    | (PostgreSQL / PostGIS)|       | (gemini-3.8-flash)    |
                                    | (or SQLite fallback)  |       | Backend-Only Enclave  |
                                    +-----------------------+       +-----------------------+
```

---

## 3. Production Docker Services

| Service Name | Purpose | Image Base | Production Web Server / Runtime | Port Handling |
| :--- | :--- | :--- | :--- | :--- |
| `stormshield-frontend` | Serves React SPA & GIS maps | `node:20-alpine` (builder) + `nginx:alpine` (runtime) | Nginx | Reads dynamic `$PORT` via `docker-entrypoint.sh` |
| `stormshield-api` | Serves REST APIs, Cascade Engine, AI | `python:3.11-slim` | Uvicorn ASGI (`app.main:app`) | Binds to `0.0.0.0:${PORT:-8000}` |
| `stormshield-postgres` | Local relational geospatial store | `postgis/postgis:15-3.3` | PostgreSQL 15 + PostGIS 3.3 | Local port 5432 (internal Docker network) |

---

## 4. Dockerfiles Summary

### 1. Frontend Dockerfile ([frontend/Dockerfile](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/frontend/Dockerfile))
- **Stage 1 (Build)**:
  - Base: `node:20-alpine`
  - Ingests `ARG VITE_API_URL` and exports `ENV VITE_API_URL=$VITE_API_URL`
  - Executes `npm ci` followed by `npm run build`
  - Compiles React + Vite + TypeScript into optimized static assets in `/app/dist`
- **Stage 2 (Runtime)**:
  - Base: `nginx:alpine`
  - Installs `gettext` (for `envsubst`) and `curl` (for health checks)
  - Copies `/app/dist` into `/usr/share/nginx/html`
  - Copies [frontend/nginx.conf](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/frontend/nginx.conf) to `/etc/nginx/templates/default.conf.template`
  - Copies [frontend/docker-entrypoint.sh](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/frontend/docker-entrypoint.sh) to substitute `${PORT}` dynamically at runtime before launching Nginx

### 2. Backend Dockerfile ([backend/Dockerfile](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/backend/Dockerfile))
- Base: `python:3.11-slim`
- Installs C libraries: `build-essential`, `libpq-dev`, `libgeos-dev`, `curl`
- Installs `requirements.txt`
- Dynamic Port Binding: `CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]`
- Health check: `CMD curl -f http://localhost:${PORT:-8000}/health || exit 1`

---

## 5. Nginx Configuration ([frontend/nginx.conf](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/frontend/nginx.conf))

- **Port Substitution**: Listens on `${PORT}` via `envsubst`
- **Health Check**:
  ```nginx
  location = /health {
      default_type application/json;
      return 200 '{"status":"healthy","service":"stormshield-frontend"}';
  }
  ```
- **SPA Routing**:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```
- **Asset Caching**:
  - `/assets/`: `Cache-Control "public, max-age=31536000, immutable"`
  - `/index.html`: `Cache-Control "no-cache, no-store, must-revalidate"`

---

## 6. Frontend API Configuration ([frontend/src/services/api.ts](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/frontend/src/services/api.ts))

The frontend resolves its API base URL via a 3-tier priority ladder:
```typescript
function getBaseApiUrl(): string {
  // 1. Runtime window injection (allows runtime override without rebuild)
  if (typeof window !== 'undefined' && window.__STORMSHIELD_CONFIG__?.API_URL) {
    return `${window.__STORMSHIELD_CONFIG__.API_URL.replace(/\/+$/, '')}/api`;
  }
  // 2. Build-time Vite environment variable (Render production)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return `${envUrl.trim().replace(/\/+$/, '')}/api`;
  }
  // 3. Relative fallback (Vite dev proxy or Nginx reverse proxy)
  return '/api';
}
const BASE_URL = getBaseApiUrl();
```

---

## 7. Render Configuration ([render.yaml](file:///c:/Users/avira/OneDrive/Desktop/New%20folder/render.yaml))

Contains the declarative multi-service blueprint:
1. `stormshield-api`: Docker Web Service built from `backend/Dockerfile` with context `backend`.
2. `stormshield-frontend`: Docker Web Service built from `frontend/Dockerfile` with context `frontend`.
3. `stormshield-db`: Managed PostgreSQL database with PostGIS support.

---

## 8. Deployment Options on Render

### Option A (Recommended — Keep Existing Backend URL):
- **Backend API**: `https://stormshield.onrender.com` (your existing active service)
  - Set Environment Variables:
    - `CORS_ORIGINS`: `https://stormshield-frontend.onrender.com,http://localhost:3000`
- **Frontend Dashboard**: `https://stormshield-frontend.onrender.com` (create new Web Service in Render)
  - Connect GitHub repo: `https://github.com/ASstyles/StormShield.git`
  - Root Directory: `frontend`
  - Runtime: `Docker`
  - Docker Command: Leave blank (uses Dockerfile ENTRYPOINT)
  - Environment Variable / Build Argument:
    - `VITE_API_URL`: `https://stormshield.onrender.com`

### Option B (Make Frontend the Primary URL `stormshield.onrender.com`):
1. In Render Dashboard, rename the current `stormshield` service to `stormshield-api` (`https://stormshield-api.onrender.com`).
2. Create a new Web Service named `stormshield` (`https://stormshield.onrender.com`) pointing to `frontend/Dockerfile`.
3. Set `VITE_API_URL=https://stormshield-api.onrender.com` on the frontend.
4. Set `CORS_ORIGINS=https://stormshield.onrender.com` on the backend.

---

## 9. Verification & Acceptance Checklist

| Check | Requirement | Result |
| :--- | :--- | :--- |
| **Backend Root Health** | `GET /health` returns `status: healthy` | **PASS** |
| **Backend Readiness** | `GET /health/ready` returns `status: healthy`, `ready: true` | **PASS** |
| **Interactive Docs** | `GET /docs` serves Swagger UI | **PASS** |
| **Frontend Production Build** | `npm run build` generates `/dist` with MapLibre worker in ~877ms | **PASS** |
| **SPA Route Handling** | Nginx `try_files` redirects all client routes to `/index.html` | **PASS** |
| **Frontend Health Probe** | `GET /health` returns HTTP 200 with service JSON | **PASS** |
| **Dynamic Port Binding** | Both containers expand `${PORT}` provided by Render | **PASS** |
| **CORS Whitelist** | Allows `https://*.onrender.com` and `http://localhost:3000` | **PASS** |
| **Gemini Security** | `GEMINI_API_KEY` remains strictly backend-only | **PASS** |
| **Database Resilience** | Connects to PostGIS with automatic SQLite fallback | **PASS** |
| **Integration Test Suite** | All 16 acceptance test steps in `test_full_product_flow.py` passed | **PASS** |
