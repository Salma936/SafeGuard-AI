export type ViewMode = 'landing' | 'investigate' | 'live-demo' | 'screenshot-analyzer';

export interface ForensicsFinding {
  label: string;
  detail: string;
  severity: 'high' | 'medium' | 'info' | string;
}

export interface ForensicsAnalysisResult {
  manipulation_score: number;
  verdict: string;
  findings: ForensicsFinding[];
  ela_heatmap_base64?: string | null;
  noise_heatmap_base64?: string | null;
}

export interface EvidenceItem {
  id: string;
  type: 'message' | 'url' | 'screenshot' | 'email' | 'file' | 'audio' | 'video';
  title: string;
  content: string;
  timestamp: string;
  source?: string;
  riskScore: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  indicators: string[];
  metadata?: Record<string, string>;
  sha256Hash?: string;
  contentLocation?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  phase: 'Inception' | 'Contact' | 'Escalation' | 'Compromise Attempt' | 'Containment';
  title: string;
  description: string;
  relatedEvidenceIds: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ActionItem {
  id: string;
  category: 'Immediate Containment' | 'Account Security' | 'Evidence Preservation' | 'Recovery & Reporting';
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'recommended';
  isCompleted: boolean;
  actionType: 'external_link' | 'copy_text' | 'checklist' | 'guide';
  actionTarget?: string;
  actionLinks?: Array<{ label: string; url: string }>;
}

export interface IncidentCase {
  id: string;
  title: string;
  category: string;
  summary: string;
  dateReported: string;
  status: 'Investigating' | 'Contained' | 'Resolved';
  overallRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number;
  evidence: EvidenceItem[];
  timeline: TimelineEvent[];
  actionPlan: ActionItem[];
  synthesis: {
    tacticsObserved: string[];
    potentialImpact: string;
    originAssessment: string;
    recommendedLegalSteps?: string;
  };
}

export interface ThreatAnalysisResult {
  incident_id: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  confidence: number;
  threat_type:
    | 'Phishing'
    | 'Social Engineering'
    | 'Scam'
    | 'Harassment'
    | 'Impersonation'
    | 'Account Takeover Attempt'
    | 'Malicious Link'
    | 'Sextortion / Coercion'
    | 'Financial Fraud'
    | 'Identity Theft'
    | 'Other Suspicious Activity';
  coercive_media_threat_detected?: boolean;
  summary: string;
  explanation: string;
  explanation_simple?: string;
  warning_signs: string[];
  indicators: string[];
  tactics_observed: string[];
  recommended_actions: Array<{
    id?: string;
    title: string;
    description: string;
    priority: 'urgent' | 'high' | 'recommended';
    category: 'Immediate Containment' | 'Account Security' | 'Evidence Preservation' | 'Recovery & Reporting';
    actionTarget?: string;
    actionLinks?: Array<{ label: string; url: string }>;
  }>;
  affected_accounts: string[];
  evidence_relationships: Array<{
    source_id: string;
    target_id: string;
    relationship_type: string;
    description: string;
  }>;
  timeline_events: Array<{
    id: string;
    timestamp: string;
    phase: 'Inception' | 'Contact' | 'Escalation' | 'Compromise Attempt' | 'Containment';
    title: string;
    description: string;
    relatedEvidenceIds: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  potential_impact: string;
  origin_assessment: string;
  observed_evidence: string[];
  ai_inference: string[];
  uncertainty: string[];
}

export interface AnalyticsSummary {
  total_incidents: number;
  high_risk_incidents: number;
  critical_risk_incidents: number;
  threats_by_type: Record<string, number>;
  evidence_processed: number;
  total_analytics_events: number;
}
