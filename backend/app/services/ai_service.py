import json
import uuid
import time
import base64
import re
from typing import Dict, Any, Optional
from backend.app.config import settings
from backend.app.schemas import (
    InvestigationResultSchema, ActionItemSchema,
    EvidenceRelationshipSchema, TimelineEventSchema
)

def detect_coercive_media_threat(text: str) -> bool:
    """
    Lightweight heuristic layer detecting if communication contains BOTH:
    1. Coercion / extortion signal (payment demand, blackmail, leak threat)
    2. Private / intimate / sensitive personal media threat (photos, videos, recordings)
    """
    if not text or not isinstance(text, str):
        return False
    t = text.lower()

    # 1. Private / Intimate Media Concepts
    media_patterns = [
        r'\b(?:private|intimate|nude|nudes|explicit|sexual|compromising|sensitive|personal|secret|illicit)\s+(?:photos?|pics?|pictures?|videos?|recordings?|footage|images?|media|content|clips?)\b',
        r'\b(?:photos?|pics?|pictures?|videos?|recordings?|footage|images?|media|clips?)\s+of\s+you\s+(?:naked|undressed|in\s+private)\b',
        r'\b(?:webcam|front\s*camera|camera)\s+(?:footage|recording|video|recordings)\b',
        r'\b(?:split-screen\s+video|masturbat\w*|explicit\s+material)\b',
        r'\b(?:nudes|intimate\s+footage|private\s+data\s+and\s+photos?)\b'
    ]
    has_media = any(re.search(p, t) for p in media_patterns)
    if not has_media and re.search(r'\b(?:recorded\s+you|compromised\s+your\s+(?:device|camera|webcam))\b', t) and re.search(r'\b(?:video|footage|recording|photos?|pics?)\b', t):
        has_media = True

    if not has_media:
        return False

    # 2. Coercion / Extortion Concepts
    coercion_patterns = [
        r'\b(?:pay|send|transfer|give)\s+(?:me\s+)?(?:[\$€£₹]|\d+|money|cash|bitcoin|btc|crypto|funds|ransom)\b',
        r'\b(?:pay\s+me|give\s+me\s+money|send\s+money|pay\s+or|unless\s+you\s+pay|if\s+you\s+don[\'’]?t\s+pay)\b',
        r'\b(?:post|leak|upload|release|distribute|publish|spread|broadcast|share)\s+(?:it|them|this|everything|everywhere|those|your)\b',
        r'\b(?:send\s+(?:this|it|them|the\s+\w+)\s+to\s+(?:your|all|everyone|contacts|family|friends|colleagues|social|followers|relatives))\b',
        r'\b(?:expose\s+you|ruin\s+your\s+reputation|destroy\s+your\s+life|show\s+(?:everyone|your\s+family))\b',
        r'\b(?:everyone\s+will\s+see|all\s+your\s+(?:friends|contacts|family)\s+will\s+see)\b',
        r'\b(?:or\s+I[\'’]?ll\s+(?:post|leak|send|upload|release|expose|share|show))\b',
        r'\b(?:comply\s+with|meet\s+my\s+demands?|extortion|blackmail)\b'
    ]
    has_coercion = any(re.search(p, t) for p in coercion_patterns)

    return has_media and has_coercion

try:
    from google import genai
    # pyrefly: ignore [missing-import]
    from google.genai import types
    GENAI_SDK_AVAILABLE = True
except ImportError:
    GENAI_SDK_AVAILABLE = False

