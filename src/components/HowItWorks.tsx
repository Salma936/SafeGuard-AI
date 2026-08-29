import React from 'react';
import { motion } from 'motion/react';
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
      description: 'Upload suspicious messages, URLs, screenshots, or audio recordings into a secure, sandboxed session.',
      icon: Upload,
      detail: 'Accepts SMS, email, domains, chats, and audio.',
    },
    {
      num: '02',
      title: 'SafeGuard AI Analyzes the Incident',
      description: 'The AI model extracts indicators of compromise, identifies coercive intent, and checks threat databases.',
      icon: Sparkles,
      detail: 'Multimodal reasoning & IOC correlation.',
    },
    {
      num: '03',
      title: 'Reconstruct What Happened',
      description: 'Events are automatically synthesized into a chronological timeline connecting disparate evidence points.',
      icon: Network,
      detail: 'Chronology mapping & pattern detection.',
    },
    {
      num: '04',
      title: 'Protect Yourself and Recover',
      description: 'Receive prioritized, practical containment steps, security checklists, and an exportable evidence log.',
      icon: ShieldCheck,
      detail: 'Hardening & verified reporting templates.',
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

        {/* 4-Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                id={`how-it-works-step-${step.num}`}
                onClick={() => onNavigate('investigate')}
                className="group relative rounded-[20px] p-6 flex flex-col justify-between cursor-pointer transition-all duration-200"
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
                <div>
                  {/* Step number & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-bold text-[#5FC9E8] font-mono tracking-tight">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#5FC9E8]/10 border border-[#5FC9E8]/20 flex items-center justify-center text-[#5FC9E8] group-hover:border-[#5FC9E8]/40 transition-colors duration-200">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className="text-base sm:text-lg font-semibold text-[#E8ECEF] mb-2 leading-snug group-hover:text-[#5FC9E8] transition-colors duration-200"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[#7A8794] text-xs sm:text-sm leading-relaxed mb-3 font-normal">
                    {step.description}
                  </p>
                </div>

                {/* Bottom detail pill */}
                <div className="mt-4 pt-3.5 border-t border-white/[0.05] flex items-center justify-between text-xs text-[#4A5560]">
                  <span className="font-mono uppercase text-[11px] font-semibold text-[#7A8794]">{step.detail}</span>
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
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#E8ECEF] hover:text-[#5FC9E8] px-6 py-3 rounded-full bg-[#0D1116] border border-white/[0.08] hover:border-[#5FC9E8]/30 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <span>Start an investigation with your own evidence</span>
            <ArrowRight className="w-4 h-4 text-[#5FC9E8]" />
          </button>
        </div>
      </div>
    </section>
  );
};