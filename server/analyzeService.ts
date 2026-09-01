import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { ThreatAnalysisResult } from '../src/types';
import { detectCoerciveMediaThreat } from '../src/utils/threatClassifier';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

const SYSTEM_INSTRUCTION = `
You are SafeGuard AI, an expert cybersecurity digital safety assistant specializing in cyber-abuse, phishing, smishing, scam, extortion, coercion, impersonation, credential harvesting, and account takeover investigations.
Analyze the submitted digital evidence for security threats.

CRITICAL ASSESSMENT RULES:
1. Do NOT blindly trust user-provided claims or victim assertions.
2. Clearly distinguish between:
   - detected evidence (verifiable observable facts)
   - AI inference (logical threat deductions)
   - uncertainty (missing context or unverified claims)

Respond strictly with a single JSON object matching this exact schema:
{
  "incident_id": "string",
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "risk_score": number between 0 and 100,
  "confidence": number between 0 and 100,
  "threat_type": "Phishing" | "Social Engineering" | "Scam" | "Harassment" | "Impersonation" | "Account Takeover Attempt" | "Malicious Link" | "Sextortion / Coercion" | "Financial Fraud" | "Identity Theft" | "Other Suspicious Activity",
  "coercive_media_threat_detected": boolean,
  "summary": "Concise summary",
  "explanation": "Clear, rigorous forensic explanation of what this content is trying to achieve.",
  "explanation_simple": "One or two reassuring plain-English sentences for non-technical users.",
  "warning_signs": ["Warning sign 1", "Warning sign 2"],
  "indicators": ["Observable indicator 1", "Observable indicator 2"],
  "tactics_observed": ["Tactic observed"],
  "recommended_actions": [
    {
      "title": "Action title",
      "description": "Specific actionable step",
      "priority": "urgent" | "high" | "recommended",
      "category": "Immediate Containment" | "Account Security" | "Evidence Preservation" | "Recovery & Reporting"
    }
  ],
  "affected_accounts": ["Targeted accounts/identifiers if visible"],
  "evidence_relationships": [],
  "timeline_events": [],
  "potential_impact": "Impact if victim complies",
  "origin_assessment": "Assessment of origin or modus operandi",
  "observed_evidence": ["Facts directly visible/present in the evidence, no speculation"],
  "ai_inference": ["Conclusions derived from observed evidence, clearly labeled as inference"],
  "uncertainty": ["Information that cannot be verified or is missing context"]
}
`;

