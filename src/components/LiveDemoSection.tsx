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
    <section id="live-demo" className="py-16 md:py-24 bg-[#0B0F17] border-b border-slate-800/80 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 10%, rgba(16,185,129,0.06), transparent 70%)' }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-4 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>INTERACTIVE DASHBOARD PREVIEW</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            See SafeGuard investigate an incident
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Experience how multimodal evidence transforms into incident chronology, risk scoring, and prioritized recovery.
          </p>

          <div className="mt-7 flex justify-center">
            <motion.button
              id="live-demo-section-launch-cta"
              whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(16,185,129,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleLaunchCase(activeCase)}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Launch Live Demo</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Product Workflow Visual */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 p-4 bg-slate-900/90 rounded-3xl border border-slate-800/90 max-w-5xl mx-auto overflow-x-auto shadow-lg"
        >
          <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-3 text-center sm:text-left flex items-center gap-2 px-2">
            <LiveStatusIndicator size="sm" status="active" />
            <span>END-TO-END INCIDENT INVESTIGATION WORKFLOW</span>
          </div>
          <div className="flex items-center justify-between min-w-[720px] gap-2 px-2">
            {workflowSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <React.Fragment key={idx}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 shrink-0"
                  >
                    <StepIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">{step.label}</span>
                  </motion.div>
                  {idx < workflowSteps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        {/* High-Fidelity Cybersecurity Investigation Dashboard Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-slate-900/95 rounded-3xl border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden max-w-5xl mx-auto backdrop-blur-xs"
        >
          {/* Top Scenario Switcher Bar */}
          <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Scenario:
              </span>
              <div className="flex items-center gap-2">
                {DEMO_INCIDENTS.map((item, idx) => (
                  <motion.button
                    key={item.id}
                    id={`demo-tab-${idx}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedCaseIdx(idx)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                      selectedCaseIdx === idx
                        ? 'bg-slate-800 text-white font-bold border border-emerald-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Scenario {idx + 1}: {item.category}
                  </motion.button>
                ))}
              </div>
            </div>
            <LiveStatusIndicator size="sm" status="active" label="Live Investigation Engine" />
          </div>

          {/* Realistic Dashboard Body with AnimatePresence on Scenario Change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCase.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="p-6 sm:p-8 space-y-6"
            >
              {/* Top Stat Ribbon: Incident Risk, Confidence, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-800">
                {/* Incident Risk */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-[11px] font-mono uppercase text-slate-400">Incident Risk</div>
                    <div className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {activeCase.overallRisk.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-slate-400 font-normal">
                        Score: {activeCase.riskScore}/100
                      </span>
                    </div>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </motion.div>

                {/* AI Confidence */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-[11px] font-mono uppercase text-slate-400">AI Confidence</div>
                    <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
                      94%
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-mono font-bold">
                    94
                  </div>
                </motion.div>

                {/* Evidence Analyzed Checklist */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col justify-center"
                >
                  <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">Evidence Analyzed</div>
                  <div className="flex items-center gap-3 text-xs text-slate-200">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Check className="w-3 h-3 text-emerald-400" /> Message
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Check className="w-3 h-3 text-emerald-400" /> URL
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Check className="w-3 h-3 text-emerald-400" /> Screenshot
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Main Investigation Split View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (6 cols): Timeline & Warning Signs */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Incident Timeline */}
                  <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <span className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Incident Timeline</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Reconstructed Sequence</span>
                    </div>

                    <div className="space-y-3 relative pl-2">
                      <div className="border-l-2 border-slate-800 space-y-4 pl-4">
                        {activeCase.timeline.map((event, idx) => (
                          <motion.div
                            key={event.id || idx}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className="relative"
                          >
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <div className="text-xs font-mono font-bold text-emerald-400">{event.timestamp}</div>
                            <div className="text-xs font-semibold text-slate-100">{event.title}</div>
                            <div className="text-[11px] text-slate-400 leading-relaxed">{event.description}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detected Warning Signs */}
                  <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 space-y-3">
                    <div className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center justify-between">
                      <span>Detected Warning Signs</span>
                      <span className="text-rose-400 text-xs font-mono">
                        {activeCase.synthesis.tacticsObserved.length} Indicators
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeCase.synthesis.tacticsObserved.map((tactic, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{tactic}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column (6 cols): Recommended Actions Checklist */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <span className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Recommended Actions</span>
                      </span>
                      <span className="text-xs text-emerald-400 font-mono">Priority Order</span>
                    </div>

                    <div className="space-y-2.5">
                      {activeCase.actionPlan.map((act, idx) => (
                        <motion.div
                          key={act.id || idx}
                          whileHover={{ x: 3, borderColor: 'rgba(16,185,129,0.3)' }}
                          className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-start gap-3 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 font-mono">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-100">{act.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                              {act.description}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Action Launch Button */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">Ready to explore or analyze live?</div>
                      <div className="text-[11px] text-slate-400">
                        Open the full investigation studio to inspect this case or upload new files.
                      </div>
                    </div>
                    <motion.button
                      id="live-demo-inspect-full-btn"
                      whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(16,185,129,0.35)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLaunchCase(activeCase)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-full transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>Launch Live Demo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};


