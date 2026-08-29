import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  ShieldAlert,
  ArrowRight,
  Lock,
  Activity,
  Check,
} from 'lucide-react';
import { ViewMode, IncidentCase } from '../types';
import { DEMO_INCIDENTS } from '../data/demoIncidents';
import { LiveStatusIndicator } from './LiveStatusIndicator';

interface LiveDemoSectionProps {
  onNavigate: (view: ViewMode) => void;
  onSelectDemoCase?: (incident: IncidentCase) => void;
}

export const LiveDemoSection: React.FC<LiveDemoSectionProps> = ({
  onNavigate,
  onSelectDemoCase,
}) => {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const activeCase = DEMO_INCIDENTS[selectedCaseIdx] || DEMO_INCIDENTS[0];

  const handleLaunchCase = (incident: IncidentCase) => {
    if (onSelectDemoCase) {
      onSelectDemoCase(incident);
    }
    onNavigate('live-demo');
  };

  const workflowSteps = [
    { label: 'Evidence Upload', icon: FileSearch },
    { label: 'AI Analysis', icon: Sparkles },
    { label: 'Risk Detection', icon: ShieldAlert },
    { label: 'Incident Reconstruction', icon: Activity },
    { label: 'Recommended Actions', icon: CheckCircle2 },
    { label: 'Evidence & Recovery', icon: Lock },
  ];

  return (
    <section id="live-demo" className="py-16 md:py-24 border-b border-white/[0.06] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D1116] text-[#5FC9E8] text-xs font-mono font-bold tracking-wider uppercase mb-4 border border-white/[0.06]">
            <Sparkles className="w-3.5 h-3.5 text-[#5FC9E8]" />
            <span>INTERACTIVE DASHBOARD PREVIEW</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#E8ECEF] tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            See SafeGuard investigate an incident
          </h2>

          <p className="text-base sm:text-lg text-[#7A8794] leading-relaxed">
            Experience how multimodal evidence transforms into incident chronology, risk scoring, and prioritized recovery.
          </p>

          <div className="mt-7 flex justify-center">
            <button
              id="live-demo-section-launch-cta"
              onClick={() => handleLaunchCase(activeCase)}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm font-semibold text-[#0A0D10] bg-[#5FC9E8] hover:bg-[#7be2fe] rounded-full transition-all duration-200 cursor-pointer"
              style={{
                boxShadow: '0 8px 30px -8px rgba(95, 201, 232, 0.5)',
              }}
            >
              <Play className="w-4 h-4 fill-[#0A0D10]" />
              <span>Launch Live Demo</span>
            </button>
          </div>
        </div>

        {/* Product Workflow Visual */}
        <div
          className="mb-10 p-4 rounded-[20px] max-w-5xl mx-auto overflow-x-auto shadow-lg"
          style={{
            background: 'rgba(13, 17, 22, 0.55)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#7A8794] mb-3 text-center sm:text-left flex items-center gap-2 px-2">
            <LiveStatusIndicator size="sm" status="active" />
            <span>END-TO-END INCIDENT INVESTIGATION WORKFLOW</span>
          </div>
          <div className="flex items-center justify-between min-w-[720px] gap-2 px-2">
            {workflowSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-2 bg-[#06080B]/80 px-3.5 py-2 rounded-xl border border-white/[0.06] shrink-0">
                    <StepIcon className="w-3.5 h-3.5 text-[#5FC9E8]" />
                    <span className="text-xs font-semibold text-[#E8ECEF]">{step.label}</span>
                  </div>
                  {idx < workflowSteps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-[#4A5560] shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* High-Fidelity Cybersecurity Investigation Dashboard Card */}
        <div
          className="rounded-[24px] shadow-2xl overflow-hidden max-w-5xl mx-auto"
          style={{
            background: 'rgba(13, 17, 22, 0.55)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Top Scenario Switcher Bar */}
          <div className="bg-[#06080B]/80 px-6 py-3.5 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#7A8794]">
                Scenario:
              </span>
              <div className="flex items-center gap-2">
                {DEMO_INCIDENTS.map((item, idx) => (
                  <button
                    key={item.id}
                    id={`demo-tab-${idx}`}
                    onClick={() => setSelectedCaseIdx(idx)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                      selectedCaseIdx === idx
                        ? 'bg-[#151B22] text-[#E8ECEF] font-bold border border-[#5FC9E8]/40 shadow-xs'
                        : 'text-[#7A8794] hover:text-[#E8ECEF] hover:bg-white/[0.03]'
                    }`}
                  >
                    Scenario {idx + 1}: {item.category}
                  </button>
                ))}
              </div>
            </div>
            <LiveStatusIndicator size="sm" status="active" label="Live Investigation Engine" />
          </div>

          {/* Dashboard Body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCase.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-6 sm:p-8 space-y-6"
            >
              {/* Top Stat Ribbon: Incident Risk, Confidence, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-white/[0.06]">
                {/* Incident Risk */}
                <div className="p-4 bg-[#06080B]/80 rounded-2xl border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono uppercase text-[#7A8794]">Incident Risk</div>
                    <div className="text-xl font-bold text-[#E8ECEF] flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 text-xs font-mono rounded-md bg-[#D9705A]/15 text-[#D9705A] border border-[#D9705A]/25 font-bold">
                        {activeCase.overallRisk.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-[#7A8794] font-normal">
                        Score: {activeCase.riskScore}/100
                      </span>
                    </div>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-[#D9705A]" />
                </div>

                {/* AI Confidence */}
                <div className="p-4 bg-[#06080B]/80 rounded-2xl border border-white/[0.06] flex items-center justify-between">
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

                {/* Evidence Analyzed Checklist */}
                <div className="p-4 bg-[#06080B]/80 rounded-2xl border border-white/[0.06] flex flex-col justify-center">
                  <div className="text-[11px] font-mono uppercase text-[#7A8794] mb-1">Evidence Analyzed</div>
                  <div className="flex items-center gap-3 text-xs text-[#E8ECEF]">
                    <span className="flex items-center gap-1 text-[#5FC9E8] font-medium">
                      <Check className="w-3 h-3 text-[#5FC9E8]" /> Message
                    </span>
                    <span className="flex items-center gap-1 text-[#5FC9E8] font-medium">
                      <Check className="w-3 h-3 text-[#5FC9E8]" /> URL
                    </span>
                    <span className="flex items-center gap-1 text-[#5FC9E8] font-medium">
                      <Check className="w-3 h-3 text-[#5FC9E8]" /> Screenshot
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Investigation Split View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Timeline & Warning Signs */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Incident Timeline */}
                  <div className="bg-[#06080B]/80 rounded-2xl p-5 border border-white/[0.06] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <span className="text-xs font-mono uppercase text-[#E8ECEF] font-semibold flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#5FC9E8]" />
                        <span>Incident Timeline</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#7A8794]">Reconstructed Sequence</span>
                    </div>

                    <div className="space-y-3 relative pl-2">
                      <div className="border-l-2 border-[#5FC9E8]/20 space-y-4 pl-4">
                        {activeCase.timeline.map((event, idx) => {
                          const isHigh = event.severity === 'high' || event.severity === 'critical';
                          const dotColor = isHigh ? '#D9705A' : event.severity === 'medium' ? '#E0A458' : '#5FC9E8';
                          return (
                            <div key={event.id || idx} className="relative">
                              <div
                                className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full"
                                style={{
                                  backgroundColor: dotColor,
                                  boxShadow: isHigh ? '0 0 10px rgba(217, 112, 90, 0.6)' : 'none',
                                }}
                              />
                              <div className="text-xs font-mono font-bold text-[#5FC9E8]">{event.timestamp}</div>
                              <div className="text-xs font-semibold text-[#E8ECEF]">{event.title}</div>
                              <div className="text-[11px] text-[#7A8794] leading-relaxed">{event.description}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Detected Warning Signs */}
                  <div className="bg-[#06080B]/80 rounded-2xl p-5 border border-white/[0.06] space-y-3">
                    <div className="text-xs font-mono uppercase text-[#E8ECEF] font-semibold flex items-center justify-between">
                      <span>Detected Warning Signs</span>
                      <span className="text-[#D9705A] text-xs font-mono">
                        {activeCase.synthesis.tacticsObserved.length} Indicators
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeCase.synthesis.tacticsObserved.map((tactic, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-[#D9705A]/10 border border-[#D9705A]/20 text-xs text-[#D9705A] flex items-center gap-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{tactic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Recommended Actions Checklist */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="bg-[#06080B]/80 rounded-2xl p-5 border border-white/[0.06] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <span className="text-xs font-mono uppercase text-[#E8ECEF] font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#5FC9E8]" />
                        <span>Recommended Actions</span>
                      </span>
                      <span className="text-xs text-[#5FC9E8] font-mono">Priority Order</span>
                    </div>

                    <div className="space-y-2.5">
                      {activeCase.actionPlan.map((act, idx) => (
                        <div
                          key={act.id || idx}
                          className="p-3.5 bg-[#0D1116] rounded-2xl border border-white/[0.06] flex items-start gap-3"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#5FC9E8]/10 text-[#5FC9E8] border border-[#5FC9E8]/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 font-mono">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[#E8ECEF]">{act.title}</div>
                            <div className="text-[11px] text-[#7A8794] mt-0.5 leading-relaxed">
                              {act.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Action Launch Button */}
                  <div className="p-5 rounded-2xl bg-[#06080B]/80 border border-[#5FC9E8]/25 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-[#E8ECEF]">Ready to explore or analyze live?</div>
                      <div className="text-[11px] text-[#7A8794]">
                        Open the full investigation studio to inspect this case or upload new files.
                      </div>
                    </div>
                    <button
                      id="live-demo-inspect-full-btn"
                      onClick={() => handleLaunchCase(activeCase)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#5FC9E8] hover:bg-[#7be2fe] text-[#0A0D10] text-xs font-semibold rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      style={{
                        boxShadow: '0 8px 20px -6px rgba(95, 201, 232, 0.4)',
                      }}
                    >
                      <span>Launch Live Demo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
