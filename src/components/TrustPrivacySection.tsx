import React from 'react';
import { Eye, ShieldCheck, HelpCircle, LifeBuoy } from 'lucide-react';

export const TrustPrivacySection: React.FC = () => {
  const pillars = [
    {
      id: 'pillar-1',
      title: 'Transparent Analysis',
      description: 'Every assessment reveals its exact indicators, scoring rationale, and corroborating signals without opaque black-box conclusions.',
      icon: Eye
    },
    {
      id: 'pillar-2',
      title: 'Privacy-Conscious Design',
      description: 'Sensitive personal identifiers, passwords, and device data can be redacted prior to processing with client-side isolation.',
      icon: ShieldCheck
    },
    {
      id: 'pillar-3',
      title: 'Clear Explanations',
      description: 'Complex technical attack vectors (e.g. reverse proxy phishing, SIM swap lures) are demystified into simple, objective language.',
      icon: HelpCircle
    },
    {
      id: 'pillar-4',
      title: 'Actionable Recovery Guidance',
      description: 'Step-by-step guidance prioritizes safety over panic, providing concrete containment and reporting pathways.',
      icon: LifeBuoy
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-[#0B0F17] border-b border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-4 border border-emerald-500/20">
            <span>TRUST & PRIVACY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Built around victim safety.
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
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
                className="bg-slate-900/80 hover:bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg shadow-black/40 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
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

