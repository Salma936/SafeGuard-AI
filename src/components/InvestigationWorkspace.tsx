import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  Upload,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  Sparkles,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  FileCheck,
  AlertTriangle,
  Copy,
  Check,
  ShieldAlert,
  Globe,
  Server,
  Zap,
  Key,
  Activity,
  Mic,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Video,
  X
} from 'lucide-react';
import {
  ViewMode,
  IncidentCase,
  EvidenceItem,
  TimelineEvent,
  ActionItem,
  ThreatAnalysisResult,
  ForensicsAnalysisResult
} from '../types';
import { DEMO_INCIDENTS } from '../data/demoIncidents';
import {
  analyzeSuspiciousText,
  analyzeSuspiciousUrl,
  analyzeSuspiciousImage,
  analyzeSuspiciousAudio,
  analyzeSuspiciousVideo,
  analyzeScreenshotForensics,
  addIncidentEvidence
} from '../services/api';
import { MAX_VIDEO_SIZE_BYTES, isVideoFile, readFileAsBase64 } from '../utils/fileUtils';
import { detectCoerciveMediaThreat } from '../utils/threatClassifier';
import { LiveStatusIndicator } from './LiveStatusIndicator';
import { ThreatIndexGauge } from './ThreatIndexGauge';
import { MiniRiskGauge } from './MiniRiskGauge';
import { EvidenceConstellation, ConstellationHandle } from './EvidenceConstellation';
import {
  EvidenceCardSkeleton,
  TimelineItemSkeleton,
  ActionItemSkeleton
} from './SkeletonLoader';
import { EvidenceCard } from './EvidenceCard';

interface InvestigationWorkspaceProps {
  initialMode?: ViewMode;
  onNavigate: (view: ViewMode) => void;
  selectedDemoCase?: IncidentCase | null;
}

