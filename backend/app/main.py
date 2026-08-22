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
# DATABASE INITIALIZATION
# =========================================================

init_db()


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
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