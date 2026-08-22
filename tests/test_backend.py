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

import json
from backend.app.services.ai_service import ai_service


def test_evidence_relationships_survive_analysis(monkeypatch):
    """
    Regression test: evidence_relationships, observed_evidence, ai_inference,
    and uncertainty returned by Gemini must survive unchanged through
    parsing and into the API response. Previously, evidence_relationships
    was hardcoded to [] and silently dropped.
    """

    fake_gemini_response = {
        "incident_id": "inc-test-001",
        "risk_level": "HIGH",
        "risk_score": 85,
        "confidence": 80,
        "threat_type": "Phishing",
        "summary": "Test phishing summary.",
        "explanation": "Test explanation.",
        "explanation_simple": "Test simple explanation.",
        "warning_signs": ["Urgency tactics"],
        "indicators": ["Suspicious domain"],
        "tactics_observed": ["Social Engineering Lure"],
        "recommended_actions": [],
        "affected_accounts": [],
        "timeline_events": [],
        "potential_impact": "Test impact.",
        "origin_assessment": "Test origin.",
        "observed_evidence": ["Message references bank name X"],
        "ai_inference": ["Likely impersonation attempt based on urgency and link"],
        "uncertainty": ["Sender identity cannot be verified from text alone"],
        "evidence_relationships": [
            {
                "source_id": "ev-0001",
                "target_id": "ev-0002",
                "relationship_type": "leads_to",
                "description": "SMS links to the malicious URL."
            }
        ],
    }

    def fake_call_gemini(self, contents):
        return json.dumps(fake_gemini_response)

    monkeypatch.setattr(
        "backend.app.services.ai_service.AIService._call_gemini",
        fake_call_gemini,
    )

    response = client.post(
        "/api/analyze/text",
        json={"text": "Your bank account requires urgent verification: http://fake-bank.example/verify"},
    )

    assert response.status_code == 200, response.text
    data = response.json()

    assert "evidence_relationships" in data
    assert len(data["evidence_relationships"]) == 1
    rel = data["evidence_relationships"][0]
    assert rel["source_id"] == "ev-0001"
    assert rel["target_id"] == "ev-0002"
    assert rel["relationship_type"] == "leads_to"

    assert data["observed_evidence"] == ["Message references bank name X"]
    assert data["ai_inference"] == [
        "Likely impersonation attempt based on urgency and link"
    ]
    assert data["uncertainty"] == [
        "Sender identity cannot be verified from text alone"
    ]


def _fake_investigation_json(threat_type="Scam", risk_level="HIGH"):
    return {
        "incident_id": "inc-test-002",
        "risk_level": risk_level,
        "risk_score": 80,
        "confidence": 75,
        "threat_type": threat_type,
        "summary": "Test summary.",
        "explanation": "Test explanation.",
        "explanation_simple": "Test simple explanation.",
        "warning_signs": ["Test warning"],
        "indicators": ["Test indicator"],
        "tactics_observed": ["Test tactic"],
        "recommended_actions": [],
        "affected_accounts": [],
        "timeline_events": [],
        "evidence_relationships": [],
        "potential_impact": "Test impact.",
        "origin_assessment": "Test origin.",
        "observed_evidence": ["Test observed fact"],
        "ai_inference": ["Test inference"],
        "uncertainty": ["Test uncertainty"],
    }


