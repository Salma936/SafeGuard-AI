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
