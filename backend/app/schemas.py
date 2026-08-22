from typing import List, Optional, Dict, Any, Literal
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]

ThreatType = Literal[
    "Phishing",
    "Social Engineering",
    "Scam",
    "Harassment",
    "Impersonation",
    "Account Takeover Attempt",
    "Malicious Link",
    "Sextortion / Coercion",
    "Financial Fraud",
    "Identity Theft",
    "Other Suspicious Activity"
]

class ActionItemSchema(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    priority: Literal["urgent", "high", "recommended"] = "high"
    category: Literal["Immediate Containment", "Account Security", "Evidence Preservation", "Recovery & Reporting"] = "Immediate Containment"
    actionTarget: Optional[str] = None

class EvidenceRelationshipSchema(BaseModel):
    source_id: str
    target_id: str
    relationship_type: str
    description: str

class TimelineEventSchema(BaseModel):
    id: str
    timestamp: str
    phase: Literal["Inception", "Contact", "Escalation", "Compromise Attempt", "Containment"] = "Contact"
    title: str
    description: str
    relatedEvidenceIds: List[str] = Field(default_factory=list)
    severity: Literal["low", "medium", "high", "critical"] = "medium"

class InvestigationResultSchema(BaseModel):
    incident_id: str
    risk_level: RiskLevel
    risk_score: int = Field(ge=0, le=100, default=75)
    confidence: int = Field(ge=0, le=100, default=90)
    threat_type: ThreatType
    summary: str
    explanation: str
    explanation_simple: Optional[str] = None
    warning_signs: List[str] = Field(default_factory=list)
    indicators: List[str] = Field(default_factory=list)
    tactics_observed: List[str] = Field(default_factory=list)
    recommended_actions: List[ActionItemSchema] = Field(default_factory=list)
    affected_accounts: List[str] = Field(default_factory=list)
    evidence_relationships: List[EvidenceRelationshipSchema] = Field(default_factory=list)
    timeline_events: List[TimelineEventSchema] = Field(default_factory=list)
    potential_impact: str = ""
    origin_assessment: str = ""
    observed_evidence: List[str] = Field(default_factory=list)
    ai_inference: List[str] = Field(default_factory=list)
    uncertainty: List[str] = Field(default_factory=list)
    contradictions: List[str] = Field(default_factory=list)
    missing_evidence: List[str] = Field(default_factory=list)

# Request Schemas
class TextAnalysisRequest(BaseModel):
    text: Optional[str] = None
    message: Optional[str] = None  # Support both "text" and "message"

class UrlAnalysisRequest(BaseModel):
    url: str

class ImageAnalysisRequest(BaseModel):
    image_b64: Optional[str] = None
    filename: Optional[str] = "screenshot.png"
    mime_type: Optional[str] = "image/png"

class AudioAnalysisRequest(BaseModel):
    audio_b64: Optional[str] = None
    filename: Optional[str] = "recording.mp3"
    mime_type: Optional[str] = "audio/mp3"

# Incident Schemas
class IncidentCreateRequest(BaseModel):
    title: str
    category: str = "Digital Safety Investigation"
    summary: Optional[str] = ""
    status: Literal["NEW", "INVESTIGATING", "RESOLVED", "ARCHIVED"] = "NEW"
    risk_level: RiskLevel = "MEDIUM"
    threat_type: ThreatType = "Other Suspicious Activity"

class IncidentUpdateRequest(BaseModel):
    title: Optional[str] = None
    status: Optional[Literal["NEW", "INVESTIGATING", "RESOLVED", "ARCHIVED"]] = None
    risk_level: Optional[RiskLevel] = None
    threat_type: Optional[ThreatType] = None
    summary: Optional[str] = None

class SynthesisSchema(BaseModel):
    tacticsObserved: List[str] = Field(default_factory=list)
    potentialImpact: str = ""
    originAssessment: str = ""
    recommendedLegalSteps: Optional[str] = ""

class IncidentResponseSchema(BaseModel):
    incident_id: str
    title: str = ""
    created_at: str
    updated_at: str
    status: str
    risk_level: str
    risk_score: int = 50
    confidence: int = 90
    threat_type: str
    summary: str
    evidence_ids: List[str] = Field(default_factory=list)
    timeline: List[TimelineEventSchema] = Field(default_factory=list)
    recommendations: List[ActionItemSchema] = Field(default_factory=list)
    synthesis: Optional[SynthesisSchema] = None
    observed_evidence: List[str] = Field(default_factory=list)
    ai_inference: List[str] = Field(default_factory=list)
    uncertainty: List[str] = Field(default_factory=list)
    contradictions: List[str] = Field(default_factory=list)
    missing_evidence: List[str] = Field(default_factory=list)
    evidence_relationships: List[EvidenceRelationshipSchema] = Field(default_factory=list)
    explanation: Optional[str] = None
    explanation_simple: Optional[str] = None

class VideoAnalysisRequest(BaseModel):
    video_b64: Optional[str] = None
    mime_type: Optional[str] = None


class DocumentAnalysisRequest(BaseModel):
    doc_b64: Optional[str] = None
    mime_type: Optional[str] = None


class EmailAnalysisRequest(BaseModel):
    sender: Optional[str] = None
    recipient: Optional[str] = None
    subject: Optional[str] = None
    body: str
    timestamp: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    attachments: Optional[List[str]] = None
    urls: Optional[List[str]] = None

class EvidenceCreateRequest(BaseModel):
    type: Literal["text", "url", "image", "screenshot", "audio", "document", "video", "email", "file"]
    title: Optional[str] = "Evidence Item"
    content: Optional[str] = ""
    file_b64: Optional[str] = None
    filename: Optional[str] = None

class EvidenceResponseSchema(BaseModel):
    evidence_id: str
    incident_id: str
    type: str
    filename: Optional[str] = None
    content_location: str
    created_at: str
    sha256_hash: str
    analysis_status: str
    analysis_result: Optional[InvestigationResultSchema] = None

# Analytics Schema
class AnalyticsSummarySchema(BaseModel):
    total_incidents: int
    high_risk_incidents: int
    critical_risk_incidents: int
    threats_by_type: Dict[str, int]
    evidence_processed: int
    total_analytics_events: int
