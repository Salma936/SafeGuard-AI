import asyncio
import time
import base64
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body, Depends, Request
from typing import Optional
from backend.app.schemas import (
    TextAnalysisRequest, UrlAnalysisRequest,
    ImageAnalysisRequest, AudioAnalysisRequest,
    EmailAnalysisRequest, VideoAnalysisRequest,
    DocumentAnalysisRequest, InvestigationResultSchema
)
from email import message_from_bytes
from email.policy import default as email_default_policy
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
        result = await asyncio.to_thread(ai_service.analyze_text, text_content)
        duration_ms = int((time.time() - start_time) * 1000)
        
        await asyncio.to_thread(
            bigquery_service.log_event,
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
        result = await asyncio.to_thread(ai_service.analyze_url, payload.url)
        duration_ms = int((time.time() - start_time) * 1000)

        await asyncio.to_thread(
            bigquery_service.log_event,
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

        result = await asyncio.to_thread(
            ai_service.analyze_image,
            image_bytes,
            mime_type=mime_type
        )

        duration_ms = int((time.time() - start_time) * 1000)

        await asyncio.to_thread(
            bigquery_service.log_event,
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
async def analyze_audio_upload_endpoint(
    file: UploadFile = File(...),
):
    """
    POST /api/analyze/audio
    Multimodal audio evidence transcription and coercion detection.
    Accepts multipart file upload only.
    """
    start_time = time.time()
    try:
        audio_bytes = await file.read()
        mime_type = file.content_type or "audio/mp3"

        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Must provide an audio file upload.")

        result = await asyncio.to_thread(ai_service.analyze_audio, audio_bytes, mime_type=mime_type)
        duration_ms = int((time.time() - start_time) * 1000)

        await asyncio.to_thread(
            bigquery_service.log_event,
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


@router.post("/audio/base64", response_model=InvestigationResultSchema)
async def analyze_audio_base64_endpoint(
    payload: AudioAnalysisRequest = Body(...),
):
    """
    POST /api/analyze/audio/base64
    Multimodal audio evidence transcription and coercion detection.
    Accepts JSON body with base64-encoded audio (audio_b64, mime_type).
    """
    start_time = time.time()
    try:
        if not payload.audio_b64:
            raise HTTPException(status_code=400, detail="Must provide an audio_b64 string.")

        clean_b64 = payload.audio_b64.split(",")[-1]
        audio_bytes = base64.b64decode(clean_b64)
        mime_type = payload.mime_type or "audio/mp3"

        result = await asyncio.to_thread(ai_service.analyze_audio, audio_bytes, mime_type=mime_type)
        duration_ms = int((time.time() - start_time) * 1000)

        await asyncio.to_thread(
            bigquery_service.log_event,
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


def _parse_eml_bytes(raw: bytes) -> dict:
    """Parse raw .eml bytes into the structured dict analyze_email expects."""
    msg = message_from_bytes(raw, policy=email_default_policy)

    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                body = part.get_content()
                break
        if not body:
            for part in msg.walk():
                if part.get_content_type() == "text/html":
                    body = part.get_content()
                    break
    else:
        body = msg.get_content()

    attachments = [
        part.get_filename()
        for part in msg.walk()
        if part.get_filename()
    ]

    return {
        "sender": msg.get("From", ""),
        "recipient": msg.get("To", ""),
        "subject": msg.get("Subject", ""),
        "timestamp": msg.get("Date", ""),
        "headers": {k: v for k, v in msg.items()},
        "body": body or "",
        "attachments": attachments,
        "urls": [],
    }


@router.post("/video", response_model=InvestigationResultSchema)
async def analyze_video_upload_endpoint(
    file: UploadFile = File(...),
):
    """
    POST /api/analyze/video
    Multimodal video evidence deepfake and manipulation detection.
    Accepts multipart file upload only.
    """
    start_time = time.time()
    try:
        video_bytes = await file.read()
        mime_type = file.content_type or "video/mp4"

        if not video_bytes:
            raise HTTPException(status_code=400, detail="Must provide a video file upload.")

        result = await asyncio.to_thread(ai_service.analyze_video, video_bytes, mime_type=mime_type)
        duration_ms = int((time.time() - start_time) * 1000)
        await asyncio.to_thread(
            bigquery_service.log_event,
            event_name="analysis_completed",
            incident_id=result.incident_id,
            threat_type=result.threat_type,
            risk_level=result.risk_level,
            confidence=result.confidence,
            evidence_type="video",
            analysis_duration_ms=duration_ms
        )
        return result
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.post("/video/base64", response_model=InvestigationResultSchema)
async def analyze_video_base64_endpoint(
    payload: VideoAnalysisRequest = Body(...),
):
    """
    POST /api/analyze/video/base64
    Multimodal video evidence deepfake and manipulation detection.
    Accepts JSON body with base64-encoded video (video_b64, mime_type).
    """
    start_time = time.time()
    try:
        if not payload.video_b64:
            raise HTTPException(status_code=400, detail="Must provide a video_b64 string.")

        clean_b64 = payload.video_b64.split(",")[-1]
        video_bytes = base64.b64decode(clean_b64)
        mime_type = payload.mime_type or "video/mp4"

        result = await asyncio.to_thread(ai_service.analyze_video, video_bytes, mime_type=mime_type)
        duration_ms = int((time.time() - start_time) * 1000)
        await asyncio.to_thread(
            bigquery_service.log_event,
            event_name="analysis_completed",
            incident_id=result.incident_id,
            threat_type=result.threat_type,
            risk_level=result.risk_level,
            confidence=result.confidence,
            evidence_type="video",
            analysis_duration_ms=duration_ms
        )
        return result
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.post("/email", response_model=InvestigationResultSchema)
async def analyze_email_endpoint(request: Request):
    """
    POST /api/analyze/email
    Email evidence analysis. Accepts either JSON structured email data
    or a raw .eml multipart file upload.
    """
    start_time = time.time()
    try:
        email_data = None
        content_type = request.headers.get("content-type", "").lower()

        if "application/json" in content_type:
            body = await request.json()
            if not body.get("body"):
                raise HTTPException(status_code=400, detail="Missing required 'body' field for email analysis.")
            email_data = body

        elif "multipart/form-data" in content_type:
            form = await request.form()
            uploaded_file = form.get("file")
            if uploaded_file is not None and hasattr(uploaded_file, "read"):
                raw = await uploaded_file.read()
                email_data = _parse_eml_bytes(raw)

        if not email_data:
            raise HTTPException(status_code=400, detail="Must provide an .eml file upload or structured email JSON payload.")

        result = await asyncio.to_thread(ai_service.analyze_email, email_data)
        duration_ms = int((time.time() - start_time) * 1000)
        await asyncio.to_thread(
            bigquery_service.log_event,
            event_name="analysis_completed",
            incident_id=result.incident_id,
            threat_type=result.threat_type,
            risk_level=result.risk_level,
            confidence=result.confidence,
            evidence_type="email",
            analysis_duration_ms=duration_ms
        )
        return result
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.post("/document", response_model=InvestigationResultSchema)
async def analyze_document_endpoint(request: Request):
    """
    POST /api/analyze/document
    Document evidence analysis (PDF, DOCX, TXT) via Gemini native multimodal understanding.
    Accepts either JSON with base64 document data or a multipart file upload.
    """
    start_time = time.time()
    try:
        doc_bytes = None
        mime_type = "application/pdf"

        content_type = request.headers.get("content-type", "").lower()

        if "application/json" in content_type:
            body = await request.json()
            doc_b64 = body.get("doc_b64")
            mime_type = body.get("mime_type") or "application/pdf"
            if doc_b64:
                clean_b64 = doc_b64.split(",", 1)[-1]
                try:
                    doc_bytes = base64.b64decode(clean_b64)
                except Exception:
                    raise HTTPException(status_code=400, detail="Invalid doc_b64 encoding.")

        elif "multipart/form-data" in content_type:
            form = await request.form()
            uploaded_file = form.get("file")
            if uploaded_file is not None and hasattr(uploaded_file, "read"):
                doc_bytes = await uploaded_file.read()
                mime_type = getattr(uploaded_file, "content_type", None) or "application/pdf"

        if not doc_bytes:
            raise HTTPException(status_code=400, detail="Must provide a document file upload or doc_b64 string.")

        result = await asyncio.to_thread(ai_service.analyze_document, doc_bytes, mime_type=mime_type)
        duration_ms = int((time.time() - start_time) * 1000)
        await asyncio.to_thread(
            bigquery_service.log_event,
            event_name="analysis_completed",
            incident_id=result.incident_id,
            threat_type=result.threat_type,
            risk_level=result.risk_level,
            confidence=result.confidence,
            evidence_type="document",
            analysis_duration_ms=duration_ms
        )
        return result
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))