// Helper to highlight key threat indicators directly within evidence content
const renderAnnotatedEvidence = (
  content: string,
  indicators: string[],
  severityColor: string
) => {
  const keywords: string[] = [];

  const triggerWords = [
    'urgent',
    'immediately',
    'suspended',
    'compromised',
    '2 hours',
    '15 mins',
    '24 hours',
    'bitcoin',
    'wire transfer',
    '$1,420.00',
    '$800',
    'webcam',
    'password',
    'deleted',
    'permanently',
    'billing error',
    'fraud-prevention',
    'login',
    'verify',
    'update'
  ];

  indicators.forEach((ind) => {
    const quoted = ind.match(/'([^']+)'|"([^"]+)"/);
    if (quoted && (quoted[1] || quoted[2])) {
      keywords.push((quoted[1] || quoted[2]).trim());
    }
    const words = ind.split(/[:\s—–(),]+/);
    words.forEach((w) => {
      const clean = w.trim();
      if (
        clean.length >= 4 &&
        ![
          'detected',
          'suspicious',
          'observed',
          'high',
          'risk',
          'with',
          'from',
          'that',
          'this',
          'critical',
          'medium'
        ].includes(clean.toLowerCase())
      ) {
        keywords.push(clean);
      }
    });
  });

  triggerWords.forEach((w) => keywords.push(w));

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const uniqueKeywords = Array.from(new Set(keywords.filter(Boolean)));

  const patternParts = [
    '(https?:\\/\\/[^\\s,]+)',
    ...uniqueKeywords.map((k) => `(\\b${escapeRegex(k)}\\b)`)
  ];

  const regex = new RegExp(patternParts.join('|'), 'gi');
  const parts = content.split(regex).filter((p) => p !== undefined && p !== '');

  return (
    <span>
      {parts.map((part, i) => {
        regex.lastIndex = 0;
        const isMatch = regex.test(part);
        regex.lastIndex = 0;

        if (isMatch) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded font-bold transition-all"
              style={{
                backgroundColor: `${severityColor}22`,
                borderBottom: `2px solid ${severityColor}`,
                color: '#FFFFFF'
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full mr-1 shrink-0 inline-block"
                style={{
                  backgroundColor: severityColor,
                  boxShadow: `0 0 6px ${severityColor}`
                }}
              />
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

// Helper for relevant tactic icons
const getTacticIcon = (tactic: string) => {
  const lower = tactic.toLowerCase();
  if (lower.includes('urgent') || lower.includes('coercion')) return Zap;
  if (
    lower.includes('lookalike') ||
    lower.includes('credential') ||
    lower.includes('harvest')
  )
    return Key;
  if (lower.includes('fatigue') || lower.includes('prompt')) return Activity;
  if (
    lower.includes('smishing') ||
    lower.includes('sms') ||
    lower.includes('message')
  )
    return MessageSquare;
  if (lower.includes('breach') || lower.includes('regurgitation')) return Lock;
  if (lower.includes('bluff') || lower.includes('extortion'))
    return AlertTriangle;
  if (lower.includes('deepfake') || lower.includes('video') || lower.includes('synthetic'))
    return Video;
  return ShieldAlert;
};

// Plain language translation helpers for Simple View
const getIndicatorPlainLanguage = (indicator: string): string => {
  const lower = indicator.toLowerCase();

  // 1. Audio / Voice cloning
  if (
    lower.includes('voice clone') ||
    lower.includes('synthetic voice') ||
    lower.includes('audio spoof') ||
    lower.includes('acoustic') ||
    lower.includes('voicemail') ||
    lower.includes('ai-generated voice') ||
    lower.includes('tts synthesis') ||
    lower.includes('vishing')
  ) {
    return "The caller's voice may be an AI-generated clone designed to sound like someone you trust.";
  }

  // 2. Video / Synthetic media / Deepfake
  if (
    lower.includes('facial movement') ||
    lower.includes('deepfake') ||
    lower.includes('manipulation likelihood') ||
    lower.includes('audio-visual sync') ||
    lower.includes('morphed') ||
    lower.includes('synthetic media')
  ) {
    return "Facial inconsistencies and audio desynchronization indicate synthetic video manipulation.";
  }

  // 3. MFA fatigue / push notifications
  if (lower.includes('prompt fatigue') || lower.includes('push') || lower.includes('mfa')) {
    return "The attacker is spamming login requests hoping you'll accidentally click approve.";
  }

  // 4. Extortion / Sextortion
  if (lower.includes('sextortion') || lower.includes('extortion')) {
    return "An extortionist is claiming to have private files to frighten you into sending money.";
  }

  // 5. Urgent message / SMS / Phishing
  if (lower.includes('urgency') || lower.includes('deadline') || lower.includes('coercive')) {
    return "The sender is creating fake urgency to rush you into making a mistake.";
  }

  // 6. Reverse proxy / 2FA capture
  if (
    lower.includes('reverse proxy') ||
    lower.includes('capturing 2fa') ||
    lower.includes('authentication parameter')
  ) {
    return "A deceptive login page designed to intercept your password and two-factor code.";
  }

  // 7. Domain / URL / Lookalike / Typosquatting
  if (
    lower.includes('domain registered') ||
    lower.includes('newly registered') ||
    lower.includes('registered') ||
    lower.includes('typosquatting') ||
    lower.includes('subdomain') ||
    lower.includes('free tier') ||
    lower.includes('phishing kit') ||
    lower.includes('squatting') ||
    lower.includes('lookalike') ||
    lower.includes('homoglyph')
  ) {
    return "This web address is designed to imitate a trusted platform and trick you into entering credentials.";
  }

  // 8. Credential harvesting / fake login page
  if (
    lower.includes('credential harvesting') ||
    lower.includes('page clone') ||
    lower.includes('site clone') ||
    lower.includes('harvest')
  ) {
    return "This fake page is programmed to steal your username, password, and security codes.";
  }

  // 9. Spam flood / inbox disruption
  if (lower.includes('high volume') || lower.includes('inbox disruption')) {
    return "Mass spam attack designed to bury important fraud alerts from your bank or email.";
  }

  // 10. Malware / Dropper
  if (lower.includes('malicious payload') || lower.includes('dropper')) {
    return "A harmful attachment or file download that could install tracking malware.";
  }

  if (lower.includes('external domain') || lower.includes('unrecognized')) {
    return "This link doesn't come from a company you actually use.";
  }

  return "Identified as a suspicious pattern commonly used in digital threat campaigns.";
};

const getTacticPlainLanguage = (tactic: string): string => {
  const lower = tactic.toLowerCase();

  if (lower.includes('aitm') || (lower.includes('proxy') && lower.includes('phishing'))) {
    return "AiTM proxy phishing";
  }

  if (lower.includes('fatigue') || lower.includes('prompt') || lower.includes('bombing')) {
    return "MFA fatigue spam";
  }

  if (lower.includes('smishing') || lower.includes('sms')) {
    return "Fake emergency alert";
  }

  if (lower.includes('lookalike') || lower.includes('credential')) {
    return "Copycat login page";
  }

  if (lower.includes('breach') || lower.includes('regurgitation')) {
    return "Credential leak bluff";
  }

  if (lower.includes('bluff') || lower.includes('psychological')) {
    return "Extortion camera bluff";
  }

  if (lower.includes('cryptocurrency') || lower.includes('extortion')) {
    return "Crypto ransom demand";
  }

  if (lower.includes('impersonation') || lower.includes('typosquatting')) {
    return "Brand impersonation";
  }

  if (lower.includes('stalkerware') || lower.includes('spyware')) {
    return "Tracking spyware";
  }

  if (lower.includes('voice') || lower.includes('vishing') || lower.includes('acoustic')) {
    return "AI voice clone spoof";
  }

  if (lower.includes('synthetic media') || lower.includes('deepfake')) {
    return "Deepfake video";
  }

  return tactic;
};

// Region-general legal reporting guidance helper
const formatLegalSteps = (text?: string): string => {
  if (!text) return '';
  const userTimezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  const isUS = userTimezone.includes('America') || userTimezone.includes('US');

  let cleaned = text.replace(
    /submit report to FTC\.gov\s*\/\s*IC3\.gov/gi,
    'report to your local cybercrime authority or financial institution'
  );
  cleaned = cleaned.replace(
    /Report message to FBI IC3/gi,
    'Report message to your local cybercrime authority'
  );

  if (isUS && !cleaned.includes('(US: FTC.gov / IC3.gov)')) {
    cleaned += ' (US portals: FTC.gov / IC3.gov)';
  }

  return cleaned;
};

export interface KeyFindingItem {
  tactic: string;
  label: string;
  score: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  isVisual: boolean;
  evidenceId?: string;
}

const getKeyFindingsList = (incident: IncidentCase): KeyFindingItem[] => {
  const isVisualType = (type: string) => {
    const t = type.toLowerCase();
    return t === 'video' || t === 'screenshot' || t === 'image' || t === 'file';
  };

  const isVisualTactic = (tactic: string, matchingEv?: EvidenceItem) => {
    if (matchingEv && isVisualType(matchingEv.type)) {
      return true;
    }
    const lower = tactic.toLowerCase();
    return (
      lower.includes('video') ||
      lower.includes('deepfake') ||
      lower.includes('synthetic media') ||
      lower.includes('screenshot') ||
      lower.includes('image') ||
      lower.includes('mfa prompt') ||
      lower.includes('fatigue')
    );
  };

  return incident.synthesis.tacticsObserved.map((tactic, idx) => {
    const lower = tactic.toLowerCase();
    const matchingEv = incident.evidence.find(
      (ev) =>
        ev.title.toLowerCase().includes(lower) ||
        ev.indicators.some((ind) => ind.toLowerCase().includes(lower)) ||
        ((lower.includes('video') || lower.includes('synthetic media') || lower.includes('deepfake')) && ev.type === 'video') ||
        ((lower.includes('fatigue') || lower.includes('prompt')) && ev.type === 'screenshot') ||
        (lower.includes('smish') && ev.type === 'message') ||
        (lower.includes('proxy') && ev.type === 'url') ||
        ((lower.includes('voice') || lower.includes('acoustic')) && ev.type === 'audio')
    ) || incident.evidence[idx];

    const isVideoOrDeepfake = lower.includes('synthetic media') || lower.includes('deepfake');
    const score = isVideoOrDeepfake
      ? 68
      : (matchingEv?.riskScore ?? incident.evidence[idx]?.riskScore ?? incident.riskScore);

    const isVisual = isVisualTactic(tactic, matchingEv);
    const severity: 'critical' | 'high' | 'medium' | 'low' =
      score >= 90 ? 'critical' : (score >= 70 || isVideoOrDeepfake) ? 'high' : 'medium';

    let label = getTacticPlainLanguage(tactic);
    if (lower.includes('synthetic media') || lower.includes('deepfake')) {
      label = 'Deepfake video';
    }

    return {
      tactic,
      label,
      score,
      severity,
      isVisual,
      evidenceId: matchingEv?.id || incident.evidence[idx]?.id,
    };
  }).sort((a, b) => {
    if (a.isVisual && !b.isVisual) return -1;
    if (!a.isVisual && b.isVisual) return 1;
    return b.score - a.score;
  });
};

const getSignalBadgeIcon = (indicator: string) => {
  const lower = indicator.toLowerCase();
  if (lower.includes('deadline') || lower.includes('urgency') || lower.includes('minute') || lower.includes('hour') || lower.includes('time') || lower.includes('pressure')) {
    return Clock;
  }
  if (lower.includes('domain') || lower.includes('link') || lower.includes('url') || lower.includes('endpoint') || lower.includes('squatting')) {
    return LinkIcon;
  }
  if (lower.includes('2fa') || lower.includes('mfa') || lower.includes('prompt') || lower.includes('push') || lower.includes('fatigue')) {
    return ShieldAlert;
  }
  if (lower.includes('spoofed') || lower.includes('sender') || lower.includes('impersonat') || lower.includes('fake') || lower.includes('unknown')) {
    return AlertTriangle;
  }
  if (lower.includes('ssl') || lower.includes('cert') || lower.includes('reverse proxy') || lower.includes('token') || lower.includes('auth')) {
    return Lock;
  }
  if (lower.includes('video') || lower.includes('facial') || lower.includes('sync') || lower.includes('morphed') || lower.includes('deepfake')) {
    return Video;
  }
  return Zap;
};

// Generate a plain-English one-sentence verdict from risk category/type
const getVerdictSentence = (category: string, riskScore: number): string => {
  const lower = category.toLowerCase();
  if (lower.includes('phishing') || lower.includes('impersonation')) {
    return riskScore >= 75
      ? 'This looks like a coordinated phishing attack.'
      : 'This looks like a phishing or impersonation attempt.';
  }
  if (lower.includes('extortion') || lower.includes('harassment')) {
    return 'This appears to be an extortion or harassment campaign.';
  }
  if (lower.includes('scam') || lower.includes('fraud')) {
    return 'This looks like a financial scam designed to steal money or data.';
  }
  if (lower.includes('account takeover') || lower.includes('credential')) {
    return 'This looks like an account takeover attempt.';
  }
  if (lower.includes('social engineering')) {
    return 'This looks like a social engineering manipulation attempt.';
  }
  if (lower.includes('malicious') || lower.includes('malware')) {
    return 'This content appears to carry malicious software or links.';
  }
  if (riskScore >= 75) {
    return 'This looks like a high-risk coordinated threat campaign.';
  }
  if (riskScore >= 50) {
    return 'This looks moderately suspicious and warrants close attention.';
  }
  return 'This content shows some suspicious signals worth reviewing.';
};

// Generate a plain-English context sentence from category/tactics
const getVerdictContext = (category: string, tactics: string[]): string => {
  const lower = category.toLowerCase();
  const tacticsStr = tactics.map(t => t.toLowerCase()).join(' ');

  if (tacticsStr.includes('aitm') || tacticsStr.includes('proxy') || tacticsStr.includes('reverse proxy')) {
    return 'A fake login page intercepts your credentials and two-factor code in real time.';
  }
  if (lower.includes('phishing') && tacticsStr.includes('fatigue')) {
    return 'Fake urgency plus MFA spam designed to force an accidental login approval.';
  }
  if (lower.includes('phishing') || tacticsStr.includes('lookalike') || tacticsStr.includes('credential')) {
    return 'Fake urgency plus a spoofed login page, built to steal credentials.';
  }
  if (lower.includes('extortion') || tacticsStr.includes('extortion') || tacticsStr.includes('bluff')) {
    return 'The attacker bluffs with recycled old passwords to frighten you into paying.';
  }
  if (lower.includes('scam') || tacticsStr.includes('fraud')) {
    return 'Designed to trick you into handing over money or sensitive financial details.';
  }
  if (tacticsStr.includes('smishing') || tacticsStr.includes('sms')) {
    return 'A fake emergency SMS crafted to make you click a malicious link immediately.';
  }
  return 'Multiple threat signals detected across the collected evidence items.';
};

// Generate a plain-language description for each tactic row
const getTacticDescription = (tactic: string): string => {
  const lower = tactic.toLowerCase();
  if (lower.includes('aitm') || (lower.includes('proxy') && lower.includes('phishing'))) {
    return 'A deceptive login page sits between you and the real site, capturing your password and 2FA code live.';
  }
  if (lower.includes('fatigue') || lower.includes('bombing') || lower.includes('prompt')) {
    return 'You get spammed with login approval requests until you accidentally tap "Allow".';
  }
  if (lower.includes('smishing') || lower.includes('sms')) {
    return 'A fake emergency text designed to create panic and make you click without thinking.';
  }
  if (lower.includes('lookalike') || lower.includes('credential harvest')) {
    return 'A copycat website that looks identical to the real one, built purely to steal your login.';
  }
  if (lower.includes('breach') || lower.includes('regurgitation') || lower.includes('credential stuffing')) {
    return 'The attacker uses your old leaked password as a bluff to make the threat seem credible.';
  }
  if (lower.includes('bluff') || lower.includes('psychological') || lower.includes('extortion bluff')) {
    return 'A fake claim that private footage was recorded — there is no video, only intimidation.';
  }
  if (lower.includes('cryptocurrency') || lower.includes('crypto ransom')) {
    return 'A demand to send untraceable cryptocurrency so the payment cannot be recovered.';
  }
  if (lower.includes('impersonation') || lower.includes('typosquatting')) {
    return 'A fake website or sender disguised to look exactly like a trusted brand you recognise.';
  }
  if (lower.includes('stalkerware') || lower.includes('spyware')) {
    return 'Hidden tracking software installed to monitor your location, messages, and activity.';
  }
  if (lower.includes('synthetic media') || lower.includes('deepfake')) {
    return 'The video or audio has been digitally altered to make someone appear to say or do something that never actually happened.';
  }
  if (lower.includes('emotional manipulation') || lower.includes('pity') || lower.includes('guilt')) {
    return 'A sob story or guilt trip designed to lower your guard so you comply without questioning the request.';
  }
  return `${tactic} is a known attack pattern used to manipulate, deceive, or gain unauthorised access.`;
};

// Helper to extract uppercase kinetic headline words directly from the active incident
export function getHeadlineWords(incident: IncidentCase): { line1: string[]; line2: string[] } {
  if (incident.headline && incident.headline.line1 && incident.headline.line1.length > 0) {
    return {
      line1: incident.headline.line1.map((w) => w.toUpperCase()),
      line2: (incident.headline.line2 || []).map((w) => w.toUpperCase()),
    };
  }

  const title = incident.title || '';
  const words = title.trim().toUpperCase().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return { line1: ['INCIDENT', 'INVESTIGATION'], line2: [] };
  }

  if (words.length <= 3) {
    return { line1: words, line2: [] };
  }

  // Look for a colon (e.g., "LIVE INVESTIGATION: PHISHING")
  const colonIdx = words.findIndex((w) => w.endsWith(':'));
  if (colonIdx >= 0 && colonIdx < words.length - 1) {
    return {
      line1: words.slice(0, colonIdx + 1),
      line2: words.slice(colonIdx + 1),
    };
  }

  // Look for a natural break at '&'
  const ampersandIdx = words.indexOf('&');
  if (ampersandIdx >= 1 && ampersandIdx < words.length - 1) {
    const ratio = ampersandIdx / words.length;
    if (ratio >= 0.25 && ratio <= 0.75) {
      return {
        line1: words.slice(0, ampersandIdx),
        line2: words.slice(ampersandIdx),
      };
    }
  }

  // Balanced split
  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid),
    line2: words.slice(mid),
  };
}

export const InvestigationWorkspace: React.FC<
  InvestigationWorkspaceProps
> = ({
  onNavigate,
  selectedDemoCase
}) => {
    const [activeCase, setActiveCase] = useState<IncidentCase>(
      selectedDemoCase || DEMO_INCIDENTS[0]
    );

    // Synchronize activeCase if parent passes a different selectedDemoCase
    useEffect(() => {
      if (selectedDemoCase) {
        setActiveCase(selectedDemoCase);
      }
    }, [selectedDemoCase]);

    // Single source of truth for kinetic hero headline words
    const headlineWords = useMemo(() => getHeadlineWords(activeCase), [activeCase]);

    // Single source of truth for evidence types matching activeCase.evidence
    const evidenceTypesDisplay = useMemo(() => {
      const typeLabelMap: Record<string, string> = {
        message: 'Text',
        text: 'Text',
        url: 'URL',
        screenshot: 'Screenshot',
        audio: 'Audio',
        video: 'Video',
        email: 'Email',
      };
      const types = Array.from(
        new Set(activeCase.evidence.map((ev) => typeLabelMap[ev.type] || ev.type.toUpperCase()))
      );
      return types.length > 0 ? types.join(' · ') : 'No artifacts';
    }, [activeCase.evidence]);

    const [activeTab, setActiveTab] = useState<
      'evidence' | 'timeline' | 'actions' | 'export'
    >('evidence');

    const [viewDetailMode, setViewDetailMode] = useState<
      'simple' | 'technical'
    >('simple');

    // Custom evidence & real AI submission state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suspiciousMessageInput, setSuspiciousMessageInput] = useState('');
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [analysisSuccess, setAnalysisSuccess] = useState<string | null>(null);

    // Stored failed analysis context to allow immediate retry with the same input
    const [lastFailedAnalysis, setLastFailedAnalysis] = useState<{
      source: 'direct-text' | 'custom-evidence';
      text?: string;
      url?: string;
      categoryType?: 'message' | 'url' | 'screenshot' | 'email' | 'audio' | 'video';
      file?: File | null;
    } | null>(null);

    // Active AbortController to cleanly abort analysis on retry or unmount
    const analysisAbortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
      return () => {
        if (analysisAbortControllerRef.current) {
          analysisAbortControllerRef.current.abort();
        }
      };
    }, []);

    const [customTextInput, setCustomTextInput] = useState('');
    const [customUrlInput, setCustomUrlInput] = useState('');

    const [customTypeInput, setCustomTypeInput] = useState<
      'message' | 'url' | 'screenshot' | 'email' | 'audio' | 'video'
    >('message');

    const [selectedEvidenceFile, setSelectedEvidenceFile] =
      useState<File | null>(null);

    const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
    const [exportSuccessMessage, setExportSuccessMessage] =
      useState<string | null>(null);
    const [hasCopiedHash, setHasCopiedHash] = useState(false);
    const [expandedEvidenceIds, setExpandedEvidenceIds] = useState<Record<string, boolean>>({});
    const [technicalOpen, setTechnicalOpen] = useState(false);
    const [showAllEvidence, setShowAllEvidence] = useState(false);
    const [showAllTactics, setShowAllTactics] = useState(false);
    const constellationRef = useRef<ConstellationHandle>(null);

    const confidenceScore = (() => {
      for (const ev of activeCase.evidence) {
        if (ev.metadata?.['AI Confidence']) {
          const parsed = parseInt(ev.metadata['AI Confidence'], 10);
          if (!isNaN(parsed)) return parsed;
        }
      }
      return Math.min(98, Math.round(activeCase.riskScore * 1.08 + 10));
    })();

    const toggleEvidenceDetails = (id: string) => {
      setExpandedEvidenceIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const keyFindingsList = useMemo(() => getKeyFindingsList(activeCase), [activeCase]);

    const scrollToEvidenceCard = (evidenceId?: string) => {
      if (!evidenceId) return;
      setActiveTab('evidence');
      setShowAllEvidence(true);

      setTimeout(() => {
        const el = document.getElementById(`evidence-card-${evidenceId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-[#5FC9E8]', 'ring-offset-2', 'ring-offset-[#06080B]', 'rounded-3xl');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-[#5FC9E8]', 'ring-offset-2', 'ring-offset-[#06080B]', 'rounded-3xl');
          }, 2000);
        }
      }, 100);
    };

    // Toggle Action item completed
    const handleToggleAction = (actionId: string) => {
      setActiveCase((prev) => ({
        ...prev,
        actionPlan: prev.actionPlan.map((act) =>
          act.id === actionId
            ? { ...act, isCompleted: !act.isCompleted }
            : act
        )
      }));
    };

    // Helper to ingest real AI analysis result into workspace state
    const processAnalysisResult = (
      result: ThreatAnalysisResult,
      originalText: string,
      categoryType:
        | 'message'
        | 'url'
        | 'screenshot'
        | 'email'
        | 'audio'
        | 'video' = 'message',
      extraElaData?: ForensicsAnalysisResult | null
    ) => {
      const riskLevelCapitalized:
        | 'Low'
        | 'Medium'
        | 'High'
        | 'Critical' =
        result.risk_level === 'CRITICAL'
          ? 'Critical'
          : result.risk_level === 'HIGH'
            ? 'High'
            : result.risk_level === 'MEDIUM'
              ? 'Medium'
              : 'Low';

      const newEv: EvidenceItem = {
        id: `ev-ai-${Date.now()}`,
        type: categoryType,
        title: `${result.threat_type}: Ingested ${categoryType.toUpperCase()}`,
        content: originalText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        riskScore: result.risk_score,
        riskLevel: riskLevelCapitalized,
        indicators:
          result.warning_signs && result.warning_signs.length > 0
            ? result.warning_signs
            : ['Suspicious communication heuristics detected'],
        metadata: {
          'Threat Type': result.threat_type,
          'AI Confidence': `${result.confidence}%`,
          Model: 'Gemini 3.6 Flash',
          ...(extraElaData
            ? {
                'ELA Score': `${extraElaData.manipulation_score}/100`,
                'ELA Verdict': extraElaData.verdict
              }
            : {})
        },
        elaResult: extraElaData || undefined
      };

      const newTimeline: TimelineEvent = {
        id: `t-ai-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        phase:
          result.risk_score >= 70
            ? 'Compromise Attempt'
            : 'Contact',
        title: `${result.threat_type} Detected`,
        description:
          result.explanation_simple || result.explanation,
        relatedEvidenceIds: [newEv.id],
        severity:
          result.risk_level === 'CRITICAL'
            ? 'critical'
            : result.risk_level === 'HIGH'
              ? 'high'
              : result.risk_level === 'MEDIUM'
                ? 'medium'
                : 'low'
      };

      const isCoercive =
        result.coercive_media_threat_detected === true ||
        detectCoerciveMediaThreat(originalText);

      const effectiveThreatType = isCoercive
        ? 'Sextortion / Coercion'
        : result.threat_type;

      let newActions: ActionItem[] =
        result.recommended_actions &&
          result.recommended_actions.length > 0
          ? result.recommended_actions.map((act, idx) => ({
            id: act.id || `act-ai-${Date.now()}-${idx}`,
            category:
              act.category || 'Immediate Containment',
            title: act.title,
            description: act.description,
            priority: act.priority || 'high',
            isCompleted: false,
            actionType: (act.actionLinks && act.actionLinks.length > 0) || act.actionTarget
              ? 'external_link'
              : 'guide',
            actionTarget: act.actionTarget,
            actionLinks: act.actionLinks
          }))
          : [
            {
              id: `act-ai-${Date.now()}-0`,
              category: 'Immediate Containment',
              title:
                'Do not click links or provide credentials',
              description:
                'Cease communication with the sender immediately.',
              priority: 'urgent',
              isCompleted: false,
              actionType: 'guide'
            }
          ];

      if (isCoercive) {
        const alreadyHasSextortionCard = newActions.some((a) =>
          a.title.toLowerCase().includes('sextortion')
        );
        if (!alreadyHasSextortionCard) {
          const sextortionAction: ActionItem = {
            id: `act-sextortion-${Date.now()}`,
            category: 'Immediate Containment',
            title: 'This looks like sextortion — get help removing it',
            description:
              'Someone may be threatening to distribute private personal media unless you comply with their demands. This is a form of online extortion. Do not pay or send additional material. Preserve the evidence and seek help from an established support service.',
            priority: 'urgent',
            isCompleted: false,
            actionType: 'external_link',
            actionLinks: [
              {
                label: 'Adults: StopNCII.org →',
                url: 'https://stopncii.org/'
              },
              {
                label: "For content created when someone was under 18: NCMEC's Take It Down →",
                url: 'https://takeitdown.ncmec.org/'
              }
            ]
          };
          newActions = [sextortionAction, ...newActions];
        }
      }

      const priorityRank = (priority: string) => {
        const p = priority?.toLowerCase();
        if (p === 'urgent') return 0;
        if (p === 'high') return 1;
        if (p === 'recommended' || p === 'medium') return 2;
        return 3;
      };

      setActiveCase((prev) => {
        const combinedActions = [...newActions, ...prev.actionPlan];
        const seenSextortion = new Set<string>();
        const deduplicatedActions = combinedActions.filter((a) => {
          if (a.title === 'This looks like sextortion — get help removing it') {
            if (seenSextortion.has(a.title)) return false;
            seenSextortion.add(a.title);
          }
          return true;
        });
        const sortedActions = deduplicatedActions.sort(
          (a, b) => priorityRank(a.priority) - priorityRank(b.priority)
        );

        return {
          ...prev,
          title: `Live Investigation: ${effectiveThreatType} (${result.risk_level} Risk)`,
          category: effectiveThreatType,
          summary:
            result.explanation_simple || result.explanation,
          overallRisk: riskLevelCapitalized,
          riskScore: result.risk_score,
          status: 'Investigating',
          evidence: [newEv, ...prev.evidence],
          timeline: [newTimeline, ...prev.timeline],
          actionPlan: sortedActions,
          synthesis: {
            tacticsObserved:
              result.tactics_observed &&
                result.tactics_observed.length > 0
                ? result.tactics_observed
                : [effectiveThreatType],
            potentialImpact:
              result.potential_impact ||
              prev.synthesis.potentialImpact,
            originAssessment:
              result.origin_assessment ||
              prev.synthesis.originAssessment,
            recommendedLegalSteps:
              prev.synthesis.recommendedLegalSteps
          }
        };
      });

      setAnalysisSuccess(
        `Analyzed as "${result.threat_type}" (${result.risk_level} Risk, ${result.confidence}% Confidence). Investigation workspace updated.`
      );

      setTimeout(() => setAnalysisSuccess(null), 6000);
    };

    // Submit text message directly from the workspace input
    const handleAnalyzeTextMessage = async (
      e?: React.FormEvent,
      overrideText?: string
    ) => {
      e?.preventDefault();

      if (isAnalyzing) return;

      const textToAnalyze = (overrideText !== undefined ? overrideText : suspiciousMessageInput).trim();
      if (!textToAnalyze) return;

      // Abort previous in-flight request if any
      if (analysisAbortControllerRef.current) {
        analysisAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      analysisAbortControllerRef.current = controller;

      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const result = await analyzeSuspiciousText(
          textToAnalyze,
          controller.signal
        );

        processAnalysisResult(
          result,
          textToAnalyze,
          'message'
        );

        setSuspiciousMessageInput('');
        setLastFailedAnalysis(null);
      } catch (err: any) {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          return;
        }

        console.error('Failed to analyze message:', err);

        const errorMsg =
          err?.message ||
          'Failed to analyze the message with AI. Please try again.';

        setAnalysisError(errorMsg);
        setLastFailedAnalysis({
          source: 'direct-text',
          text: textToAnalyze
        });
      } finally {
        if (analysisAbortControllerRef.current === controller) {
          analysisAbortControllerRef.current = null;
          setIsAnalyzing(false);
        }
      }
    };

    // Submit custom evidence modal with real AI analysis
    const handleAddCustomEvidence = async (
      e?: React.FormEvent,
      retryParams?: {
        text?: string;
        url?: string;
        categoryType?: 'message' | 'url' | 'screenshot' | 'email' | 'audio' | 'video';
        file?: File | null;
      }
    ) => {
      e?.preventDefault();

      if (isAnalyzing) return;

      const typeInput = retryParams?.categoryType || customTypeInput;
      const textInput = retryParams?.text !== undefined ? retryParams.text : customTextInput;
      const urlInput = retryParams?.url !== undefined ? retryParams.url : customUrlInput;
      const fileInput = retryParams?.file !== undefined ? retryParams.file : selectedEvidenceFile;

      const hasContent = textInput.trim() || urlInput.trim() || fileInput;
      if (!hasContent) {
        setAnalysisError('Please provide text, a URL, or upload a file to analyze.');
        return;
      }

      // Abort previous in-flight request if any
      if (analysisAbortControllerRef.current) {
        analysisAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      analysisAbortControllerRef.current = controller;

      setIsAnalyzing(true);
      setShowAddEvidenceModal(false);
      setAnalysisError(null);

      const currentAttemptContext = {
        source: 'custom-evidence' as const,
        text: textInput,
        url: urlInput,
        categoryType: typeInput,
        file: fileInput
      };

      try {
        let result: ThreatAnalysisResult;
        let extraElaData: ForensicsAnalysisResult | null = null;
        let displayContent =
          textInput.trim() ||
          urlInput.trim() ||
          (fileInput ? fileInput.name : 'Ingested Evidence');

        if (typeInput === 'url' || urlInput.trim()) {
          const urlToAnalyze = urlInput.trim() || textInput.trim();
          result = await analyzeSuspiciousUrl(urlToAnalyze, controller.signal);
          displayContent = urlToAnalyze;
        } else if (
          typeInput === 'screenshot' ||
          (fileInput && fileInput.type.startsWith('image/'))
        ) {
          if (fileInput) {
            const b64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(fileInput);
            });

            // Execute analyzeSuspiciousImage (Gemini) and analyzeScreenshotForensics (ELA) in parallel
            const [geminiResult, elaResult] = await Promise.all([
              analyzeSuspiciousImage(b64, fileInput.type, controller.signal),
              analyzeScreenshotForensics(fileInput, controller.signal).catch((elaErr) => {
                console.warn('ELA analysis skipped or failed:', elaErr);
                return null;
              })
            ]);

            result = geminiResult;
            if (elaResult && elaResult.manipulation_score > 35) {
              extraElaData = elaResult;
            }
            displayContent = `${fileInput.name} (Screenshot Evidence)`;
          } else {
            result = await analyzeSuspiciousText(
              textInput.trim() || 'Screenshot Analysis Request',
              controller.signal
            );
          }
        } else if (
          typeInput === 'audio' ||
          (fileInput && fileInput.type.startsWith('audio/'))
        ) {
          if (fileInput) {
            const b64 = await readFileAsBase64(fileInput);
            result = await analyzeSuspiciousAudio(b64, fileInput.type, controller.signal);
            displayContent = `${fileInput.name} (Audio Recording Evidence)`;
          } else {
            result = await analyzeSuspiciousText(
              textInput.trim() || 'Audio Evidence Analysis Request',
              controller.signal
            );
          }
        } else if (
          typeInput === 'video' ||
          (fileInput && isVideoFile(fileInput))
        ) {
          if (fileInput) {
            if (fileInput.size > MAX_VIDEO_SIZE_BYTES) {
              setAnalysisError(
                'Video file exceeds 20MB limit. Please upload a clip under 20MB for inline forensic analysis.'
              );
              setIsAnalyzing(false);
              return;
            }

            const b64 = await readFileAsBase64(fileInput);
            result = await analyzeSuspiciousVideo(
              b64,
              fileInput.type || 'video/mp4',
              controller.signal
            );
            displayContent = `${fileInput.name} (Video Forensics Evidence)`;
          } else {
            result = await analyzeSuspiciousText(
              textInput.trim() || 'Video Forensics Evidence Analysis Request',
              controller.signal
            );
          }
        } else {
          const textToAnalyze = textInput.trim() || urlInput.trim();
          result = await analyzeSuspiciousText(textToAnalyze, controller.signal);
          displayContent = textToAnalyze;
        }

        processAnalysisResult(
          result,
          displayContent,
          typeInput as any,
          extraElaData
        );

        setCustomTextInput('');
        setCustomUrlInput('');
        setSelectedEvidenceFile(null);
        setLastFailedAnalysis(null);
      } catch (err: any) {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          return;
        }

        console.error('Error analyzing evidence:', err);

        const errorMsg =
          err?.message || 'Failed to analyze evidence with AI. Please try again.';

        setAnalysisError(errorMsg);
        setLastFailedAnalysis(currentAttemptContext);
      } finally {
        if (analysisAbortControllerRef.current === controller) {
          analysisAbortControllerRef.current = null;
          setIsAnalyzing(false);
        }
      }
    };

    // Retry the most recent failed or timed out evidence analysis
    const handleRetryAnalysis = () => {
      if (isAnalyzing || !lastFailedAnalysis) return;

      if (lastFailedAnalysis.source === 'direct-text') {
        handleAnalyzeTextMessage(undefined, lastFailedAnalysis.text);
      } else if (lastFailedAnalysis.source === 'custom-evidence') {
        handleAddCustomEvidence(undefined, {
          text: lastFailedAnalysis.text,
          url: lastFailedAnalysis.url,
          categoryType: lastFailedAnalysis.categoryType,
          file: lastFailedAnalysis.file
        });
      }
    };

    const handleExportReport = () => {
      const reportData = {
        incidentId: activeCase.id,
        title: activeCase.title,
        dateGenerated: new Date().toISOString(),
        status: activeCase.status,
        riskScore: activeCase.riskScore,
        riskLevel: activeCase.overallRisk,
        evidencePreserved: activeCase.evidence,
        incidentTimeline: activeCase.timeline,
        prescribedContainment: activeCase.actionPlan,
        synthesis: activeCase.synthesis,
        cryptographicSignature:
          `SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069`
      };

      const blob = new Blob(
        [JSON.stringify(reportData, null, 2)],
        { type: 'application/json' }
      );

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');

      a.href = url;

      a.download =
        `SafeGuard_Incident_${activeCase.id}_Preservation.json`;

      document.body.appendChild(a);

      a.click();

      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      setExportSuccessMessage(
        'Incident preservation report generated and downloaded with SHA-256 chain of custody hash.'
      );

      setTimeout(
        () => setExportSuccessMessage(null),
        4000
      );
    };

    // =========================================================
    // RENDER HELPERS FOR WORKSPACE VIEWS
    // =========================================================

    const renderTabNav = () => (
      <div className="flex w-full min-w-0 items-center gap-2 overflow-x-auto border-b border-white/[0.06] pb-2 scrollbar-thin">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('evidence')}
          className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
            activeTab === 'evidence'
              ? 'border border-[#5FC9E8]/30 bg-[#0D1116] text-[#E8ECEF] shadow-xs'
              : 'text-[#7A8794] hover:bg-white/[0.03] hover:text-[#E8ECEF]'
          }`}
        >
          <Layers className="h-4 w-4 text-[#5FC9E8]" />
          <span>Evidence Artifacts ({activeCase.evidence.length})</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('timeline')}
          className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
            activeTab === 'timeline'
              ? 'border border-[#5FC9E8]/30 bg-[#0D1116] text-[#E8ECEF] shadow-xs'
              : 'text-[#7A8794] hover:bg-white/[0.03] hover:text-[#E8ECEF]'
          }`}
        >
          <Clock className="h-4 w-4 text-[#5FC9E8]" />
          <span>Timeline ({activeCase.timeline.length})</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('actions')}
          className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
            activeTab === 'actions'
              ? 'border border-[#5FC9E8]/30 bg-[#0D1116] text-[#E8ECEF] shadow-xs'
              : 'text-[#7A8794] hover:bg-white/[0.03] hover:text-[#E8ECEF]'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-[#5FC9E8]" />
          <span>
            Action Checklist ({activeCase.actionPlan.filter((a) => a.isCompleted).length}/
            {activeCase.actionPlan.length})
          </span>
        </motion.button>
      </div>
    );

    const renderAnalyzer = () => (
      <div className="w-full min-w-0 space-y-4 rounded-3xl border border-white/[0.08] bg-[#0D1116]/80 p-4 shadow-lg shadow-black/40 sm:p-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#5FC9E8]/20 bg-[#5FC9E8]/10 text-[#5FC9E8]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3
                className="truncate text-sm font-semibold text-[#E8ECEF]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                AI Suspicious Message Analyzer
              </h3>
              <p className="truncate text-xs text-[#7A8794]">
                Paste any text, email, link, or message snippet
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, boxShadow: '0 0 16px rgba(95,201,232,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddEvidenceModal(true)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#5FC9E8] hover:bg-[#7be2fe] px-3.5 py-2 text-xs font-semibold text-[#0A0D10] shadow-xs transition-colors"
              style={{
                boxShadow: '0 4px 16px -4px rgba(95, 201, 232, 0.35)',
              }}
            >
              <PlusCircle className="h-3.5 w-3.5 text-[#0A0D10]" />
              <span>Add Evidence</span>
            </motion.button>

            <motion.button
              type="button"
              id="btn-analyze-suspicious-message-top"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAnalyzeTextMessage}
              disabled={isAnalyzing || !suspiciousMessageInput.trim()}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#5FC9E8]/40 bg-[#0D1116] px-4 py-2 text-xs font-semibold text-[#5FC9E8] transition-all hover:bg-[#5FC9E8]/10 hover:border-[#5FC9E8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#5FC9E8]" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[#5FC9E8]" />
                  <span>Analyse</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* ANALYZER FORM */}
        <form onSubmit={handleAnalyzeTextMessage} className="min-w-0 space-y-3">
          <textarea
            id="ai-analyzer-textarea"
            rows={3}
            value={suspiciousMessageInput}
            onChange={(e) => setSuspiciousMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAnalyzeTextMessage();
              }
            }}
            placeholder="e.g. 'URGENT: Your payroll direct deposit failed. Verify your employee account immediately at https://payroll-update-secure.com/auth' or paste email headers..."
            className="w-full min-w-0 resize-y rounded-2xl border border-white/[0.08] bg-[#06080B]/90 p-3.5 text-xs text-[#E8ECEF] placeholder-[#4A5560] focus:border-[#5FC9E8]/60 focus:outline-none focus:ring-1 focus:ring-[#5FC9E8]/40 font-mono transition-colors leading-relaxed"
          />

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-[#4A5560] shrink-0">Quick samples:</span>
              <button
                type="button"
                onClick={() =>
                  setSuspiciousMessageInput(
                    'HR Notice: Open enrollment closes in 2 hours. Review your benefit deductions: https://benefits-hr-portal.com/login?token=89274'
                  )
                }
                className="shrink-0 rounded-lg border border-white/[0.06] bg-[#06080B] px-2 py-1 text-[11px] font-mono text-[#7A8794] hover:text-[#5FC9E8] hover:border-[#5FC9E8]/30 transition-colors cursor-pointer"
              >
                Benefits HR Scam
              </button>
              <button
                type="button"
                onClick={() =>
                  setSuspiciousMessageInput(
                    'Bank Alert: New device logged into your savings account from St. Petersburg, FL. Not you? Tap: https://secure-bank-fraud-alert.net/auth'
                  )
                }
                className="shrink-0 rounded-lg border border-white/[0.06] bg-[#06080B] px-2 py-1 text-[11px] font-mono text-[#7A8794] hover:text-[#5FC9E8] hover:border-[#5FC9E8]/30 transition-colors cursor-pointer"
              >
                Bank Device Alert
              </button>
              <button
                type="button"
                onClick={() =>
                  setSuspiciousMessageInput(
                    'Mom please text this new number urgently, I lost my phone and wallet at the station: +1-917-555-0199'
                  )
                }
                className="shrink-0 rounded-lg border border-white/[0.06] bg-[#06080B] px-2 py-1 text-[11px] font-mono text-[#7A8794] hover:text-[#5FC9E8] hover:border-[#5FC9E8]/30 transition-colors cursor-pointer"
              >
                Family Distress
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {suspiciousMessageInput.trim() && (
                <button
                  type="button"
                  onClick={() => setSuspiciousMessageInput('')}
                  className="px-3 py-1.5 text-xs text-[#7A8794] hover:text-[#E8ECEF] transition-colors cursor-pointer font-mono"
                >
                  Clear
                </button>
              )}

              {/* SINGLE SOLID PRIMARY BUTTON ON SCREEN */}
              <motion.button
                type="submit"
                id="btn-analyze-suspicious-message"
                whileHover={{
                  scale: 1.03,
                  boxShadow: '0 8px 24px -6px rgba(95,201,232,0.5)'
                }}
                whileTap={{ scale: 0.97 }}
                disabled={isAnalyzing || !suspiciousMessageInput.trim()}
                className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[#5FC9E8] px-6 py-2.5 text-xs font-semibold text-[#0A0D10] shadow-[0_8px_24px_-6px_rgba(95,201,232,0.4)] transition-all hover:bg-[#7be2fe] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Analyse</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>

        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-w-0 space-y-4 pt-2"
          >
            <EvidenceCardSkeleton />
            <EvidenceCardSkeleton />
          </motion.div>
        )}

        {!isAnalyzing && analysisError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="min-w-0 rounded-2xl border border-[#D9705A]/30 bg-[#0D1116] p-4 text-[#E8ECEF] shadow-lg shadow-black/40 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#D9705A]/30 bg-[#D9705A]/10 text-[#D9705A]">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#D9705A]">
                    {analysisError.toLowerCase().includes('timed out') ? 'Analysis Timed Out' : 'Analysis Failed'}
                  </h4>
                  <p className="mt-0.5 text-xs text-[#7A8794] leading-relaxed">
                    {analysisError}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnalysisError(null)}
                className="shrink-0 p-1 text-[#7A8794] hover:text-[#E8ECEF] transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {lastFailedAnalysis && (
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.06]">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetryAnalysis}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#5FC9E8]/40 bg-[#5FC9E8]/10 px-4 py-1.5 text-xs font-semibold text-[#5FC9E8] transition-all hover:bg-[#5FC9E8]/20"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry Analysis</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    );

    const renderEvidenceSection = (isSimple: boolean) => {
      const isVisualEvidence = (type: string) => {
        const t = type.toLowerCase();
        return t === 'video' || t === 'screenshot' || t === 'image' || t === 'file';
      };

      const sortedEvidence = [...activeCase.evidence].sort((a, b) => {
        const aVisual = isVisualEvidence(a.type);
        const bVisual = isVisualEvidence(b.type);
        if (aVisual && !bVisual) return -1;
        if (!aVisual && bVisual) return 1;
        return b.riskScore - a.riskScore;
      });

      const initialCount = isSimple ? 1 : 2;
      const initialEvidence = sortedEvidence.slice(0, initialCount);
      const extraEvidence = sortedEvidence.slice(initialCount);
      const hiddenCount = extraEvidence.length;

      return (
        <div className="space-y-4">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 pt-2">
            <h3
              className="text-base font-semibold text-[#E8ECEF]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Ingested Digital Evidence
            </h3>

            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 16px rgba(95,201,232,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddEvidenceModal(true)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[#5FC9E8] hover:bg-[#7be2fe] px-3.5 py-1.5 text-xs font-semibold text-[#0A0D10] shadow-xs transition-colors"
              style={{
                boxShadow: '0 4px 16px -4px rgba(95, 201, 232, 0.35)',
              }}
            >
              <PlusCircle className="h-3.5 w-3.5 text-[#0A0D10]" />
              <span>Add Evidence</span>
            </motion.button>
          </div>

          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {initialEvidence.map((ev, idx) => (
                <div key={ev.id} id={`evidence-card-${ev.id}`} className="scroll-mt-24 transition-all duration-300">
                  <EvidenceCard
                    ev={ev}
                    idx={idx}
                    isExpanded={!!expandedEvidenceIds[ev.id]}
                    onToggleExpand={() => toggleEvidenceDetails(ev.id)}
                    isSimpleView={isSimple}
                  />
                </div>
              ))}

              {showAllEvidence && extraEvidence.length > 0 && (
                <motion.div
                  key="extra-evidence"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4 overflow-hidden"
                >
                  {extraEvidence.map((ev, idx) => (
                    <div key={ev.id} id={`evidence-card-${ev.id}`} className="scroll-mt-24 transition-all duration-300">
                      <EvidenceCard
                        ev={ev}
                        idx={idx + initialCount}
                        isExpanded={!!expandedEvidenceIds[ev.id]}
                        onToggleExpand={() => toggleEvidenceDetails(ev.id)}
                        isSimpleView={isSimple}
                      />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {hiddenCount > 0 && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  id="btn-toggle-show-all-evidence"
                  onClick={() => setShowAllEvidence((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5FC9E8] hover:text-[#7be2fe] transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-white/[0.04]"
                >
                  <span>
                    {showAllEvidence ? 'Show less' : `Show ${hiddenCount} more`}
                  </span>
                  {showAllEvidence ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderTimelineSection = () => (
      <div className="min-w-0 space-y-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[#E8ECEF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Incident Chronology & Reconstruction
          </h3>
          <span className="shrink-0 text-xs font-mono text-[#7A8794]">
            Automated Correlation
          </span>
        </div>

        <div
          className="w-full min-w-0 space-y-6 rounded-[20px] p-4 sm:p-6 shadow-lg"
          style={{
            background: 'rgba(13, 17, 22, 0.55)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {activeCase.timeline.map((event, idx) => {
            const isHighSeverity = event.severity === 'high' || event.severity === 'critical';
            const isMedSeverity = event.severity === 'medium';
            const dotColor = isHighSeverity ? '#D9705A' : isMedSeverity ? '#E0A458' : '#5FC9E8';

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="relative min-w-0 border-l-2 pb-6 pl-6 last:border-l-0 last:pb-0"
                style={{ borderColor: 'rgba(95, 201, 232, 0.2)' }}
              >
                <div
                  className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-[#06080B]"
                  style={{
                    backgroundColor: dotColor,
                    boxShadow: isHighSeverity ? '0 0 14px rgba(217, 112, 90, 0.65)' : 'none',
                  }}
                />
                <div className="flex min-w-0 flex-wrap items-center gap-2 pb-1">
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold font-mono"
                    style={{
                      backgroundColor: `${dotColor}18`,
                      color: dotColor,
                      border: `1px solid ${dotColor}33`,
                    }}
                  >
                    {event.timestamp}
                  </span>
                  <span className="shrink-0 rounded-md border border-white/[0.06] bg-[#06080B]/80 px-2 py-0.5 text-xs font-mono text-[#7A8794]">
                    Phase: {event.phase}
                  </span>
                </div>
                <h4 className="mt-1 break-words text-sm font-semibold text-[#E8ECEF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {event.title}
                </h4>
                <p className="mt-1 break-words text-xs leading-relaxed text-[#7A8794]">
                  {event.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    );

    const renderActionsSection = () => (
      <div className="min-w-0 space-y-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[#E8ECEF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Situation-Specific Recovery Actions
          </h3>
          <span className="shrink-0 text-xs font-mono text-[#7A8794]">
            Progress: {activeCase.actionPlan.filter((a) => a.isCompleted).length} / {activeCase.actionPlan.length} completed
          </span>
        </div>

        <div className="min-w-0 space-y-3">
          {activeCase.actionPlan.map((act, idx) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: 3 }}
              onClick={() => handleToggleAction(act.id)}
              className={`flex min-w-0 cursor-pointer items-start gap-3.5 rounded-3xl border p-4 transition-all ${
                act.isCompleted
                  ? 'border-[#5FC9E8]/30 bg-[#5FC9E8]/5'
                  : 'border-white/[0.06] bg-[#0D1116]/70 shadow-xs hover:border-white/[0.12]'
              }`}
            >
              <input
                type="checkbox"
                checked={act.isCompleted}
                onChange={() => { }}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded-md accent-[#5FC9E8]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider ${
                      act.priority === 'urgent'
                        ? 'border border-[#D9705A]/20 bg-[#D9705A]/10 text-[#D9705A]'
                        : act.priority === 'high'
                          ? 'border border-[#E0A458]/20 bg-[#E0A458]/10 text-[#E0A458]'
                          : 'border border-white/[0.08] bg-[#06080B] text-[#7A8794]'
                    }`}
                  >
                    {act.priority}
                  </span>
                  <span className="break-words text-xs font-mono text-[#7A8794]">
                    {act.category}
                  </span>
                </div>
                <h4
                  className={`mt-1 break-words text-sm font-semibold ${
                    act.isCompleted ? 'text-[#7A8794] line-through' : 'text-[#E8ECEF]'
                  }`}
                >
                  {act.title}
                </h4>
                <p className="mt-1 break-words text-xs leading-relaxed text-[#7A8794]">
                  {act.description}
                </p>
                {act.actionLinks && act.actionLinks.length > 0 ? (
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {act.actionLinks.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex max-w-full items-center gap-1.5 break-words text-xs font-semibold text-[#5FC9E8] hover:text-[#8ee1f9] transition-colors"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : act.actionTarget ? (
                  <a
                    href={act.actionTarget}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 inline-flex max-w-full items-center gap-1 break-words text-xs font-semibold text-[#5FC9E8] hover:text-[#8ee1f9]"
                  >
                    <span>Open Takedown Tool</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );

    const renderTechnicalDetailsSection = (isSimple: boolean) => (
      <div
        className={
          isSimple
            ? 'w-full min-w-0 rounded-2xl overflow-hidden shadow-lg border border-white/[0.08] bg-[#0D1116]/80'
            : ''
        }
      >
        <button
          type="button"
          id="btn-toggle-technical-details"
          onClick={() => setTechnicalOpen((prev) => !prev)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-xs font-semibold text-[#7A8794] hover:text-[#E8ECEF] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[#5FC9E8]" />
            <span>View technical details, chain of custody</span>
          </span>
          {technicalOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-[#5FC9E8]" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-[#5FC9E8]" />
          )}
        </button>

        <AnimatePresence>
          {technicalOpen && (
            <motion.div
              key="tech-details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
              onAnimationComplete={(definition) => {
                if (definition === 'animate') {
                  constellationRef.current?.remeasure();
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      setTimeout(() => {
                        constellationRef.current?.remeasure();
                      }, 80);
                    });
                  });
                }
              }}
            >
              <div
                className="px-5 pb-5 space-y-5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* FORENSIC ASSESSMENT DETAIL */}
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#4A5560]">
                      Forensic Assessment
                    </span>
                    <span
                      className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold font-mono"
                      style={{
                        backgroundColor:
                          activeCase.riskScore >= 75
                            ? 'rgba(217, 112, 90, 0.15)'
                            : activeCase.riskScore >= 50
                            ? 'rgba(224, 164, 88, 0.15)'
                            : 'rgba(95, 201, 232, 0.15)',
                        color:
                          activeCase.riskScore >= 75
                            ? '#D9705A'
                            : activeCase.riskScore >= 50
                            ? '#E0A458'
                            : '#5FC9E8',
                        border: `1px solid ${
                          activeCase.riskScore >= 75
                            ? 'rgba(217, 112, 90, 0.3)'
                            : activeCase.riskScore >= 50
                            ? 'rgba(224, 164, 88, 0.3)'
                            : 'rgba(95, 201, 232, 0.3)'
                        }`,
                      }}
                    >
                      {activeCase.overallRisk} RISK
                    </span>
                  </div>

                  {/* Gauge */}
                  <div className="flex flex-col items-center justify-center py-2">
                    <ThreatIndexGauge
                      score={activeCase.riskScore}
                      size={140}
                      radius={54}
                      strokeWidth={8}
                    />
                  </div>

                  {/* Full tactics list */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#4A5560] mb-2">
                      <span>Tactics Identified</span>
                      <span className="text-[#5FC9E8]">SIGNAL ANALYSIS</span>
                    </div>
                    {activeCase.synthesis.tacticsObserved.map((tactic, idx) => {
                      const isHigh = activeCase.riskScore >= 75;
                      const barColor = isHigh ? '#D9705A' : '#E0A458';
                      const TacticIcon = getTacticIcon(tactic);
                      return (
                        <div key={idx} className="flex items-center gap-3 py-1 min-w-0">
                          <div
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                            style={{ backgroundColor: `${barColor}18`, color: barColor }}
                          >
                            <TacticIcon className="h-3 w-3" />
                          </div>
                          <div className="h-1.5 w-7 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: isHigh ? '100%' : '70%',
                                backgroundColor: barColor,
                                boxShadow: `0 0 6px ${barColor}88`,
                              }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-[#E8ECEF] leading-snug break-words flex-1 min-w-0">
                            {getTacticPlainLanguage(tactic)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* IMPACT & ORIGIN READOUT */}
                <div
                  className="space-y-3 pt-4"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#4A5560]">
                    Impact &amp; Origin Readout
                  </div>
                  <div className="space-y-3 min-w-0">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#D9705A]/15 text-[#D9705A] mt-0.5">
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#7A8794]">
                          Potential Impact
                        </div>
                        <p className="mt-0.5 break-words font-sans text-xs leading-relaxed text-[#E8ECEF]">
                          {activeCase.synthesis.potentialImpact}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#5FC9E8]/15 text-[#5FC9E8] mt-0.5">
                        <Globe className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#7A8794]">
                          Infrastructure Origin
                        </div>
                        <p className="mt-0.5 break-words font-mono text-xs leading-relaxed text-[#5FC9E8]">
                          {activeCase.synthesis.originAssessment}
                        </p>
                      </div>
                    </div>
                    {activeCase.synthesis.recommendedLegalSteps && (
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[#7A8794] mt-0.5">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#7A8794]">
                            Legal Steps
                          </div>
                          <p className="mt-0.5 break-words font-sans text-xs leading-relaxed text-[#7A8794]">
                            {formatLegalSteps(activeCase.synthesis.recommendedLegalSteps)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* EVIDENCE CONSTELLATION */}
                <div
                  className="space-y-3 pt-4"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-[#5FC9E8]" />
                    <span
                      className="text-xs font-semibold text-[#E8ECEF]"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      Evidence Chain of Custody
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#7A8794]">
                    All evidence items, header hashes, and chronology records are preserved with
                    ISO timestamping for regulatory or police reporting.
                  </p>

                  <EvidenceConstellation
                    ref={constellationRef}
                    key={`constellation-${technicalOpen}-${activeCase.id}-${isSimple ? 'simple' : 'tech'}`}
                    evidence={activeCase.evidence}
                    caseTitle={activeCase.title}
                  />

                  {/* SHA-256 */}
                  <motion.div
                    initial={{ boxShadow: '0 0 0px rgba(95, 201, 232, 0)' }}
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(95, 201, 232, 0)',
                        '0 0 22px rgba(95, 201, 232, 0.6)',
                        '0 0 0px rgba(95, 201, 232, 0)',
                      ],
                    }}
                    transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
                    className="w-full min-w-0 rounded-xl border border-white/[0.08] bg-[#06080B]/90 p-3 flex items-center justify-between gap-2.5 text-[11px] font-mono text-[#7A8794] shadow-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <span className="text-[#5FC9E8] font-bold shrink-0">SHA256:</span>
                      <span className="truncate text-[#E8ECEF]">
                        7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
                        );
                        setHasCopiedHash(true);
                        setTimeout(() => setHasCopiedHash(false), 2000);
                      }}
                      title="Copy SHA-256 Hash"
                      className="shrink-0 p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#5FC9E8] transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                    >
                      {hasCopiedHash ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#5FC9E8]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#5FC9E8]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </motion.div>

                  {/* Outlined Download Preservation Packet button */}
                  <button
                    onClick={handleExportReport}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#5FC9E8]/40 bg-[#0D1116] hover:bg-[#5FC9E8]/10 hover:border-[#5FC9E8] py-3 text-xs font-semibold text-[#5FC9E8] transition-all duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Preservation Packet</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );

    const renderForensicSummaryPanel = () => {
      const isCritical = activeCase.riskScore >= 90;
      const isHigh = activeCase.riskScore >= 70;
      const bannerColor = isCritical ? '#D9705A' : isHigh ? '#E0A458' : '#5FC9E8';
      const bannerBg = isCritical
        ? 'rgba(217, 112, 90, 0.12)'
        : isHigh
        ? 'rgba(224, 164, 88, 0.10)'
        : 'rgba(95, 201, 232, 0.10)';
      const bannerBorder = isCritical
        ? 'rgba(217, 112, 90, 0.25)'
        : isHigh
        ? 'rgba(224, 164, 88, 0.22)'
        : 'rgba(95, 201, 232, 0.22)';
      const scoreColor = isCritical ? '#D9705A' : isHigh ? '#E0A458' : '#5FC9E8';

      return (
        <div
          className="w-full min-w-0 rounded-[20px] overflow-hidden shadow-lg"
          style={{
            background: 'rgba(13, 17, 22, 0.55)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* 1. PLAIN-ENGLISH VERDICT BANNER */}
          <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl px-4 py-3.5 flex items-start gap-3"
              style={{
                background: bannerBg,
                border: `1px solid ${bannerBorder}`,
              }}
            >
              <AlertTriangle className="shrink-0 mt-0.5 h-4 w-4" style={{ color: bannerColor }} />
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold leading-snug"
                  style={{ color: bannerColor, fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {getVerdictSentence(activeCase.category, activeCase.riskScore)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#7A8794]">
                  {getVerdictContext(activeCase.category, activeCase.synthesis.tacticsObserved)}
                </p>
              </div>
            </motion.div>
          </div>

          {/* 2. STAT CARDS */}
          <div
            className="grid grid-cols-2 gap-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="flex flex-col items-center justify-center py-5 px-4"
              style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-[38px] font-bold font-mono leading-none"
                style={{ color: scoreColor }}
              >
                {activeCase.riskScore}
              </motion.span>
              <span className="mt-1.5 text-[10px] font-mono uppercase tracking-wider text-[#4A5560]">
                risk score
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-5 px-4">
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="text-[38px] font-bold font-mono leading-none text-[#5FC9E8]"
              >
                {confidenceScore}%
              </motion.span>
              <span className="mt-1.5 text-[10px] font-mono uppercase tracking-wider text-[#4A5560]">
                AI confidence
              </span>
            </div>
          </div>

          {/* 3. CONDENSED KEY FINDINGS */}
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#4A5560]">
                Key Findings
              </span>
              <span className="text-[10px] font-mono text-[#7A8794]">
                {keyFindingsList.length} signals
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {keyFindingsList.map((item, idx) => {
                const isCritical = item.severity === 'critical';
                const isHigh = item.severity === 'high';
                const accentColor = isCritical ? '#D9705A' : isHigh ? '#E0A458' : '#5FC9E8';

                return (
                  <button
                    key={`sidebar-kf-${item.label}-${idx}`}
                    type="button"
                    onClick={() => scrollToEvidenceCard(item.evidenceId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.025] hover:border-[#5FC9E8]/40 hover:bg-[#5FC9E8]/10 text-[#E8ECEF] hover:text-[#5FC9E8] cursor-pointer transition-colors text-left group"
                    title={`Jump to full evidence card for ${item.label}`}
                  >
                    <span className="font-medium text-xs group-hover:underline underline-offset-2">
                      {item.label}
                    </span>
                    <span className="font-mono text-[11px] font-bold shrink-0" style={{ color: accentColor }}>
                      ({item.score} · {item.severity})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. TECHNICAL DETAILS TOGGLE */}
          {renderTechnicalDetailsSection(false)}
        </div>
      );
    };

    return (
      <div className="min-h-[100dvh] w-full overflow-x-hidden bg-transparent pb-20 font-sans text-[#E8ECEF]">

        {/* =========================================================
          TOP APP HEADER
      ========================================================= */}

        <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#06080B]/85 shadow-lg backdrop-blur-md">

          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12">

            <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">

              {/* LEFT SIDE */}

              <div className="flex min-w-0 items-center gap-4">

                <button
                  id="workspace-back-to-landing-btn"
                  onClick={() =>
                    onNavigate('landing')
                  }
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#0D1116] px-3.5 py-1.5 text-xs font-semibold text-[#E8ECEF] transition-colors hover:bg-white/[0.06]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Home</span>
                </button>

                <div className="hidden h-4 w-px bg-white/[0.06] sm:block" />

                <div className="flex min-w-0 items-center gap-2">

                  <span className="shrink-0 text-xs font-mono font-bold uppercase text-[#7A8794]">
                    CASE:
                  </span>

                  <span className="truncate text-xs font-bold text-[#E8ECEF] sm:max-w-xs md:max-w-md">
                    {activeCase.title}
                  </span>

                  <span className="hidden shrink-0 rounded-full border border-[#D9705A]/25 bg-[#D9705A]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#D9705A] md:inline">
                    {activeCase.overallRisk} RISK (
                    {activeCase.riskScore}/100)
                  </span>

                </div>

              </div>

              {/* TOP ACTION BAR */}

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-2.5">

                <motion.button
                  id="workspace-top-add-evidence-btn"
                  whileHover={{ scale: 1.04, boxShadow: '0 0 16px rgba(95,201,232,0.4)' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    setShowAddEvidenceModal(true)
                  }
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[#5FC9E8] hover:bg-[#7be2fe] px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-[#0A0D10] shadow-xs transition-colors"
                  style={{
                    boxShadow: '0 4px 16px -4px rgba(95, 201, 232, 0.4)',
                  }}
                >
                  <PlusCircle className="h-3.5 w-3.5 text-[#0A0D10]" />
                  <span>Add Evidence</span>
                </motion.button>

                <motion.button
                  id="workspace-top-analyse-btn"
                  whileHover={{
                    scale: 1.04,
                    boxShadow:
                      '0 0 16px rgba(95,201,232,0.3)'
                  }}
                  whileTap={{ scale: 0.96 }}
                  onClick={(e) => {
                    if (isAnalyzing) return;
                    if (
                      suspiciousMessageInput.trim()
                    ) {
                      handleAnalyzeTextMessage(e);
                    } else if (lastFailedAnalysis) {
                      handleRetryAnalysis();
                    } else {
                      setActiveTab('evidence');

                      setTimeout(() => {
                        document
                          .getElementById(
                            'ai-analyzer-textarea'
                          )
                          ?.focus();
                      }, 50);
                    }
                  }}
                  disabled={isAnalyzing}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#5FC9E8]/30 bg-[#0D1116] px-3 py-2 text-xs font-semibold text-[#E8ECEF] shadow-xs transition-colors hover:border-[#5FC9E8]/60 sm:px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#5FC9E8]" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-[#5FC9E8]" />
                      <span>Analyse</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  id="workspace-top-image-forensics-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('screenshot-analyzer')}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#0D1116] px-3 py-2 text-xs font-semibold text-white hover:text-white hover:border-white/[0.22] transition-colors"
                  title="Deep ELA & Image Manipulation Forensics"
                >
                  <FileCheck className="h-3.5 w-3.5 text-[#5FC9E8]" />
                  <span className="text-white">Image Forensics</span>
                </motion.button>

                <motion.button
                  id="workspace-top-export-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleExportReport}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#0D1116] px-3 py-2 text-xs font-semibold text-white hover:text-white hover:border-white/[0.22] transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-[#5FC9E8]" />
                  <span className="hidden md:inline text-white">
                    Export
                  </span>
                </motion.button>

              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
          INCIDENT OVERVIEW KINETIC HERO SECTION (Above Stage Tracker)
      ========================================================= */}

        <div className="border-b border-white/[0.06] bg-[#06080B]/60 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:px-12">
          <div className="mx-auto max-w-7xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 xl:gap-12">
            {/* Left Content Column */}
            <div className="flex-1 min-w-0">
              {/* Eyebrow label */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="mb-3"
              >
                <span className="font-mono text-xs font-semibold tracking-widest text-[#4A5560] uppercase">
                  01 — INCIDENT OVERVIEW
                </span>
              </motion.div>

              {/* Uppercase Kinetic Headline */}
              <h1
                key={`dash-h1-group-${activeCase.id}-${activeCase.title}`}
                className="font-display font-bold text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] text-[#E8ECEF] mb-4 tracking-tight leading-[1.15]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {/* Line 1 */}
                <span className="block overflow-visible whitespace-normal sm:whitespace-nowrap">
                  {headlineWords.line1.map((word, idx) => (
                    <React.Fragment key={`dash-h1-${activeCase.id}-${idx}-${word}`}>
                      <motion.span
                        initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{
                          duration: 0.55,
                          delay: 0.15 + idx * 0.07,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="inline-block mr-2 sm:mr-2.5"
                      >
                        {word}
                      </motion.span>
                      {' '}
                    </React.Fragment>
                  ))}
                </span>

                {/* Line 2 */}
                {headlineWords.line2 && headlineWords.line2.length > 0 && (
                  <span className="block overflow-visible whitespace-normal sm:whitespace-nowrap text-[#5FC9E8]">
                    {headlineWords.line2.map((word, idx) => (
                      <React.Fragment key={`dash-h2-${activeCase.id}-${idx}-${word}`}>
                        <motion.span
                          initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{
                            duration: 0.55,
                            delay: 0.15 + (headlineWords.line1.length + idx) * 0.07,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="inline-block mr-2 sm:mr-2.5"
                        >
                          {word}
                        </motion.span>
                        {' '}
                      </React.Fragment>
                    ))}
                  </span>
                )}
              </h1>

              {/* Three Short Stat Lines */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center gap-y-2 gap-x-6 sm:gap-x-8 mb-6 text-sm"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5FC9E8]" />
                  <span className="font-mono font-bold text-[#E8ECEF]">{activeCase.evidence.length}</span>
                  <span className="text-[#7A8794]">evidence artifacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5FC9E8]" />
                  <span className="font-mono text-[#E8ECEF]">{evidenceTypesDisplay}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5FC9E8]" />
                  <span className="text-[#7A8794]">Tamper-evident evidence chain</span>
                </div>
              </motion.div>

              {/* Two Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center gap-3.5"
              >
                <button
                  id="dashboard-hero-primary-cta"
                  onClick={() => {
                    setActiveTab('evidence');
                    setTimeout(() => {
                      document.getElementById('ai-analyzer-textarea')?.focus();
                    }, 50);
                  }}
                  className="cursor-pointer bg-[#5FC9E8] hover:bg-[#7be2fe] text-[#0A0D10] font-semibold px-6 py-3 rounded-full inline-flex items-center gap-2 text-sm transition-all duration-200"
                  style={{
                    boxShadow: '0 8px 30px -8px rgba(95, 201, 232, 0.5)',
                  }}
                >
                  <span>Open Investigation</span>
                  <ArrowRight className="w-4 h-4 text-[#0A0D10]" />
                </button>

                <button
                  id="dashboard-hero-secondary-cta"
                  onClick={handleExportReport}
                  className="cursor-pointer text-white hover:text-white font-semibold px-6 py-3 rounded-full inline-flex items-center gap-2 text-sm transition-all duration-200"
                  style={{
                    background: 'rgba(13, 17, 22, 0.55)',
                    backdropFilter: 'blur(18px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <Download className="w-4 h-4 text-[#5FC9E8]" />
                  <span className="text-white">Export Report</span>
                </button>
              </motion.div>
            </div>

            {/* Right Column: Evidence Constellation Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm sm:max-w-md lg:w-[260px] xl:w-[280px] shrink-0 self-center lg:self-auto"
            >
              <div className="mb-2">
                <span className="font-mono text-xs font-semibold tracking-wider text-[#7A8794] uppercase">
                  LIVE CASE GRAPH
                </span>
              </div>
              <div className="pointer-events-none select-none">
                <EvidenceConstellation
                  variant="preview"
                  evidence={activeCase.evidence}
                  caseTitle={activeCase.title}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* =========================================================
          5-STAGE TRACKER (LIFECYCLE BAR) WITH ACTIVE "YOU ARE HERE" STATE
      ========================================================= */}

        <div className="overflow-x-auto border-b border-white/[0.06] bg-[#06080B]/75 backdrop-blur-md px-4 py-3 text-[#7A8794] sm:px-6">

          <div className="mx-auto flex min-w-[700px] max-w-7xl items-center justify-between text-xs font-mono tracking-wider">

            {/* 01 DETECT (Completed) */}
            <div className="flex items-center gap-2 font-semibold text-[#E8ECEF]">
              <span className="h-2 w-2 rounded-full bg-[#5FC9E8] shadow-[0_0_8px_rgba(95,201,232,0.7)]" />
              <span>01 DETECT</span>
            </div>

            {/* Solid connecting line from completed stage 1 to active stage 2 */}
            <div className="h-[2px] w-12 sm:w-16 bg-[#5FC9E8] shrink-0 rounded-full" />

            {/* 02 CORRELATE (Active "You Are Here" State) */}
            <div className="flex items-center gap-2.5 font-bold text-[#5FC9E8] bg-[#5FC9E8]/10 border border-[#5FC9E8]/30 rounded-full px-3.5 py-1.5 shadow-[0_0_15px_rgba(95,201,232,0.2)]">
              <motion.span
                animate={{
                  scale: [1, 1.35, 1],
                  boxShadow: [
                    '0 0 0px rgba(95,201,232,0.4)',
                    '0 0 14px rgba(95,201,232,0.95)',
                    '0 0 0px rgba(95,201,232,0.4)',
                  ],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="h-2.5 w-2.5 rounded-full bg-[#5FC9E8]"
              />
              <span>02 CORRELATE</span>
            </div>

            {/* Dim / dashed connecting line to upcoming stages */}
            <div className="h-0 w-12 sm:w-16 border-t border-dashed border-white/[0.15] shrink-0" />

            {/* 03 PROTECT (Upcoming) */}
            <div className="flex items-center gap-2 font-medium text-[#7A8794]">
              <span className="h-2 w-2 rounded-full bg-[#4A5560]" />
              <span>03 PROTECT</span>
            </div>

            <div className="h-0 w-12 sm:w-16 border-t border-dashed border-white/[0.15] shrink-0" />

            {/* 04 PRESERVE (Upcoming) */}
            <div className="flex items-center gap-2 font-medium text-[#7A8794]">
              <span className="h-2 w-2 rounded-full bg-[#4A5560]" />
              <span>04 PRESERVE</span>
            </div>

            <div className="h-0 w-12 sm:w-16 border-t border-dashed border-white/[0.15] shrink-0" />

            {/* 05 RECOVER (Upcoming) */}
            <div className="flex items-center gap-2 font-medium text-[#7A8794]">
              <span className="h-2 w-2 rounded-full bg-[#4A5560]" />
              <span>05 RECOVER</span>
            </div>

          </div>
        </div>

        {/* =========================================================
          MAIN WORKSPACE
      ========================================================= */}

        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 xl:px-12">

          {/* SUCCESS TOAST */}

          <AnimatePresence>
            {analysisSuccess && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -12,
                  scale: 0.95
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                  scale: 0.95
                }}
                className="mb-6 flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[#5FC9E8]/30 bg-[#0D1116] p-4 text-xs font-medium text-[#E8ECEF] shadow-lg shadow-black/40 sm:text-sm"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Sparkles className="h-5 w-5 shrink-0 text-[#5FC9E8]" />
                  <span className="break-words">
                    {analysisSuccess}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() =>
                    setAnalysisSuccess(null)
                  }
                  className="shrink-0 cursor-pointer font-mono text-xs font-bold text-[#5FC9E8] hover:text-[#8ee1f9]"
                >
                  Dismiss
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ERROR TOAST */}

          <AnimatePresence>
            {analysisError && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -12,
                  scale: 0.95
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                  scale: 0.95
                }}
                className="mb-6 flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[#D9705A]/40 bg-[#0D1116] p-4 text-xs font-medium text-[#D9705A] shadow-lg shadow-black/40 sm:text-sm"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-[#D9705A]" />
                  <span className="break-words">
                    {analysisError}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {lastFailedAnalysis && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRetryAnalysis}
                      className="shrink-0 cursor-pointer font-mono text-xs font-bold text-[#5FC9E8] hover:text-[#8ee1f9] underline decoration-[#5FC9E8]/40"
                    >
                      Retry Analysis
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() =>
                      setAnalysisError(null)
                    }
                    className="shrink-0 cursor-pointer font-mono text-xs font-bold text-[#D9705A]/80 hover:text-[#D9705A]"
                  >
                    Dismiss
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* EXPORT TOAST */}

          <AnimatePresence>
            {exportSuccessMessage && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -12,
                  scale: 0.95
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                  scale: 0.95
                }}
                className="mb-6 flex min-w-0 items-center gap-2 rounded-2xl border border-[#5FC9E8]/30 bg-[#0D1116] p-4 text-xs font-medium text-[#E8ECEF] shadow-xs sm:text-sm"
              >
                <FileCheck className="h-5 w-5 shrink-0 text-[#5FC9E8]" />
                <span className="break-words">
                  {exportSuccessMessage}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* =========================================================
            SCENARIO SELECTOR
        ========================================================= */}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#0D1116]/80 p-4 shadow-xs">

            <div className="flex min-w-0 flex-wrap items-center gap-2">

              <span className="shrink-0 text-xs font-mono uppercase text-[#7A8794]">
                Preset Scenarios:
              </span>

              <div className="flex flex-wrap gap-2">

                {DEMO_INCIDENTS.map((demo) => (
                  <motion.button
                    key={demo.id}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setActiveCase(demo);
                      setAnalysisSuccess(null);
                      setAnalysisError(null);
                    }}
                    className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs transition-all ${activeCase.id === demo.id
                        ? 'bg-[#5FC9E8] font-bold text-[#0A0D10] shadow-[0_0_15px_rgba(95,201,232,0.3)]'
                        : 'border border-white/[0.08] bg-[#06080B] font-semibold text-[#7A8794] hover:bg-white/[0.04] hover:text-[#E8ECEF]'
                      }`}
                  >
                    {demo.category}
                  </motion.button>
                ))}

              </div>
            </div>

            {/* VIEW MODE */}

            <div className="flex shrink-0 flex-wrap items-center gap-3">

              <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#06080B] p-1">

                <motion.button
                  id="view-mode-simple-btn"
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setViewDetailMode('simple')
                  }
                  className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${viewDetailMode === 'simple'
                      ? 'border border-[#5FC9E8]/40 bg-[#5FC9E8]/15 text-[#5FC9E8] font-bold shadow-xs'
                      : 'text-[#7A8794] hover:text-[#E8ECEF]'
                    }`}
                >
                  Simple View
                </motion.button>

                <motion.button
                  id="view-mode-technical-btn"
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setViewDetailMode('technical')
                  }
                  className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${viewDetailMode === 'technical'
                      ? 'border border-[#5FC9E8]/40 bg-[#5FC9E8]/15 text-[#5FC9E8] font-bold shadow-xs'
                      : 'text-[#7A8794] hover:text-[#E8ECEF]'
                    }`}
                >
                  Technical View
                </motion.button>

              </div>

              <div className="hidden items-center gap-1.5 text-xs text-[#7A8794] font-mono sm:flex">
                <LiveStatusIndicator
                  size="sm"
                  status="active"
                />

                <span>
                  Status:{' '}
                  <span className="font-bold text-[#5FC9E8]">
                    {activeCase.status}
                  </span>{' '}
                  &bull; {activeCase.dateReported}
                </span>
              </div>

            </div>
          </div>

          {/* =========================================================
            MAIN WORKSPACE CONTENT (SIMPLE VIEW VS TECHNICAL VIEW)
        ========================================================= */}

          {viewDetailMode === 'simple' ? (
            /* =======================================================
               SIMPLE VIEW (Optimized for non-technical users)
            ======================================================= */
            <div className="min-w-0 space-y-6 max-w-4xl mx-auto">
              {/* Top: 3-Card Summary Strip (Risk Level, AI Confidence, Evidence Count) */}
              <div className="flex justify-center w-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-2xl">
                  {/* 1. Risk Level */}
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0D1116]/80 backdrop-blur-md p-5 text-center flex flex-col items-center justify-center shadow-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-3xl sm:text-4xl font-bold font-mono leading-none"
                        style={{
                          color:
                            activeCase.riskScore >= 75
                              ? '#D9705A'
                              : activeCase.riskScore >= 50
                              ? '#E0A458'
                              : '#5FC9E8',
                        }}
                      >
                        {activeCase.riskScore}
                      </span>
                      <span
                        className="text-xs font-mono uppercase font-bold px-2 py-0.5 rounded-md"
                        style={{
                          color:
                            activeCase.riskScore >= 75
                              ? '#D9705A'
                              : activeCase.riskScore >= 50
                              ? '#E0A458'
                              : '#5FC9E8',
                          backgroundColor:
                            activeCase.riskScore >= 75
                              ? 'rgba(217,112,90,0.15)'
                              : activeCase.riskScore >= 50
                              ? 'rgba(224,164,88,0.15)'
                              : 'rgba(95,201,232,0.15)',
                        }}
                      >
                        {activeCase.overallRisk}
                      </span>
                    </div>
                    <span className="mt-2 text-xs font-mono uppercase tracking-wider text-[#7A8794]">
                      Risk Level
                    </span>
                  </div>

                  {/* 2. AI Confidence */}
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0D1116]/80 backdrop-blur-md p-5 text-center flex flex-col items-center justify-center shadow-xs">
                    <span className="text-3xl sm:text-4xl font-bold font-mono leading-none text-[#5FC9E8]">
                      {confidenceScore}%
                    </span>
                    <span className="mt-2 text-xs font-mono uppercase tracking-wider text-[#7A8794]">
                      AI Confidence
                    </span>
                  </div>

                  {/* 3. Evidence Count */}
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0D1116]/80 backdrop-blur-md p-5 text-center flex flex-col items-center justify-center shadow-xs">
                    <span className="text-3xl sm:text-4xl font-bold font-mono leading-none text-[#E8ECEF]">
                      {activeCase.evidence.length}
                    </span>
                    <span className="mt-2 text-xs font-mono uppercase tracking-wider text-[#7A8794]">
                      Evidence Count
                    </span>
                  </div>
                </div>
              </div>

              {/* Plain-English Verdict Banner */}
              <div
                className="rounded-2xl border p-4 sm:p-5 flex items-start gap-3.5"
                style={{
                  background:
                    activeCase.riskScore >= 75
                      ? 'rgba(217, 112, 90, 0.10)'
                      : 'rgba(95, 201, 232, 0.10)',
                  borderColor:
                    activeCase.riskScore >= 75
                      ? 'rgba(217, 112, 90, 0.25)'
                      : 'rgba(95, 201, 232, 0.25)',
                }}
              >
                <AlertTriangle
                  className="shrink-0 mt-0.5 h-5 w-5"
                  style={{ color: activeCase.riskScore >= 75 ? '#D9705A' : '#5FC9E8' }}
                />
                <div className="min-w-0">
                  <p
                    className="text-sm sm:text-base font-semibold leading-snug"
                    style={{
                      color: activeCase.riskScore >= 75 ? '#D9705A' : '#5FC9E8',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {getVerdictSentence(activeCase.category, activeCase.riskScore)}
                  </p>
                  <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-[#7A8794]">
                    {getVerdictContext(activeCase.category, activeCase.synthesis.tacticsObserved)}
                  </p>
                </div>
              </div>

              {/* Condensed Key Findings element directly below verdict banner */}
              <div
                id="workspace-condensed-key-findings"
                className="rounded-2xl border border-white/[0.08] bg-[#0D1116]/80 px-4 py-3 text-xs leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-1.5 shadow-sm"
              >
                <span className="font-semibold text-[#5FC9E8] font-mono text-xs shrink-0 mr-1">
                  Key Findings:
                </span>
                {keyFindingsList.map((item, idx) => (
                  <React.Fragment key={`kf-${item.label}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => scrollToEvidenceCard(item.evidenceId)}
                      className="inline-flex items-center gap-1 text-[#E8ECEF] hover:text-[#5FC9E8] cursor-pointer transition-colors group text-left"
                      title={`Scroll to full evidence card for ${item.label}`}
                    >
                      <span className="font-medium group-hover:underline underline-offset-2">
                        {item.label}
                      </span>
                      <span className="font-mono text-[11px] text-[#7A8794] group-hover:text-[#5FC9E8]/80">
                        ({item.score} · {item.severity})
                      </span>
                    </button>
                    {idx < keyFindingsList.length - 1 && (
                      <span className="text-[#4A5560] select-none font-bold">·</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Tab Navigation */}
              {renderTabNav()}

              {/* Active Tab Content */}
              {activeTab === 'evidence' && (
                <div className="space-y-6">
                  {renderAnalyzer()}
                  {renderEvidenceSection(true)}
                  {renderTechnicalDetailsSection(true)}
                </div>
              )}
              {activeTab === 'timeline' && renderTimelineSection()}
              {activeTab === 'actions' && renderActionsSection()}
            </div>
          ) : (
            /* =======================================================
               TECHNICAL VIEW (Power-user 2-column layout)
            ======================================================= */
            <div className="grid min-w-0 grid-cols-1 gap-8 xl:grid-cols-12">
              <div className="min-w-0 space-y-6 xl:col-span-8">
                {renderTabNav()}
                {activeTab === 'evidence' && (
                  <div className="min-w-0 space-y-4">
                    {renderAnalyzer()}
                    {renderEvidenceSection(false)}
                  </div>
                )}
                {activeTab === 'timeline' && renderTimelineSection()}
                {activeTab === 'actions' && renderActionsSection()}
              </div>

              <div className="min-w-0 xl:col-span-4">
                {renderForensicSummaryPanel()}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
          ADD EVIDENCE MODAL
      ========================================================= */}

        {typeof document !== 'undefined' &&
          createPortal(
            <AnimatePresence>
              {showAddEvidenceModal && (
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                  style={{
                    position: 'fixed',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 100,
                  }}
                  onClick={(e) => {
                    if (
                      e.target === e.currentTarget
                    ) {
                      setShowAddEvidenceModal(false);
                    }
                  }}
                >
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.94,
                      y: 16
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.94,
                      y: 12
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 28
                    }}
                    className="w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 rounded-3xl border border-white/[0.08] bg-[#0D1116] p-5 text-[#E8ECEF] shadow-2xl sm:p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* MODAL HEADER */}

                    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-2">
                      <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        Add Suspicious Evidence
                      </h3>

                      <motion.button
                        whileHover={{
                          scale: 1.1,
                          color: '#ffffff'
                        }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setShowAddEvidenceModal(
                            false
                          )
                        }
                        className="shrink-0 cursor-pointer p-1 text-sm font-bold text-[#7A8794] hover:text-white"
                      >
                        ✕
                      </motion.button>
                    </div>

                    {/* FORM */}

                    <form
                      onSubmit={
                        handleAddCustomEvidence
                      }
                      className="min-w-0 space-y-4"
                    >
                      {/* ARTIFACT CATEGORY */}

                      <div>
                        <label className="mb-1.5 block text-xs font-mono uppercase text-[#7A8794]">
                          Artifact Category
                        </label>

                        <div className="flex flex-wrap gap-3 items-center">
                          {(
                            [
                              'message',
                              'url',
                              'screenshot',
                              'email',
                              'audio',
                              'video'
                            ] as const
                          ).map((type) => (
                            <motion.button
                              key={type}
                              type="button"
                              whileHover={{
                                scale: 1.04
                              }}
                              whileTap={{
                                scale: 0.96
                              }}
                              onClick={() =>
                                setCustomTypeInput(
                                  type
                                )
                              }
                              className={`cursor-pointer rounded-xl border px-3.5 py-1.5 text-xs font-semibold capitalize transition-all flex items-center justify-center gap-1.5 ${customTypeInput ===
                                  type
                                  ? 'border-[#5FC9E8] bg-[#5FC9E8] text-[#0A0D10] shadow-xs'
                                  : 'border-white/[0.08] bg-[#06080B] text-[#7A8794] hover:bg-white/[0.04] hover:text-[#E8ECEF]'
                                }`}
                            >
                              {type === 'video' && <Video className="w-3.5 h-3.5 shrink-0" />}
                              <span>{type}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* FILE UPLOAD */}

                      {(customTypeInput ===
                        'screenshot' ||
                        customTypeInput ===
                        'audio' ||
                        customTypeInput ===
                        'video') && (
                          <div>
                            <label className="mb-1.5 block text-xs font-mono uppercase text-[#7A8794]">
                              Upload{' '}
                              {customTypeInput ===
                                'screenshot'
                                ? 'Image / Screenshot'
                                : customTypeInput ===
                                  'audio'
                                ? 'Audio Recording'
                                : 'Video Recording (.mp4, .mov, .webm)'}
                            </label>

                            <input
                              type="file"
                              accept={
                                customTypeInput ===
                                  'screenshot'
                                  ? 'image/*'
                                  : customTypeInput ===
                                    'audio'
                                  ? 'audio/*'
                                  : 'video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm'
                              }
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file && customTypeInput === 'video' && file.size > MAX_VIDEO_SIZE_BYTES) {
                                  setAnalysisError('Video file exceeds 20MB limit. Please upload a clip under 20MB for inline forensic analysis.');
                                  setSelectedEvidenceFile(null);
                                  return;
                                }
                                setSelectedEvidenceFile(file);
                              }}
                              className="block w-full min-w-0 cursor-pointer rounded-2xl border border-white/[0.08] bg-[#06080B] px-3 py-2 text-xs font-mono text-[#7A8794] file:mr-3 file:rounded-xl file:border-0 file:bg-[#151B22] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#5FC9E8] hover:file:bg-[#1f2833]"
                            />
                            {customTypeInput === 'video' && (
                              <p className="mt-1 text-[11px] text-[#7A8794]">
                                Supports MP4, MOV, WEBM (Max 20MB for inline forensic deepfake detection)
                              </p>
                            )}
                          </div>
                        )}

                      {/* URL */}

                      <div>
                        <label className="mb-1.5 block text-xs font-mono uppercase text-[#7A8794]">
                          Suspicious URL / Link
                          (Optional)
                        </label>

                        <input
                          type="text"
                          value={customUrlInput}
                          onChange={(e) =>
                            setCustomUrlInput(
                              e.target.value
                            )
                          }
                          placeholder="https://auth-lookalike.xyz/login"
                          className="block w-full min-w-0 rounded-2xl border border-white/[0.08] bg-[#06080B] px-3.5 py-2 text-xs font-mono text-[#E8ECEF] placeholder-[#4A5560] focus:border-[#5FC9E8] focus:outline-hidden focus:ring-2 focus:ring-[#5FC9E8]/20"
                        />
                      </div>

                      {/* MESSAGE */}

                      <div>
                        <label className="mb-1.5 block text-xs font-mono uppercase text-[#7A8794]">
                          Message Text / Header /
                          Incident Description
                        </label>

                        <textarea
                          rows={4}
                          value={customTextInput}
                          onChange={(e) =>
                            setCustomTextInput(
                              e.target.value
                            )
                          }
                          placeholder="Paste the SMS, email text, warning prompt, or suspicious message here..."
                          className="block w-full min-w-0 resize-y rounded-2xl border border-white/[0.08] bg-[#06080B] px-3.5 py-2 text-xs font-sans text-[#E8ECEF] placeholder-[#4A5560] focus:border-[#5FC9E8] focus:outline-hidden focus:ring-2 focus:ring-[#5FC9E8]/20"
                        />
                      </div>

                      {/* MODAL ACTIONS */}

                      <div className="flex flex-wrap justify-end gap-2 pt-2">
                        <motion.button
                          type="button"
                          whileHover={{
                            scale: 1.02
                          }}
                          whileTap={{
                            scale: 0.98
                          }}
                          onClick={() =>
                            setShowAddEvidenceModal(
                              false
                            )
                          }
                          className="shrink-0 cursor-pointer rounded-full border border-white/[0.08] bg-[#06080B] px-4 py-2 text-xs font-semibold text-[#7A8794] hover:bg-white/[0.04] hover:text-[#E8ECEF]"
                        >
                          Cancel
                        </motion.button>

                        <motion.button
                          type="submit"
                          whileHover={{
                            scale: 1.03,
                            boxShadow:
                              '0 0 20px rgba(95,201,232,0.35)'
                          }}
                          whileTap={{
                            scale: 0.97
                          }}
                          disabled={isAnalyzing}
                          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[#5FC9E8] px-5 py-2 text-xs font-semibold text-[#0A0D10] shadow-xs transition-all hover:bg-[#7be2fe] disabled:opacity-50"
                        >
                          {isAnalyzing ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span>
                                Correlating...
                              </span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>
                                Ingest &amp; Analyze
                              </span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}
      </div>
    );
  };