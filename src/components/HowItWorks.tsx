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
      description: 'Upload suspicious messages, URLs, screenshots, or audio recordings into a secure, sandboxed session.',
      icon: Upload,
      detail: 'Accepts SMS, email, suspicious domains, chat exports, and audio transcripts.'
    },
    {
      num: '02',
      title: 'SafeGuard AI Analyzes the Incident',
      description: 'The AI model extracts indicators of compromise, identifies coercive intent, and checks threat databases.',
      icon: Sparkles,
      detail: 'Multimodal threat reasoning, intent classification, and IOC correlation.'
    },
    {
      num: '03',
      title: 'Reconstruct What Happened',
      description: 'Events are automatically synthesized into a chronological timeline connecting disparate evidence points.',
      icon: Network,
      detail: 'Chronological timeline, entity correlation, and attack pattern detection.'
    },
    {
      num: '04',
      title: 'Protect Yourself and Recover',
      description: 'Receive prioritized, practical containment steps, security checklists, and an exportable evidence log.',
      icon: ShieldCheck,
      detail: 'Account isolation, passkey hardening, and verified reporting templates.'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-[#090D14] border-b border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-4 border border-emerald-500/20">
            <span>METHODOLOGY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            How SafeGuard works.
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            A clear, four-stage investigative pipeline designed to move from confusion to complete digital containment.
          </p>
        </div>

        {/* 4-Step Horizontal Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                id={`how-it-works-step-${step.num}`}
                className="relative bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-lg shadow-black/40 hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Step number badge & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-3">
                    {step.description}
                  </p>
                </div>

                {/* Progress indicator connector for lg screens */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono uppercase text-[11px] font-semibold text-slate-500">{step.detail}</span>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden lg:block shrink-0 ml-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA bar */}
        <div className="mt-12 text-center">
          <button
            id="how-it-works-start-investigation-btn"
            onClick={() => onNavigate('investigate')}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-200 hover:text-emerald-400 px-6 py-3 rounded-full bg-slate-900 border border-slate-700/80 hover:border-emerald-500/40 transition-all shadow-xs active:scale-[0.98]"
          >
            <span>Start an investigation with your own evidence</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>
    </section>
  );
};

