# =========================================================
# Stage 1: Build React Frontend
# =========================================================
FROM node:20-slim AS frontend-builder
WORKDIR /app

COPY package*.json tsconfig*.json vite.config.ts index.html ./
COPY src/ ./src/

RUN npm ci --include=dev || npm install --include=dev
RUN npm run build

# =========================================================
# Stage 2: Production Python Backend + Static Frontend
# =========================================================
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies & curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY backend/ /app/backend/

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/dist /app/dist

# Expose default Cloud Run container port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Start uvicorn server binding to dynamic $PORT
CMD uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1


