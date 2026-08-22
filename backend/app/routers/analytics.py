# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.schemas import AnalyticsSummarySchema
from backend.app.models import Incident, Evidence
from backend.app.services.db_service import get_db
from backend.app.services.bigquery_service import bigquery_service

router = APIRouter(prefix="/api/analytics", tags=["BigQuery Analytics"])

@router.get("/summary", response_model=AnalyticsSummarySchema)
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    GET /api/analytics/summary
    Retrieve aggregated analytics overview for digital safety investigations.
    """
    total_incidents = db.query(Incident).count()
    high_risk = db.query(Incident).filter(Incident.risk_level == "HIGH").count()
    critical_risk = db.query(Incident).filter(Incident.risk_level == "CRITICAL").count()
    evidence_count = db.query(Evidence).count()

    threat_counts = {}
    threat_rows = db.query(Incident.threat_type, func.count(Incident.id)).group_by(Incident.threat_type).all()
    for threat, count in threat_rows:
        threat_counts[threat or "Other"] = count

    bq_summary = bigquery_service.get_summary()

    return AnalyticsSummarySchema(
        total_incidents=total_incidents,
        high_risk_incidents=high_risk,
        critical_risk_incidents=critical_risk,
        threats_by_type=threat_counts,
        evidence_processed=evidence_count,
        total_analytics_events=bq_summary["total_events_logged"]
    )
