import React from 'react';
import { Eye, ShieldCheck, HelpCircle, LifeBuoy } from 'lucide-react';
import { ViewMode } from '../types';

interface TrustPrivacySectionProps {
  onNavigate?: (view: ViewMode) => void;
  onOpenAboutModal?: () => void;
}

export const TrustPrivacySection: React.FC<TrustPrivacySectionProps> = () => {
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
    <section className="py-16 md:py-24 border-b border-white/[0.06] relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D1116] text-[#5FC9E8] text-xs font-mono font-bold tracking-wider uppercase mb-3 border border-white/[0.06]">
            <span>TRUST & PRIVACY</span>
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

        {/* 4 Trust Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                id={`trust-pillar-${pillar.id}`}
                className="rounded-[20px] p-6 transition-all duration-200 flex flex-col justify-between"
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
                  <div className="w-11 h-11 rounded-xl bg-[#5FC9E8]/10 border border-[#5FC9E8]/20 text-[#5FC9E8] flex items-center justify-center mb-4 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3
                    className="text-base font-semibold text-[#E8ECEF] mb-2"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {pillar.title}
                  </h3>
                  <p className="text-[#7A8794] text-xs sm:text-sm leading-relaxed font-normal">
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