SYSTEM_INSTRUCTION = """
You are SafeGuard AI, an expert cybersecurity digital safety assistant specializing in cyber-abuse, phishing, smishing, scam, extortion, coercion, impersonation, credential harvesting, and account takeover investigations.
Analyze the submitted digital evidence (text message, URL, screenshot image, or audio transcript) for security threats.

CRITICAL ASSESSMENT RULES:
1. Do NOT blindly trust user-provided claims or victim assertions.
2. Clearly distinguish between:
   - detected evidence (verifiable observable facts in the evidence)
   - AI inference (logical deductions based on cyber threat patterns)
   - uncertainty (missing context or unverified claims)

Respond strictly with a single JSON object matching this exact schema:
{
  "incident_id": "string",
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "risk_score": number between 0 and 100,
  "confidence": number between 0 and 100,
  "threat_type": "Phishing" | "Social Engineering" | "Scam" | "Harassment" | "Impersonation" | "Account Takeover Attempt" | "Malicious Link" | "Sextortion / Coercion" | "Financial Fraud" | "Identity Theft" | "Other Suspicious Activity",
  "coercive_media_threat_detected": boolean,
  "summary": "Concise high-level incident summary",
  "explanation": "Clear, rigorous forensic explanation of what this content is trying to achieve and why it is suspicious.",
  "explanation_simple": "One or two reassuring, plain-English sentences for a non-technical user explaining what is happening.",
  "warning_signs": ["Warning sign 1", "Warning sign 2"],
  "indicators": ["Observable IOC or suspicious pattern 1", "Observable IOC 2"],
  "tactics_observed": ["Specific tactic or technique observed"],
  "recommended_actions": [
    {
      "title": "Action title",
      "description": "Specific actionable step",
      "priority": "urgent" | "high" | "recommended",
      "category": "Immediate Containment" | "Account Security" | "Evidence Preservation" | "Recovery & Reporting"
    }
  ],
  "affected_accounts": ["Identifier or account targeted if visible, e.g. Email/Bank"],
  "evidence_relationships": [
    {
      "source_id": "ev-1",
      "target_id": "ev-2",
      "relationship_type": "leads_to",
      "description": "Explanation of link between evidence"
    }
  ],
  "timeline_events": [
    {
      "id": "t-1",
      "timestamp": "HH:MM",
      "phase": "Inception" | "Contact" | "Escalation" | "Compromise Attempt" | "Containment",
      "title": "Timeline step title",
      "description": "Event detail",
      "relatedEvidenceIds": ["ev-1"],
      "severity": "low" | "medium" | "high" | "critical"
    }
  ],
  "potential_impact": "Impact if victim complies",
  "origin_assessment": "Assessment of sender, domain, or delivery infrastructure",
  "observed_evidence": ["List of verifiable facts present in the evidence"],
  "ai_inference": ["List of threat inferences or deductions based on security indicators"],
  "uncertainty": ["List of unverified claims or details that cannot be confirmed from the evidence alone"]
}
"""

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.client = None
        if GENAI_SDK_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key, vertexai=False)
            except Exception as e:
                print(f"[AIService] Warning: Failed to create Gemini client: {e}")

    def _call_gemini(self, contents: list) -> str:
        """Call Gemini API with structured JSON output instructions."""
        if not self.client:
            raise ValueError("GEMINI_API_KEY environment variable is not configured or SDK is unavailable.")

        target_model = self.model or "gemini-3.6-flash"
        if target_model in ["gemini-2.0-flash", "models/gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash"]:
            target_model = "gemini-3.6-flash"

        try:
            response = self.client.models.generate_content(
                model=target_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            return response.text or "{}"
        except Exception as err:
            err_str = str(err)
            if ("404" in err_str or "not found" in err_str.lower() or "gemini-2.0-flash" in err_str) and target_model != "gemini-3.6-flash":
                print(f"[AIService] Model {target_model} unavailable. Retrying with gemini-3.6-flash: {err}")
                self.model = "gemini-3.6-flash"
                response = self.client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_INSTRUCTION,
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )
                return response.text or "{}"
            raise

    def analyze_text(self, text: str, incident_id: Optional[str] = None) -> InvestigationResultSchema:
        """Analyze text message or digital evidence content."""
        if not text or not text.strip():
            raise ValueError("Text content cannot be empty.")
        
        inc_id = incident_id or f"inc-{uuid.uuid4().hex[:8]}"
        prompt = f"Incident ID: {inc_id}\n\nAnalyze the following suspicious message text:\n\n\"\"\"\n{text.strip()}\n\"\"\""
        
        raw_json = self._call_gemini([prompt])
        return self._parse_and_sanitize(raw_json, inc_id, fallback_threat="Phishing", text_content=text)

    def analyze_url(self, url: str, incident_id: Optional[str] = None) -> InvestigationResultSchema:
        """Analyze suspicious URL for domain impersonation, credential harvesting, and suspicious patterns."""
        if not url or not url.strip():
            raise ValueError("URL cannot be empty.")

        inc_id = incident_id or f"inc-{uuid.uuid4().hex[:8]}"
        prompt = f"""
Incident ID: {inc_id}
Analyze this suspicious URL for risk signals such as suspicious domain registration, brand impersonation, deceptive homoglyphs/typosquatting, credential harvesting forms, or phishing indicators:

URL: {url.strip()}

Do NOT label this URL as malicious solely because it is unusual unless structural or deceptive threat indicators are identified.
"""
        raw_json = self._call_gemini([prompt])
        return self._parse_and_sanitize(raw_json, inc_id, fallback_threat="Malicious Link")

    def analyze_image(self, image_bytes: bytes, mime_type: str = "image/png", incident_id: Optional[str] = None) -> InvestigationResultSchema:
        """Multimodal image/screenshot analysis via Gemini."""
        if not image_bytes:
            raise ValueError("Image file data cannot be empty.")

        inc_id = incident_id or f"inc-{uuid.uuid4().hex[:8]}"
        
        if self.client and GENAI_SDK_AVAILABLE:
            part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            prompt = f"Incident ID: {inc_id}\nAnalyze this uploaded screenshot / image evidence for fake login portals, security alerts, extortion threats, or social engineering lures."
            raw_json = self._call_gemini([part, prompt])
            return self._parse_and_sanitize(raw_json, inc_id, fallback_threat="Social Engineering")
        else:
            raise ValueError("Gemini API client unavailable for image analysis.")

    def analyze_audio(self, audio_bytes: bytes, mime_type: str = "audio/mp3", incident_id: Optional[str] = None) -> InvestigationResultSchema:
        """Multimodal audio evidence analysis abstraction."""
        if not audio_bytes:
            raise ValueError("Audio file data cannot be empty.")

        inc_id = incident_id or f"inc-{uuid.uuid4().hex[:8]}"
        
        if self.client and GENAI_SDK_AVAILABLE:
            part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
            prompt = f"Incident ID: {inc_id}\nTranscribe and analyze this audio evidence for coercive voice calls, phone scams, extortion demands, or identity impersonation."
            raw_json = self._call_gemini([part, prompt])
            return self._parse_and_sanitize(raw_json, inc_id, fallback_threat="Scam")
        else:
            raise ValueError("Gemini API client unavailable for audio analysis.")

    def analyze_video(self, video_bytes: bytes, mime_type: str = "video/mp4", incident_id: Optional[str] = None) -> InvestigationResultSchema:
        """Multimodal video evidence deepfake and forensic analysis using inline byte parts."""
        if not video_bytes:
            raise ValueError("Video content cannot be empty.")

        inc_id = incident_id or f"inc-{uuid.uuid4().hex[:8]}"

        clean_mime = (mime_type or "video/mp4").lower()
        if "quicktime" in clean_mime or clean_mime.endswith(".mov"):
            clean_mime = "video/quicktime"
        elif "webm" in clean_mime:
            clean_mime = "video/webm"
        elif "mp4" in clean_mime:
            clean_mime = "video/mp4"
        else:
            clean_mime = "video/mp4"

        if self.client and GENAI_SDK_AVAILABLE:
            part = types.Part.from_bytes(data=video_bytes, mime_type=clean_mime)
            prompt = (
                f"Incident ID: {inc_id}\n"
                "You are an expert digital safety and media forensics investigator specializing in deepfake, synthetic media, and video manipulation detection.\n"
                "Examine this uploaded video recording across both its visual stream and audio track.\n"
                "Specifically investigate and report on:\n"
                "1. Facial movement consistency: naturalness of blinking, gaze fixation, unnatural micro-expression freezes, or edge warping.\n"
                "2. Audio-visual synchronization: phoneme-viseme alignment, speech cadence, and mouth movement latency.\n"
                "3. Generative and morphing artifacts: boundary blurring along jawline/neck, lighting discontinuities, or resolution mismatches.\n"
                "4. Temporal coherence: frame-to-frame stability, optical flow anomalies, or phase distortion across sequence cuts.\n"
                "5. Voice cloning and synthetic audio: presence of neural text-to-speech artifacts, robotic pitch contours, or impersonation lures.\n"
                "Provide a rigorous analysis with:\n"
                "- risk_score (0 to 100, where >=75 indicates high confidence deepfake/coercion, <35 indicates authentic/unmanipulated)\n"
                "- risk_level ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')\n"
                "- threat_type (e.g., 'Deepfake Video Manipulation', 'Synthetic Media Impersonation', 'Coercive Media', or 'Authentic Media')\n"
                "- warning_signs (list specific forensic findings with observed frame cues, audio sync latency, or visual artifacts)\n"
                "- explanation and explanation_simple summarizing the verdict clearly for the user."
            )
            raw_json = self._call_gemini([part, prompt])
            return self._parse_and_sanitize(raw_json, inc_id, fallback_threat="Deepfake Video Manipulation")
        else:
            raise ValueError("Gemini API client unavailable for video analysis.")

    def analyze_email(self, email_data: dict, incident_id: Optional[str] = None) -> InvestigationResultSchema:
        """Analyze email evidence including body, subject, sender, and headers."""
        inc_id = incident_id or f"inc-{uuid.uuid4().hex[:8]}"
        
        email_summary = f"""
Sender: {email_data.get('sender', 'Not Provided')}
Recipient: {email_data.get('recipient', 'Not Provided')}
Subject: {email_data.get('subject', 'Not Provided')}
Timestamp: {email_data.get('timestamp', 'Not Provided')}
Headers: {json.dumps(email_data.get('headers', {})) if email_data.get('headers') else 'Not Provided'}
Urls found: {', '.join(email_data.get('urls', [])) if email_data.get('urls') else 'None'}
Attachments: {', '.join(email_data.get('attachments', [])) if email_data.get('attachments') else 'None'}

Body:
{email_data.get('body', '')}
"""
        
        prompt = f"Incident ID: {inc_id}\nAnalyze this suspicious email evidence for spoofing, brand impersonation, deceptive headers, urgent coercion, credential harvesting, or malicious attachments:\n\n{email_summary}"
        
        raw_json = self._call_gemini([prompt])
        return self._parse_and_sanitize(raw_json, inc_id, fallback_threat="Phishing")

    def analyze_document(self, doc_bytes: bytes, mime_type: str = "application/pdf", incident_id: Optional[str] = None) -> InvestigationResultSchema:
        """Analyze document evidence (e.g. PDF) using Gemini."""
        if not doc_bytes:
            raise ValueError("Document content cannot be empty.")
            
        inc_id = incident_id or f"inc-{uuid.uuid4().hex[:8]}"
        
        if self.client and GENAI_SDK_AVAILABLE:
            part = types.Part.from_bytes(data=doc_bytes, mime_type=mime_type)
            prompt = f"Incident ID: {inc_id}\nAnalyze this document evidence for malicious instructions, lookalike branding, phishing lures, or fake invoice scams."
            raw_json = self._call_gemini([part, prompt])
            return self._parse_and_sanitize(raw_json, inc_id, fallback_threat="Phishing")
        else:
            raise ValueError("Gemini API client unavailable for document analysis.")

    def synthesize_incident(self, incident_title: str, evidence_items: list, db_session) -> InvestigationResultSchema:
        """Synthesize multiple evidence items belonging to the same incident to create a correlated view."""
        if not evidence_items:
            raise ValueError("Cannot synthesize incident without evidence.")
            
        import os
        from backend.app.models import AnalysisResult
        
        evidence_contexts = []
        for idx, ev in enumerate(evidence_items):
            ar = db_session.query(AnalysisResult).filter(AnalysisResult.evidence_id == ev.id).first()
            ar_details = ""
            if ar:
                ar_details = f"""
Analysis Summary: {ar.summary}
Threat Type: {ar.threat_type}
Risk Level: {ar.risk_level} (Score: {ar.risk_score})
Indicators: {json.dumps(ar.indicators)}
Tactics Observed: {json.dumps(ar.tactics_observed)}
"""
            # For text-based evidence, include a snippet
            content_snippet = ""
            if ev.type in ["text", "url", "email"] and ev.content_location.startswith("file://"):
                try:
                    file_path = ev.content_location.replace("file://", "")
                    if os.path.exists(file_path):
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content_snippet = f.read(1000)  # first 1000 chars
                except Exception:
                    pass
            elif ev.type == "text" or ev.type == "url":
                content_snippet = ev.title or ""

            summary = f"""
--- Evidence Item #{idx+1} ---
ID: {ev.id}
Type: {ev.type}
Title: {ev.title}
Filename: {ev.filename}
SHA-256: {ev.sha256_hash}
{ar_details}
Snippet/Content: {content_snippet}
"""
            evidence_contexts.append(summary)

        evidence_ctx = "\n".join(evidence_contexts)
        incident_id = evidence_items[0].incident_id
        
        prompt = f"""
Incident ID: {incident_id}
Incident Title: {incident_title}

Perform a cross-evidence correlation analysis on the following evidence items associated with this incident.
We need to reconstruct the likely attack chain and define specific relationship links between these items.

Evidence Contexts:
{evidence_ctx}

Task:
1. Reconstruct the step-by-step timeline of the attack (distinguish observed vs inferred vs uncertain events).
2. Connect evidence belonging to the same incident. Define "evidence_relationships" using the source_id and target_id of the evidence items. Use the evidence IDs as they appear in the contexts (e.g. ev-XXXX). Use relationship_type values from this set where applicable: leads_to, supports, contains_url_from, impersonates, references, escalates, contradicts, same_campaign, credential_harvesting_stage, follow_up_contact.
3. Formulate the overall threat type, risk level, risk score, and confidence.
4. Identify any CONTRADICTIONS between evidence items — e.g. conflicting timestamps, inconsistent claims, or evidence that undermines another item's implied narrative. Populate "contradictions" as a list of short descriptions. If none are found, return an empty list — do not invent contradictions.
5. Identify any MISSING EVIDENCE that would materially strengthen or clarify this investigation — e.g. "no screenshot of the fake login page was provided" or "the follow-up phone call was not recorded." Populate "missing_evidence" as a list. If nothing is obviously missing, return an empty list.
6. Output a JSON object matching the requested schema, including "contradictions" and "missing_evidence" as top-level arrays.
"""
        raw_json = self._call_gemini([prompt])
        return self._parse_and_sanitize(raw_json, incident_id, fallback_threat="Other Suspicious Activity")

    def _parse_and_sanitize(self, raw_json: str, incident_id: str, fallback_threat: str, text_content: Optional[str] = None) -> InvestigationResultSchema:
        """Parse Gemini output JSON and enforce strict schema defaults."""
        try:
            data = json.loads(raw_json)
        except Exception:
            data = {}

        coercive_detected = data.get("coercive_media_threat_detected")
        if coercive_detected is None:
            coercive_detected = detect_coercive_media_threat(text_content or "")
        elif not coercive_detected and text_content:
            if detect_coercive_media_threat(text_content):
                coercive_detected = True

        risk_level = data.get("risk_level", "HIGH")
        if risk_level not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
            risk_level = "HIGH"

        threat_type = data.get("threat_type", fallback_threat)
        if coercive_detected:
            threat_type = "Sextortion / Coercion"

        valid_threats = [
            "Phishing", "Social Engineering", "Scam", "Harassment",
            "Impersonation", "Account Takeover Attempt", "Malicious Link",
            "Sextortion / Coercion", "Financial Fraud", "Identity Theft", "Other Suspicious Activity"
        ]
        if threat_type not in valid_threats:
            threat_type = fallback_threat

        actions = []
        for act in data.get("recommended_actions", []):
            if isinstance(act, dict) and "title" in act and "description" in act:
                actions.append(ActionItemSchema(
                    id=act.get("id", f"act-{uuid.uuid4().hex[:6]}"),
                    title=act["title"],
                    description=act["description"],
                    priority=act.get("priority", "high"),
                    category=act.get("category", "Immediate Containment"),
                    actionTarget=act.get("actionTarget")
                ))

        if coercive_detected:
            has_sextortion_action = any("sextortion" in a.title.lower() for a in actions)
            if not has_sextortion_action:
                actions.insert(0, ActionItemSchema(
                    id=f"act-sextortion-{uuid.uuid4().hex[:6]}",
                    title="This looks like sextortion — get help removing it",
                    description="Someone may be threatening to distribute private personal media unless you comply with their demands. This is a form of online extortion. Do not pay or send additional material. Preserve the evidence and seek help from an established support service.",
                    priority="urgent",
                    category="Immediate Containment",
                    actionTarget="https://stopncii.org/",
                    actionLinks=[
                        {"label": "Adults: StopNCII.org →", "url": "https://stopncii.org/"},
                        {"label": "For content created when someone was under 18: NCMEC's Take It Down →", "url": "https://takeitdown.ncmec.org/"}
                    ]
                ))

        if not actions:
            actions.append(ActionItemSchema(
                id=f"act-{uuid.uuid4().hex[:6]}",
                title="Cease interaction immediately",
                description="Do not click links, open attachments, or reply to the sender.",
                priority="urgent",
                category="Immediate Containment"
            ))

        timeline = []
        for te in data.get("timeline_events", []):
            if isinstance(te, dict) and "title" in te and "description" in te:
                timeline.append(TimelineEventSchema(
                    id=te.get("id", f"t-{uuid.uuid4().hex[:6]}"),
                    timestamp=te.get("timestamp", time.strftime("%H:%M")),
                    phase=te.get("phase", "Contact"),
                    title=te["title"],
                    description=te["description"],
                    relatedEvidenceIds=te.get("relatedEvidenceIds", []),
                    severity=te.get("severity", "medium")
                ))

        if not timeline:
            timeline.append(TimelineEventSchema(
                id=f"t-{uuid.uuid4().hex[:6]}",
                timestamp=time.strftime("%H:%M"),
                phase="Contact",
                title=f"Initial {threat_type} Contact",
                description=data.get("summary", "Suspicious communication received."),
                relatedEvidenceIds=[],
                severity="medium" if risk_level in ["LOW", "MEDIUM"] else "high"
            ))

        relationships = []
        for rel in data.get("evidence_relationships", []):
            if isinstance(rel, dict) and "source_id" in rel and "target_id" in rel:
                relationships.append(EvidenceRelationshipSchema(
                    source_id=rel["source_id"],
                    target_id=rel["target_id"],
                    relationship_type=rel.get("relationship_type", "associated_with"),
                    description=rel.get("description", "Cross-evidence link identified.")
                ))

        observed_evidence = data.get("observed_evidence", [])
        if not isinstance(observed_evidence, list):
            observed_evidence = [str(observed_evidence)] if observed_evidence else []
            
        ai_inference = data.get("ai_inference", [])
        if not isinstance(ai_inference, list):
            ai_inference = [str(ai_inference)] if ai_inference else []
            
        uncertainty = data.get("uncertainty", [])
        if not isinstance(uncertainty, list):
            uncertainty = [str(uncertainty)] if uncertainty else []

        contradictions = data.get("contradictions", [])
        if not isinstance(contradictions, list):
            contradictions = [str(contradictions)] if contradictions else []

        missing_evidence = data.get("missing_evidence", [])
        if not isinstance(missing_evidence, list):
            missing_evidence = [str(missing_evidence)] if missing_evidence else []

        return InvestigationResultSchema(
            incident_id=data.get("incident_id", incident_id),
            risk_level=risk_level,
            risk_score=max(0, min(100, int(data.get("risk_score", 75)))),
            confidence=max(0, min(100, int(data.get("confidence", 90)))),
            threat_type=threat_type,
            coercive_media_threat_detected=bool(coercive_detected),
            summary=data.get("summary", "Suspicious digital communication pattern detected."),
            explanation=data.get("explanation", "Forensic analysis detected indicators of malicious intent or deceptive social engineering."),
            explanation_simple=data.get("explanation_simple", "This communication shows warning signs of a scam or impersonation attempt."),
            warning_signs=data.get("warning_signs", ["Unverified origin", "Pressure or urgency tactics"]),
            indicators=data.get("indicators", ["Deceptive domain structure or communication pattern"]),
            tactics_observed=data.get("tactics_observed", ["Social Engineering Lure"]),
            recommended_actions=actions,
            affected_accounts=data.get("affected_accounts", []),
            evidence_relationships=relationships,
            timeline_events=timeline,
            potential_impact=data.get("potential_impact", "Risk of unauthorized access or financial harm."),
            origin_assessment=data.get("origin_assessment", "Likely automated scam delivery mechanism."),
            observed_evidence=observed_evidence,
            ai_inference=ai_inference,
            uncertainty=uncertainty,
            contradictions=contradictions,
            missing_evidence=missing_evidence
        )

ai_service = AIService()
