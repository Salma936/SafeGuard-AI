import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  FileSearch,
  ShieldAlert,
  ArrowRight,
  ArrowDown,
  Lock,
  Activity,
  Check,
  MessageSquare,
  Link2,
  LogOut,
  Key,
  ShieldCheck,
  Flag,
  Network,
  Info,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { ViewMode, IncidentCase } from '../types';
import { DEMO_INCIDENTS } from '../data/demoIncidents';
import { LiveStatusIndicator } from './LiveStatusIndicator';

interface LiveDemoSectionProps {
  onNavigate: (view: ViewMode) => void;
  onSelectDemoCase?: (incident: IncidentCase) => void;
}

export const LiveDemoSection: React.FC<LiveDemoSectionProps> = ({
  onNavigate,
  onSelectDemoCase,
}) => {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [timelineViewMode, setTimelineViewMode] = useState<'timeline' | 'graph'>('timeline');
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);
  const [expandedTimelineIds, setExpandedTimelineIds] = useState<Record<string, boolean>>({});
  const [expandedActionTechIds, setExpandedActionTechIds] = useState<Record<string, boolean>>({});
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const activeCase = DEMO_INCIDENTS[selectedCaseIdx] || DEMO_INCIDENTS[0];

  const handleLaunchCase = (incident: IncidentCase) => {
    if (onSelectDemoCase) {
      onSelectDemoCase(incident);
    }
    onNavigate('live-demo');
  };

  const toggleTimelineDetails = (id: string) => {
    setExpandedTimelineIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleActionTech = (id: string) => {
    setExpandedActionTechIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleActionCheck = (id: string) => {
    setCompletedActions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 4 Core Capabilities mapped to live proof
  const capabilities = [
    {
      id: 'cap-1',
      title: 'Multimodal Investigation',
      tag: 'Multi-Evidence Ingestion',
      description: 'Analyze messages, URLs, screenshots, images, and audio evidence in one unified investigation.',
      icon: Layers,
      proofLabel: 'Proven by Evidence Analysis below',
    },
    {
      id: 'cap-2',
      title: 'Incident Reconstruction',
      tag: 'Chronology Mapping',
      description: 'Connect related evidence and events to understand how a suspicious interaction unfolded.',
      icon: Network,
      proofLabel: 'Proven by Timeline & Graph View',
    },
    {
      id: 'cap-3',
      title: 'Personalized Protection',
      tag: 'Adaptive Guidance',
      description: 'Get situation-specific recommendations based on the evidence and risk detected.',
      icon: ShieldCheck,
      proofLabel: 'Proven by Action Checklist',
    },
    {
      id: 'cap-4',
      title: 'Evidence & Recovery',
      tag: 'Chain of Custody',
      description: 'Organize evidence, preserve an incident timeline, and generate practical recovery guidance.',
      icon: FileSpreadsheet,
      proofLabel: 'Proven by Takedowns & Custody Log',
    },
  ];

  // Helper for Timeline Event Icon
  const getTimelineEventIcon = (event: any) => {
    const title = event?.title?.toLowerCase() || '';
    const phase = event?.phase?.toLowerCase() || '';
    if (title.includes('sms') || title.includes('message') || title.includes('email')) {
      return MessageSquare;
    }
    if (title.includes('link') || title.includes('url') || title.includes('domain')) {
      return Link2;
    }
    if (title.includes('2fa') || title.includes('prompt') || title.includes('escalation')) {
      return ShieldAlert;
    }
    if (title.includes('safeguard') || title.includes('triage') || phase.includes('containment')) {
      return CheckCircle2;
    }
    return Activity;
  };

  // Helper for Event Associated Warning Signs
  const getEventWarningSign = (event: any) => {
    if (!event) return null;
    const title = event.title?.toLowerCase() || '';
    const desc = event.description?.toLowerCase() || '';

    if (title.includes('sms') || title.includes('shortcode') || desc.includes('phone number')) {
      return 'Fake emergency SMS alert';
    }
    if (title.includes('link') || title.includes('reverse proxy') || desc.includes('proxying')) {
      return 'Fake login page trick';
    }
    if (title.includes('2fa') || title.includes('prompt') || desc.includes('fatigue')) {
      return 'Spamming login approvals';
    }
    if (title.includes('extortion') || desc.includes('breach dump') || desc.includes('password from 2023')) {
      return 'Recycled old password bluff';
    }
    return null;
  };

  // Helper for Recommended Action Data
  const getActionCustomData = (idx: number) => {
    switch (idx) {
      case 0:
        return {
          plainTitle: 'Log out everywhere',
          plainDescription: 'Sign out of all your devices to kick out anyone who got in.',
          techDetail: 'Navigate to your primary account portal (Google / Microsoft / Workspace Security), click "Sign out of all active web sessions" to revoke attacker session tokens immediately.',
          urgency: 'Urgent',
          urgencyColor: '#D9705A',
          icon: LogOut,
        };
      case 1:
        return {
          plainTitle: 'Change your password + turn on stronger login',
          plainDescription: 'Switch to a passkey or security key — much harder to fake than a password.',
          techDetail: 'FIDO2 / WebAuthn hardware passkeys or authenticator apps (TOTP) are immune to adversary-in-the-middle reverse proxy phishing kits. Avoid SMS-based 2FA where possible.',
          urgency: 'Urgent',
          urgencyColor: '#D9705A',
          icon: Key,
        };
      case 2:
        return {
          plainTitle: 'Save the evidence',
          plainDescription: "We've saved a timestamped copy of everything, in case you need it later.",
          techDetail: 'Export structured SafeGuard incident JSON package with SHA-256 cryptographic chain of custody hash for reporting to your local cybercrime authority (US: FBI IC3).',
          urgency: 'Important',
          urgencyColor: '#5FC9E8',
          icon: ShieldCheck,
        };
      case 3:
      default:
        return {
          plainTitle: 'Report the fake site',
          plainDescription: "We'll help you report it so it gets taken down.",
          techDetail: 'Submit takedown abuse report to domain registrar (abuse@namecheap.com), hosting provider, Google Safe Browsing, and your local cybercrime authority.',
          urgency: 'Important',
          urgencyColor: '#5FC9E8',
          icon: Flag,
        };
    }
  };

  // Helper for Warning Signs Plain Language
  const getWarningSignPlainLanguage = (tactic: string) => {
    const lower = tactic.toLowerCase();
    if (lower.includes('proxy') || lower.includes('aitm') || lower.includes('lookalike')) {
      return {
        plain: 'Fake login page trick',
        technical: tactic,
      };
    }
    if (lower.includes('fatigue') || lower.includes('prompt')) {
      return {
        plain: 'Spamming login approvals',
        technical: tactic,
      };
    }
    if (lower.includes('smishing') || lower.includes('spoofed')) {
      return {
        plain: 'Fake emergency SMS alert',
        technical: tactic,
      };
    }
    if (lower.includes('regurgitation') || lower.includes('breach')) {
      return {
        plain: 'Recycled old password bluff',
        technical: tactic,
      };
    }
    if (lower.includes('bluff') || lower.includes('extortion')) {
      return {
        plain: 'Fabricated camera recording threat',
        technical: tactic,
      };
    }
    if (lower.includes('cryptocurrency')) {
      return {
        plain: 'Untraceable crypto payment demand',
        technical: tactic,
      };
    }
    return {
      plain: tactic,
      technical: 'Suspicious Tactic Detected',
    };
  };

  const selectedGraphEvent = activeCase.timeline.find(
    (e, idx) => (e.id || String(idx)) === selectedGraphNodeId
  ) || activeCase.timeline[0];

  return (
    <section id="live-demo" className="py-16 md:py-24 border-b border-white/[0.06] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D1116] text-[#5FC9E8] text-xs font-mono font-bold tracking-wider uppercase mb-4 border border-white/[0.06]">
            <Sparkles className="w-3.5 h-3.5 text-[#5FC9E8]" />
            <span>INTERACTIVE DASHBOARD PREVIEW</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#E8ECEF] tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            See SafeGuard investigate an incident
          </h2>

          <p className="text-base sm:text-lg text-[#7A8794] leading-relaxed">
            Experience how multimodal evidence transforms into incident chronology, risk scoring, and prioritized recovery.
          </p>

          <div className="mt-7 flex justify-center">
            <button
              id="live-demo-section-launch-cta"
              onClick={() => handleLaunchCase(activeCase)}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm font-semibold text-[#0A0D10] bg-[#5FC9E8] hover:bg-[#7be2fe] rounded-full transition-all duration-200 cursor-pointer"
              style={{
                boxShadow: '0 8px 30px -8px rgba(95, 201, 232, 0.5)',
              }}
            >
              <Play className="w-4 h-4 fill-[#0A0D10]" />
              <span>Analyze an Incident</span>
            </button>
          </div>
        </div>

        {/* Core Investigation Capabilities in Action — Full Card Treatment Matching How It Works */}
        <div className="mb-10 max-w-5xl mx-auto">
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#7A8794] mb-4 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2 px-1">
            <LiveStatusIndicator size="sm" status="active" />
            <span>CORE INVESTIGATION CAPABILITIES IN ACTION</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative items-stretch">
            {capabilities.map((cap) => {
              const CapIcon = cap.icon;
              return (
                <div
                  key={cap.id}
                  id={`capability-card-${cap.id}`}
                  onClick={() => handleLaunchCase(activeCase)}
                  className="group relative rounded-[20px] p-6 flex flex-col justify-between cursor-pointer transition-all duration-200 h-full"
                  style={{
                    background: 'rgba(13, 17, 22, 0.55)',
                    backdropFilter: 'blur(18px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'rgba(95, 201, 232, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  }}
                >
                  <div className="flex-1 flex flex-col">
                    {/* Icon container */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-10 h-10 rounded-xl bg-[#5FC9E8]/10 border border-[#5FC9E8]/20 flex items-center justify-center text-[#5FC9E8] group-hover:border-[#5FC9E8]/40 transition-colors duration-200">
                        <CapIcon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Reserved Title Height for Consistent Vertical Alignment Across All Cards */}
                    <div className="min-h-[52px] sm:min-h-[56px] flex items-start mb-2.5">
                      <h3
                        className="text-base sm:text-lg font-semibold text-[#E8ECEF] leading-snug transition-colors duration-200"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {cap.title}
                      </h3>
                    </div>

                    {/* Description: flex-1 ensures description starts at the same vertical position */}
                    <p className="text-[#7A8794] text-xs sm:text-sm leading-relaxed mb-4 font-normal flex-1">
                      {cap.description}
                    </p>
                  </div>

                  {/* Bottom detail tag: mt-auto ensures tag sits at identical vertical position */}
                  <div className="mt-auto pt-3.5 border-t border-white/[0.05] flex items-center justify-between text-xs text-[#4A5560]">
                    <span className="font-mono uppercase text-[10.5px] font-semibold text-[#7A8794] tracking-wider leading-tight">
                      {cap.tag}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* High-Fidelity Investigation Dashboard Card */}
        <div
          className="rounded-[24px] shadow-2xl overflow-hidden max-w-5xl mx-auto"
          style={{
            background: 'rgba(13, 17, 22, 0.55)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Scenario Switcher Bar */}
          <div className="bg-[#06080B]/85 px-5 sm:px-6 py-3.5 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#7A8794]">
                Sample Scenario:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {DEMO_INCIDENTS.map((item, idx) => (
                  <button
                    key={item.id}
                    id={`demo-tab-${idx}`}
                    onClick={() => {
                      setSelectedCaseIdx(idx);
                      setSelectedGraphNodeId(null);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${selectedCaseIdx === idx
                      ? 'bg-[#151B22] text-[#E8ECEF] font-bold border border-[#5FC9E8]/40 shadow-xs'
                      : 'text-[#7A8794] hover:text-[#E8ECEF] hover:bg-white/[0.03]'
                      }`}
                  >
                    Example {idx + 1}: {item.category}
                  </button>
                ))}
              </div>
            </div>
            <LiveStatusIndicator size="sm" status="active" label="Live Analysis" />
          </div>

          {/* Dashboard Body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCase.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-5 sm:p-7 space-y-6"
            >
              {/* Top Stat Ribbon: Incident Risk, Confidence, Evidence Analyzed (Multimodal Investigation Proof) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-white/[0.06]">
                {/* Incident Risk */}
                <div className="p-4 bg-[#06080B]/85 rounded-2xl border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono uppercase text-[#7A8794]">Incident Risk</div>
                    <div className="text-xl font-bold text-[#E8ECEF] flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 text-xs font-mono rounded-md bg-[#D9705A]/15 text-[#D9705A] border border-[#D9705A]/25 font-bold">
                        {activeCase.overallRisk.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-[#7A8794] font-normal">
                        Score: {activeCase.riskScore}/100
                      </span>
                    </div>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-[#D9705A]" />
                </div>

                {/* AI Confidence */}
                <div className="p-4 bg-[#06080B]/85 rounded-2xl border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono uppercase text-[#7A8794]">AI Confidence</div>
                    <div className="text-xl font-bold text-[#5FC9E8] font-mono mt-0.5">
                      94%
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#5FC9E8]/10 border border-[#5FC9E8]/20 flex items-center justify-center text-[#5FC9E8] text-xs font-mono font-bold">
                    94
                  </div>
                </div>

                {/* Evidence Analyzed Checklist */}
                <div className="p-4 bg-[#06080B]/85 rounded-2xl border border-white/[0.06] flex flex-col justify-center">
                  <div className="text-[11px] font-mono uppercase text-[#7A8794] mb-1">Evidence Analyzed</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#E8ECEF]">
                    <span className="flex items-center gap-1 text-[#5FC9E8] font-medium">
                      <Check className="w-3 h-3 text-[#5FC9E8]" /> Message
                    </span>
                    <span className="flex items-center gap-1 text-[#5FC9E8] font-medium">
                      <Check className="w-3 h-3 text-[#5FC9E8]" /> URL
                    </span>
                    <span className="flex items-center gap-1 text-[#5FC9E8] font-medium">
                      <Check className="w-3 h-3 text-[#5FC9E8]" /> Screenshot
                    </span>
                    <span className="flex items-center gap-1 text-[#5FC9E8] font-medium">
                      <Check className="w-3 h-3 text-[#5FC9E8]" /> Audio
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Investigation Split View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Left Column: Timeline / Graph View (Incident Reconstruction Proof) & Warning Signs */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Timeline & Graph View Container */}
                  <div className="bg-[#06080B]/85 rounded-2xl p-5 border border-white/[0.06] space-y-4">
                    {/* Header + View Toggle (Timeline View / Graph View) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                      <span className="text-xs font-mono uppercase text-[#E8ECEF] font-semibold flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#5FC9E8]" />
                        <span>Incident Reconstruction</span>
                      </span>

                      {/* Compact Segmented Control Toggle */}
                      <div className="inline-flex items-center gap-1 bg-[#0D1116] p-1 rounded-xl border border-white/[0.08]">
                        <button
                          type="button"
                          id="view-toggle-timeline"
                          onClick={() => setTimelineViewMode('timeline')}
                          className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${timelineViewMode === 'timeline'
                            ? 'bg-[#151B22] text-[#5FC9E8] font-bold border border-[#5FC9E8]/30 shadow-xs'
                            : 'text-[#7A8794] hover:text-[#E8ECEF]'
                            }`}
                        >
                          <Activity className="w-3 h-3" />
                          <span>Timeline View</span>
                        </button>
                        <button
                          type="button"
                          id="view-toggle-graph"
                          onClick={() => {
                            setTimelineViewMode('graph');
                            if (!selectedGraphNodeId && activeCase.timeline.length > 0) {
                              setSelectedGraphNodeId(activeCase.timeline[0].id || '0');
                            }
                          }}
                          className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${timelineViewMode === 'graph'
                            ? 'bg-[#151B22] text-[#5FC9E8] font-bold border border-[#5FC9E8]/30 shadow-xs'
                            : 'text-[#7A8794] hover:text-[#E8ECEF]'
                            }`}
                        >
                          <Network className="w-3 h-3" />
                          <span>Graph View</span>
                        </button>
                      </div>
                    </div>

                    {/* View Content: Timeline vs Graph */}
                    {timelineViewMode === 'timeline' ? (
                      /* 1. Existing Timeline View (Preserved 100% Intact as Default) */
                      <div className="space-y-3.5 relative pl-1">
                        {activeCase.timeline.map((event, idx) => {
                          const isHigh = event.severity === 'high' || event.severity === 'critical';
                          const isMed = event.severity === 'medium';
                          const semanticColor = isHigh ? '#D9705A' : isMed ? '#E0A458' : '#5FC9E8';
                          const EventIcon = getTimelineEventIcon(event);
                          const isExpanded = !!expandedTimelineIds[event.id || String(idx)];

                          return (
                            <motion.div
                              key={event.id || idx}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.35, delay: idx * 0.08 }}
                              className="relative pl-6 pb-2 last:pb-0 border-l border-white/[0.08]"
                            >
                              {/* Semantic Color Icon Node */}
                              <div
                                className="absolute -left-3 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#06080B]"
                                style={{
                                  backgroundColor: `${semanticColor}20`,
                                  color: semanticColor,
                                  borderColor: semanticColor,
                                  boxShadow: isHigh ? `0 0 10px ${semanticColor}80` : 'none',
                                }}
                              >
                                <EventIcon className="w-3 h-3" />
                              </div>

                              {/* Stepper Header: Timestamp + Title */}
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <span
                                  className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                                  style={{
                                    backgroundColor: `${semanticColor}15`,
                                    color: semanticColor,
                                  }}
                                >
                                  {event.timestamp}
                                </span>
                                <button
                                  onClick={() => toggleTimelineDetails(event.id || String(idx))}
                                  className="text-[10.5px] font-mono text-[#5FC9E8] hover:text-[#8ee1f9] flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>{isExpanded ? 'Hide' : 'Details'}</span>
                                  <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              </div>

                              <div className="text-xs font-semibold text-[#E8ECEF] mt-1 break-words">
                                {event.title}
                              </div>

                              {/* Expandable Explanation Details */}
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="text-[11px] text-[#7A8794] leading-relaxed mt-1.5 pt-1.5 border-t border-white/[0.04] break-words"
                                >
                                  {event.description}
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      /* 2. Additive Incident Graph View */
                      <div className="space-y-4">
                        {/* Interactive Graph Chain */}
                        <div className="p-3 sm:p-4 rounded-xl bg-[#06080B] border border-white/[0.06] relative overflow-hidden">
                          <div className="text-[10px] font-mono uppercase text-[#7A8794] mb-3 flex items-center justify-between">
                            <span>CAUSAL INCIDENT CHAIN</span>
                            <span className="text-[#5FC9E8]">Click node for details</span>
                          </div>

                          {/* Desktop & Tablet: Horizontal Connected Flow */}
                          <div className="hidden sm:flex items-center justify-between gap-2 relative">
                            {activeCase.timeline.map((event, idx) => {
                              const isHigh = event.severity === 'high' || event.severity === 'critical';
                              const isMed = event.severity === 'medium';
                              const semanticColor = isHigh ? '#D9705A' : isMed ? '#E0A458' : '#5FC9E8';
                              const EventIcon = getTimelineEventIcon(event);
                              const warningBadge = getEventWarningSign(event);
                              const nodeId = event.id || String(idx);
                              const isSelected = selectedGraphNodeId === nodeId || (!selectedGraphNodeId && idx === 0);

                              return (
                                <React.Fragment key={nodeId}>
                                  {/* Event Node */}
                                  <motion.button
                                    type="button"
                                    onClick={() => setSelectedGraphNodeId(nodeId)}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.25, delay: idx * 0.07 }}
                                    className={`relative flex-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[92px] ${isSelected
                                      ? 'bg-[#151B22] shadow-[0_0_15px_rgba(95,201,232,0.15)]'
                                      : 'bg-[#0D1116]/80 hover:bg-[#0D1116] border-white/[0.06]'
                                      }`}
                                    style={{
                                      borderColor: isSelected ? semanticColor : 'rgba(255, 255, 255, 0.08)',
                                    }}
                                  >
                                    {/* Top Row: Icon + Timestamp + Warning Badge */}
                                    <div className="flex items-center justify-between gap-1 mb-1.5">
                                      <div
                                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
                                        style={{
                                          backgroundColor: `${semanticColor}20`,
                                          color: semanticColor,
                                          borderColor: `${semanticColor}40`,
                                        }}
                                      >
                                        <EventIcon className="w-3 h-3" />
                                      </div>

                                      <div className="flex items-center gap-1">
                                        {warningBadge && (
                                          <div
                                            className="w-4 h-4 rounded-full bg-[#D9705A]/20 border border-[#D9705A]/40 flex items-center justify-center text-[#D9705A]"
                                            title={`Warning sign: ${warningBadge}`}
                                          >
                                            <AlertTriangle className="w-2.5 h-2.5" />
                                          </div>
                                        )}
                                        <span className="text-[10px] font-mono text-[#7A8794]">
                                          {event.timestamp}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Event Title */}
                                    <div className="text-[11px] font-semibold text-[#E8ECEF] line-clamp-2 leading-tight">
                                      {event.title}
                                    </div>
                                  </motion.button>

                                  {/* Connector Arrow to next event */}
                                  {idx < activeCase.timeline.length - 1 && (
                                    <div className="shrink-0 flex items-center justify-center text-[#4A5560]">
                                      <ArrowRight className="w-3.5 h-3.5 text-[#5FC9E8]/50" />
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>

                          {/* Mobile View: Vertical Connected Flow */}
                          <div className="flex sm:hidden flex-col space-y-2">
                            {activeCase.timeline.map((event, idx) => {
                              const isHigh = event.severity === 'high' || event.severity === 'critical';
                              const isMed = event.severity === 'medium';
                              const semanticColor = isHigh ? '#D9705A' : isMed ? '#E0A458' : '#5FC9E8';
                              const EventIcon = getTimelineEventIcon(event);
                              const warningBadge = getEventWarningSign(event);
                              const nodeId = event.id || String(idx);
                              const isSelected = selectedGraphNodeId === nodeId || (!selectedGraphNodeId && idx === 0);

                              return (
                                <React.Fragment key={nodeId}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedGraphNodeId(nodeId)}
                                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${isSelected
                                      ? 'bg-[#151B22] shadow-xs'
                                      : 'bg-[#0D1116]/80 hover:bg-[#0D1116] border-white/[0.06]'
                                      }`}
                                    style={{
                                      borderColor: isSelected ? semanticColor : 'rgba(255, 255, 255, 0.08)',
                                    }}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                                        style={{
                                          backgroundColor: `${semanticColor}20`,
                                          color: semanticColor,
                                          borderColor: `${semanticColor}40`,
                                        }}
                                      >
                                        <EventIcon className="w-3.5 h-3.5" />
                                      </div>

                                      <div className="min-w-0">
                                        <div className="text-[11.5px] font-semibold text-[#E8ECEF] truncate">
                                          {event.title}
                                        </div>
                                        <div className="text-[10px] font-mono text-[#7A8794]">
                                          {event.timestamp} &bull; Phase: {event.phase}
                                        </div>
                                      </div>
                                    </div>

                                    {warningBadge && (
                                      <div
                                        className="shrink-0 px-1.5 py-0.5 rounded bg-[#D9705A]/15 border border-[#D9705A]/30 text-[#D9705A] text-[9.5px] font-mono flex items-center gap-1"
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5" />
                                        <span>Warning</span>
                                      </div>
                                    )}
                                  </button>

                                  {idx < activeCase.timeline.length - 1 && (
                                    <div className="flex justify-center py-0.5 text-[#5FC9E8]/40">
                                      <ArrowDown className="w-3 h-3" />
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selected Node Details Panel */}
                        {selectedGraphEvent && (
                          <motion.div
                            key={selectedGraphEvent.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3.5 rounded-xl bg-[#0D1116] border border-white/[0.08] space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold text-[#E8ECEF]">
                              <span className="flex items-center gap-1.5 text-[#5FC9E8]">
                                <Info className="w-3.5 h-3.5" />
                                <span>{selectedGraphEvent.title}</span>
                              </span>
                              <span className="text-[10px] font-mono text-[#7A8794]">
                                {selectedGraphEvent.timestamp} ({selectedGraphEvent.phase})
                              </span>
                            </div>

                            <p className="text-[11.5px] text-[#7A8794] leading-relaxed">
                              {selectedGraphEvent.description}
                            </p>

                            {getEventWarningSign(selectedGraphEvent) && (
                              <div className="mt-1.5 pt-1.5 border-t border-white/[0.04] text-[10.5px] font-mono text-[#D9705A] flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>Associated Warning Sign: {getEventWarningSign(selectedGraphEvent)}</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Detected Warning Signs */}
                  <div className="bg-[#06080B]/85 rounded-2xl p-5 border border-white/[0.06] space-y-3">
                    <div className="text-xs font-mono uppercase text-[#E8ECEF] font-semibold flex items-center justify-between">
                      <span>Detected Warning Signs</span>
                      <span className="text-[#D9705A] text-xs font-mono">
                        {activeCase.synthesis.tacticsObserved.length} Indicators
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeCase.synthesis.tacticsObserved.map((tactic, idx) => {
                        const parsed = getWarningSignPlainLanguage(tactic);
                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#D9705A]/10 border border-[#D9705A]/20 flex items-start gap-2.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-[#D9705A] shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-[#E8ECEF]">
                                {parsed.plain}
                              </div>
                              <div className="text-[10px] font-mono text-[#D9705A]/80 mt-0.5 truncate" title={parsed.technical}>
                                {parsed.technical}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Recommended Actions Checklist (Personalized Protection Proof) */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="bg-[#06080B]/85 rounded-2xl p-5 border border-white/[0.06] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <span className="text-xs font-mono uppercase text-[#E8ECEF] font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#5FC9E8]" />
                        <span>Recommended Actions</span>
                      </span>
                      <span className="text-xs text-[#5FC9E8] font-mono">Priority Checklist</span>
                    </div>

                    <div className="space-y-3">
                      {activeCase.actionPlan.map((act, idx) => {
                        const custom = getActionCustomData(idx);
                        const ActionIcon = custom.icon;
                        const actionId = act.id || String(idx);
                        const isDone = !!completedActions[actionId];
                        const showTech = !!expandedActionTechIds[actionId];

                        return (
                          <div
                            key={actionId}
                            className={`p-3.5 rounded-2xl border transition-all ${isDone
                              ? 'bg-[#5FC9E8]/5 border-[#5FC9E8]/30'
                              : 'bg-[#0D1116]/80 border-white/[0.06]'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkable Circle / Stepper Icon */}
                              <button
                                type="button"
                                onClick={() => toggleActionCheck(actionId)}
                                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors"
                                style={{
                                  backgroundColor: isDone ? '#5FC9E8' : 'rgba(95, 201, 232, 0.12)',
                                  color: isDone ? '#0A0D10' : '#5FC9E8',
                                  border: `1px solid ${isDone ? '#5FC9E8' : 'rgba(95, 201, 232, 0.3)'}`,
                                }}
                                title="Mark as completed"
                              >
                                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <ActionIcon className="w-3.5 h-3.5" />}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  {/* Urgency Tag */}
                                  <span
                                    className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
                                    style={{
                                      backgroundColor: `${custom.urgencyColor}18`,
                                      color: custom.urgencyColor,
                                      border: `1px solid ${custom.urgencyColor}30`,
                                    }}
                                  >
                                    {custom.urgency}
                                  </span>

                                  {/* Technical Details Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => toggleActionTech(actionId)}
                                    className="text-[10.5px] font-mono text-[#5FC9E8] hover:text-[#8ee1f9] flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>{showTech ? 'Hide tech details' : 'Technical details'}</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${showTech ? 'rotate-180' : ''}`} />
                                  </button>
                                </div>

                                {/* Plain-Language Title & Description */}
                                <h4 className={`text-xs font-semibold mt-1.5 ${isDone ? 'line-through text-[#7A8794]' : 'text-[#E8ECEF]'}`}>
                                  {custom.plainTitle}
                                </h4>
                                <p className="text-[11.5px] text-[#7A8794] mt-0.5 leading-relaxed">
                                  {custom.plainDescription}
                                </p>

                                {/* Technical Details Accordion */}
                                {showTech && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-2.5 p-2.5 rounded-xl bg-[#06080B] border border-white/[0.06] text-[11px] font-mono text-[#5FC9E8] leading-relaxed break-words"
                                  >
                                    <div className="text-[10px] font-bold text-[#7A8794] uppercase mb-1">Technical Guidance:</div>
                                    {custom.techDetail}
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom CTA Card (Evidence & Recovery Proof) */}
                  <div className="p-5 rounded-2xl bg-[#06080B]/85 border border-[#5FC9E8]/25 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-[#E8ECEF]">
                        Ready to explore or analyze live?
                      </div>
                      <div className="text-[11px] text-[#7A8794]">
                        Open the full investigation studio to inspect this case or upload new files.
                      </div>
                    </div>
                    <button
                      id="live-demo-inspect-full-btn"
                      onClick={() => handleLaunchCase(activeCase)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#5FC9E8] hover:bg-[#7be2fe] text-[#0A0D10] text-xs font-semibold rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      style={{
                        boxShadow: '0 8px 20px -6px rgba(95, 201, 232, 0.4)',
                      }}
                    >
                      <span>Analyze an Incident</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
