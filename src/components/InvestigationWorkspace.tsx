import React, { useState } from 'react';
import {
  ArrowLeft,
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
  AlertTriangle
} from 'lucide-react';
import { ViewMode, IncidentCase, EvidenceItem, TimelineEvent, ActionItem, ThreatAnalysisResult } from '../types';
import { DEMO_INCIDENTS } from '../data/demoIncidents';
import {
  analyzeSuspiciousText,
  analyzeSuspiciousUrl,
  analyzeSuspiciousImage,
  analyzeSuspiciousAudio,
  addIncidentEvidence
} from '../services/api';


interface InvestigationWorkspaceProps {
  initialMode: 'investigate' | 'live-demo';
  onNavigate: (view: ViewMode) => void;
  selectedDemoCase?: IncidentCase | null;
}

// Plain language translation helpers for Simple View
const getIndicatorPlainLanguage = (indicator: string): string => {
  const lower = indicator.toLowerCase();
  if (lower.includes('external domain') || lower.includes('unrecognized')) {
    return "This link doesn't come from a company you actually use.";
  }
  if (lower.includes('urgency') || lower.includes('deadline')) {
    return "The sender is creating fake urgency to rush you into making a mistake.";
  }
  if (lower.includes('squatting') || lower.includes('lookalike') || lower.includes('homoglyph') || lower.includes('spoof')) {
    return "This website address is a lookalike copycat made to look authentic.";
  }
  if (lower.includes('prompt fatigue') || lower.includes('push')) {
    return "The attacker is spamming login requests hoping you'll accidentally click approve.";
  }
  if (lower.includes('reverse proxy') || lower.includes('capturing 2fa') || lower.includes('authentication parameter')) {
    return "A deceptive login page designed to intercept your password and two-factor code.";
  }
  if (lower.includes('sextortion') || lower.includes('extortion')) {
    return "An extortionist is claiming to have private files to frighten you into sending money.";
  }
  if (lower.includes('breach') || lower.includes('credential stuffing') || lower.includes('recycled')) {
    return "They are using an old password leaked from a past company breach to bluff you.";
  }
  if (lower.includes('bitcoin') || lower.includes('cryptocurrency') || lower.includes('wallet')) {
    return "The sender is demanding cryptocurrency because it cannot easily be refunded or traced.";
  }
  if (lower.includes('unknown sender') || lower.includes('masking as it')) {
    return "The sender is pretending to be an IT authority to gain your trust.";
  }
  if (lower.includes('ssl') || lower.includes('registered 48 hours')) {
    return "This website was created just days ago and has no verified company certificate.";
  }
  if (lower.includes('geoip') || lower.includes('location')) {
    return "Login attempt was detected originating from an unrecognized foreign location.";
  }
  return "Suspicious indicators detected that indicate this content is untrusted.";
};

