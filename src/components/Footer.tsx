import React from 'react';
import { ViewMode } from '../types';
import { LiveStatusIndicator } from './LiveStatusIndicator';

interface FooterProps {
  onNavigate: (view: ViewMode) => void;
  onOpenModal: (modal: 'about' | 'services' | 'pricing' | 'company' | 'blog' | 'signin') => void;
  onScrollToSection?: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenModal, onScrollToSection }) => {
  const handleNavClick = (sectionId: string) => {
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    }
  };

  return (
    <footer
      className="border-t border-white/[0.06] py-12 px-6 sm:px-8 lg:px-12 flex flex-col justify-center text-[#7A8794]"
      style={{
        background: 'rgba(6, 8, 11, 0.9)',
      }}
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Top bar: Brand, Lifecycle phases, Victim Safety summary */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8 pb-8 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-12">
            {/* Brand Logo */}
            <button
              onClick={() => onNavigate('landing')}
              className="text-base font-semibold tracking-tight flex items-center gap-2 text-[#E8ECEF] group focus:outline-none cursor-pointer"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span className="w-5 h-5 bg-[#5FC9E8] rounded-md flex items-center justify-center text-[#0A0D10] shadow-[0_0_8px_rgba(95,201,232,0.3)]">
                <span className="w-2 h-2 bg-[#0A0D10] rounded-xs" />
              </span>
              <span>SafeGuard AI</span>
            </button>

            {/* Lifecycle Phase Markers */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#4A5560] font-bold uppercase tracking-widest mb-0.5 font-mono">Submit</span>
                <span className="text-xs font-semibold text-[#E8ECEF] font-mono">01 Evidence</span>
              </div>
              <div className="w-6 sm:w-8 h-[1px] bg-white/[0.06] hidden sm:block" />

              <div className="flex flex-col">
                <span className="text-[10px] text-[#4A5560] font-bold uppercase tracking-widest mb-0.5 font-mono">Analyze</span>
                <span className="text-xs font-semibold text-[#E8ECEF] font-mono">02 Investigate</span>
              </div>
              <div className="w-6 sm:w-8 h-[1px] bg-white/[0.06] hidden sm:block" />

              <div className="flex flex-col">
                <span className="text-[10px] text-[#4A5560] font-bold uppercase tracking-widest mb-0.5 font-mono">Act</span>
                <span className="text-xs font-semibold text-[#E8ECEF] font-mono">03 Protect</span>
              </div>
              <div className="w-6 sm:w-8 h-[1px] bg-white/[0.06] hidden sm:block" />

              <div className="flex flex-col">
                <span className="text-[10px] text-[#4A5560] font-bold uppercase tracking-widest mb-0.5 font-mono">Restore</span>
                <span className="text-xs font-semibold text-[#E8ECEF] font-mono">04 Recover</span>
              </div>
            </div>
          </div>

          {/* Victim safety summary */}
          <div className="lg:text-right">
            <p className="text-sm font-semibold text-[#E8ECEF] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Built around victim safety.
            </p>
            <p className="text-xs text-[#7A8794]">Transparent analysis &bull; Privacy-conscious &bull; Actionable guidance</p>
          </div>
        </div>

        {/* Middle Navigation bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-[#7A8794]">
            <button
              id="footer-nav-home"
              onClick={() => onNavigate('landing')}
              className="hover:text-[#E8ECEF] transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              id="footer-nav-live-demo"
              onClick={() => handleNavClick('live-demo')}
              className="hover:text-[#8ee1f9] transition-colors text-[#5FC9E8] font-bold cursor-pointer"
            >
              Live Demo
            </button>
            <button
              id="footer-nav-how-it-works"
              onClick={() => handleNavClick('how-it-works')}
              className="hover:text-[#E8ECEF] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              id="footer-nav-about"
              onClick={() => onOpenModal('company')}
              className="hover:text-[#E8ECEF] transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          <LiveStatusIndicator
            status="active"
            label="All systems operational · Engine v2.4"
            size="sm"
          />
        </div>

        {/* Bottom copyright line */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[#4A5560] font-medium gap-2">
          <span>AI-powered digital safety assistant for cyber-abuse response.</span>
          <div className="flex gap-4 uppercase tracking-widest text-[10px] font-mono">
            <span>&copy; {new Date().getFullYear()} SafeGuard AI</span>
            <button onClick={() => onOpenModal('company')} className="hover:text-[#7A8794] transition-colors cursor-pointer">
              Privacy Policy
            </button>
            <button onClick={() => onOpenModal('services')} className="hover:text-[#7A8794] transition-colors cursor-pointer">
              Security Architecture
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
