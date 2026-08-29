import React from 'react';
import { Eye, ShieldCheck, HelpCircle, LifeBuoy } from 'lucide-react';
import { ViewMode } from '../types';

interface TrustPrivacySectionProps {
  onNavigate?: (view: ViewMode) => void;
  onOpenAboutModal?: () => void;
}

export const TrustPrivacySection: React.FC<TrustPrivacySectionProps> = ({ onNavigate }) => {
  const pillars = [
    {
      id: 'pillar-1',
      title: 'Transparent Analysis',
      description: 'Every assessment reveals its exact indicators, scoring rationale, and corroborating signals without opaque black-box conclusions.',
      icon: Eye,
    },
    {
      id: 'pillar-2',
      title: 'Privacy-Conscious Design',
      description: 'Sensitive personal identifiers, passwords, and device data can be redacted prior to processing with client-side isolation.',
      icon: ShieldCheck,
    },
    {
      id: 'pillar-3',
      title: 'Clear Explanations',
      description: 'Complex technical attack vectors (e.g. reverse proxy phishing, SIM swap lures) are demystified into simple, objective language.',
      icon: HelpCircle,
    },
    {
      id: 'pillar-4',
      title: 'Actionable Recovery Guidance',
      description: 'Step-by-step guidance prioritizes safety over panic, providing concrete containment and reporting pathways.',
      icon: LifeBuoy,
    },
  ];

  return (
    <section id="trust-privacy" className="py-16 md:py-24 border-b border-white/[0.06] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D1116] text-[#5FC9E8] text-xs font-mono font-bold tracking-wider uppercase mb-3 border border-white/[0.06]">
            <span>TRUST &amp; PRIVACY</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#E8ECEF] tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Built around victim safety.
          </h2>
          <p className="text-base sm:text-lg text-[#7A8794] leading-relaxed">
            Transparent forensic reasoning, privacy-first evidence isolation, and actionable recovery pathways.
          </p>
        </div>

        {/* 4 Trust & Privacy Full Cards — Identical Treatment & Sizing to How It Works Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative items-stretch">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                id={`trust-pillar-${pillar.id}`}
                onClick={() => onNavigate && onNavigate('investigate')}
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
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Reserved Title Height for Consistent Vertical Alignment Across All Cards */}
                  <div className="min-h-[52px] sm:min-h-[56px] flex items-start mb-2.5">
                    <h3
                      className="text-base sm:text-lg font-semibold text-[#E8ECEF] leading-snug transition-colors duration-200"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {pillar.title}
                    </h3>
                  </div>

                  {/* Description: flex-1 ensures description starts at the same vertical position */}
                  <p className="text-[#7A8794] text-xs sm:text-sm leading-relaxed font-normal flex-1">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
