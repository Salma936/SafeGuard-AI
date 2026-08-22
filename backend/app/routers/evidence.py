import uuid
import base64
from datetime import datetime
from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from backend.app.schemas import EvidenceCreateRequest, EvidenceResponseSchema, InvestigationResultSchema
from backend.app.models import Incident, Evidence, AnalysisResult
from backend.app.services.db_service import get_db
from backend.app.services.storage_service import storage_service
from backend.app.services.ai_service import ai_service
from backend.app.services.bigquery_service import bigquery_service

router = APIRouter(prefix="/api/incidents/{incident_id}/evidence", tags=["Evidence Management"])

@router.post("", response_model=EvidenceResponseSchema)
async def add_evidence(
    incident_id: str,
    payload: Optional[EvidenceCreateRequest] = None,
    file: Optional[UploadFile] = File(None),
    type: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    POST /api/incidents/{incident_id}/evidence
    Add evidence (text, URL, screenshot, image, audio, document) to an incident.
    Calculates SHA-256 hash, stores in Cloud Storage or local disk, runs AI analysis, and saves to DB.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    ev_id = f"ev-{uuid.uuid4().hex[:8]}"
    ev_type = type or (payload.type if payload else "text")
    ev_title = title or (payload.title if payload else "Evidence Item")
    ev_content = content or (payload.content if payload else "")
    filename = None
    content_bytes = b""

    if file:
        filename = file.filename
        content_bytes = await file.read()
    elif payload and payload.file_b64:
        filename = payload.filename or f"evidence_{ev_id}"
        clean_b64 = payload.file_b64.split(",")[-1]
        content_bytes = base64.b64decode(clean_b64)
    else:
        filename = f"evidence_{ev_id}.txt"
        content_bytes = (ev_content or ev_title).encode("utf-8")

    # Store file & compute SHA-256 hash
    storage_meta = storage_service.store_evidence(
        incident_id=incident_id,
        evidence_id=ev_id,
        filename=filename,
        content_bytes=content_bytes
    )

    # Determine mime_type
    mime_type = None
    if file:
        mime_type = file.content_type
    else:
        if ev_type == "url":
            mime_type = "text/html"
        elif ev_type in ["image", "screenshot"]:
            mime_type = "image/png"
        elif ev_type == "audio":
            mime_type = "audio/mp3"
        elif ev_type == "video":
            mime_type = "video/mp4"
        elif ev_type == "email":
            mime_type = "message/rfc822"
        elif ev_type == "document":
            mime_type = "application/pdf"
        else:
            mime_type = "text/plain"

    ev_record = Evidence(
        id=ev_id,
        incident_id=incident_id,
        type=ev_type,
        evidence_type=ev_type,
        mime_type=mime_type,
        title=ev_title,
        filename=filename,
        content_location=storage_meta["content_location"],
        created_at=datetime.utcnow(),
        sha256_hash=storage_meta["sha256_hash"],
        analysis_status="COMPLETED"
    )
    db.add(ev_record)

    # Perform automated AI threat analysis on the ingested evidence
    analysis_result_schema = None
    try:
        if ev_type == "url":
            analysis_result_schema = ai_service.analyze_url(ev_content or filename, incident_id=incident_id)
        elif ev_type in ["image", "screenshot"]:
            analysis_result_schema = ai_service.analyze_image(content_bytes, incident_id=incident_id)
        elif ev_type == "audio":
            analysis_result_schema = ai_service.analyze_audio(content_bytes, incident_id=incident_id)
        else: # text, message, email, document
            text_to_analyze = ev_content or ev_title
            analysis_result_schema = ai_service.analyze_text(text_to_analyze, incident_id=incident_id)

        if analysis_result_schema:
            ar_model = AnalysisResult(
                id=f"ar-{uuid.uuid4().hex[:8]}",
                incident_id=incident_id,
                evidence_id=ev_id,
                risk_level=analysis_result_schema.risk_level,
                risk_score=analysis_result_schema.risk_score,
                confidence=analysis_result_schema.confidence,
                threat_type=analysis_result_schema.threat_type,
                summary=analysis_result_schema.summary,
                explanation=analysis_result_schema.explanation,
                explanation_simple=analysis_result_schema.explanation_simple,
                warning_signs=analysis_result_schema.warning_signs,
                indicators=analysis_result_schema.indicators,
                tactics_observed=analysis_result_schema.tactics_observed,
                recommended_actions=[a.dict() for a in analysis_result_schema.recommended_actions],
                affected_accounts=analysis_result_schema.affected_accounts,
                evidence_relationships=[r.dict() for r in analysis_result_schema.evidence_relationships],
                observed_evidence=analysis_result_schema.observed_evidence,
                ai_inference=analysis_result_schema.ai_inference,
                uncertainty=analysis_result_schema.uncertainty,
                potential_impact=analysis_result_schema.potential_impact,
                origin_assessment=analysis_result_schema.origin_assessment
            )
            db.add(ar_model)
            
            # Update incident overall risk
            inc.risk_level = analysis_result_schema.risk_level
            inc.threat_type = analysis_result_schema.threat_type
            inc.updated_at = datetime.utcnow()
    except Exception as err:
        print(f"[EvidenceRouter] Warning: AI analysis failed for evidence {ev_id}: {err}")
        ev_record.analysis_status = "FAILED"

    db.commit()
    db.refresh(ev_record)

    bigquery_service.log_event(
        event_name="evidence_uploaded",
        incident_id=incident_id,
        evidence_type=ev_type
    )

    return EvidenceResponseSchema(
        evidence_id=ev_record.id,
        incident_id=ev_record.incident_id,
        type=ev_record.type,
        filename=ev_record.filename,
        content_location=ev_record.content_location,
        created_at=ev_record.created_at.isoformat() + "Z",
        sha256_hash=ev_record.sha256_hash,
        analysis_status=ev_record.analysis_status,
        analysis_result=analysis_result_schema
    )

@router.get("", response_model=List[EvidenceResponseSchema])
def get_incident_evidence(incident_id: str, db: Session = Depends(get_db)):
    """
    GET /api/incidents/{incident_id}/evidence
    List all evidence preservation records for an incident.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    evidence_items = db.query(Evidence).filter(Evidence.incident_id == incident_id).order_by(Evidence.created_at.desc()).all()
    results = []
    for ev in evidence_items:
        ar = db.query(AnalysisResult).filter(AnalysisResult.evidence_id == ev.id).first()
        ar_schema = None
        if ar:
            ar_schema = InvestigationResultSchema(
                incident_id=ar.incident_id,
                risk_level=ar.risk_level,
                risk_score=ar.risk_score,
                confidence=ar.confidence,
                threat_type=ar.threat_type,
                summary=ar.summary or "",
                explanation=ar.explanation or "",
                explanation_simple=ar.explanation_simple,
                warning_signs=ar.warning_signs or [],
                indicators=ar.indicators or [],
                tactics_observed=ar.tactics_observed or [],
                recommended_actions=ar.recommended_actions or [],
                affected_accounts=ar.affected_accounts or [],
                potential_impact=ar.potential_impact or "",
                origin_assessment=ar.origin_assessment or ""
            )
        results.append(EvidenceResponseSchema(
            evidence_id=ev.id,
            incident_id=ev.incident_id,
            type=ev.type,
            filename=ev.filename,
            content_location=ev.content_location,
            created_at=ev.created_at.isoformat() + "Z",
            sha256_hash=ev.sha256_hash,
            analysis_status=ev.analysis_status,
            analysis_result=ar_schema
        ))
    return results
