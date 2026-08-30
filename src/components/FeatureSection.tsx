import React from 'react';
import { Layers, Network, ShieldCheck, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { ViewMode } from '../types';

interface FeatureSectionProps {
  onNavigate: (view: ViewMode) => void;
}

export const FeatureSection: React.FC<FeatureSectionProps> = ({ onNavigate }) => {
  const features = [
    {
      id: 'feat-1',
      num: '01',
      title: 'Multimodal Investigation',
      description: 'Analyze messages, URLs, screenshots, images, audio, and video evidence in one unified investigation.',
      icon: Layers,
      tag: 'Multi-Evidence Ingestion',
      iconColor: '#5FC9E8',
      iconBg: 'rgba(95, 201, 232, 0.08)',
      iconBorder: 'rgba(95, 201, 232, 0.2)',
    },
    {
      id: 'feat-2',
      num: '02',
      title: 'Incident Reconstruction',
      description: 'Connect related evidence and events to understand how a suspicious interaction unfolded.',
      icon: Network,
      tag: 'Chronology Mapping',
      iconColor: '#5FC9E8',
      iconBg: 'rgba(95, 201, 232, 0.08)',
      iconBorder: 'rgba(95, 201, 232, 0.2)',
    },
    {
      id: 'feat-3',
      num: '03',
      title: 'Personalized Protection',
      description: 'Get situation-specific recommendations based on the evidence and risk detected.',
      icon: ShieldCheck,
      tag: 'Adaptive Guidance',
      iconColor: '#E0A458',
      iconBg: 'rgba(224, 164, 88, 0.08)',
      iconBorder: 'rgba(224, 164, 88, 0.2)',
    },
    {
      id: 'feat-4',
      num: '04',
      title: 'Evidence & Recovery',
      description: 'Organize evidence, preserve an incident timeline, and generate practical recovery guidance.',
      icon: FileSpreadsheet,
      tag: 'Chain of Custody',
      iconColor: '#5FC9E8',
      iconBg: 'rgba(95, 201, 232, 0.08)',
      iconBorder: 'rgba(95, 201, 232, 0.2)',
    },
  ];

  return (
    <section className="py-16 md:py-24 border-b border-white/[0.06] relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D1116] text-[#5FC9E8] text-xs font-mono font-bold tracking-wider uppercase mb-3 border border-white/[0.06]">
            <span>CORE CAPABILITIES</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#E8ECEF] tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            From suspicious evidence to clear action.
          </h2>
          <p className="text-base sm:text-lg text-[#7A8794] leading-relaxed">
            SafeGuard equips you with dedicated forensic analysis and guided recovery to handle cyber threats calmly and decisively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                id={`feature-card-${idx + 1}`}
                onClick={() => onNavigate('investigate')}
                className="group relative rounded-[20px] p-7 cursor-pointer flex flex-col justify-between overflow-hidden transition-all duration-200"
                style={{
                  background: 'rgba(13, 17, 22, 0.55)',
                  backdropFilter: 'blur(18px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200"
                      style={{
                        backgroundColor: feature.iconBg,
                        border: `1px solid ${feature.iconBorder}`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: feature.iconColor }} strokeWidth={1.75} />
                    </div>
                  </div>

                  <h3
                    className="text-xl font-semibold text-[#E8ECEF] tracking-tight mb-2.5 transition-colors duration-200"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-[#7A8794] text-sm leading-relaxed mb-6 font-normal">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs font-medium">
                  <span className="text-[#4A5560] font-mono">{feature.tag}</span>
                  <span className="inline-flex items-center gap-1 text-[#5FC9E8] font-semibold">
                    <span>Analyze an Incident</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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