import React from 'react';
import { Upload, Sparkles, Network, ShieldCheck, ArrowRight } from 'lucide-react';
import { ViewMode } from '../types';

interface HowItWorksProps {
  onNavigate: (view: ViewMode) => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: '01',
      title: 'Upload Evidence',
      description: 'Upload suspicious messages, URLs, images,screenshots, audio, or video recordings into a secure, sandboxed session.',
      icon: Upload,
      tag: 'ACCEPTS SMS, EMAIL, DOMAINS, CHATS, AUDIO, AND VIDEO.',
    },
    {
      num: '02',
      title: 'SafeGuard AI Analyzes the Incident',
      description: 'The AI model extracts indicators of compromise, identifies coercive intent, and checks threat databases.',
      icon: Sparkles,
      tag: 'MULTIMODAL REASONING & IOC CORRELATION.',
    },
    {
      num: '03',
      title: 'Reconstruct What Happened',
      description: 'Events are automatically synthesized into a chronological timeline connecting disparate evidence points.',
      icon: Network,
      tag: 'CHRONOLOGY MAPPING & PATTERN DETECTION.',
    },
    {
      num: '04',
      title: 'Protect Yourself and Recover',
      description: 'Receive prioritized, practical containment steps, security checklists, and an exportable evidence log.',
      icon: ShieldCheck,
      tag: 'HARDENING & VERIFIED REPORTING TEMPLATES.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 border-b border-white/[0.06] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D1116] text-[#5FC9E8] text-xs font-mono font-bold tracking-wider uppercase mb-3 border border-white/[0.06]">
            <span>METHODOLOGY</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#E8ECEF] tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            How SafeGuard works.
          </h2>
          <p className="text-base sm:text-lg text-[#7A8794] leading-relaxed">
            A clear, four-stage investigative pipeline designed to move from confusion to complete digital containment.
          </p>
        </div>

        {/* 4-Step Flow — Equal Sized Cards with Uniform Internal Alignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative items-stretch">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                id={`how-it-works-step-${step.num}`}
                onClick={() => onNavigate('investigate')}
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
                  {/* Step number & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-bold text-[#5FC9E8] font-mono tracking-tight">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#5FC9E8]/10 border border-[#5FC9E8]/20 flex items-center justify-center text-[#5FC9E8] group-hover:border-[#5FC9E8]/40 transition-colors duration-200">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Reserved Title Height for Consistent Vertical Alignment Across All Cards */}
                  <div className="min-h-[52px] sm:min-h-[56px] flex items-start mb-2.5">
                    <h3
                      className="text-base sm:text-lg font-semibold text-[#E8ECEF] leading-snug transition-colors duration-200"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {step.title}
                    </h3>
                  </div>

                  {/* Description: flex-1 ensures description starts at the same vertical position */}
                  <p className="text-[#7A8794] text-xs sm:text-sm leading-relaxed mb-4 font-normal flex-1">
                    {step.description}
                  </p>
                </div>

                {/* Bottom detail tag: mt-auto ensures tag sits at identical vertical position */}
                <div className="mt-auto pt-3.5 border-t border-white/[0.05] flex items-center justify-between text-xs text-[#4A5560]">
                  <span className="font-mono uppercase text-[10.5px] font-semibold text-[#7A8794] tracking-wider leading-tight">
                    {step.tag}
                  </span>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-[#4A5560] hidden lg:block shrink-0 ml-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <button
            id="how-it-works-start-investigation-btn"
            onClick={() => onNavigate('investigate')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0D10] bg-[#5FC9E8] hover:bg-[#7be2fe] px-7 py-3 rounded-full transition-all duration-200 cursor-pointer shadow-[0_8px_24px_-6px_rgba(95,201,232,0.4)]"
          >
            <span>Start an investigation with your own evidence</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};