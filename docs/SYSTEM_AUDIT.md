# StormShield X — Complete System Audit

**Audit Date:** September 2026  
**Auditor:** StormShield X Lead Senior Full-Stack, GIS & Reliability Engineering Team  
**Scope:** Full-stack repository audit, Dockerization, runtime stability, and geospatial visualization verification  

---

## 1. Executive Summary

StormShield X is an advanced multi-hazard cyclone impact, infrastructure cascade analysis, and emergency decision-support platform designed for coastal regions (demonstrated along the coastal belt of Kakinada, Andhra Pradesh, India).

The platform transforms meteorological parameters (sustained wind velocity, central barometric pressure, localized precipitation, and hydrodynamic storm surge) into deterministic infrastructure exposure, prioritized evacuation routes, infrastructure dependency cascades, and AI-assisted operational action plans.

This audit establishes the baseline architectural state, diagnoses root causes for all previously observed failures (including the blank screen and empty map issues), details the Docker multi-container environment, and establishes the 100-pass quality assurance matrix.

---

## 2. Detected Technologies & Service Topology

| Tier | Technologies | Role / Responsibilities |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript 6, Vite 8, Tailwind CSS v4 | Interactive emergency dashboard, Time Machine slider, What-If simulator, cascade graph, routing view, multimodal analysis, and AI commander modals |
| **Mapping Engine** | MapLibre GL JS v6.11.2, WebGL2, GeoJSON | Hardware-accelerated geospatial canvas rendering Kakinada shoreline, bathymetric inundation polygons, cyclone track, and infrastructure pins |
| **Backend API** | FastAPI 0.110, Python 3.11/3.14, Uvicorn | RESTful API, Dijkstra/A* routing engine, multi-hazard risk attribution matrix, and cascade graph calculation |
| **Database** | PostgreSQL 15 + PostGIS 3.3 (or SQLite fallback) | Spatial database storing monitored infrastructure, multi-hazard polygons, cyclone tracks, and historical baseline datasets |
| **AI Subsystem** | Google GenAI SDK (`google-genai`), `gemini-3.8-flash` | Grounded natural language operational synthesis, image triage, and deterministic domain-expert offline fallback |
| **Orchestration** | Docker, Docker Compose (v3.8) | Multi-container microservices with isolated internal network, healthchecks, and volume persistence |

---

## 3. Dependency & Version Audit

### Frontend (`frontend/package.json`)
- `react`: `^19.2.8`
- `react-dom`: `^19.2.8`
- `maplibre-gl`: `^6.11.2`
- `lucide-react`: `^1.48.0`
- `recharts`: `^3.10.1`
- `tailwindcss`: `^4.3.3`
- `vite`: `^8.3.0`
- `oxlint`: `^1.81.0`
- `typescript`: `~6.0.2`

### Backend (`backend/requirements.txt`)
- `fastapi`: `>=0.110.0`
- `uvicorn`: `>=0.28.0`
- `pydantic`: `>=2.6.0`
- `pydantic-settings`: `>=2.2.0`
- `sqlalchemy`: `>=2.0.0`
- `psycopg2-binary`: `>=2.9.9`
- `psycopg[binary]`: `>=3.1.0`
- `shapely`: `>=2.0.0`
- `networkx`: `>=3.2.0`
- `numpy`: `>=1.26.0`
- `httpx`: `>=0.27.0`
- `google-genai`: `>=2.0.0`

---

## 4. Environment Variables Audit

All environment configurations are documented in `.env.example` and validated via Pydantic in `app/config.py`:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `POSTGRES_DB` | string | `stormshield` | PostgreSQL database name |
| `POSTGRES_USER` | string | `stormshield` | PostgreSQL user role |
| `POSTGRES_PASSWORD` | string | *(secure string)* | Password for PostgreSQL authentication |
| `POSTGRES_HOST` | string | `postgres` | Database container hostname |
| `POSTGRES_PORT` | int | `5432` | Internal database port |
| `DATABASE_URL` | string | `postgresql://...` | Connection URI; auto-falls back to SQLite outside Docker |
| `GEMINI_API_KEY` | string | `""` | Google AI Studio key; activates live `gemini-3.8-flash` |
| `GEMINI_MODEL` | string | `gemini-3.8-flash` | CURRENT stable Gemini model name |
| `GEMINI_TEMPERATURE`| float | `0.2` | Low temperature for deterministic factual extraction |
| `CORS_ORIGINS` | string/list | `localhost:3000,...` | Allowed CORS origins for frontend-backend communication |
| `MAX_IMAGE_SIZE_MB` | int | `10` | Maximum upload size for multimodal satellite analysis |

---

## 5. Root Causes Found & Repaired

### Issue A: MapLibre Empty Black Canvas
- **Root Cause:** MapLibre v6 moved to decoupled ESM web workers. Without `setWorkerUrl(workerUrl)` and `?worker&url`, the worker failed to resolve, halting vector tile decoding. Concurrently, external vector style requests hung on remote fonts and sprites.
- **Fix:** Switched to Carto Dark raster tiles (zero external font/sprite dependencies), configured `setWorkerUrl(workerUrl)`, assigned `map.current` synchronously, and added an automatic offline tactical grid fallback.

### Issue B: Blank Screen / React Boot Failure
- **Root Cause:** In `MapLibreMap.tsx`, calling a top-level capability check `useState(() => checkWebGL2())` during React Fast Refresh threw `ReferenceError: Cannot access 'checkWebGL2' before initialization`. Without an Error Boundary, this unmounted the entire application. Concurrently, Vite's `optimizeDeps` attempted to pre-bundle `maplibre-gl-worker.mjs` into `.vite/deps/`.
- **Fix:** Added `optimizeDeps: { exclude: ['maplibre-gl'] }` to `vite.config.ts`, extracted `TIME_STEPS` into `constants/timeSteps.ts`, isolated `<MapLibreMap>` inside a new `<MapErrorBoundary>`, and performed WebGL2 capability detection safely inside `useEffect`.

### Issue C: Cross-Panel Data Contradictions
- **Root Cause:** Risk indicators in `CycloneSidebar` had hardcoded constants (88.5, 91.0, 82.0, 85.0), while `ZoneDetailPanel` and `TimeMachine` dynamically updated.
- **Fix:** Bound `CycloneSidebar` multi-hazard indices to the active scenario zone (`selectedZone || riskZones[0]`), synchronized `handleScrubTimeStep` in `App.tsx`, and injected the active database cyclone into `/api/ai/analyze-zone`.

---

## 6. Testing & Quality Strategy

The system is validated through a 100-pass testing protocol covering:
1. Containerization & multi-service startup (Docker Compose).
2. Clean static compilation & bundle sizes (`npm run build`).
3. Database connectivity, PostGIS extension initialization, and seed verification.
4. Geospatial data formatting (strict `[lng, lat]` coordinates).
5. A* graph evacuation route optimization avoiding overtopped roads.
6. Cascade dependency blast radius modeling.
7. Gemini `gemini-3.8-flash` queries with graceful offline fallback.
8. Zero console errors and zero runtime exceptions.
