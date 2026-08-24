"""
screenshot_router.py
---------------------
FastAPI route for the screenshot edited/morphed analyzer.

Mount this in your main FastAPI app, e.g.:

    from backend.app.routers.screenshot_router import router as screenshot_router
    app.include_router(screenshot_router, prefix="/api")

Then POST an image as multipart/form-data to /api/analyze-screenshot.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.app.services.image_forensics import analyze_image

router = APIRouter(tags=["screenshot-analysis"])

MAX_FILE_SIZE_MB = 15
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


class Finding(BaseModel):
    label: str
    detail: str
    severity: str


class AnalysisResponse(BaseModel):
    manipulation_score: int
    verdict: str
    findings: list[Finding]
    ela_heatmap_base64: Optional[str] = None
    noise_heatmap_base64: Optional[str] = None


@router.post("/analyze-screenshot", response_model=AnalysisResponse)
async def analyze_screenshot(file: UploadFile = File(...)):
    # Fallback to check content type; if browser or client doesn't send exact MIME type (e.g. application/octet-stream),
    # verify extension as well.
    is_valid_mime = file.content_type in ALLOWED_CONTENT_TYPES
    is_valid_ext = any((file.filename or "").lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"])

    if not is_valid_mime and not is_valid_ext:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Use JPEG, PNG, or WEBP.",
        )

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f}MB). Max is {MAX_FILE_SIZE_MB}MB.",
        )

    try:
        result = analyze_image(contents)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not analyze image: {e}")

    return AnalysisResponse(
        manipulation_score=result.manipulation_score,
        verdict=result.verdict,
        findings=[Finding(**f) for f in result.findings],
        ela_heatmap_base64=result.ela_heatmap_base64,
        noise_heatmap_base64=result.noise_heatmap_base64,
    )
