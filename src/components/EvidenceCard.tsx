import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Link as LinkIcon,
  ShieldAlert,
  FileText,
  Mic,
  Video,
  Lightbulb,
  ChevronDown,
  Clock,
  AlertTriangle,
  Lock,
  Zap
} from 'lucide-react';
import { EvidenceItem } from '../types';

export const getSignalBadgeIcon = (indicator: string) => {
  const lower = indicator.toLowerCase();
  if (
    lower.includes('deadline') ||
    lower.includes('urgency') ||
    lower.includes('minute') ||
    lower.includes('hour') ||
    lower.includes('time') ||
    lower.includes('pressure')
  ) {
    return Clock;
  }
  if (
    lower.includes('domain') ||
    lower.includes('link') ||
    lower.includes('url') ||
    lower.includes('endpoint') ||
    lower.includes('squatting')
  ) {
    return LinkIcon;
  }
  if (
    lower.includes('2fa') ||
    lower.includes('mfa') ||
    lower.includes('prompt') ||
    lower.includes('push') ||
    lower.includes('fatigue')
  ) {
    return ShieldAlert;
  }
  if (
    lower.includes('spoofed') ||
    lower.includes('sender') ||
    lower.includes('impersonat') ||
    lower.includes('fake') ||
    lower.includes('unknown')
  ) {
    return AlertTriangle;
  }
  if (
    lower.includes('ssl') ||
    lower.includes('cert') ||
    lower.includes('reverse proxy') ||
    lower.includes('token') ||
    lower.includes('auth')
  ) {
    return Lock;
  }
  if (
    lower.includes('video') ||
    lower.includes('facial') ||
    lower.includes('sync') ||
    lower.includes('morphed') ||
    lower.includes('deepfake')
  ) {
    return Video;
  }
  return Zap;
};

