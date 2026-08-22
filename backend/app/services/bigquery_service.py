import time
from datetime import datetime
from typing import Dict, Any, List
from backend.app.config import settings

try:
    # pyrefly: ignore [missing-import]
    from google.cloud import bigquery
    BIGQUERY_AVAILABLE = True
except ImportError:
    BIGQUERY_AVAILABLE = False

class BigQueryService:
    def __init__(self):
        self.dataset_id = settings.BIGQUERY_DATASET
        self.bq_client = None
        self.local_event_log: List[Dict[str, Any]] = []

        if BIGQUERY_AVAILABLE and settings.GOOGLE_CLOUD_PROJECT and settings.GOOGLE_APPLICATION_CREDENTIALS:
            try:
                self.bq_client = bigquery.Client(project=settings.GOOGLE_CLOUD_PROJECT)
            except Exception as e:
                print(f"[BigQueryService] Warning: Could not initialize BigQuery client: {e}")

    def log_event(
        self,
        event_name: str,
        incident_id: str,
        threat_type: str = "Unknown",
        risk_level: str = "MEDIUM",
        confidence: int = 0,
        evidence_type: str = "text",
        analysis_duration_ms: int = 0,
        extra_data: Dict[str, Any] = None
    ):
        """
        Log analytics event asynchronously. Non-blocking & fail-safe.
        """
        event_row = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_name": event_name,
            "incident_id": incident_id,
            "threat_type": threat_type,
            "risk_level": risk_level,
            "confidence": confidence,
            "evidence_type": evidence_type,
            "analysis_duration_ms": analysis_duration_ms,
            "extra_data": extra_data or {}
        }

        # Store in local in-memory log for local analytics fallback
        self.local_event_log.append(event_row)

        # Stream to BigQuery if client is available
        if self.bq_client:
            try:
                table_id = f"{settings.GOOGLE_CLOUD_PROJECT}.{self.dataset_id}.events"
                errors = self.bq_client.insert_rows_json(table_id, [event_row])
                if errors:
                    print(f"[BigQueryService] Insert errors: {errors}")
            except Exception as err:
                print(f"[BigQueryService] Stream to BigQuery failed: {err}")

    def get_summary(self) -> Dict[str, Any]:
        """Return analytics summary for frontend/dashboard."""
        return {
            "total_events_logged": len(self.local_event_log),
            "recent_events": self.local_event_log[-20:]
        }

bigquery_service = BigQueryService()
