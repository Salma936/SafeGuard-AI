import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play, MessageSquare, Link2, FileSearch, Mic } from 'lucide-react';
import { ViewMode } from '../types';
import { LiveStatusIndicator } from './LiveStatusIndicator';
import { ThreatIndexGauge } from './ThreatIndexGauge';

interface HeroProps {
  onNavigate: (view: ViewMode) => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onScrollToSection }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:py-20 lg:py-24 border-b border-white/[0.06] w-full">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 w-full">
        {/* Main Side-by-Side Flex Container (Cross-Browser Safari & Chrome Resilient) */}
        <div className="flex flex-col lg:flex-row lg:flex-nowrap items-center justify-between gap-10 lg:gap-12 xl:gap-16 w-full min-w-0">
          {/* Left Column: Human and Accessible Landing Copy */}
          <div className="flex-1 flex flex-col justify-center text-left min-w-0 w-full lg:max-w-2xl">
            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="mb-5"
            >
              <div className="inline-flex items-center gap-2 bg-[#0D1116] text-[#5FC9E8] px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-[#5FC9E8]/30 w-fit shadow-[0_0_15px_rgba(95,201,232,0.1)]">
                <LiveStatusIndicator size="sm" status="active" />
                <span className="font-mono uppercase text-[11px] font-bold tracking-wider">
                  AI DIGITAL SAFETY ASSISTANT
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#E8ECEF] mb-6 leading-[1.08]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Something doesn't feel right online?{' '}
              <span className="block text-[#5FC9E8] mt-1">Let AI investigate it.</span>
            </motion.h1>

            {/* Supporting text */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-[#7A8794] leading-relaxed mb-8 max-w-xl"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Upload a suspicious message, link, screenshot, or audio. SafeGuard AI analyzes the evidence, reconstructs what happened, and gives you clear steps to protect yourself and recover.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4 mb-8"
            >
              <button
                id="hero-primary-cta"
                onClick={() => onNavigate('investigate')}
                className="bg-[#5FC9E8] hover:bg-[#7be2fe] text-[#0A0D10] font-semibold px-7 py-3.5 rounded-full transition-all duration-200 inline-flex items-center gap-2.5 text-sm sm:text-base cursor-pointer"
                style={{
                  boxShadow: '0 8px 30px -8px rgba(95, 201, 232, 0.5)',
                }}
              >
                <span>Analyze an Incident</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-secondary-cta"
                onClick={() => onScrollToSection('live-demo')}
                className="text-[#E8ECEF] hover:text-white px-7 py-3.5 rounded-full font-semibold transition-all duration-200 inline-flex items-center gap-2 text-sm sm:text-base cursor-pointer"
                style={{
                  background: 'rgba(13, 17, 22, 0.55)',
                  backdropFilter: 'blur(18px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Play className="w-4 h-4 text-[#5FC9E8] fill-[#5FC9E8]" />
                <span>View Live Demo</span>
              </button>
            </motion.div>

            {/* Evidence formats supported */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#7A8794] pt-4 border-t border-white/[0.06]"
            >
              <span className="font-mono uppercase text-[11px] text-[#4A5560] font-semibold tracking-wider">
                Analyzes:
              </span>
              <span className="flex items-center gap-1.5 text-[#E8ECEF]">
                <MessageSquare className="w-3.5 h-3.5 text-[#5FC9E8]" /> Messages
              </span>
              <span className="text-[#4A5560]">&bull;</span>
              <span className="flex items-center gap-1.5 text-[#E8ECEF]">
                <Link2 className="w-3.5 h-3.5 text-[#5FC9E8]" /> Links
              </span>
              <span className="text-[#4A5560]">&bull;</span>
              <span className="flex items-center gap-1.5 text-[#E8ECEF]">
                <FileSearch className="w-3.5 h-3.5 text-[#5FC9E8]" /> Screenshots
              </span>
              <span className="text-[#4A5560]">&bull;</span>
              <span className="flex items-center gap-1.5 text-[#E8ECEF]">
                <Mic className="w-3.5 h-3.5 text-[#5FC9E8]" /> Audio
              </span>
            </motion.div>
          </div>

          {/* Right Column: Composite Threat Index Circular Gauge Card (Fixed Width + Shrink-0 for Safari) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-[420px] xl:w-[440px] shrink-0 flex justify-center lg:justify-end"
            style={{
              flexShrink: 0,
            }}
          >
            <div
              className="w-full max-w-md rounded-[24px] p-6 sm:p-7 relative overflow-hidden shrink-0"
              style={{
                background: 'rgba(13, 17, 22, 0.55)',
                backdropFilter: 'blur(18px) saturate(140%)',
                WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                width: '100%',
              }}
            >
              {/* Card Header Bar */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#5FC9E8] animate-pulse" />
                  <span className="font-mono text-xs font-semibold tracking-wider text-[#E8ECEF] uppercase">
                    COMPOSITE THREAT INDEX
                  </span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#D9705A]/15 text-[#D9705A] border border-[#D9705A]/25 font-bold">
                  HIGH RISK
                </span>
              </div>

              {/* Animated Circular Gauge */}
              <div className="py-2 flex justify-center">
                <ThreatIndexGauge score={84} size={176} radius={70} strokeWidth={10} />
              </div>

              {/* Quick Telemetry Details */}
              <div className="mt-5 space-y-2.5 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7A8794] font-mono">Triage Status</span>
                  <span className="font-mono text-[#5FC9E8] font-semibold">Active Containment</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7A8794] font-mono">Chained Artifacts</span>
                  <span className="font-mono text-[#E8ECEF] font-bold">4 Verified (SHA-256)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7A8794] font-mono">Primary Vector</span>
                  <span className="font-mono text-[#E0A458] font-semibold">Phishing + MFA Fatigue</span>
                </div>
              </div>

              {/* Interactive workspace link */}
              <button
                onClick={() => onNavigate('investigate')}
                className="w-full mt-5 py-2.5 text-center text-xs font-semibold text-[#5FC9E8] hover:text-[#8ee1f9] rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              >
                <span>Launch Interactive Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
