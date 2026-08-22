import React from 'react';
import { Layers, Network, ShieldCheck, FileSpreadsheet, ArrowUpRight } from 'lucide-react';
import { ViewMode } from '../types';

interface FeatureSectionProps {
  onNavigate: (view: ViewMode) => void;
}

export const FeatureSection: React.FC<FeatureSectionProps> = ({ onNavigate }) => {
  const features = [
    {
      id: 'feat-1',
      title: 'Multimodal Investigation',
      description: 'Analyze messages, URLs, screenshots, images, and audio evidence in one unified investigation.',
      icon: Layers,
      tag: 'Multi-Evidence Ingestion'
    },
    {
      id: 'feat-2',
      title: 'Incident Reconstruction',
      description: 'Connect related evidence and events to understand how a suspicious interaction unfolded.',
      icon: Network,
      tag: 'Chronology Mapping'
    },
    {
      id: 'feat-3',
      title: 'Personalized Protection',
      description: 'Get situation-specific recommendations based on the evidence and risk detected.',
      icon: ShieldCheck,
      tag: 'Adaptive Guidance'
    },
    {
      id: 'feat-4',
      title: 'Evidence & Recovery',
      description: 'Organize evidence, preserve an incident timeline, and generate practical recovery guidance.',
      icon: FileSpreadsheet,
      tag: 'Chain of Custody'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-[#090D14] border-b border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-4 border border-emerald-500/20">
            <span>CORE CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            From suspicious evidence to clear action.
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            SafeGuard equips you with dedicated forensic analysis and guided recovery to handle cyber threats calmly and decisively.
          </p>
        </div>

        {/* 4 Clean Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                id={`feature-card-${idx + 1}`}
                onClick={() => onNavigate('investigate')}
                className="group relative bg-slate-900/80 hover:bg-slate-900 rounded-2xl p-7 border border-slate-800 hover:border-emerald-500/40 transition-all duration-200 shadow-lg shadow-black/40 hover:shadow-emerald-500/5 flex flex-col justify-between cursor-pointer backdrop-blur-xs"
              >
                <div>
                  {/* Top row: Icon & Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 flex items-center justify-center group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 transition-all">
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                      0{idx + 1}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-white tracking-tight mb-2.5 group-hover:text-emerald-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom subtle capability pill */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500 font-mono">{feature.tag}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold group-hover:text-emerald-300">
                    <span>Explore in Studio</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

