import time
import base64
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Request
from typing import Optional
from backend.app.schemas import (
    TextAnalysisRequest, UrlAnalysisRequest,
    ImageAnalysisRequest, AudioAnalysisRequest,
    InvestigationResultSchema
)
from backend.app.services.ai_service import ai_service
from backend.app.services.bigquery_service import bigquery_service

router = APIRouter(prefix="/api/analyze", tags=["AI Analysis Engine"])

@router.post("/text", response_model=InvestigationResultSchema)
@router.post("", response_model=InvestigationResultSchema)
async def analyze_text_endpoint(payload: TextAnalysisRequest):
    """
    POST /api/analyze/text
    Analyze suspicious text message or message content for digital threats.
    """
    text_content = payload.text or payload.message
    if not text_content or not text_content.strip():
        raise HTTPException(status_code=400, detail="Missing 'text' or 'message' field in request body.")

    start_time = time.time()
    try:
        result = ai_service.analyze_text(text_content)
        duration_ms = int((time.time() - start_time) * 1000)
        
        bigquery_service.log_event(
            event_name="analysis_completed",
            incident_id=result.incident_id,
            threat_type=result.threat_type,
            risk_level=result.risk_level,
            confidence=result.confidence,
            evidence_type="text",
            analysis_duration_ms=duration_ms
        )
        return result
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/url", response_model=InvestigationResultSchema)
async def analyze_url_endpoint(payload: UrlAnalysisRequest):
    """
    POST /api/analyze/url
    Analyze suspicious URL for domain spoofing, typosquatting, credential harvesting, and deceptive structures.
    """
    if not payload.url or not payload.url.strip():
        raise HTTPException(status_code=400, detail="Missing 'url' field in request body.")

    start_time = time.time()
    try:
        result = ai_service.analyze_url(payload.url)
        duration_ms = int((time.time() - start_time) * 1000)

        bigquery_service.log_event(
            event_name="analysis_completed",
            incident_id=result.incident_id,
            threat_type=result.threat_type,
            risk_level=result.risk_level,
            confidence=result.confidence,
            evidence_type="url",
            analysis_duration_ms=duration_ms
        )
        return result
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/image", response_model=InvestigationResultSchema)
async def analyze_image_endpoint(request: Request):
    """
    POST /api/analyze/image

    Accepts either JSON with Base64 image data
    or a multipart file upload.
    """
    start_time = time.time()

    try:
        image_bytes = None
        mime_type = "image/png"

        content_type = request.headers.get("content-type", "").lower()

        if "application/json" in content_type:
            body = await request.json()

            image_b64 = body.get("image_b64")
            mime_type = body.get("mime_type") or "image/png"

            if image_b64:
                clean_b64 = image_b64.split(",", 1)[-1]

                try:
                    image_bytes = base64.b64decode(clean_b64)
                except Exception:
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid image_b64 encoding."
                    )

        elif "multipart/form-data" in content_type:
            form = await request.form()
            uploaded_file = form.get("file")

            if uploaded_file is not None and hasattr(uploaded_file, "read"):
                image_bytes = await uploaded_file.read()
                mime_type = getattr(
                    uploaded_file,
                    "content_type",
                    None
                ) or "image/png"

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Must provide an image file upload or image_b64 string."
            )

        result = ai_service.analyze_image(
            image_bytes,
            mime_type=mime_type
        )

        duration_ms = int((time.time() - start_time) * 1000)

        bigquery_service.log_event(
            event_name="analysis_completed",
            incident_id=result.incident_id,
            threat_type=result.threat_type,
            risk_level=result.risk_level,
            confidence=result.confidence,
            evidence_type="image",
            analysis_duration_ms=duration_ms
        )

        return result

    except HTTPException:
        raise

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=str(err)
        )


@router.post("/audio", response_model=InvestigationResultSchema)
async def analyze_audio_endpoint(
    file: Optional[UploadFile] = File(None),
    payload: Optional[AudioAnalysisRequest] = None
):
    """
    POST /api/analyze/audio
    Multimodal audio evidence transcription and coercion detection.
    Accepts multipart file upload or JSON payload with base64 audio.
    """
    start_time = time.time()
    try:
        audio_bytes = None
        mime_type = "audio/mp3"

        if file:
            audio_bytes = await file.read()
            mime_type = file.content_type or "audio/mp3"
        elif payload and payload.audio_b64:
            clean_b64 = payload.audio_b64.split(",")[-1]
            audio_bytes = base64.b64decode(clean_b64)
            mime_type = payload.mime_type or "audio/mp3"

        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Must provide an audio file upload or audio_b64 string.")

        result = ai_service.analyze_audio(audio_bytes, mime_type=mime_type)
        duration_ms = int((time.time() - start_time) * 1000)

        bigquery_service.log_event(
            event_name="analysis_completed",
            incident_id=result.incident_id,
            threat_type=result.threat_type,
            risk_level=result.risk_level,
            confidence=result.confidence,
            evidence_type="audio",
            analysis_duration_ms=duration_ms
        )
        return result
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))
