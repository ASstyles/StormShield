# StormShield X — Docker Deployment & Operations Guide

**System:** StormShield X Production Architecture  
**Compose Version:** 3.8  
**Container Engine:** Docker Engine / Docker Desktop (Linux Containers)  
**Security Status:** Hardened (Non-root users, internal DB network, zero exposed secrets)  

---

## 1. Architectural Topology

StormShield X runs as an orchestrated multi-tier microservices environment managed via `docker-compose.yml`:

```
                    Internet / User Browser
                              │
                    ┌─────────▼─────────┐
                    │  Port 3000 (HTTP) │
                    └─────────┬─────────┘
                              │
            ┌─────────────────▼─────────────────┐
            │       stormshield-frontend        │
            │   (Nginx Alpine + Built React)    │
            │                                   │
            │  • Serves SPA static assets       │
            │  • Reverse proxies /api/ -> :8000 │
            │  • Proxies /docs & /openapi.json  │
            │  • Gzip compression enabled       │
            └─────────────────┬─────────────────┘
                              │ Internal Docker Network: stormshield-network
            ┌─────────────────▼─────────────────┐
            │        stormshield-backend        │
            │      (FastAPI + Python 3.11)      │
            │                                   │
            │  • Multi-hazard risk engine       │
            │  • Dijkstra A* evacuation routing │
            │  • Infrastructure cascade graph   │
            │  • Gemini gemini-3.8-flash engine │
            └─────────────────┬─────────────────┘
                              │ Internal Docker Network: stormshield-network
            ┌─────────────────▼─────────────────┐
            │        stormshield-postgres       │
            │       (PostGIS 15-3.3 Alpine)     │
            │                                   │
            │  • PostGIS spatial extensions     │
            │  • Persistent volume mount        │
            │  • Auto-initializes schema.sql    │
            │  • NO public port exposure        │
            └───────────────────────────────────┘
```

---

## 2. Docker Service Specifications

### 1. `stormshield-frontend`
- **Base Image:** Stage 1: `node:20-alpine` (builder); Stage 2: `nginx:alpine` (runtime).
- **Exposed Port:** `3000:80` (mapped to host port 3000).
- **Healthcheck:** `wget -q --spider http://localhost:80/` (interval: 10s, timeout: 5s, retries: 3).
- **Reverse Proxy:** Routes `/api/` to `http://backend:8000/api/` seamlessly, eliminating browser CORS issues in production.

### 2. `stormshield-backend`
- **Base Image:** `python:3.11-slim` with system geospatial libraries (`libgeos-dev`, `libpq-dev`, `build-essential`).
- **Exposed Port:** `8000:8000` (mapped to host port 8000 for direct API and Swagger inspection).
- **Healthcheck:** `curl -f http://localhost:8000/api/health` (interval: 10s, timeout: 5s, retries: 5).
- **Dependency:** Waits for `postgres` container to report `service_healthy` before booting.

### 3. `stormshield-postgres`
- **Base Image:** `postgis/postgis:15-3.3`.
- **Security:** Bound strictly to the private `stormshield-network` bridge. No host port is exposed, preventing unauthorized external access.
- **Persistence:** Volume `postgres-data` mounted at `/var/lib/postgresql/data`.
- **Initialization:** Automatically mounts `backend/app/database/schema.sql` into `/docker-entrypoint-initdb.d/init.sql`.
- **Healthcheck:** `pg_isready -U stormshield -d stormshield` (interval: 5s, timeout: 5s, retries: 5).

---

## 3. Essential Operational Commands

### Initial Build & Launch
To build all images without cache and launch the full platform:
```bash
docker compose up --build
```

### Launch in Background (Daemon Mode)
```bash
docker compose up -d
```

### Verify Service Health & Running Containers
```bash
docker compose ps
```
Expected output:
```
NAME                   IMAGE                    COMMAND                  SERVICE    STATUS
stormshield-backend    stormshield-x-backend    "uvicorn app.main:ap…"   backend    running (healthy)
stormshield-frontend   stormshield-x-frontend   "/docker-entrypoint.…"   frontend   running (healthy)
stormshield-postgres   postgis/postgis:15-3.3   "docker-entrypoint.s…"   postgres   running (healthy)
```

### View Live Aggregated Logs
```bash
docker compose logs -f
```
Or for an individual service:
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Clean Teardown (Preserving Database Volume)
```bash
docker compose down
```

### Complete Reset (Wiping Database Volume for Clean Test)
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## 4. Local Development Without Docker

If running on a machine without Docker installed, the application runs via Python virtual environment and Vite dev server:

### Terminal 1: Backend
```powershell
$env:DATABASE_URL="sqlite:///./stormshield.db"
.\backend\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend --reload
```

### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```

Access the application at `http://localhost:3000`.
