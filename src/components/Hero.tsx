import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, ShieldAlert, Sparkles, AlertTriangle, CheckCircle2, FileSearch, Link2, MessageSquare, Cpu } from 'lucide-react';
import { ViewMode } from '../types';

interface HeroProps {
  onNavigate: (view: ViewMode) => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onScrollToSection }) => {
  // Subtle animated analysis pulse simulation
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const scanningStages = [
    { label: 'Multimodal Ingestion', detail: 'SMS text + Suspicious URL + Screenshot parsed' },
    { label: 'Heuristic & LLM Parsing', detail: 'Urgency coercion & credential harvesting identified' },
    { label: 'Chronology Correlation', detail: '3 artifacts mapped across 4-minute attack window' },
    { label: 'Containment Synthesis', detail: 'Generating 4 prioritized containment & recovery steps' }
  ];

  return (
    <section className="relative overflow-hidden bg-[#090D14] border-b border-slate-800/80 pt-8 pb-16 md:py-20 lg:py-24">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-cyan-500/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column (6 cols): Copy and Direct Action */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left">
            {/* Cybersecurity Badge */}
            <div className="inline-flex items-center gap-2 bg-slate-900/90 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-emerald-500/30 mb-6 w-fit shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="font-mono uppercase text-[11px] font-bold tracking-wider">AI DIGITAL SAFETY ASSISTANT</span>
            </div>

            {/* Exact required headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-white mb-6">
              Something doesn't feel right online?{' '}
              <span className="block text-emerald-400 mt-1">Let AI investigate it.</span>
            </h1>

            {/* Exact required supporting text */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-xl">
              Upload a suspicious message, link, screenshot, or audio. SafeGuard AI analyzes the evidence, reconstructs what happened, and gives you clear steps to protect yourself and recover.
            </p>

            {/* Exact required CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                id="hero-primary-cta"
                onClick={() => onNavigate('investigate')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-7 py-3.5 rounded-full transition-all shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] active:scale-[0.98] inline-flex items-center gap-2.5 text-sm sm:text-base"
              >
                <span>Analyze an Incident</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-secondary-cta"
                onClick={() => onScrollToSection('live-demo')}
                className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 px-7 py-3.5 rounded-full font-bold transition-all active:scale-[0.98] inline-flex items-center gap-2 text-sm sm:text-base shadow-xs"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>View Live Demo</span>
              </button>
            </div>

            {/* Evidence formats supported */}
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-800/80">
              <span className="font-mono uppercase text-[11px] text-slate-500 font-semibold tracking-wider">Analyzes:</span>
              <span className="flex items-center gap-1.5 text-slate-300"><MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Messages</span>
              <span className="text-slate-600">&bull;</span>
              <span className="flex items-center gap-1.5 text-slate-300"><Link2 className="w-3.5 h-3.5 text-emerald-400" /> Links</span>
              <span className="text-slate-600">&bull;</span>
              <span className="flex items-center gap-1.5 text-slate-300"><FileSearch className="w-3.5 h-3.5 text-emerald-400" /> Screenshots</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-300">Audio</span>
            </div>
          </div>

          {/* Right Column (6 cols): High-end Cybersecurity / AI Live Telemetry Visual */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl shadow-black/60 p-6 relative overflow-hidden backdrop-blur-sm">
              {/* Card top window bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  <span className="ml-2 text-xs font-mono font-medium text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SafeGuard AI Engine &bull; Active Triage</span>
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  REAL-TIME
                </span>
              </div>

              {/* Evidence ingestion stream mock */}
              <div className="space-y-3 mb-5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Ingested Evidence Artifacts</span>
                  <span className="text-emerald-400 font-bold">3 Sources Correlated</span>
                </div>

                {/* Evidence Artifact 1 */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="text-slate-200 font-medium truncate">SMS: "URGENT: Security alert. Verify account now..."</div>
                      <div className="text-[10px] text-slate-500 font-mono">Timestamp: 10:32 AM &bull; Sender: +1 (800) 555-0199</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 font-bold">
                    Urgent Hook
                  </span>
                </div>

                {/* Evidence Artifact 2 */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Link2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="text-slate-200 font-mono text-[11px] truncate">https://security-verify-auth92.net/login</div>
                      <div className="text-[10px] text-slate-500 font-mono">Timestamp: 10:34 AM &bull; Homoglyph spoofing detected</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 font-bold">
                    Phishing URL
                  </span>
                </div>
              </div>

              {/* Dynamic Investigation Progress Telemetry */}
              <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AI Reasoning Pipeline</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    Stage {activeStep + 1} of 4
                  </span>
                </div>

                <div className="text-xs text-white font-medium mb-1">
                  {scanningStages[activeStep].label}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mb-2.5">
                  &gt; {scanningStages[activeStep].detail}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((activeStep + 1) / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Result Summary Bar */}
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Incident Risk Assessment:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    HIGH RISK
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-xs">
                    94% Confidence
                  </span>
                </div>
              </div>

              {/* Quick Launch Link */}
              <button
                onClick={() => onNavigate('investigate')}
                className="w-full mt-3 py-2 text-center text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Launch Interactive Studio to test with your own files</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

