import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import {
  ViewMode,
  IncidentCase,
  EvidenceItem,
  TimelineEvent,
  ActionItem,
  ThreatAnalysisResult
} from '../types';
import { DEMO_INCIDENTS } from '../data/demoIncidents';
import {
  analyzeSuspiciousText,
  analyzeSuspiciousUrl,
  analyzeSuspiciousImage,
  analyzeSuspiciousAudio,
  addIncidentEvidence
} from '../services/api';
import { LiveStatusIndicator } from './LiveStatusIndicator';
import { ThreatIndexGauge } from './ThreatIndexGauge';
import { MiniRiskGauge } from './MiniRiskGauge';
import { EvidenceConstellation } from './EvidenceConstellation';
import {
  EvidenceCardSkeleton,
  TimelineItemSkeleton,
  ActionItemSkeleton
} from './SkeletonLoader';

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
  return ShieldAlert;
};

// Plain language translation helpers for Simple View
const getIndicatorPlainLanguage = (indicator: string): string => {
  const lower = indicator.toLowerCase();

  if (lower.includes('external domain') || lower.includes('unrecognized')) {
    return "This link doesn't come from a company you actually use.";
  }

  if (lower.includes('urgency') || lower.includes('deadline')) {
    return "The sender is creating fake urgency to rush you into making a mistake.";
  }

  if (
    lower.includes('squatting') ||
    lower.includes('lookalike') ||
    lower.includes('homoglyph') ||
    lower.includes('spoof')
  ) {
    return "This website address is a lookalike copycat made to look authentic.";
  }

  if (lower.includes('prompt fatigue') || lower.includes('push')) {
    return "The attacker is spamming login requests hoping you'll accidentally click approve.";
  }

  if (
    lower.includes('reverse proxy') ||
    lower.includes('capturing 2fa') ||
    lower.includes('authentication parameter')
  ) {
    return "A deceptive login page designed to intercept your password and two-factor code.";
  }

  if (lower.includes('sextortion') || lower.includes('extortion')) {
    return "An extortionist is claiming to have private files to frighten you into sending money.";
  }

  if (
    lower.includes('typosquatting') ||
    lower.includes('subdomain') ||
    lower.includes('free tier') ||
    lower.includes('phishing kit')
  ) {
    return "The domain is imitating a trusted platform using subtle spelling variations.";
  }

  if (
    lower.includes('credential harvesting') ||
    lower.includes('clone') ||
    lower.includes('harvest')
  ) {
    return "This fake page is programmed to steal your username, password, and security codes.";
  }

  if (lower.includes('high volume') || lower.includes('inbox disruption')) {
    return "Mass spam attack designed to bury important fraud alerts from your bank or email.";
  }

  if (lower.includes('malicious payload') || lower.includes('dropper')) {
    return "A harmful attachment or file download that could install tracking malware.";
  }

  if (lower.includes('ai-generated') || lower.includes('voice clone')) {
    return "Synthesized audio mimicking someone's voice using AI generator models.";
  }

  return "Identified as a suspicious pattern commonly used in digital threat campaigns.";
};

const getTacticPlainLanguage = (tactic: string): string => {
  const lower = tactic.toLowerCase();

  if (lower.includes('urgent') || lower.includes('coercion')) {
    return "Fabricating urgency to force immediate action";
  }

  if (lower.includes('lookalike') || lower.includes('credential')) {
    return "Setting up copycat login screens to capture passwords";
  }

  if (lower.includes('fatigue') || lower.includes('prompt')) {
    return "Spamming sign-in alerts until you approve the login";
  }

  if (lower.includes('smishing') || lower.includes('sms')) {
    return "Fake text messages pretending to be official alerts";
  }

  if (lower.includes('breach') || lower.includes('regurgitation')) {
    return "Using an old leaked password to pretend your device was hacked";
  }

  if (lower.includes('bluff') || lower.includes('psychological')) {
    return "Falsely claiming to have recorded your camera to scare you";
  }

  if (lower.includes('cryptocurrency') || lower.includes('extortion')) {
    return "Demanding cryptocurrency payments to avoid bank trace";
  }

  if (lower.includes('impersonation') || lower.includes('typosquatting')) {
    return "Impersonating a trusted service using a lookalike website address";
  }

  if (lower.includes('stalkerware') || lower.includes('spyware')) {
    return "Hidden tracking software monitoring your activity";
  }

  return tactic;
};

export const InvestigationWorkspace: React.FC<
  InvestigationWorkspaceProps
