import React from 'react';
import { motion } from 'motion/react';
import { Eye, ShieldCheck, HelpCircle, LifeBuoy } from 'lucide-react';
import { ViewMode } from '../types';

interface TrustPrivacySectionProps {
  onNavigate?: (view: ViewMode) => void;
  onOpenAboutModal?: () => void;
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

const pillarVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

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
    <section className="py-16 md:py-24 bg-[#0B0F17] border-b border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-4 border border-emerald-500/20">
            <span>TRUST & PRIVACY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Built around victim safety.
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            Transparent forensic reasoning, privacy-first evidence isolation, and actionable recovery pathways.
          </p>
        </motion.div>

        {/* 4 Trust Pillars with Motion */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.id}
                id={`trust-pillar-${pillar.id}`}
                variants={pillarVariants}
                whileHover={{
                  y: -6,
                  borderColor: 'rgba(16,185,129,0.35)',
                  boxShadow: '0 20px 35px -10px rgba(16,185,129,0.1)',
                  transition: { duration: 0.25 },
                }}
                className="bg-slate-900/80 hover:bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg shadow-black/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <motion.div
                    whileHover={{ scale: 1.12, rotate: 2 }}
                    className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 flex items-center justify-center mb-4 transition-transform"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  <h3 className="text-base font-bold text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};