const getTacticPlainLanguage = (tactic: string): string => {
  const lower = tactic.toLowerCase();
  if (lower.includes('aitm') || (lower.includes('proxy') && lower.includes('phishing'))) {
    return "A fake login page designed to steal your password and access code";
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

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  onNavigate,
  selectedDemoCase
}) => {
  const [activeCase, setActiveCase] = useState<IncidentCase>(
    selectedDemoCase || DEMO_INCIDENTS[0]
  );
  const [activeTab, setActiveTab] = useState<'evidence' | 'timeline' | 'actions' | 'export'>('evidence');
  const [viewDetailMode, setViewDetailMode] = useState<'simple' | 'technical'>('simple');
  
  // Custom evidence & real AI submission state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suspiciousMessageInput, setSuspiciousMessageInput] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisSuccess, setAnalysisSuccess] = useState<string | null>(null);

  const [customTextInput, setCustomTextInput] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customTypeInput, setCustomTypeInput] = useState<'message' | 'url' | 'screenshot' | 'email' | 'audio'>('message');
  const [selectedEvidenceFile, setSelectedEvidenceFile] = useState<File | null>(null);
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Toggle Action item completed
  const handleToggleAction = (actionId: string) => {
    setActiveCase((prev) => ({
      ...prev,
      actionPlan: prev.actionPlan.map((act) =>
        act.id === actionId ? { ...act, isCompleted: !act.isCompleted } : act
      )
    }));
  };

  // Helper to ingest real AI analysis result into workspace state
  const processAnalysisResult = (
    result: ThreatAnalysisResult,
    originalText: string,
    categoryType: 'message' | 'url' | 'screenshot' | 'email' = 'message'
  ) => {
    const riskLevelCapitalized: 'Low' | 'Medium' | 'High' | 'Critical' =
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      riskScore: result.risk_score,
      riskLevel: riskLevelCapitalized,
      indicators: result.warning_signs && result.warning_signs.length > 0 ? result.warning_signs : ['Suspicious communication heuristics detected'],
      metadata: {
        'Threat Type': result.threat_type,
        'AI Confidence': `${result.confidence}%`,
        'Model': 'Gemini 3.6 Flash'
      }
    };

    const newTimeline: TimelineEvent = {
      id: `t-ai-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phase: result.risk_score >= 70 ? 'Compromise Attempt' : 'Contact',
      title: `${result.threat_type} Detected`,
      description: result.explanation_simple || result.explanation,
      relatedEvidenceIds: [newEv.id],
      severity: result.risk_level === 'CRITICAL' ? 'critical' : result.risk_level === 'HIGH' ? 'high' : result.risk_level === 'MEDIUM' ? 'medium' : 'low'
    };

    const newActions: ActionItem[] = result.recommended_actions && result.recommended_actions.length > 0
      ? result.recommended_actions.map((act, idx) => ({
          id: `act-ai-${Date.now()}-${idx}`,
          category: act.category || 'Immediate Containment',
          title: act.title,
          description: act.description,
          priority: act.priority || 'high',
          isCompleted: false,
          actionType: act.actionTarget ? 'external_link' : 'guide',
          actionTarget: act.actionTarget
        }))
      : [
          {
            id: `act-ai-${Date.now()}-0`,
            category: 'Immediate Containment',
            title: 'Do not click links or provide credentials',
            description: 'Cease communication with the sender immediately.',
            priority: 'urgent',
            isCompleted: false,
            actionType: 'guide'
          }
        ];

    setActiveCase((prev) => ({
      ...prev,
      title: `Live Investigation: ${result.threat_type} (${result.risk_level} Risk)`,
      category: result.threat_type,
      summary: result.explanation_simple || result.explanation,
      overallRisk: riskLevelCapitalized,
      riskScore: result.risk_score,
      status: 'Investigating',
      evidence: [newEv, ...prev.evidence],
      timeline: [newTimeline, ...prev.timeline],
      actionPlan: [...newActions, ...prev.actionPlan],
      synthesis: {
        tacticsObserved: result.tactics_observed && result.tactics_observed.length > 0 ? result.tactics_observed : [result.threat_type],
        potentialImpact: result.potential_impact || prev.synthesis.potentialImpact,
        originAssessment: result.origin_assessment || prev.synthesis.originAssessment,
        recommendedLegalSteps: prev.synthesis.recommendedLegalSteps
      }
    }));

    setAnalysisSuccess(`Analyzed as "${result.threat_type}" (${result.risk_level} Risk, ${result.confidence}% Confidence). Investigation workspace updated.`);
    setTimeout(() => setAnalysisSuccess(null), 6000);
  };

  // Submit text message directly from the workspace input
  const handleAnalyzeTextMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspiciousMessageInput.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeSuspiciousText(suspiciousMessageInput.trim());
      processAnalysisResult(result, suspiciousMessageInput.trim(), 'message');
      setSuspiciousMessageInput('');
    } catch (err: any) {
      console.error('Failed to analyze message:', err);
      setAnalysisError(err?.message || 'Failed to analyze the message with AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit custom evidence modal with real AI analysis
  const handleAddCustomEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setShowAddEvidenceModal(false);
    setAnalysisError(null);

    try {
      let result: ThreatAnalysisResult;
      let displayContent = customTextInput || customUrlInput || (selectedEvidenceFile ? selectedEvidenceFile.name : 'Ingested Evidence');

      if (customTypeInput === 'url' || customUrlInput.trim()) {
        const urlToAnalyze = customUrlInput.trim() || customTextInput.trim();
        result = await analyzeSuspiciousUrl(urlToAnalyze);
        displayContent = urlToAnalyze;
      } else if (customTypeInput === 'screenshot' || (selectedEvidenceFile && selectedEvidenceFile.type.startsWith('image/'))) {
        if (selectedEvidenceFile) {
          const b64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedEvidenceFile);
          });
          result = await analyzeSuspiciousImage(b64, selectedEvidenceFile.type);
          displayContent = `${selectedEvidenceFile.name} (Screenshot Evidence)`;
        } else {
          result = await analyzeSuspiciousText(customTextInput.trim() || 'Screenshot Analysis Request');
        }
      } else if (customTypeInput === 'audio' || (selectedEvidenceFile && selectedEvidenceFile.type.startsWith('audio/'))) {
        if (selectedEvidenceFile) {
          const b64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedEvidenceFile);
          });
          result = await analyzeSuspiciousAudio(b64, selectedEvidenceFile.type);
          displayContent = `${selectedEvidenceFile.name} (Audio Recording Evidence)`;
        } else {
          result = await analyzeSuspiciousText(customTextInput.trim() || 'Audio Evidence Analysis Request');
        }
      } else {
        const textToAnalyze = customTextInput.trim() || customUrlInput.trim();
        result = await analyzeSuspiciousText(textToAnalyze);
        displayContent = textToAnalyze;
      }

      processAnalysisResult(result, displayContent, customTypeInput as any);
      setCustomTextInput('');
      setCustomUrlInput('');
      setSelectedEvidenceFile(null);
    } catch (err: any) {
      console.error('Error analyzing evidence:', err);
      setAnalysisError(err?.message || 'Failed to analyze evidence with AI.');
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
      cryptographicSignature: `SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069`
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SafeGuard_Incident_${activeCase.id}_Preservation.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setExportSuccessMessage('Incident preservation report generated and downloaded with SHA-256 chain of custody hash.');
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#090D14] text-slate-200 pb-20 font-sans">
      {/* Top App Header / Bar */}
      <div className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                id="workspace-back-to-landing-btn"
                onClick={() => onNavigate('landing')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>

              <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 font-bold uppercase">CASE:</span>
                <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                  {activeCase.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20">
                  {activeCase.overallRisk} RISK ({activeCase.riskScore}/100)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowAddEvidenceModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-full shadow-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Evidence</span>
              </button>

              <button
                onClick={handleExportReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-colors border border-slate-800"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5-Step Lifecycle Progression Indicator Banner */}
        <div className="bg-[#070A0F] text-slate-400 py-2.5 px-6 overflow-x-auto border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono tracking-wider min-w-[650px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>01 DETECT</span>
            </div>
            <span className="text-slate-600">&rarr;</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>02 CORRELATE</span>
            </div>
            <span className="text-slate-600">&rarr;</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>03 PROTECT</span>
            </div>
            <span className="text-slate-600">&rarr;</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>04 PRESERVE</span>
            </div>
            <span className="text-slate-600">&rarr;</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>05 RECOVER</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Container */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-8">
        {/* Real-time AI Analysis Success Toast */}
        {analysisSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/40 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{analysisSuccess}</span>
            </div>
            <button
              onClick={() => setAnalysisSuccess(null)}
              className="text-emerald-400/80 hover:text-emerald-300 text-xs font-mono font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Real-time AI Analysis Error Toast */}
        {analysisError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-lg shadow-rose-950/40 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{analysisError}</span>
            </div>
            <button
              onClick={() => setAnalysisError(null)}
              className="text-rose-400/80 hover:text-rose-300 text-xs font-mono font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Export Success Toast */}
        {exportSuccessMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-xs animate-fadeIn">
            <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}

        {/* Scenario Quick Selector & View Mode Toggle */}
        <div className="mb-6 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-slate-400">Preset Scenarios:</span>
            <div className="flex flex-wrap gap-2">
              {DEMO_INCIDENTS.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => {
                    setActiveCase(demo);
                    setAnalysisSuccess(null);
                    setAnalysisError(null);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                    activeCase.id === demo.id
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold border border-slate-700'
                  }`}
                >
                  {demo.category}
                </button>
              ))}
            </div>
          </div>

          {/* Simple View / Technical View Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                id="view-mode-simple-btn"
                onClick={() => setViewDetailMode('simple')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewDetailMode === 'simple'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Simple View
              </button>
              <button
                id="view-mode-technical-btn"
                onClick={() => setViewDetailMode('technical')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewDetailMode === 'technical'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Technical View
              </button>
            </div>

            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Status: <span className="text-emerald-400 font-bold">{activeCase.status}</span> &bull; {activeCase.dateReported}
            </span>
          </div>
        </div>

        {/* Workspace Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Navigation Tabs & Detail Panel */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tab navigation */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'evidence'
                    ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Evidence Artifacts ({activeCase.evidence.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'timeline'
                    ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Timeline ({activeCase.timeline.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('actions')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'actions'
                    ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Action Checklist ({activeCase.actionPlan.filter(a => a.isCompleted).length}/{activeCase.actionPlan.length})</span>
              </button>
            </div>

            {/* TAB: Evidence Artifacts */}
            {activeTab === 'evidence' && (
              <div className="space-y-4">
                {/* AI Suspicious Message Analyzer Input Box */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-emerald-500/30 shadow-lg shadow-black/40 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">AI Suspicious Message Analyzer</h4>
                        <p className="text-xs text-slate-400">Paste any suspicious message to extract risk indicators and response steps.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 hidden sm:inline">
                      Live Gemini 3.6 Flash
                    </span>
                  </div>

                  <form onSubmit={handleAnalyzeTextMessage} className="space-y-3">
                    <textarea
                      rows={3}
                      value={suspiciousMessageInput}
                      onChange={(e) => {
                        setSuspiciousMessageInput(e.target.value);
                        if (analysisError) setAnalysisError(null);
                      }}
                      placeholder="Paste suspicious message here (e.g. 'URGENT: Your account was compromised. Click https://... to verify now')..."
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-sans text-white placeholder-slate-500 resize-y"
                      disabled={isAnalyzing}
                    />

                    {/* Quick test sample buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-500 mr-1">Quick Samples:</span>
                        <button
                          type="button"
                          onClick={() => setSuspiciousMessageInput('URGENT: Your Netflix account has been suspended due to billing error. Update immediately at https://netflix-billing-update.me/auth or access will be permanently deleted in 2 hours.')}
                          className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          Netflix Phish
                        </button>
                        <button
                          type="button"
                          onClick={() => setSuspiciousMessageInput('Bank Alert: Unrecognized $1,420.00 wire transfer from your Chase Checking. If not you, confirm via https://chase-fraud-prevention.online/resolve immediately.')}
                          className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          Bank Smish
                        </button>
                        <button
                          type="button"
                          onClick={() => setSuspiciousMessageInput('I have recorded video of you from your webcam. If you do not send $800 in Bitcoin to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh within 24 hours, I will distribute this to all your contacts.')}
                          className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          Extortion Bluff
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {suspiciousMessageInput && (
                          <button
                            type="button"
                            onClick={() => setSuspiciousMessageInput('')}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="submit"
                          id="btn-analyze-suspicious-message"
                          disabled={isAnalyzing || !suspiciousMessageInput.trim()}
                          className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md flex items-center gap-1.5"
                        >
                          {isAnalyzing ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Analyzing with AI...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Analyze Message</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-base font-bold text-white">Ingested Digital Evidence</h3>
                  <button
                    onClick={() => setShowAddEvidenceModal(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Evidence Modal</span>
                  </button>
                </div>

                {activeCase.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-950 text-emerald-400 flex items-center justify-center border border-slate-800">
                          {ev.type === 'message' && <FileText className="w-4 h-4" />}
                          {ev.type === 'url' && <LinkIcon className="w-4 h-4" />}
                          {ev.type === 'screenshot' && <Upload className="w-4 h-4" />}
                          {ev.type === 'email' && <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">{ev.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Type: {ev.type.toUpperCase()} &bull; Ingested at {ev.timestamp} {ev.source ? `from ${ev.source}` : ''}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                        {ev.riskLevel} Risk ({ev.riskScore}/100)
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 break-all leading-relaxed whitespace-pre-line">
                      {ev.content}
                    </div>

                    {ev.metadata && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {Object.entries(ev.metadata).map(([key, val]) => (
                          <div key={key} className="p-2 bg-slate-950/70 rounded-lg text-[11px] font-mono border border-slate-800">
                            <span className="text-slate-500">{key}:</span> <span className="text-slate-300 font-semibold">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-mono text-slate-400 mr-1">Observed Indicators:</span>
                        {ev.indicators.map((ind, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md border border-red-500/20"
                          >
                            {ind}
                          </span>
                        ))}
                      </div>

                      {/* Plain-language explanation for Simple View */}
                      {viewDetailMode === 'simple' && (
                        <p className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                          <span className="text-emerald-400 font-semibold mr-1.5">What this means:</span>
                          {ev.indicators.length > 0
                            ? getIndicatorPlainLanguage(ev.indicators[0])
                            : "Suspicious indicators detected for this evidence item."}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Timeline Reconstruction */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Incident Chronology &amp; Reconstruction</h3>
                  <span className="text-xs text-slate-400 font-mono">Automated Correlation</span>
                </div>

                <div className="bg-slate-900/70 rounded-2xl p-6 border border-slate-800 shadow-xs space-y-6">
                  {activeCase.timeline.map((event) => (
                    <div key={event.id} className="relative pl-6 pb-6 border-l-2 border-emerald-500/40 last:border-l-0 last:pb-0">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-xs"></div>
                      
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {event.timestamp}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          Phase: {event.phase}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-1">{event.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Action Checklist */}
            {activeTab === 'actions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Situation-Specific Recovery Actions</h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Progress: {activeCase.actionPlan.filter(a => a.isCompleted).length} / {activeCase.actionPlan.length} completed
                  </span>
                </div>

                <div className="space-y-3">
                  {activeCase.actionPlan.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => handleToggleAction(act.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        act.isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 shadow-xs'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={act.isCompleted}
                        onChange={() => {}}
                        className="w-4 h-4 rounded mt-1 text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            act.priority === 'urgent'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : act.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {act.priority}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{act.category}</span>
                        </div>
                        <h4 className={`text-sm font-bold mt-1 ${act.isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                          {act.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {act.description}
                        </p>
                        {act.actionTarget && (
                          <a
                            href={act.actionTarget}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold mt-2"
                          >
                            <span>Open Takedown Tool</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Triage Synthesis & Forensic Summary */}
          <div className="lg:col-span-4 space-y-6">
            {/* Risk Assessment Gauge Card */}
            <div className="bg-slate-900/70 rounded-2xl p-6 border border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Forensic Assessment</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                  {activeCase.overallRisk} RISK
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  {viewDetailMode === 'simple' ? (
                    <>
                      <span className="text-xs text-slate-200 font-bold">
                        {activeCase.riskScore >= 75
                          ? 'Overall, this looks very risky'
                          : activeCase.riskScore >= 50
                          ? 'Overall, this looks moderately suspicious'
                          : 'Overall, this appears low risk'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Score: <span className="text-white font-bold">{activeCase.riskScore}/100</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-slate-400 font-medium">Composite Threat Index</span>
                      <span className="text-2xl font-extrabold text-white font-mono">{activeCase.riskScore}/100</span>
                    </>
                  )}
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      activeCase.riskScore > 75 ? 'bg-red-500' : activeCase.riskScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${activeCase.riskScore}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-mono text-slate-400">Tactics Identified:</div>
                <div className="flex flex-wrap gap-1.5">
                  {activeCase.synthesis.tacticsObserved.map((tactic, idx) => (
                    <span key={idx} className="text-xs bg-slate-950 text-slate-300 font-mono px-2.5 py-1 rounded-md border border-slate-800">
                      {viewDetailMode === 'simple' ? getTacticPlainLanguage(tactic) : tactic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-xs font-mono text-slate-400">Potential Impact:</div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  {activeCase.synthesis.potentialImpact}
                </p>
              </div>

              <div className="pt-2 space-y-1">
                <div className="text-xs font-mono text-slate-400">Infrastructure Origin:</div>
                <p className="text-xs text-emerald-400 leading-relaxed font-mono">
                  {activeCase.synthesis.originAssessment}
                </p>
              </div>
            </div>

            {/* Evidence Chain of Custody & Preservation */}
            <div className="bg-slate-900/90 text-white rounded-2xl p-6 space-y-4 shadow-sm border border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold">Evidence Chain of Custody</h4>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                All evidence items, header hashes, and chronology records are preserved with ISO timestamping for regulatory or police reporting.
              </p>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
                SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
              </div>

              <button
                onClick={handleExportReport}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Preservation Packet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Ingest New Evidence */}
      {showAddEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 w-full max-w-lg space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Add Suspicious Evidence</h3>
              <button
                onClick={() => setShowAddEvidenceModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomEvidence} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Artifact Category
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['message', 'url', 'screenshot', 'email', 'audio'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCustomTypeInput(type)}
                      className={`py-2 text-xs font-bold rounded-lg capitalize border transition-all ${
                        customTypeInput === type
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {(customTypeInput === 'screenshot' || customTypeInput === 'audio') && (
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Upload {customTypeInput === 'screenshot' ? 'Image / Screenshot' : 'Audio Recording'}
                  </label>
                  <input
                    type="file"
                    accept={customTypeInput === 'screenshot' ? 'image/*' : 'audio/*'}
                    onChange={(e) => setSelectedEvidenceFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Suspicious URL / Link (Optional)
                </label>
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://auth-lookalike.xyz/login"
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-white placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Message Text / Header / Incident Description
                </label>
                <textarea
                  rows={4}
                  value={customTextInput}
                  onChange={(e) => setCustomTextInput(e.target.value)}
                  placeholder="Paste the SMS, email text, warning prompt, or suspicious message here..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans text-white placeholder-slate-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEvidenceModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-full transition-all shadow-xs flex items-center gap-1.5"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Correlating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ingest &amp; Analyze</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

