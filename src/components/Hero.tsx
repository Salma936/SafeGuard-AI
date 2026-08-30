import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play, MessageSquare, Link2, FileSearch, Mic, AlertTriangle, Check, ShieldAlert, Video } from 'lucide-react';
import { ViewMode } from '../types';
import { DEMO_INCIDENTS } from '../data/demoIncidents';
import { LiveStatusIndicator } from './LiveStatusIndicator';

interface HeroProps {
  onNavigate: (view: ViewMode) => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onScrollToSection }) => {
  const sampleCase = DEMO_INCIDENTS[0];

  return (
    <section className="relative overflow-hidden pt-8 pb-14 md:py-18 lg:py-22 border-b border-white/[0.06] w-full">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 w-full">
        {/* Main Side-by-Side Flex Container */}
        <div className="flex flex-col lg:flex-row lg:flex-nowrap items-center justify-between gap-10 lg:gap-12 xl:gap-14 w-full min-w-0">
          {/* Left Column: Multimodal Image & Audio Deepfake Differentiator Copy */}
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
                  DEEPFAKE FORENSICS &amp; DIGITAL SAFETY
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
              <span className="block text-[#5FC9E8] mt-1">Let AI investigate the evidence.</span>
            </motion.h1>

            {/* Supporting text */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-[#7A8794] leading-relaxed mb-8 max-w-xl"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Upload a suspicious message, link, screenshot, audio, or video. SafeGuard AI analyzes the evidence, reconstructs what happened, and gives you clear steps to protect yourself and recover.
            </motion.p>

            {/* CTAs (Max 2: Primary "Analyze an Incident" + Secondary "Live Demo") */}
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
                <span>Live Demo</span>
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
                <FileSearch className="w-3.5 h-3.5 text-[#5FC9E8]" /> Images
              </span>
              <span className="text-[#4A5560]">&bull;</span>
              <span className="flex items-center gap-1.5 text-[#E8ECEF]">
                <Mic className="w-3.5 h-3.5 text-[#5FC9E8]" /> Audio Clones
              </span>
              <span className="text-[#4A5560]">&bull;</span>
              <span className="flex items-center gap-1.5 text-[#E8ECEF]">
                <Video className="w-3.5 h-3.5 text-[#5FC9E8]" /> Video Deepfakes
              </span>
              <span className="text-[#4A5560]">&bull;</span>
              <span className="flex items-center gap-1.5 text-[#E8ECEF]">
                <MessageSquare className="w-3.5 h-3.5 text-[#5FC9E8]" /> Messages
              </span>
              <span className="text-[#4A5560]">&bull;</span>
              <span className="flex items-center gap-1.5 text-[#E8ECEF]">
                <Link2 className="w-3.5 h-3.5 text-[#5FC9E8]" /> URLs
              </span>
            </motion.div>
          </div>

          {/* Right Column: Reused Analysis Summary Cards Component (Incident Risk, AI Confidence, Evidence Analyzed) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-[440px] xl:w-[460px] shrink-0 flex justify-center lg:justify-end"
            style={{
              flexShrink: 0,
            }}
          >
            <div
              className="w-full rounded-[24px] p-5 sm:p-6 space-y-4 shadow-xl relative overflow-hidden shrink-0"
              style={{
                background: 'rgba(13, 17, 22, 0.55)',
                backdropFilter: 'blur(18px) saturate(140%)',
                WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#5FC9E8] animate-pulse" />
                  <span className="font-mono text-xs font-semibold tracking-wider text-[#E8ECEF] uppercase">
                    LIVE INVESTIGATION SUMMARY
                  </span>
                </div>
                <span className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-[#5FC9E8]/10 text-[#5FC9E8] border border-[#5FC9E8]/20 font-bold">
                  SAMPLE PREVIEW
                </span>
              </div>

              {/* 1. Incident Risk Card */}
              <div className="p-4 bg-[#06080B]/85 rounded-2xl border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono uppercase text-[#7A8794]">Incident Risk</div>
                  <div className="text-xl font-bold text-[#E8ECEF] flex items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 text-xs font-mono rounded-md bg-[#D9705A]/15 text-[#D9705A] border border-[#D9705A]/25 font-bold">
                      {sampleCase.overallRisk.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-[#7A8794] font-normal">
                      Score: {sampleCase.riskScore}/100
                    </span>
                  </div>
                </div>
                <AlertTriangle className="w-6 h-6 text-[#D9705A]" />
              </div>

              {/* 2. AI Confidence Card */}
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

              {/* 3. Evidence Analyzed Checklist Card */}
              <div className="p-4 bg-[#06080B]/85 rounded-2xl border border-white/[0.06] flex flex-col justify-center">
                <div className="text-[11px] font-mono uppercase text-[#7A8794] mb-1.5">Evidence Analyzed</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#E8ECEF]">
                  <span className="flex items-center gap-1.5 text-[#5FC9E8] font-medium">
                    <Check className="w-3.5 h-3.5 text-[#5FC9E8]" /> Message
                  </span>
                  <span className="flex items-center gap-1.5 text-[#5FC9E8] font-medium">
                    <Check className="w-3.5 h-3.5 text-[#5FC9E8]" /> URL
                  </span>
                  <span className="flex items-center gap-1.5 text-[#5FC9E8] font-medium">
                    <Check className="w-3.5 h-3.5 text-[#5FC9E8]" /> Screenshot
                  </span>
                  <span className="flex items-center gap-1.5 text-[#5FC9E8] font-medium">
                    <Check className="w-3.5 h-3.5 text-[#5FC9E8]" /> Audio
                  </span>
                  <span className="flex items-center gap-1.5 text-[#5FC9E8] font-medium">
                    <Check className="w-3.5 h-3.5 text-[#5FC9E8]" /> Video
                  </span>
                </div>
              </div>

              {/* Action Button: Live Demo */}
              <button
                onClick={() => onScrollToSection('live-demo')}
                className="w-full mt-2 py-2.5 text-center text-xs font-semibold text-[#5FC9E8] hover:text-[#8ee1f9] rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              >
                <span>Inspect Full Live Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
