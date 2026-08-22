import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_check(): 
    """Verify system health check endpoint."""
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data.get("status") == "ok"
    assert "service" in data


def test_analyze_text_validation_error():
    """Verify input validation for text analysis."""
    response = client.post("/api/analyze/text", json={})

    assert response.status_code in (400, 422)


def test_analyze_url_validation_error():
    """Verify input validation for URL analysis."""
    response = client.post("/api/analyze/url", json={})

    assert response.status_code in (400, 422)


def test_incident_lifecycle():
    """
    Verify the complete incident lifecycle:
    creation -> listing -> retrieval -> timeline ->
    evidence -> update -> deletion.
    """

    # --------------------------------------------------
    # 1. Create incident
    # --------------------------------------------------

    create_payload = {
        "title": "Test Phishing Incident",
        "category": "Phishing",
        "summary": "Suspicious email claiming urgent password reset.",
        "risk_level": "HIGH",
        "threat_type": "Phishing",
    }

    response = client.post(
        "/api/incidents",
        json=create_payload,
    )

    assert response.status_code in (200, 201), response.text

    inc_data = response.json()

    assert "incident_id" in inc_data

    inc_id = inc_data["incident_id"]

    assert inc_id.startswith("inc-")
    assert inc_data["title"] == "Test Phishing Incident"

    if "timeline" in inc_data:
        assert isinstance(inc_data["timeline"], list)
        assert len(inc_data["timeline"]) > 0

    # --------------------------------------------------
    # 2. List incidents
    # --------------------------------------------------

    list_resp = client.get("/api/incidents")

    assert list_resp.status_code == 200, list_resp.text

    incidents_list = list_resp.json()

    assert isinstance(incidents_list, list)

    assert any(
        incident.get("incident_id") == inc_id
        for incident in incidents_list
    )

    # --------------------------------------------------
    # 3. Get single incident
    # --------------------------------------------------

    get_resp = client.get(
        f"/api/incidents/{inc_id}"
    )

    assert get_resp.status_code == 200, get_resp.text

    single_incident = get_resp.json()

    assert single_incident["incident_id"] == inc_id

    # --------------------------------------------------
    # 4. Get timeline
    # --------------------------------------------------

    timeline_resp = client.get(
        f"/api/incidents/{inc_id}/timeline"
    )

    assert timeline_resp.status_code == 200, timeline_resp.text

    timeline_data = timeline_resp.json()

    assert isinstance(timeline_data, list)

    # --------------------------------------------------
    # 5. Add evidence
    # --------------------------------------------------

    evidence_payload = {
        "type": "text",
        "title": "Suspicious Email Header",
        "content": "Received-SPF: fail (domain spoofed)",
    }

    evidence_resp = client.post(
        f"/api/incidents/{inc_id}/evidence",
        json=evidence_payload,
    )

    assert evidence_resp.status_code in (200, 201), evidence_resp.text

    evidence_data = evidence_resp.json()

    assert "evidence_id" in evidence_data

    evidence_id = evidence_data["evidence_id"]

    assert evidence_id.startswith("ev-")

    assert "sha256_hash" in evidence_data

    sha256_hash = evidence_data["sha256_hash"]

    assert isinstance(sha256_hash, str)
    assert len(sha256_hash) == 64

    # --------------------------------------------------
    # 6. Get evidence list
    # --------------------------------------------------

    evidence_list_resp = client.get(
        f"/api/incidents/{inc_id}/evidence"
    )

    assert evidence_list_resp.status_code == 200, evidence_list_resp.text

    evidence_list = evidence_list_resp.json()

    assert isinstance(evidence_list, list)

    assert any(
        evidence.get("evidence_id") == evidence_id
        for evidence in evidence_list
    )

    # --------------------------------------------------
    # 7. Update incident
    # --------------------------------------------------

    update_resp = client.put(
        f"/api/incidents/{inc_id}",
        json={"status": "RESOLVED"},
    )

    assert update_resp.status_code == 200, update_resp.text

    updated_incident = update_resp.json()

    assert updated_incident["status"] == "RESOLVED"

    # --------------------------------------------------
    # 8. Delete incident
    # --------------------------------------------------

    delete_resp = client.delete(
        f"/api/incidents/{inc_id}"
    )

    assert delete_resp.status_code in (200, 204), delete_resp.text

    # --------------------------------------------------
    # 9. Verify deletion
    # --------------------------------------------------

    deleted_resp = client.get(
        f"/api/incidents/{inc_id}"
    )

    assert deleted_resp.status_code in (404, 410)


def test_analytics_summary():
    """Verify analytics summary endpoint."""

    response = client.get(
        "/api/analytics/summary"
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert "total_incidents" in data
    assert isinstance(data["total_incidents"], int)

    assert "threats_by_type" in data