function sanitizeResult(parsed: any, defaultThreat: any, originalText?: string): ThreatAnalysisResult {
  const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
  const validThreatTypes = [
    'Phishing',
    'Social Engineering',
    'Scam',
    'Harassment',
    'Impersonation',
    'Account Takeover Attempt',
    'Malicious Link',
    'Sextortion / Coercion',
    'Financial Fraud',
    'Identity Theft',
    'Other Suspicious Activity'
  ] as const;

  const isCoercive =
    parsed.coercive_media_threat_detected === true ||
    (originalText ? detectCoerciveMediaThreat(originalText) : false);

  const riskLevel = validRiskLevels.includes(parsed.risk_level) ? parsed.risk_level : 'HIGH';
  const threatType = isCoercive
    ? 'Sextortion / Coercion'
    : (validThreatTypes.includes(parsed.threat_type) ? parsed.threat_type : defaultThreat);

  const actions = Array.isArray(parsed.recommended_actions) && parsed.recommended_actions.length > 0
    ? parsed.recommended_actions.map((act: any, idx: number) => ({
        id: act.id || `act-${Date.now()}-${idx}`,
        title: act.title || 'Cease communication immediately',
        description: act.description || 'Do not click links, open attachments, or reply to the sender.',
        priority: act.priority || 'urgent',
        category: act.category || 'Immediate Containment',
        actionTarget: act.actionTarget
      }))
    : [
        {
          id: `act-${Date.now()}-0`,
          title: 'Cease communication immediately',
          description: 'Do not click links, open attachments, or reply to the sender.',
          priority: 'urgent' as const,
          category: 'Immediate Containment' as const
        }
      ];

  if (isCoercive) {
    const hasSextortionCard = actions.some((a: any) =>
      a.title && a.title.toLowerCase().includes('sextortion')
    );
    if (!hasSextortionCard) {
      actions.unshift({
        id: `act-sextortion-${Date.now()}`,
        title: 'This looks like sextortion — get help removing it',
        description:
          'Someone may be threatening to distribute private personal media unless you comply with their demands. This is a form of online extortion. Do not pay or send additional material. Preserve the evidence and seek help from an established support service.',
        priority: 'urgent' as const,
        category: 'Immediate Containment' as const,
        actionLinks: [
          { label: 'Adults: StopNCII.org →', url: 'https://stopncii.org/' },
          { label: "For content created when someone was under 18: NCMEC's Take It Down →", url: 'https://takeitdown.ncmec.org/' }
        ]
      });
    }
  }

  const timeline = Array.isArray(parsed.timeline_events) && parsed.timeline_events.length > 0
    ? parsed.timeline_events.map((t: any, idx: number) => ({
        id: t.id || `t-${Date.now()}-${idx}`,
        timestamp: t.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        phase: t.phase || 'Contact',
        title: t.title || `${threatType} Event Detected`,
        description: t.description || parsed.explanation_simple || 'Communication pattern identified.',
        relatedEvidenceIds: Array.isArray(t.relatedEvidenceIds) ? t.relatedEvidenceIds : [],
        severity: t.severity || 'high'
      }))
    : [
        {
          id: `t-${Date.now()}-0`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          phase: 'Contact' as const,
          title: `${threatType} Detection`,
          description: parsed.explanation_simple || parsed.explanation || 'Suspicious communication received.',
          relatedEvidenceIds: [],
          severity: riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'high' as const : 'medium' as const
        }
      ];

  return {
    incident_id: parsed.incident_id || `inc-${Date.now()}`,
    risk_level: riskLevel,
    risk_score: typeof parsed.risk_score === 'number' ? Math.max(0, Math.min(100, parsed.risk_score)) : 75,
    confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(100, parsed.confidence)) : 90,
    threat_type: threatType,
    coercive_media_threat_detected: isCoercive,
    summary: parsed.summary || 'Suspicious communication pattern detected.',
    explanation: parsed.explanation || 'Forensic analysis identified deceptive tactics or threat indicators.',
    explanation_simple: parsed.explanation_simple || 'This message contains warning signs of an online scam or phishing attempt.',
    warning_signs: Array.isArray(parsed.warning_signs) && parsed.warning_signs.length > 0
      ? parsed.warning_signs
      : ['Unverified sender origin', 'Urgency pressure tactics'],
    indicators: Array.isArray(parsed.indicators) && parsed.indicators.length > 0
      ? parsed.indicators
      : ['Suspicious domain structure or communication pattern'],
    tactics_observed: Array.isArray(parsed.tactics_observed) && parsed.tactics_observed.length > 0
      ? parsed.tactics_observed
      : ['Social Engineering Lure'],
    recommended_actions: actions,
    affected_accounts: Array.isArray(parsed.affected_accounts) ? parsed.affected_accounts : [],
    evidence_relationships: Array.isArray(parsed.evidence_relationships) ? parsed.evidence_relationships : [],
    timeline_events: timeline,
    potential_impact: parsed.potential_impact || 'Risk of credential compromise or fraudulent activity.',
    origin_assessment: parsed.origin_assessment || 'Likely automated scam delivery mechanism.',
    observed_evidence: Array.isArray(parsed.observed_evidence) ? parsed.observed_evidence : [],
    ai_inference: Array.isArray(parsed.ai_inference) ? parsed.ai_inference : [],
    uncertainty: Array.isArray(parsed.uncertainty) ? parsed.uncertainty : []
  };
}

export async function analyzeSuspiciousMessage(message: string): Promise<ThreatAnalysisResult> {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Please provide a message to analyze.');
  }

  const ai = getAiClient();
  const prompt = `Analyze this suspicious text message for digital safety threats:\n\n"""\n${message.trim()}\n"""`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return sanitizeResult(parsed, 'Phishing', message);
}

export async function analyzeSuspiciousUrl(url: string): Promise<ThreatAnalysisResult> {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('Please provide a URL to analyze.');
  }

  const ai = getAiClient();
  const prompt = `Analyze this suspicious URL for digital threats, typosquatting, credential harvesting, brand impersonation, and deceptive parameters:\n\nURL: ${url.trim()}\n\nDo NOT label this URL as malicious solely because it looks unusual unless threat indicators exist.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return sanitizeResult(parsed, 'Malicious Link');
}

export async function analyzeSuspiciousImage(imageB64: string, mimeType: string = 'image/png'): Promise<ThreatAnalysisResult> {
  if (!imageB64) {
    throw new Error('Please provide an image to analyze.');
  }

  const ai = getAiClient();
  const cleanB64 = imageB64.includes(',') ? imageB64.split(',')[1] : imageB64;
  const imagePart = {
    inlineData: {
      data: cleanB64,
      mimeType: mimeType
    }
  };

  const prompt = 'Analyze this screenshot/image evidence for fake login portals, security alerts, extortion threats, or social engineering lures.';

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [imagePart, prompt],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return sanitizeResult(parsed, 'Social Engineering');
}

export async function analyzeSuspiciousAudio(audioB64: string, mimeType: string = 'audio/mp3'): Promise<ThreatAnalysisResult> {
  if (!audioB64) {
    throw new Error('Please provide an audio recording to analyze.');
  }

  const ai = getAiClient();
  const cleanB64 = audioB64.includes(',') ? audioB64.split(',')[1] : audioB64;
  const audioPart = {
    inlineData: {
      data: cleanB64,
      mimeType: mimeType
    }
  };

  const prompt = 'Transcribe and analyze this audio evidence for coercive voice calls, phone scams, extortion demands, or identity impersonation.';

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [audioPart, prompt],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return sanitizeResult(parsed, 'Scam');
}
