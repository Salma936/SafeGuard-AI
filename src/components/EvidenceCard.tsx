import React from 'react';
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

  if (
    lower.includes('facial movement') ||
    lower.includes('deepfake') ||
    lower.includes('manipulation likelihood') ||
    lower.includes('audio-visual sync') ||
    lower.includes('morphed')
  ) {
    return "Facial inconsistencies and audio desynchronization indicate synthetic video manipulation.";
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
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  ev,
  idx = 0,
  isExpanded = false,
  onToggleExpand
}) => {
  const isHigh =
    ev.riskScore >= 75 ||
    ev.riskLevel.toLowerCase() === 'critical' ||
    ev.riskLevel.toLowerCase() === 'high';
  const isMed =
    ev.riskScore >= 50 || ev.riskLevel.toLowerCase() === 'medium';
  const severityColor = isHigh ? '#D9705A' : isMed ? '#E0A458' : '#5FC9E8';

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
      className="w-full min-w-0 rounded-2xl border border-white/[0.06] p-5 shadow-xs transition-all relative overflow-hidden text-left"
      style={{
        background: 'rgba(13, 17, 22, 0.65)',
        backdropFilter: 'blur(16px) saturate(130%)',
        WebkitBackdropFilter: 'blur(16px) saturate(130%)',
        borderLeftWidth: '3.5px',
        borderLeftColor: severityColor
      }}
    >
      {/* 1. Header Row */}
      <div className="flex min-w-0 items-start justify-between gap-3 mb-3.5">
        {/* Left: Icon in 36x36 colored square with 8px corner radius + Title & Timestamp */}
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

        {/* Right: Large risk score number (20px, bold) + one-line risk label */}
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

      {/* 2. Signal Badges Row (1-3 compact pill badges with icon + short label) */}
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

      {/* 3. Insight Row ("WHAT THIS MEANS" restyled as single line with small lightbulb icon) */}
      <div className="pt-2.5 border-t border-white/[0.05] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0 text-[#7A8794] truncate">
          <Lightbulb className="w-3.5 h-3.5 text-[#5FC9E8] shrink-0" />
          <span className="font-semibold text-[#5FC9E8] shrink-0 text-[11px] font-mono uppercase">
            What this means:
          </span>
          <span className="truncate text-[#E8ECEF] text-[11.5px]">
            {ev.indicators.length > 0
              ? getIndicatorPlainLanguage(ev.indicators[0])
              : 'Suspicious indicators detected for this evidence item.'}
          </span>
        </div>

        {/* 4. Full Details Toggle Button */}
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

      {/* 4. Collapsible Full Details (Raw message text, URLs, metadata) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-white/[0.06] space-y-2.5"
          >
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
    </motion.div>
  );
};
