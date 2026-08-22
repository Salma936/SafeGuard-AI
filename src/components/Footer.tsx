import React from 'react';
import { ViewMode } from '../types';

interface FooterProps {
  onNavigate: (view: ViewMode) => void;
  onOpenModal: (modal: 'services' | 'pricing' | 'company' | 'blog' | 'signin') => void;
  onScrollToSection?: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenModal, onScrollToSection }) => {
  const handleNavClick = (sectionId: string) => {
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    }
  };

  return (
    <footer className="border-t border-slate-800/80 bg-[#070A0F] py-12 px-6 sm:px-8 lg:px-12 flex flex-col justify-center text-slate-300">
      <div className="max-w-7xl mx-auto w-full">
        {/* Top bar: Brand, Lifecycle phases, Victim Safety summary */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8 pb-8 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-12">
            {/* Brand Logo */}
            <button
              onClick={() => onNavigate('landing')}
              className="text-base font-bold tracking-tight flex items-center gap-2 text-white group focus:outline-none"
            >
              <span className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-slate-950">
                <span className="w-2 h-2 bg-slate-950 rounded-xs"></span>
              </span>
              <span>SafeGuard AI</span>
            </button>

            {/* Lifecycle Phase Markers */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Submit</span>
                <span className="text-xs font-bold text-slate-300">01 Evidence</span>
              </div>
              <div className="w-6 sm:w-8 h-[1px] bg-slate-800 hidden sm:block"></div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Analyze</span>
                <span className="text-xs font-bold text-slate-300">02 Investigate</span>
              </div>
              <div className="w-6 sm:w-8 h-[1px] bg-slate-800 hidden sm:block"></div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Act</span>
                <span className="text-xs font-bold text-slate-300">03 Protect</span>
              </div>
              <div className="w-6 sm:w-8 h-[1px] bg-slate-800 hidden sm:block"></div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Restore</span>
                <span className="text-xs font-bold text-slate-300">04 Recover</span>
              </div>
            </div>
          </div>

          {/* Victim safety summary */}
          <div className="lg:text-right">
            <p className="text-sm font-bold text-white mb-1">Built around victim safety.</p>
            <p className="text-xs text-slate-400">Transparent analysis &bull; Privacy-conscious &bull; Actionable guidance</p>
          </div>
        </div>

        {/* Middle Navigation bar: Home | Live Demo | How It Works | About */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
            <button
              id="footer-nav-home"
              onClick={() => onNavigate('landing')}
              className="hover:text-white transition-colors"
            >
              Home
            </button>
            <button
              id="footer-nav-live-demo"
              onClick={() => handleNavClick('live-demo')}
              className="hover:text-emerald-400 transition-colors text-emerald-400 font-bold"
            >
              Live Demo
            </button>
            <button
              id="footer-nav-how-it-works"
              onClick={() => handleNavClick('how-it-works')}
              className="hover:text-white transition-colors"
            >
              How It Works
            </button>
            <button
              id="footer-nav-about"
              onClick={() => onOpenModal('company')}
              className="hover:text-white transition-colors"
            >
              About
            </button>
          </nav>

          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>All systems operational &bull; Engine v2.4</span>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 font-medium gap-2">
          <span>AI-powered digital safety assistant for cyber-abuse response.</span>
          <div className="flex gap-4 uppercase tracking-widest text-[10px] font-mono">
            <span>&copy; {new Date().getFullYear()} SafeGuard AI</span>
            <button onClick={() => onOpenModal('company')} className="hover:text-slate-300 transition-colors">Privacy Policy</button>
            <button onClick={() => onOpenModal('services')} className="hover:text-slate-300 transition-colors">Security Architecture</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