def test_analyze_video_success(monkeypatch):
    """Video analysis endpoint returns a full InvestigationResultSchema when Gemini succeeds."""

    def fake_call_gemini(self, contents):
        return json.dumps(_fake_investigation_json(threat_type="Scam"))

    monkeypatch.setattr(
        "backend.app.services.ai_service.AIService._call_gemini",
        fake_call_gemini,
    )

    # Also bypass the real Files API path entirely by monkeypatching analyze_video
    # at the service level, since _call_gemini alone isn't reachable without a
    # real Gemini client configured for the Files API upload/poll logic.
    def fake_analyze_video(self, video_bytes, mime_type="video/mp4", incident_id=None):
        from backend.app.schemas import InvestigationResultSchema
        data = _fake_investigation_json(threat_type="Scam")
        data["incident_id"] = incident_id or "inc-test-002"
        return InvestigationResultSchema(**data)

    monkeypatch.setattr(
        "backend.app.services.ai_service.AIService.analyze_video",
        fake_analyze_video,
    )

    response = client.post(
        "/api/analyze/video",
        files={"file": ("test.mp4", b"fake-video-bytes", "video/mp4")},
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["threat_type"] == "Scam"
    assert data["observed_evidence"] == ["Test observed fact"]


def test_analyze_video_missing_file():
    """Video endpoint returns 400 when neither file nor video_b64 is provided."""
    response = client.post("/api/analyze/video", json={})
    assert response.status_code in (400, 422)


def test_analyze_email_structured_payload(monkeypatch):
    """Email analysis works with a structured JSON payload."""

    def fake_analyze_email(self, email_data, incident_id=None):
        from backend.app.schemas import InvestigationResultSchema
        assert email_data["sender"] == "attacker@fake-bank.example"
        data = _fake_investigation_json(threat_type="Phishing")
        return InvestigationResultSchema(**data)

    monkeypatch.setattr(
        "backend.app.services.ai_service.AIService.analyze_email",
        fake_analyze_email,
    )

    response = client.post(
        "/api/analyze/email",
        json={
            "sender": "attacker@fake-bank.example",
            "recipient": "victim@example.com",
            "subject": "Urgent: Verify your account",
            "body": "Click here to verify your account immediately.",
        },
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["threat_type"] == "Phishing"


def test_analyze_email_eml_upload(monkeypatch):
    """Email analysis works with a raw .eml file upload and parses sender/subject/body."""

    captured = {}

    def fake_analyze_email(self, email_data, incident_id=None):
        from backend.app.schemas import InvestigationResultSchema
        captured["email_data"] = email_data
        data = _fake_investigation_json(threat_type="Phishing")
        return InvestigationResultSchema(**data)

    monkeypatch.setattr(
        "backend.app.services.ai_service.AIService.analyze_email",
        fake_analyze_email,
    )

    raw_eml = (
        b"From: attacker@fake-bank.example\r\n"
        b"To: victim@example.com\r\n"
        b"Subject: Urgent: Verify your account\r\n"
        b"Date: Mon, 1 Jan 2026 00:00:00 +0000\r\n"
        b"Content-Type: text/plain\r\n"
        b"\r\n"
        b"Click here to verify your account immediately.\r\n"
    )

    response = client.post(
        "/api/analyze/email",
        files={"file": ("test.eml", raw_eml, "message/rfc822")},
    )

    assert response.status_code == 200, response.text
    assert captured["email_data"]["sender"] == "attacker@fake-bank.example"
    assert "Verify your account" in captured["email_data"]["subject"]


def test_analyze_email_missing_input():
    """Email endpoint returns an error when neither file nor payload is provided."""
    response = client.post("/api/analyze/email")
    assert response.status_code in (400, 422)


def test_analyze_document_success(monkeypatch):
    """Document analysis endpoint returns a full InvestigationResultSchema for a PDF upload."""

    def fake_analyze_document(self, doc_bytes, mime_type="application/pdf", incident_id=None):
        from backend.app.schemas import InvestigationResultSchema
        assert mime_type == "application/pdf"
        data = _fake_investigation_json(threat_type="Financial Fraud")
        return InvestigationResultSchema(**data)

    monkeypatch.setattr(
        "backend.app.services.ai_service.AIService.analyze_document",
        fake_analyze_document,
    )

    response = client.post(
        "/api/analyze/document",
        files={"file": ("invoice.pdf", b"%PDF-1.4 fake pdf bytes", "application/pdf")},
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["threat_type"] == "Financial Fraud"


def test_analyze_document_missing_file():
    """Document endpoint returns 400 when neither file nor doc_b64 is provided."""
    response = client.post("/api/analyze/document", json={})
    assert response.status_code in (400, 422)


def test_analyze_video_gemini_failure_returns_error(monkeypatch):
    """If video analysis raises (e.g. Gemini Files API failure), endpoint returns 500, not a fabricated success."""

    def fake_analyze_video_failure(self, video_bytes, mime_type="video/mp4", incident_id=None):
        raise ValueError("Video processing on Gemini Files API failed.")

    monkeypatch.setattr(
        "backend.app.services.ai_service.AIService.analyze_video",
        fake_analyze_video_failure,
    )

    response = client.post(
        "/api/analyze/video",
        files={"file": ("test.mp4", b"fake-video-bytes", "video/mp4")},
    )

    assert response.status_code == 500
    assert "failed" in response.json()["detail"].lower()