export const getIndicatorPlainLanguage = (indicator: string): string => {
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

export const renderAnnotatedEvidence = (
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
    'update',
    'facial movement',
    'audio-visual sync',
    'manipulation index'
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

interface EvidenceCardProps {
  ev: EvidenceItem;
  idx?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isSimpleView?: boolean;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  ev,
  idx = 0,
  isExpanded = false,
  onToggleExpand,
  isSimpleView = false
}) => {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const isHigh =
    ev.riskScore >= 75 ||
    ev.riskLevel.toLowerCase() === 'critical' ||
    ev.riskLevel.toLowerCase() === 'high';
  const isMed =
    ev.riskScore >= 50 || ev.riskLevel.toLowerCase() === 'medium';
  const severityColor = isHigh ? '#D9705A' : isMed ? '#E0A458' : '#5FC9E8';

  const plainSentence =
    ev.indicators && ev.indicators.length > 0
      ? getIndicatorPlainLanguage(ev.indicators[0])
      : 'Suspicious indicators detected for this evidence item.';

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
        delay: idx * 0.06,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{
        y: -2,
        borderColor: 'rgba(95, 201, 232, 0.3)'
      }}
      className="w-full min-w-0 rounded-2xl border border-white/[0.06] p-4 sm:p-5 shadow-xs transition-all relative overflow-hidden text-left"
      style={{
        background: 'rgba(13, 17, 22, 0.65)',
        backdropFilter: 'blur(16px) saturate(130%)',
        WebkitBackdropFilter: 'blur(16px) saturate(130%)',
        borderLeftWidth: '3.5px',
        borderLeftColor: severityColor
      }}
    >
      {isSimpleView ? (
        /* ========================================================
           SIMPLE VIEW: Clean, non-technical, collapsed by default
           Icon + Title + ONE plain-English sentence + Severity Badge
           Technical tags move behind "View full details"
        ======================================================== */
        <div className="space-y-3">
          {/* Top Row: Icon, Title, and Severity Badge */}
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex w-9 h-9 shrink-0 items-center justify-center rounded-[8px] border"
                style={{
                  backgroundColor: `${severityColor}15`,
                  borderColor: `${severityColor}30`,
                  color: severityColor
                }}
              >
                {ev.type === 'message' && <MessageSquare className="h-4 w-4" />}
                {ev.type === 'url' && <LinkIcon className="h-4 w-4" />}
                {ev.type === 'screenshot' && <ShieldAlert className="h-4 w-4" />}
                {ev.type === 'email' && <FileText className="h-4 w-4" />}
                {ev.type === 'audio' && <Mic className="h-4 w-4" />}
                {ev.type === 'video' && <Video className="h-4 w-4" />}
              </div>

              <div className="min-w-0">
                <h4
                  className="break-words font-semibold text-sm text-[#E8ECEF] leading-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {ev.title}
                </h4>
                <div className="break-words text-[11px] font-mono text-[#7A8794] mt-0.5">
                  {ev.type.toUpperCase()}{ev.source ? ` • ${ev.source}` : ''}
                </div>
              </div>
            </div>

            {/* Severity Badge */}
            <span
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase border tracking-wider"
              style={{
                backgroundColor: `${severityColor}15`,
                borderColor: `${severityColor}35`,
                color: severityColor
              }}
            >
              {ev.riskLevel} Risk
            </span>
          </div>

          {/* ONE Plain-English Sentence & Details Toggle */}
          <div className="pt-2 border-t border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Lightbulb className="w-3.5 h-3.5 text-[#5FC9E8] shrink-0" />
              <p className="text-[#E8ECEF] text-xs sm:text-[12.5px] leading-relaxed break-words font-medium">
                {plainSentence}
              </p>
            </div>

            {onToggleExpand && (
              <button
                type="button"
                id={`btn-toggle-evidence-${ev.id}`}
                onClick={onToggleExpand}
                className="shrink-0 self-end sm:self-center inline-flex items-center gap-1 text-[11px] font-mono text-[#5FC9E8] hover:text-[#8ee1f9] cursor-pointer transition-colors"
              >
                <span>{isExpanded ? 'Hide details' : 'View full details'}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>

          {/* ELA Forensics Warning Line (only if manipulation_score > 35) */}
          {ev.elaResult && ev.elaResult.manipulation_score > 35 && (
            <div className="mt-2.5 rounded-xl border border-[#E0A458]/30 bg-[#E0A458]/10 p-2.5 text-xs text-[#E0A458] flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold flex items-center gap-1.5 text-[12px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#E0A458]" />
                  ⚠ Possible editing detected (score: {ev.elaResult.manipulation_score}/100)
                </span>
                {ev.elaResult.ela_heatmap_base64 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHeatmap((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-[#5FC9E8] hover:text-[#8ee1f9] cursor-pointer transition-colors"
                  >
                    <span>{showHeatmap ? 'Hide forensic heatmap' : 'View forensic heatmap'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showHeatmap ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {showHeatmap && ev.elaResult.ela_heatmap_base64 && (
                <div className="mt-1.5 rounded-lg border border-white/[0.08] bg-[#06080B]/95 p-3 flex flex-col items-center gap-2">
                  <img
                    src={`data:image/png;base64,${ev.elaResult.ela_heatmap_base64}`}
                    alt="ELA Forensic Heatmap"
                    className="max-h-64 w-auto rounded-md object-contain border border-white/[0.06]"
                  />
                  <div className="text-center">
                    <span className="text-[11px] font-mono text-[#E8ECEF] font-semibold block">
                      Error Level Analysis (ELA) Heatmap
                    </span>
                    <span className="text-[10px] font-mono text-[#7A8794]">
                      Brighter compression variance signals localized digital manipulation or editing.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collapsible Details: Technical Tags, Raw content, Metadata */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 pt-3 border-t border-white/[0.06] space-y-3"
              >
                {/* Technical Signal Tags moved behind View Full Details */}
                {ev.indicators && ev.indicators.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A8794] font-semibold">
                      Technical Signal Indicators:
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {ev.indicators.map((ind, iIdx) => {
                        const BadgeIcon = getSignalBadgeIcon(ind);
                        return (
                          <div
                            key={iIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border"
                            style={{
                              backgroundColor: `${severityColor}12`,
                              borderColor: `${severityColor}28`,
                              color: severityColor
                            }}
                          >
                            <BadgeIcon className="w-3 h-3 shrink-0" />
                            <span>{ind}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Raw Evidence Text */}
                <div className="p-3 rounded-xl bg-[#06080B]/90 border border-white/[0.06] font-mono text-xs text-[#E8ECEF] leading-relaxed break-words">
                  <div className="text-[10px] font-mono uppercase text-[#7A8794] mb-1 font-semibold">
                    Raw Evidence Content:
                  </div>
                  {renderAnnotatedEvidence(ev.content, ev.indicators, severityColor)}
                </div>

                {/* Metadata Key-Value pairs */}
                {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                  <div className="p-3 rounded-xl bg-[#06080B]/60 border border-white/[0.04] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono text-[#7A8794]">
                    {Object.entries(ev.metadata).map(([key, val]) => (
                      <span key={key} className="inline-flex items-center gap-1.5">
                        <span className="text-[#4A5560] font-semibold">{key}:</span>
                        <span className="text-[#E8ECEF]">{val}</span>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ========================================================
           TECHNICAL VIEW: Existing power-user layout preserved
        ======================================================== */
        <div>
          {/* 1. Header Row */}
          <div className="flex min-w-0 items-start justify-between gap-3 mb-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex w-9 h-9 shrink-0 items-center justify-center rounded-[8px] border"
                style={{
                  backgroundColor: `${severityColor}15`,
                  borderColor: `${severityColor}30`,
                  color: severityColor
                }}
              >
                {ev.type === 'message' && <MessageSquare className="h-4 w-4" />}
                {ev.type === 'url' && <LinkIcon className="h-4 w-4" />}
                {ev.type === 'screenshot' && <ShieldAlert className="h-4 w-4" />}
                {ev.type === 'email' && <FileText className="h-4 w-4" />}
                {ev.type === 'audio' && <Mic className="h-4 w-4" />}
                {ev.type === 'video' && <Video className="h-4 w-4" />}
              </div>

              <div className="min-w-0">
                <h4
                  className="break-words font-semibold text-sm text-[#E8ECEF] leading-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {ev.title}
                </h4>
                <div className="break-words text-[11px] font-mono text-[#7A8794] mt-0.5">
                  {ev.type.toUpperCase()} &bull; Ingested at {ev.timestamp}{' '}
                  {ev.source ? `from ${ev.source}` : ''}
                </div>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div
                className="text-[20px] font-bold font-mono leading-none"
                style={{ color: severityColor }}
              >
                {ev.riskScore}
              </div>
              <div
                className="text-[10px] font-mono font-bold uppercase mt-1 tracking-wider leading-none"
                style={{ color: severityColor }}
              >
                {ev.riskLevel.toLowerCase()} risk
              </div>
            </div>
          </div>

          {/* 2. Signal Badges Row directly on card */}
          {ev.indicators && ev.indicators.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              {ev.indicators.slice(0, 3).map((ind, iIdx) => {
                const BadgeIcon = getSignalBadgeIcon(ind);
                return (
                  <div
                    key={iIdx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border"
                    style={{
                      backgroundColor: `${severityColor}12`,
                      borderColor: `${severityColor}28`,
                      color: severityColor
                    }}
                  >
                    <BadgeIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[240px] sm:max-w-xs">{ind}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. Insight Row */}
          <div className="pt-2.5 border-t border-white/[0.05] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0 text-[#7A8794] truncate">
              <Lightbulb className="w-3.5 h-3.5 text-[#5FC9E8] shrink-0" />
              <span className="font-semibold text-[#5FC9E8] shrink-0 text-[11px] font-mono uppercase">
                What this means:
              </span>
              <span className="truncate text-[#E8ECEF] text-[11.5px]">
                {plainSentence}
              </span>
            </div>

            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-mono text-[#5FC9E8] hover:text-[#8ee1f9] cursor-pointer"
              >
                <span>{isExpanded ? 'Hide details' : 'View full details'}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>

          {/* ELA Forensics Warning Line (only if manipulation_score > 35) */}
          {ev.elaResult && ev.elaResult.manipulation_score > 35 && (
            <div className="mt-2.5 rounded-xl border border-[#E0A458]/30 bg-[#E0A458]/10 p-2.5 text-xs text-[#E0A458] flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold flex items-center gap-1.5 text-[12px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#E0A458]" />
                  ⚠ Possible editing detected (score: {ev.elaResult.manipulation_score}/100)
                </span>
                {ev.elaResult.ela_heatmap_base64 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHeatmap((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-[#5FC9E8] hover:text-[#8ee1f9] cursor-pointer transition-colors"
                  >
                    <span>{showHeatmap ? 'Hide forensic heatmap' : 'View forensic heatmap'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showHeatmap ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {showHeatmap && ev.elaResult.ela_heatmap_base64 && (
                <div className="mt-1.5 rounded-lg border border-white/[0.08] bg-[#06080B]/95 p-3 flex flex-col items-center gap-2">
                  <img
                    src={`data:image/png;base64,${ev.elaResult.ela_heatmap_base64}`}
                    alt="ELA Forensic Heatmap"
                    className="max-h-64 w-auto rounded-md object-contain border border-white/[0.06]"
                  />
                  <div className="text-center">
                    <span className="text-[11px] font-mono text-[#E8ECEF] font-semibold block">
                      Error Level Analysis (ELA) Heatmap
                    </span>
                    <span className="text-[10px] font-mono text-[#7A8794]">
                      Brighter compression variance signals localized digital manipulation or editing.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Collapsible Full Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 pt-3 border-t border-white/[0.06] space-y-2.5"
              >
                <div className="p-3 rounded-xl bg-[#06080B]/90 border border-white/[0.06] font-mono text-xs text-[#E8ECEF] leading-relaxed break-words">
                  <div className="text-[10px] font-mono uppercase text-[#7A8794] mb-1 font-semibold">
                    Raw Evidence Content:
                  </div>
                  {renderAnnotatedEvidence(ev.content, ev.indicators, severityColor)}
                </div>

                {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                  <div className="p-3 rounded-xl bg-[#06080B]/60 border border-white/[0.04] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono text-[#7A8794]">
                    {Object.entries(ev.metadata).map(([key, val]) => (
                      <span key={key} className="inline-flex items-center gap-1.5">
                        <span className="text-[#4A5560] font-semibold">{key}:</span>
                        <span className="text-[#E8ECEF]">{val}</span>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
