# ========================================================
# STORMSHIELD X — UNIFIED PRODUCTION DOCKERFILE
# Multi-stage build combining React Vite frontend + FastAPI backend
# Single container, single Render Web Service
# ========================================================

# --------------------------------------------------------
# Stage 1: Build React/Vite Frontend
# --------------------------------------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# Build static production bundle into dist/ (MapLibre worker chunk, CSS, HTML)
RUN npm run build

# --------------------------------------------------------
# Stage 2: Build FastAPI Backend & Package Unified Image
# --------------------------------------------------------
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for geospatial calculations and C libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgeos-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI backend source code
COPY backend/ .

# Copy compiled frontend dist into /app/static for FastAPI to serve
COPY --from=frontend-build /app/frontend/dist /app/static

# Dynamic PORT for Render (defaults to 8000 for local docker)
ENV PORT=8000
ENV STATIC_DIR=/app/static
EXPOSE 8000

# Health check verifies /health endpoint
HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Launch Uvicorn listening on 0.0.0.0:$PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
