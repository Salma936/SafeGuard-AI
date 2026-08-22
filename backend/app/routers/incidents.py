import uuid
from datetime import datetime
from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.app.schemas import (
    IncidentCreateRequest, IncidentUpdateRequest,
    IncidentResponseSchema, TimelineEventSchema, ActionItemSchema
)
from backend.app.models import Incident, Evidence, TimelineEvent, Recommendation
from backend.app.services.db_service import get_db
from backend.app.services.bigquery_service import bigquery_service

router = APIRouter(prefix="/api/incidents", tags=["Incident Management"])

@router.post("", response_model=IncidentResponseSchema)
def create_incident(payload: IncidentCreateRequest, db: Session = Depends(get_db)):
    """
    POST /api/incidents
    Create a new digital safety investigation incident.
    """
    inc_id = f"inc-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.utcnow().isoformat() + "Z"

    incident = Incident(
        id=inc_id,
        title=payload.title,
        category=payload.category,
        summary=payload.summary or "Digital safety investigation initiated.",
        status=payload.status,
        risk_level=payload.risk_level,
        threat_type=payload.threat_type,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(incident)
    
    # Default initial timeline event
    init_timeline = TimelineEvent(
        id=f"t-{uuid.uuid4().hex[:6]}",
        incident_id=inc_id,
        timestamp=datetime.utcnow().strftime("%H:%M"),
        phase="Inception",
        title="Incident Investigation Case Opened",
        description=payload.summary or "Case created in SafeGuard AI response system.",
        severity=payload.risk_level.lower()
    )
    db.add(init_timeline)
    db.commit()
    db.refresh(incident)

    bigquery_service.log_event(
        event_name="incident_created",
        incident_id=inc_id,
        threat_type=payload.threat_type,
        risk_level=payload.risk_level
    )

    return IncidentResponseSchema(
        incident_id=incident.id,
        title=incident.title,
        created_at=now_iso,
        updated_at=now_iso,
        status=incident.status,
        risk_level=incident.risk_level,
        threat_type=incident.threat_type,
        summary=incident.summary,
        evidence_ids=[],
        timeline=[
            TimelineEventSchema(
                id=init_timeline.id,
                timestamp=init_timeline.timestamp,
                phase=init_timeline.phase,
                title=init_timeline.title,
                description=init_timeline.description,
                severity=init_timeline.severity
            )
        ],
        recommendations=[]
    )

@router.get("", response_model=List[IncidentResponseSchema])
def list_incidents(db: Session = Depends(get_db)):
    """
    GET /api/incidents
    Retrieve list of all investigation incidents.
    """
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
    results = []
    for inc in incidents:
        ev_ids = [e.id for e in inc.evidence_items]
        timeline = [
            TimelineEventSchema(
                id=t.id,
                timestamp=t.timestamp,
                phase=t.phase,
                title=t.title,
                description=t.description,
                relatedEvidenceIds=t.related_evidence_ids or [],
                severity=t.severity
            )
            for t in inc.timeline_events
        ]
        recs = [
            ActionItemSchema(
                id=r.id,
                title=r.title,
                description=r.description,
                priority=r.priority,
                category=r.category,
                actionTarget=r.action_target
            )
            for r in inc.recommendations
        ]
        results.append(IncidentResponseSchema(
            incident_id=inc.id,
            title=inc.title,
            created_at=inc.created_at.isoformat() + "Z",
            updated_at=inc.updated_at.isoformat() + "Z",
            status=inc.status,
            risk_level=inc.risk_level,
            threat_type=inc.threat_type,
            summary=inc.summary or "",
            evidence_ids=ev_ids,
            timeline=timeline,
            recommendations=recs
        ))
    return results

@router.get("/{incident_id}", response_model=IncidentResponseSchema)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """
    GET /api/incidents/{incident_id}
    Retrieve details for a specific investigation incident.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    ev_ids = [e.id for e in inc.evidence_items]
    timeline = [
        TimelineEventSchema(
            id=t.id,
            timestamp=t.timestamp,
            phase=t.phase,
            title=t.title,
            description=t.description,
            relatedEvidenceIds=t.related_evidence_ids or [],
            severity=t.severity
        )
        for t in inc.timeline_events
    ]
    recs = [
        ActionItemSchema(
            id=r.id,
            title=r.title,
            description=r.description,
            priority=r.priority,
            category=r.category,
            actionTarget=r.action_target
        )
        for r in inc.recommendations
    ]
    return IncidentResponseSchema(
        incident_id=inc.id,
        title=inc.title,
        created_at=inc.created_at.isoformat() + "Z",
        updated_at=inc.updated_at.isoformat() + "Z",
        status=inc.status,
        risk_level=inc.risk_level,
        threat_type=inc.threat_type,
        summary=inc.summary or "",
        evidence_ids=ev_ids,
        timeline=timeline,
        recommendations=recs
    )

@router.put("/{incident_id}", response_model=IncidentResponseSchema)
def update_incident(incident_id: str, payload: IncidentUpdateRequest, db: Session = Depends(get_db)):
    """
    PUT /api/incidents/{incident_id}
    Update status, risk level, or threat details of an incident.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    if payload.title is not None:
        inc.title = payload.title
    if payload.status is not None:
        old_status = inc.status
        inc.status = payload.status
        if payload.status == "RESOLVED" and old_status != "RESOLVED":
            bigquery_service.log_event(
                event_name="incident_resolved",
                incident_id=inc.id,
                threat_type=inc.threat_type,
                risk_level=inc.risk_level
            )
    if payload.risk_level is not None:
        inc.risk_level = payload.risk_level
    if payload.threat_type is not None:
        inc.threat_type = payload.threat_type
    if payload.summary is not None:
        inc.summary = payload.summary

    inc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(inc)

    return get_incident(incident_id, db)

@router.delete("/{incident_id}")
def delete_incident(incident_id: str, db: Session = Depends(get_db)):
    """
    DELETE /api/incidents/{incident_id}
    Remove an incident case and associated evidence records.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    db.delete(inc)
    db.commit()
    return {"message": f"Incident '{incident_id}' deleted successfully."}



@router.post("/{incident_id}/analyze", response_model=IncidentResponseSchema)
def correlate_incident(incident_id: str, db: Session = Depends(get_db)):
    """
    POST /api/incidents/{incident_id}/analyze

    Cross-evidence correlation: retrieves all evidence for this incident,
    reconstructs the attack chain, identifies relationships, contradictions,
    and missing evidence, and persists the synthesis as an incident-level
    AnalysisResult (evidence_id is NULL to distinguish it from per-evidence
    analysis rows).
    """
    from backend.app.services.ai_service import ai_service
    from backend.app.services.bigquery_service import bigquery_service
    from backend.app.models import AnalysisResult, TimelineEvent
    import uuid as uuid_module
    import time as time_module

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    if not inc.evidence_items:
        raise HTTPException(
            status_code=400,
            detail="Cannot correlate an incident with no evidence. Add evidence first."
        )

    start_time = time_module.time()
    try:
        result = ai_service.synthesize_incident(
            incident_title=inc.title,
            evidence_items=inc.evidence_items,
            db_session=db
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Correlation analysis failed: {err}")

    duration_ms = int((time_module.time() - start_time) * 1000)

    # Remove any prior incident-level synthesis result (evidence_id IS NULL)
    # so re-running correlation doesn't accumulate stale rows.
    db.query(AnalysisResult).filter(
        AnalysisResult.incident_id == incident_id,
        AnalysisResult.evidence_id.is_(None)
    ).delete()

    synthesis_row = AnalysisResult(
        id=f"ar-{uuid_module.uuid4().hex[:8]}",
        incident_id=incident_id,
        evidence_id=None,
        risk_level=result.risk_level,
        risk_score=result.risk_score,
        confidence=result.confidence,
        threat_type=result.threat_type,
        summary=result.summary,
        explanation=result.explanation,
        explanation_simple=result.explanation_simple,
        warning_signs=result.warning_signs,
        indicators=result.indicators,
        tactics_observed=result.tactics_observed,
        recommended_actions=[a.model_dump() if hasattr(a, "model_dump") else a.dict() for a in result.recommended_actions],
        affected_accounts=result.affected_accounts,
        evidence_relationships=[r.model_dump() if hasattr(r, "model_dump") else r.dict() for r in result.evidence_relationships],
        timeline_events=[t.model_dump() if hasattr(t, "model_dump") else t.dict() for t in result.timeline_events],
        potential_impact=result.potential_impact,
        origin_assessment=result.origin_assessment,
        observed_evidence=result.observed_evidence,
        ai_inference=result.ai_inference,
        uncertainty=result.uncertainty,
        contradictions=result.contradictions,
        missing_evidence=result.missing_evidence,
    )
    db.add(synthesis_row)

    # Persist timeline events as real TimelineEvent rows tied to the incident,
    # so GET /api/incidents/{id}/timeline reflects the correlated view too.
    for t in result.timeline_events:
        db.add(TimelineEvent(
            id=f"t-{uuid_module.uuid4().hex[:6]}",
            incident_id=incident_id,
            timestamp=t.timestamp,
            phase=t.phase,
            title=t.title,
            description=t.description,
            related_evidence_ids=t.relatedEvidenceIds,
            severity=t.severity
        ))

    # Update the incident's own risk fields to reflect the correlated assessment
    inc.risk_level = result.risk_level
    inc.risk_score = result.risk_score
    inc.threat_type = result.threat_type

    db.commit()
    db.refresh(inc)

    bigquery_service.log_event(
        event_name="incident_correlated",
        incident_id=incident_id,
        threat_type=result.threat_type,
        risk_level=result.risk_level,
        confidence=result.confidence,
        evidence_type="incident_synthesis",
        analysis_duration_ms=duration_ms
    )

    ev_ids = [e.id for e in inc.evidence_items]
    timeline = [
        TimelineEventSchema(
            id=t.id,
            timestamp=t.timestamp,
            phase=t.phase,
            title=t.title,
            description=t.description,
            relatedEvidenceIds=t.related_evidence_ids or [],
            severity=t.severity
        )
        for t in inc.timeline_events
    ]

    return IncidentResponseSchema(
        incident_id=inc.id,
        title=inc.title,
        created_at=inc.created_at.isoformat() + "Z",
        updated_at=inc.updated_at.isoformat() + "Z",
        status=inc.status,
        risk_level=inc.risk_level,
        risk_score=result.risk_score,
        confidence=result.confidence,
        threat_type=inc.threat_type,
        summary=inc.summary or result.summary,
        evidence_ids=ev_ids,
        timeline=timeline,
        recommendations=[],
        observed_evidence=result.observed_evidence,
        ai_inference=result.ai_inference,
        uncertainty=result.uncertainty,
        evidence_relationships=result.evidence_relationships,
        explanation=result.explanation,
        explanation_simple=result.explanation_simple,
        contradictions=result.contradictions,
        missing_evidence=result.missing_evidence,
    )


@router.get("/{incident_id}/timeline", response_model=List[TimelineEventSchema])
def get_incident_timeline(incident_id: str, db: Session = Depends(get_db)):
    """
    GET /api/incidents/{incident_id}/timeline
    Automatically constructed timeline of events for an incident.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    events = db.query(TimelineEvent).filter(TimelineEvent.incident_id == incident_id).order_by(TimelineEvent.created_at.asc()).all()
    return [
        TimelineEventSchema(
            id=t.id,
            timestamp=t.timestamp,
            phase=t.phase,
            title=t.title,
            description=t.description,
            relatedEvidenceIds=t.related_evidence_ids or [],
            severity=t.severity
        )
        for t in events
    ]