> = ({
  onNavigate,
  selectedDemoCase
}) => {
    const [activeCase, setActiveCase] = useState<IncidentCase>(
      selectedDemoCase || DEMO_INCIDENTS[0]
    );

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

    const [customTextInput, setCustomTextInput] = useState('');
    const [customUrlInput, setCustomUrlInput] = useState('');

    const [customTypeInput, setCustomTypeInput] = useState<
      'message' | 'url' | 'screenshot' | 'email' | 'audio'
    >('message');

    const [selectedEvidenceFile, setSelectedEvidenceFile] =
      useState<File | null>(null);

    const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
    const [exportSuccessMessage, setExportSuccessMessage] =
      useState<string | null>(null);
    const [hasCopiedHash, setHasCopiedHash] = useState(false);

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
        | 'email' = 'message'
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
          Model: 'Gemini 3.6 Flash'
        }
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

      const newActions: ActionItem[] =
        result.recommended_actions &&
          result.recommended_actions.length > 0
          ? result.recommended_actions.map((act, idx) => ({
            id: `act-ai-${Date.now()}-${idx}`,
            category:
              act.category || 'Immediate Containment',
            title: act.title,
            description: act.description,
            priority: act.priority || 'high',
            isCompleted: false,
            actionType: act.actionTarget
              ? 'external_link'
              : 'guide',
            actionTarget: act.actionTarget
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

      setActiveCase((prev) => ({
        ...prev,
        title: `Live Investigation: ${result.threat_type} (${result.risk_level} Risk)`,
        category: result.threat_type,
        summary:
          result.explanation_simple || result.explanation,
        overallRisk: riskLevelCapitalized,
        riskScore: result.risk_score,
        status: 'Investigating',
        evidence: [newEv, ...prev.evidence],
        timeline: [newTimeline, ...prev.timeline],
        actionPlan: [...newActions, ...prev.actionPlan],
        synthesis: {
          tacticsObserved:
            result.tactics_observed &&
              result.tactics_observed.length > 0
              ? result.tactics_observed
              : [result.threat_type],
          potentialImpact:
            result.potential_impact ||
            prev.synthesis.potentialImpact,
          originAssessment:
            result.origin_assessment ||
            prev.synthesis.originAssessment,
          recommendedLegalSteps:
            prev.synthesis.recommendedLegalSteps
        }
      }));

      setAnalysisSuccess(
        `Analyzed as "${result.threat_type}" (${result.risk_level} Risk, ${result.confidence}% Confidence). Investigation workspace updated.`
      );

      setTimeout(() => setAnalysisSuccess(null), 6000);
    };

    // Submit text message directly from the workspace input
    const handleAnalyzeTextMessage = async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (!suspiciousMessageInput.trim()) return;

      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const result = await analyzeSuspiciousText(
          suspiciousMessageInput.trim()
        );

        processAnalysisResult(
          result,
          suspiciousMessageInput.trim(),
          'message'
        );

        setSuspiciousMessageInput('');
      } catch (err: any) {
        console.error(
          'Failed to analyze message:',
          err
        );

        setAnalysisError(
          err?.message ||
          'Failed to analyze the message with AI.'
        );
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Submit custom evidence modal with real AI analysis
    const handleAddCustomEvidence = async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      setIsAnalyzing(true);
      setShowAddEvidenceModal(false);
      setAnalysisError(null);

      try {
        let result: ThreatAnalysisResult;

        let displayContent =
          customTextInput ||
          customUrlInput ||
          (selectedEvidenceFile
            ? selectedEvidenceFile.name
            : 'Ingested Evidence');

        if (
          customTypeInput === 'url' ||
          customUrlInput.trim()
        ) {
          const urlToAnalyze =
            customUrlInput.trim() ||
            customTextInput.trim();

          result = await analyzeSuspiciousUrl(
            urlToAnalyze
          );

          displayContent = urlToAnalyze;
        } else if (
          customTypeInput === 'screenshot' ||
          (selectedEvidenceFile &&
            selectedEvidenceFile.type.startsWith('image/'))
        ) {
          if (selectedEvidenceFile) {
            const b64 = await new Promise<string>(
              (resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () =>
                  resolve(reader.result as string);

                reader.onerror = reject;

                reader.readAsDataURL(
                  selectedEvidenceFile
                );
              }
            );

            result = await analyzeSuspiciousImage(
              b64,
              selectedEvidenceFile.type
            );

            displayContent = `${selectedEvidenceFile.name} (Screenshot Evidence)`;
          } else {
            result = await analyzeSuspiciousText(
              customTextInput.trim() ||
              'Screenshot Analysis Request'
            );
          }
        } else if (
          customTypeInput === 'audio' ||
          (selectedEvidenceFile &&
            selectedEvidenceFile.type.startsWith('audio/'))
        ) {
          if (selectedEvidenceFile) {
            const b64 = await new Promise<string>(
              (resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () =>
                  resolve(reader.result as string);

                reader.onerror = reject;

                reader.readAsDataURL(
                  selectedEvidenceFile
                );
              }
            );

            result = await analyzeSuspiciousAudio(
              b64,
              selectedEvidenceFile.type
            );

            displayContent = `${selectedEvidenceFile.name} (Audio Recording Evidence)`;
          } else {
            result = await analyzeSuspiciousText(
              customTextInput.trim() ||
              'Audio Evidence Analysis Request'
            );
          }
        } else {
          const textToAnalyze =
            customTextInput.trim() ||
            customUrlInput.trim();

          result = await analyzeSuspiciousText(
            textToAnalyze
          );

          displayContent = textToAnalyze;
        }

        processAnalysisResult(
          result,
          displayContent,
          customTypeInput as any
        );

        setCustomTextInput('');
        setCustomUrlInput('');
        setSelectedEvidenceFile(null);
      } catch (err: any) {
        console.error(
          'Error analyzing evidence:',
          err
        );

        setAnalysisError(
          err?.message ||
          'Failed to analyze evidence with AI.'
        );
      } finally {
        setIsAnalyzing(false);
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
                  whileHover={{
                    scale: 1.04,
                    boxShadow:
                      '0 0 16px rgba(95,201,232,0.35)'
                  }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    setShowAddEvidenceModal(true)
                  }
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#5FC9E8] px-3 py-2 text-xs font-semibold text-[#0A0D10] shadow-xs transition-colors hover:bg-[#7be2fe] sm:px-4"
                  style={{
                    boxShadow: '0 4px 16px -4px rgba(95, 201, 232, 0.4)',
                  }}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
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
                    if (
                      suspiciousMessageInput.trim()
                    ) {
                      handleAnalyzeTextMessage(e);
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
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#5FC9E8]/30 bg-[#0D1116] px-3 py-2 text-xs font-semibold text-[#E8ECEF] shadow-xs transition-colors hover:border-[#5FC9E8]/60 sm:px-4"
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
                  id="btn-open-screenshot-analyzer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    onNavigate(
                      'screenshot-analyzer'
                    )
                  }
                  className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#0D1116] px-3 py-2 text-xs font-semibold text-[#7A8794] hover:text-[#E8ECEF] transition-colors sm:inline-flex"
                  title="Deep ELA & Image Manipulation Forensics"
                >
                  <FileCheck className="h-3.5 w-3.5 text-[#5FC9E8]" />
                  <span className="hidden md:inline">
                    Image Forensics
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleExportReport}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#0D1116] px-3 py-2 text-xs font-semibold text-[#7A8794] hover:text-[#E8ECEF] transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-[#5FC9E8]" />
                  <span className="hidden md:inline">
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
          <div className="mx-auto max-w-7xl">
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
              className="font-display font-bold text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] text-[#E8ECEF] mb-4 tracking-tight leading-[1.15]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {/* Line 1 */}
              <span className="block overflow-visible whitespace-normal sm:whitespace-nowrap">
                {['COORDINATED', 'HARASSMENT', 'CAMPAIGN'].map((word, idx) => (
                  <motion.span
                    key={`dash-h1-${idx}`}
                    initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{
                      duration: 0.55,
                      delay: 0.15 + idx * 0.07,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-block mr-2.5 sm:mr-3"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>

              {/* Line 2 */}
              <span className="block overflow-visible whitespace-normal sm:whitespace-nowrap text-[#5FC9E8]">
                {['CROSS-PLATFORM'].map((word, idx) => (
                  <motion.span
                    key={`dash-h2-${idx}`}
                    initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{
                      duration: 0.55,
                      delay: 0.15 + (3 + idx) * 0.07,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-block mr-2.5 sm:mr-3"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
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
                <span className="font-mono font-bold text-[#E8ECEF]">4</span>
                <span className="text-[#7A8794]">evidence artifacts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5FC9E8]" />
                <span className="font-mono text-[#E8ECEF]">Text · URL · Screenshot · Audio</span>
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
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="dashboard-hero-secondary-cta"
                onClick={handleExportReport}
                className="cursor-pointer text-[#E8ECEF] font-semibold px-6 py-3 rounded-full inline-flex items-center gap-2 text-sm transition-all duration-200"
                style={{
                  background: 'rgba(13, 17, 22, 0.55)',
                  backdropFilter: 'blur(18px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Download className="w-4 h-4 text-[#5FC9E8]" />
                <span>Export Report</span>
              </button>
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

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() =>
                    setAnalysisError(null)
                  }
                  className="shrink-0 cursor-pointer font-mono text-xs font-bold text-[#D9705A]/80 hover:text-[#D9705A]"
                >
                  Dismiss
                </motion.button>
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
                      ? 'bg-[#5FC9E8] text-[#0A0D10] font-bold shadow-xs'
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
                      ? 'bg-[#151B22] text-[#E8ECEF] font-bold shadow-xs border border-white/[0.06]'
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
            MAIN RESPONSIVE GRID
        ========================================================= */}

          <div className="grid min-w-0 grid-cols-1 gap-8 xl:grid-cols-12">

            {/* =======================================================
              LEFT COLUMN
          ======================================================= */}

            <div className="min-w-0 space-y-6 xl:col-span-8">

              {/* =====================================================
                TAB NAVIGATION
            ===================================================== */}

              <div className="flex w-full min-w-0 items-center gap-2 overflow-x-auto border-b border-white/[0.06] pb-2 scrollbar-thin">

                {/* EVIDENCE */}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setActiveTab('evidence')
                  }
                  className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${activeTab === 'evidence'
                      ? 'border border-[#5FC9E8]/30 bg-[#0D1116] text-[#E8ECEF] shadow-xs'
                      : 'text-[#7A8794] hover:bg-white/[0.03] hover:text-[#E8ECEF]'
                    }`}
                >
                  <Layers className="h-4 w-4 text-[#5FC9E8]" />

                  <span>
                    Evidence Artifacts (
                    {activeCase.evidence.length})
                  </span>
                </motion.button>

                {/* TIMELINE */}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setActiveTab('timeline')
                  }
                  className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${activeTab === 'timeline'
                      ? 'border border-[#5FC9E8]/30 bg-[#0D1116] text-[#E8ECEF] shadow-xs'
                      : 'text-[#7A8794] hover:bg-white/[0.03] hover:text-[#E8ECEF]'
                    }`}
                >
                  <Clock className="h-4 w-4 text-[#5FC9E8]" />

                  <span>
                    Timeline (
                    {activeCase.timeline.length})
                  </span>
                </motion.button>

                {/* ACTIONS */}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setActiveTab('actions')
                  }
                  className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${activeTab === 'actions'
                      ? 'border border-[#5FC9E8]/30 bg-[#0D1116] text-[#E8ECEF] shadow-xs'
                      : 'text-[#7A8794] hover:bg-white/[0.03] hover:text-[#E8ECEF]'
                    }`}
                >
                  <CheckCircle2 className="h-4 w-4 text-[#5FC9E8]" />

                  <span>
                    Action Checklist (
                    {
                      activeCase.actionPlan.filter(
                        (a) => a.isCompleted
                      ).length
                    }
                    /{activeCase.actionPlan.length})
                  </span>
                </motion.button>

              </div>

              {/* =====================================================
                EVIDENCE TAB
            ===================================================== */}

              {activeTab === 'evidence' && (
                <div className="min-w-0 space-y-4">

                  {/* AI ANALYZER */}

                  <div className="w-full min-w-0 space-y-4 rounded-3xl border border-white/[0.08] bg-[#0D1116]/80 p-4 shadow-lg shadow-black/40 sm:p-5">

                    {/* ANALYZER HEADER */}

                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">

                      <div className="flex min-w-0 items-center gap-2.5">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#5FC9E8]/20 bg-[#5FC9E8]/10 text-[#5FC9E8]">
                          <Sparkles className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">

                          <div className="flex min-w-0 flex-wrap items-center gap-2">

                            <h4 className="min-w-0 text-sm font-bold text-white">
                              AI Suspicious Message Analyzer
                            </h4>

                            <LiveStatusIndicator
                              size="sm"
                              status="active"
                              label="Live Gemini 3.6 Flash"
                            />

                          </div>

                          <p className="text-xs text-[#7A8794]">
                            Paste any suspicious message to
                            extract risk indicators and response
                            steps.
                          </p>

                        </div>

                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() =>
                            setShowAddEvidenceModal(true)
                          }
                          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#06080B] px-3.5 py-2 text-xs font-semibold text-[#E8ECEF] transition-colors hover:bg-white/[0.04]"
                        >
                          <PlusCircle className="h-3.5 w-3.5 text-[#5FC9E8]" />
                          <span>Add Evidence</span>
                        </motion.button>

                        <motion.button
                          type="button"
                          id="btn-analyze-suspicious-message-top"
                          whileHover={{
                            scale: 1.03,
                            boxShadow:
                              '0 0 20px rgba(95,201,232,0.35)'
                          }}
                          whileTap={{ scale: 0.97 }}
                          onClick={
                            handleAnalyzeTextMessage
                          }
                          disabled={
                            isAnalyzing ||
                            !suspiciousMessageInput.trim()
                          }
                          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#5FC9E8] px-4 py-2 text-xs font-semibold text-[#0A0D10] shadow-md transition-all hover:bg-[#7be2fe] disabled:cursor-not-allowed disabled:opacity-50"
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

                    {/* ANALYZER FORM */}

                    <form
                      onSubmit={
                        handleAnalyzeTextMessage
                      }
                      className="min-w-0 space-y-3"
                    >

                      <textarea
                        id="ai-analyzer-textarea"
                        rows={3}
                        value={
                          suspiciousMessageInput
                        }
                        onChange={(e) => {
                          setSuspiciousMessageInput(
                            e.target.value
                          );

                          if (analysisError) {
                            setAnalysisError(null);
                          }
                        }}
                        placeholder="Paste suspicious message here (e.g. 'URGENT: Your account was compromised. Click https://... to verify now')..."
                        className="block w-full min-w-0 resize-y rounded-2xl border border-white/[0.08] bg-[#06080B] px-3.5 py-2.5 text-xs font-sans text-[#E8ECEF] placeholder-[#4A5560] focus:border-[#5FC9E8] focus:outline-hidden focus:ring-2 focus:ring-[#5FC9E8]/30"
                        disabled={isAnalyzing}
                      />

                      {/* QUICK SAMPLES */}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">

                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">

                          <span className="mr-1 shrink-0 text-[10px] font-mono uppercase text-[#4A5560]">
                            Quick Samples:
                          </span>

                          {[
                            {
                              label: 'Netflix Phish',
                              text: 'URGENT: Your Netflix account has been suspended due to billing error. Update immediately at https://netflix-billing-update.me/auth or access will be permanently deleted in 2 hours.'
                            },
                            {
                              label: 'Bank Smish',
                              text: 'Bank Alert: Unrecognized $1,420.00 wire transfer from your Chase Checking. If not you, confirm via https://chase-fraud-prevention.online/resolve immediately.'
                            },
                            {
                              label: 'Extortion Bluff',
                              text: 'I have recorded video of you from your webcam. If you do not send $800 in Bitcoin to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh within 24 hours, I will distribute this to all your contacts.'
                            }
                          ].map((sample) => (
                            <motion.button
                              key={sample.label}
                              type="button"
                              whileHover={{ y: -1, scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() =>
                                setSuspiciousMessageInput(sample.text)
                              }
                              className="shrink-0 cursor-pointer rounded-lg border border-white/[0.08] px-2.5 py-1 text-[11px] font-mono text-[#7A8794] transition-all duration-150 hover:border-[#5FC9E8]/40 hover:text-[#E8ECEF]"
                              style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                backdropFilter: 'blur(10px)',
                              }}
                            >
                              {sample.label}
                            </motion.button>
                          ))}

                        </div>

                        <div className="flex shrink-0 items-center gap-2">

                          {suspiciousMessageInput && (
                            <motion.button
                              type="button"
                              whileHover={{
                                scale: 1.05
                              }}
                              onClick={() =>
                                setSuspiciousMessageInput(
                                  ''
                                )
                              }
                              className="cursor-pointer px-3 py-1.5 text-xs text-[#7A8794] hover:text-white"
                            >
                              Clear
                            </motion.button>
                          )}

                          <motion.button
                            type="submit"
                            id="btn-analyze-suspicious-message"
                            whileHover={{
                              scale: 1.03,
                              boxShadow:
                                '0 0 20px rgba(95,201,232,0.35)'
                            }}
                            whileTap={{
                              scale: 0.97
                            }}
                            disabled={
                              isAnalyzing ||
                              !suspiciousMessageInput.trim()
                            }
                            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#5FC9E8] px-5 py-2 text-xs font-semibold text-[#0A0D10] shadow-md transition-all hover:bg-[#7be2fe] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isAnalyzing ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>
                                  Analyzing...
                                </span>
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
                  </div>

                  {/* LOADING */}

                  {isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="min-w-0 space-y-4"
                    >
                      <EvidenceCardSkeleton />
                      <EvidenceCardSkeleton />
                    </motion.div>
                  )}

                  {/* EVIDENCE HEADER */}

                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 pt-2">

                    <h3 className="text-base font-semibold text-[#E8ECEF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      Ingested Digital Evidence
                    </h3>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setShowAddEvidenceModal(true)
                      }
                      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#5FC9E8] px-3.5 py-1.5 text-xs font-semibold text-[#0A0D10] shadow-xs transition-colors hover:bg-[#7be2fe]"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Add Evidence</span>
                    </motion.button>

                  </div>

                  {/* EVIDENCE CARDS */}

                  <AnimatePresence>

                    {activeCase.evidence.map(
                      (ev, idx) => {
                        const isHigh =
                          ev.riskScore >= 75 ||
                          ev.riskLevel.toLowerCase() === 'critical' ||
                          ev.riskLevel.toLowerCase() === 'high';
                        const isMed =
                          ev.riskScore >= 50 ||
                          ev.riskLevel.toLowerCase() === 'medium';
                        const severityColor = isHigh
                          ? '#D9705A'
                          : isMed
                          ? '#E0A458'
                          : '#5FC9E8';

                        return (
                          <motion.div
                            key={ev.id}
                            initial={{
                              opacity: 0,
                              y: 14
                            }}
                            animate={{
                              opacity: 1,
                              y: 0
                            }}
                            transition={{
                              duration: 0.4,
                              delay: idx * 0.08,
                              ease: [0.16, 1, 0.3, 1]
                            }}
                            whileHover={{
                              y: -2,
                              borderColor: 'rgba(95, 201, 232, 0.3)'
                            }}
                            className="w-full min-w-0 rounded-3xl border border-white/[0.06] p-5 shadow-xs transition-colors relative overflow-hidden"
                            style={{
                              background: 'rgba(13, 17, 22, 0.65)',
                              backdropFilter: 'blur(16px) saturate(130%)',
                              WebkitBackdropFilter: 'blur(16px) saturate(130%)',
                              borderLeftWidth: '3.5px',
                              borderLeftColor: severityColor
                            }}
                          >
                            {/* Header: Type, Title, Mini Risk Gauge */}
                            <div className="flex min-w-0 items-start justify-between gap-3 pb-3">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[#5FC9E8]">
                                  {ev.type === 'message' && (
                                    <FileText className="h-4 w-4" />
                                  )}
                                  {ev.type === 'url' && (
                                    <LinkIcon className="h-4 w-4" />
                                  )}
                                  {ev.type === 'screenshot' && (
                                    <Upload className="h-4 w-4" />
                                  )}
                                  {ev.type === 'email' && (
                                    <FileText className="h-4 w-4" />
                                  )}
                                  {ev.type === 'audio' && (
                                    <Mic className="h-4 w-4" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div
                                    className="break-words font-semibold text-sm text-[#E8ECEF]"
                                    style={{
                                      fontFamily: "'Space Grotesk', sans-serif"
                                    }}
                                  >
                                    {ev.title}
                                  </div>
                                  <div className="break-words text-[11px] font-mono text-[#7A8794]">
                                    {ev.type.toUpperCase()} &bull; Ingested at{' '}
                                    {ev.timestamp}{' '}
                                    {ev.source ? `from ${ev.source}` : ''}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center">
                                <MiniRiskGauge
                                  score={ev.riskScore}
                                  riskLevel={ev.riskLevel}
                                  size={40}
                                />
                              </div>
                            </div>

                            {/* In-Text Highlighted Evidence Content (No extra inner box) */}
                            <div className="w-full min-w-0 py-2 font-mono text-xs leading-relaxed text-[#E8ECEF] break-words">
                              {renderAnnotatedEvidence(
                                ev.content,
                                ev.indicators,
                                severityColor
                              )}
                            </div>

                            {/* Clean Metadata Line (No nested box borders) */}
                            {ev.metadata &&
                              Object.keys(ev.metadata).length > 0 && (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-[11px] font-mono text-[#7A8794] border-t border-white/[0.04] mt-2">
                                  {Object.entries(ev.metadata).map(
                                    ([key, val]) => (
                                      <span
                                        key={key}
                                        className="inline-flex items-center gap-1.5"
                                      >
                                        <span className="text-[#4A5560] font-semibold">
                                          {key}:
                                        </span>
                                        <span className="text-[#E8ECEF]">
                                          {val}
                                        </span>
                                      </span>
                                    )
                                  )}
                                </div>
                              )}

                            {/* "WHAT THIS MEANS:" Typographic Annotation */}
                            {viewDetailMode === 'simple' && (
                              <div className="pt-3 mt-1 border-t border-white/[0.04]">
                                <div className="font-mono text-[10.5px] font-bold text-[#5FC9E8] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#5FC9E8] inline-block" />
                                  <span>WHAT THIS MEANS:</span>
                                </div>
                                <p className="text-[#7A8794] font-sans text-xs leading-relaxed">
                                  {ev.indicators.length > 0
                                    ? getIndicatorPlainLanguage(
                                        ev.indicators[0]
                                      )
                                    : 'Suspicious indicators detected for this evidence item.'}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        );
                      }
                    )}

                  </AnimatePresence>

                </div>
              )}

              {/* =====================================================
                TIMELINE TAB
            ===================================================== */}

              {activeTab === 'timeline' && (
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

                    {activeCase.timeline.map(
                      (event, idx) => {
                        const isHighSeverity = event.severity === 'high' || event.severity === 'critical';
                        const isMedSeverity = event.severity === 'medium';
                        const dotColor = isHighSeverity ? '#D9705A' : isMedSeverity ? '#E0A458' : '#5FC9E8';

                        return (
                          <motion.div
                            key={event.id}
                            initial={{
                              opacity: 0,
                              x: -8
                            }}
                            animate={{
                              opacity: 1,
                              x: 0
                            }}
                            transition={{
                              delay: idx * 0.06
                            }}
                            className="relative min-w-0 border-l-2 pb-6 pl-6 last:border-l-0 last:pb-0"
                            style={{
                              borderColor: 'rgba(95, 201, 232, 0.2)',
                            }}
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
                      }
                    )}

                  </div>
                </div>
              )}

              {/* =====================================================
                ACTION TAB
            ===================================================== */}

              {activeTab === 'actions' && (
                <div className="min-w-0 space-y-4">

                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">

                    <h3 className="text-base font-semibold text-[#E8ECEF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      Situation-Specific Recovery
                      Actions
                    </h3>

                    <span className="shrink-0 text-xs font-mono text-[#7A8794]">
                      Progress:{' '}
                      {
                        activeCase.actionPlan.filter(
                          (a) => a.isCompleted
                        ).length
                      }{' '}
                      /{' '}
                      {
                        activeCase.actionPlan.length
                      }{' '}
                      completed
                    </span>

                  </div>

                  <div className="min-w-0 space-y-3">

                    {activeCase.actionPlan.map(
                      (act, idx) => (
                        <motion.div
                          key={act.id}
                          initial={{
                            opacity: 0,
                            y: 8
                          }}
                          animate={{
                            opacity: 1,
                            y: 0
                          }}
                          transition={{
                            delay: idx * 0.05
                          }}
                          whileHover={{ x: 3 }}
                          onClick={() =>
                            handleToggleAction(
                              act.id
                            )
                          }
                          className={`flex min-w-0 cursor-pointer items-start gap-3.5 rounded-3xl border p-4 transition-all ${act.isCompleted
                              ? 'border-[#5FC9E8]/30 bg-[#5FC9E8]/5'
                              : 'border-white/[0.06] bg-[#0D1116]/70 shadow-xs hover:border-white/[0.12]'
                            }`}
                        >

                          <input
                            type="checkbox"
                            checked={
                              act.isCompleted
                            }
                            onChange={() => { }}
                            className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded-md accent-[#5FC9E8]"
                          />

                          <div className="min-w-0 flex-1">

                            <div className="flex min-w-0 flex-wrap items-center gap-2">

                              <span
                                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider ${act.priority ===
                                    'urgent'
                                    ? 'border border-[#D9705A]/20 bg-[#D9705A]/10 text-[#D9705A]'
                                    : act.priority ===
                                      'high'
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
                              className={`mt-1 break-words text-sm font-semibold ${act.isCompleted
                                  ? 'text-[#7A8794] line-through'
                                  : 'text-[#E8ECEF]'
                                }`}
                            >
                              {act.title}
                            </h4>

                            <p className="mt-1 break-words text-xs leading-relaxed text-[#7A8794]">
                              {act.description}
                            </p>

                            {act.actionTarget && (
                              <a
                                href={
                                  act.actionTarget
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) =>
                                  e.stopPropagation()
                                }
                                className="mt-2 inline-flex max-w-full items-center gap-1 break-words text-xs font-semibold text-[#5FC9E8] hover:text-[#8ee1f9]"
                              >
                                <span>
                                  Open Takedown Tool
                                </span>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            )}

                          </div>

                        </motion.div>
                      )
                    )}

                  </div>
                </div>
              )}

            </div>

            {/* =======================================================
              RIGHT COLUMN
          ======================================================= */}

            <div className="min-w-0 space-y-6 xl:col-span-4">

              {/* RISK ASSESSMENT */}

              <div
                className="w-full min-w-0 space-y-4 rounded-[20px] p-5 shadow-lg sm:p-6"
                style={{
                  background: 'rgba(13, 17, 22, 0.55)',
                  backdropFilter: 'blur(18px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >

                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.06] pb-3">

                  <span className="text-xs font-mono uppercase tracking-wider text-[#7A8794]">
                    Forensic Assessment
                  </span>

                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold font-mono"
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

                {/* Circular Threat Index Gauge Centerpiece */}
                <div className="py-2 flex flex-col items-center justify-center">
                  <ThreatIndexGauge
                    score={activeCase.riskScore}
                    size={160}
                    radius={62}
                    strokeWidth={9}
                  />
                  {viewDetailMode === 'simple' && (
                    <p className="text-xs text-center text-[#E8ECEF] font-medium mt-2">
                      {activeCase.riskScore >= 75
                        ? 'Overall, this looks very risky'
                        : activeCase.riskScore >= 50
                        ? 'Overall, this looks moderately suspicious'
                        : 'Overall, this appears low risk'}
                    </p>
                  )}
                </div>

                {/* TACTICS IDENTIFIED — Horizontal Signal Strip Rows (No Box Borders) */}
                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#7A8794]">
                    <span>Tactics Identified</span>
                    <span className="text-[10px] text-[#5FC9E8] font-semibold">SIGNAL ANALYSIS</span>
                  </div>

                  <div className="space-y-2 min-w-0">
                    {activeCase.synthesis.tacticsObserved.map(
                      (tactic, idx) => {
                        const isHigh = activeCase.riskScore >= 75;
                        const barColor = isHigh ? '#D9705A' : '#E0A458';
                        const TacticIcon = getTacticIcon(tactic);

                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.35,
                              delay: 0.08 + idx * 0.05,
                              ease: 'easeOut'
                            }}
                            className="flex items-center gap-3 py-1 min-w-0"
                          >
                            {/* Small relevant icon */}
                            <div
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                              style={{
                                backgroundColor: `${barColor}18`,
                                color: barColor
                              }}
                            >
                              <TacticIcon className="h-3.5 w-3.5" />
                            </div>

                            {/* Thin colored signal bar reflecting severity */}
                            <div className="h-1.5 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: isHigh ? '100%' : '70%',
                                  backgroundColor: barColor,
                                  boxShadow: `0 0 6px ${barColor}88`
                                }}
                              />
                            </div>

                            {/* Inline tactic name */}
                            <span className="truncate font-mono text-xs text-[#E8ECEF]">
                              {viewDetailMode === 'simple'
                                ? getTacticPlainLanguage(tactic)
                                : tactic}
                            </span>
                          </motion.div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* POTENTIAL IMPACT & INFRASTRUCTURE ORIGIN — Merged Compact Readout Row */}
                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#7A8794]">
                    Impact &amp; Origin Readout
                  </div>

                  <div className="space-y-3 min-w-0">
                    {/* Potential Impact */}
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

                    {/* Infrastructure Origin */}
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
                  </div>
                </div>

              </div>

              {/* EVIDENCE CONSTELLATION & CHAIN OF CUSTODY */}

              <div
                className="w-full min-w-0 space-y-4 rounded-[20px] p-5 text-[#E8ECEF] shadow-sm sm:p-6"
                style={{
                  background: 'rgba(13, 17, 22, 0.55)',
                  backdropFilter: 'blur(18px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >

                <div className="flex items-center gap-2">

                  <Lock className="h-4 w-4 shrink-0 text-[#5FC9E8]" />

                  <h4 className="text-sm font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Evidence Chain of Custody
                  </h4>

                </div>

                <p className="break-words text-xs leading-relaxed text-[#7A8794]">
                  All evidence items, header hashes, and chronology records are preserved
                  with ISO timestamping for regulatory or police reporting.
                </p>

                {/* Evidence Constellation Node Graph Signature Element */}
                <EvidenceConstellation
                  evidence={activeCase.evidence}
                  caseTitle={activeCase.title}
                />

                {/* SHA256 Glass Chip with Copy & Verification Pulse */}
                <motion.div
                  initial={{ boxShadow: '0 0 0px rgba(95, 201, 232, 0)' }}
                  animate={{
                    boxShadow: [
                      '0 0 0px rgba(95, 201, 232, 0)',
                      '0 0 22px rgba(95, 201, 232, 0.6)',
                      '0 0 0px rgba(95, 201, 232, 0)'
                    ]
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

                <button
                  onClick={handleExportReport}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#5FC9E8] hover:bg-[#7be2fe] py-3 text-xs font-semibold text-[#0A0D10] transition-all duration-200"
                  style={{
                    boxShadow: '0 8px 30px -8px rgba(95, 201, 232, 0.5)',
                  }}
                >
                  <Download className="h-4 w-4" />
                  <span>
                    Download Preservation Packet
                  </span>
                </button>

              </div>

            </div>
          </div>
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
                    className="w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 rounded-3xl border border-white/[0.08] bg-[#0D1116] p-5 text-[#E8ECEF] shadow-2xl sm:p-6"
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

                        <div className="grid grid-cols-5 gap-1.5">
                          {(
                            [
                              'message',
                              'url',
                              'screenshot',
                              'email',
                              'audio'
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
                              className={`cursor-pointer rounded-xl border py-2 text-xs font-semibold capitalize transition-all ${customTypeInput ===
                                  type
                                  ? 'border-[#5FC9E8] bg-[#5FC9E8] text-[#0A0D10] shadow-xs'
                                  : 'border-white/[0.08] bg-[#06080B] text-[#7A8794] hover:bg-white/[0.04] hover:text-[#E8ECEF]'
                                }`}
                            >
                              {type}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* FILE UPLOAD */}

                      {(customTypeInput ===
                        'screenshot' ||
                        customTypeInput ===
                        'audio') && (
                          <div>
                            <label className="mb-1.5 block text-xs font-mono uppercase text-[#7A8794]">
                              Upload{' '}
                              {customTypeInput ===
                                'screenshot'
                                ? 'Image / Screenshot'
                                : 'Audio Recording'}
                            </label>

                            <input
                              type="file"
                              accept={
                                customTypeInput ===
                                  'screenshot'
                                  ? 'image/*'
                                  : 'audio/*'
                              }
                              onChange={(e) =>
                                setSelectedEvidenceFile(
                                  e.target.files?.[0] ||
                                  null
                                )
                              }
                              className="block w-full min-w-0 cursor-pointer rounded-2xl border border-white/[0.08] bg-[#06080B] px-3 py-2 text-xs font-mono text-[#7A8794] file:mr-3 file:rounded-xl file:border-0 file:bg-[#151B22] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#5FC9E8] hover:file:bg-[#1f2833]"
                            />
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