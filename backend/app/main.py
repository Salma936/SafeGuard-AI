from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.services.db_service import init_db
from backend.app.routers import (
    analyze,
    incidents,
    evidence,
    analytics,
)


# =========================================================
# LIFESPAN — runs AFTER uvicorn binds to the port
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle handler.

    init_db() is intentionally placed here instead of at module level.
    Cloud Run requires the container to bind to PORT within a few seconds
    of startup.  Running init_db() at import time blocked uvicorn from
    binding in time, causing the revision health-check to fail.
    """
    print("[SafeGuard] Starting up — initialising database …")
    try:
        init_db()
        print("[SafeGuard] Database ready.")
    except Exception as exc:
        # Log but do not crash — the app can still serve requests
        # that don't need the DB, and /health will still respond.
        print(f"[SafeGuard] WARNING: init_db() failed: {exc}")
    yield
    # Shutdown logic (if any) goes here
    print("[SafeGuard] Shutting down.")





# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    lifespan=lifespan,
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "SafeGuard AI Backend Engine for digital abuse "
        "detection, evidence preservation, incident management, "
        "risk assessment, and recovery."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# =========================================================
# CORS
# =========================================================

# Development-friendly configuration.
# Restrict this to your actual frontend URL before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# =========================================================
# GLOBAL ERROR HANDLER
# =========================================================

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    print(
        f"[SafeGuard API Error] "
        f"Path={request.url.path} "
        f"Error={exc}"
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": (
                "An internal server error occurred "
                "while processing your request."
            )
        },
    )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model": settings.GEMINI_MODEL,
        "database": "configured",
        "cloud_storage": (
            settings.GOOGLE_CLOUD_STORAGE_BUCKET
        ),
    }


# =========================================================
# ROUTERS
# =========================================================

app.include_router(analyze.router)
app.include_router(incidents.router)
app.include_router(evidence.router)
app.include_router(analytics.router)


# =========================================================
# STATIC FRONTEND SERVING (Production)
# =========================================================

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

if os.path.exists("dist"):
    if os.path.exists("dist/assets"):
        app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Serve exact file if exists, otherwise fallback to SPA index.html
        file_path = os.path.join("dist", full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse("dist/index.html")


# =========================================================
# LOCAL DEVELOPMENT
# =========================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )