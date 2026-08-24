import React from 'react';
import { motion } from 'motion/react';
import { Upload, Sparkles, Network, ShieldCheck, ArrowRight } from 'lucide-react';
import { ViewMode } from '../types';

interface HowItWorksProps {
  onNavigate: (view: ViewMode) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: '01',
      title: 'Upload Evidence',
      description: 'Upload suspicious messages, URLs, screenshots, or audio recordings into a secure, sandboxed session.',
      icon: Upload,
      detail: 'Accepts SMS, email, suspicious domains, chat exports, and audio transcripts.',
    },
    {
      num: '02',
      title: 'SafeGuard AI Analyzes the Incident',
      description: 'The AI model extracts indicators of compromise, identifies coercive intent, and checks threat databases.',
      icon: Sparkles,
      detail: 'Multimodal threat reasoning, intent classification, and IOC correlation.',
    },
    {
      num: '03',
      title: 'Reconstruct What Happened',
      description: 'Events are automatically synthesized into a chronological timeline connecting disparate evidence points.',
      icon: Network,
      detail: 'Chronological timeline, entity correlation, and attack pattern detection.',
    },
    {
      num: '04',
      title: 'Protect Yourself and Recover',
      description: 'Receive prioritized, practical containment steps, security checklists, and an exportable evidence log.',
      icon: ShieldCheck,
      detail: 'Account isolation, passkey hardening, and verified reporting templates.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-[#090D14] border-b border-slate-800/80 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(16,185,129,0.08), transparent 70%)' }}
      />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-4 border border-emerald-500/20">
            <span>METHODOLOGY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            How SafeGuard works.
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            A clear, four-stage investigative pipeline designed to move from confusion to complete digital containment.
          </p>
        </motion.div>

        {/* 4-Step Horizontal Flow with Motion */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative"
        >
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                id={`how-it-works-step-${step.num}`}
                variants={stepVariants}
                whileHover={{
                  y: -6,
                  borderColor: 'rgba(16,185,129,0.4)',
                  boxShadow: '0 20px 35px -10px rgba(16,185,129,0.12)',
                  transition: { duration: 0.25 },
                }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-lg shadow-black/40 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Step number badge & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight">
                      {step.num}
                    </span>
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 3 }}
                      className="w-11 h-11 rounded-2xl bg-emerald-500/5 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 transition-all duration-300"
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug group-hover:text-emerald-300 transition-colors">
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
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden lg:block shrink-0 ml-2" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-12 text-center"
        >
          <motion.button
            id="how-it-works-start-investigation-btn"
            whileHover={{ scale: 1.03, borderColor: 'rgba(16,185,129,0.5)', color: '#34d399' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('investigate')}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-200 px-6 py-3 rounded-full bg-slate-900 border border-slate-700/80 transition-all shadow-xs cursor-pointer"
          >
            <span>Start an investigation with your own evidence</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};