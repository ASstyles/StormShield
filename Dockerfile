# StormShield X — Backend Service Entrypoint
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for geospatial and C libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgeos-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Render dynamically injects $PORT (defaults to 8000 for local docker)
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start Uvicorn listening on 0.0.0.0:$PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
