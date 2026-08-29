import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Menu, X, ShieldAlert, Bell } from 'lucide-react';
import { ViewMode } from '../types';
import { LiveStatusIndicator } from './LiveStatusIndicator';

interface HeaderProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenModal: (modal: 'about' | 'signin' | 'services' | 'pricing' | 'company' | 'blog') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onScrollToSection,
  onOpenModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasAlert, setHasAlert] = useState(true);

  return (
    <header
      className="sticky top-0 z-40 w-full transition-all duration-200"
      style={{
        background: 'rgba(6, 8, 11, 0.75)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <button
            id="header-brand-logo"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[#E8ECEF] group focus:outline-none cursor-pointer"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <div className="w-8 h-8 rounded-xl bg-[#0D1116] border border-[#5FC9E8]/30 flex items-center justify-center text-[#5FC9E8] group-hover:border-[#5FC9E8]/60 shadow-[0_0_12px_rgba(95,201,232,0.15)] transition-all duration-200">
              <ShieldAlert className="w-4 h-4 text-[#5FC9E8]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#E8ECEF] tracking-tight">SafeGuard</span>
              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#5FC9E8]/10 text-[#5FC9E8] border border-[#5FC9E8]/20">
                AI
              </span>
            </div>
          </button>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#7A8794]">
            <button
              id="nav-home-btn"
              onClick={() => {
                onNavigate('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors duration-150 cursor-pointer ${
                currentView === 'landing' ? 'text-[#5FC9E8] font-semibold' : 'hover:text-[#E8ECEF]'
              }`}
            >
              Home
            </button>

            <button
              id="nav-live-demo-btn"
              onClick={() => onScrollToSection('live-demo')}
              className="hover:text-[#E8ECEF] transition-colors duration-150 flex items-center gap-2 text-[#7A8794] cursor-pointer"
            >
              <LiveStatusIndicator size="sm" status="active" />
              <span>Live Demo</span>
            </button>

            <button
              id="nav-how-it-works-btn"
              onClick={() => onScrollToSection('how-it-works')}
              className="hover:text-[#E8ECEF] transition-colors duration-150 cursor-pointer"
            >
              How It Works
            </button>

            <button
              id="nav-about-btn"
              onClick={() => onScrollToSection('about')}
              className="hover:text-[#E8ECEF] transition-colors duration-150 cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            <button
              id="header-notification-bell"
              onClick={() => {
                setHasAlert(false);
                onNavigate('investigate');
              }}
              className="relative p-2 rounded-full text-[#7A8794] hover:text-[#E8ECEF] bg-[#0D1116] hover:bg-[#151B22] border border-white/[0.06] transition-colors cursor-pointer"
              title="Recent Threat Alerts"
            >
              <Bell className="w-4 h-4" />
              {hasAlert && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#5FC9E8] shadow-[0_0_8px_rgba(95,201,232,0.8)]" />
              )}
            </button>

            <button
              id="nav-signin-btn"
              onClick={() => onOpenModal('signin')}
              className="text-[#7A8794] hover:text-[#E8ECEF] font-medium px-4 py-2 rounded-full hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              Sign In
            </button>

            <button
              id="nav-get-started-btn"
              onClick={() => onNavigate('investigate')}
              className="bg-[#5FC9E8] hover:bg-[#7be2fe] text-[#0A0D10] font-semibold px-5 py-2 rounded-full transition-all duration-200 inline-flex items-center gap-2 cursor-pointer"
              style={{
                boxShadow: '0 8px 24px -6px rgba(95, 201, 232, 0.4)',
              }}
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => {
                setHasAlert(false);
                onNavigate('investigate');
              }}
              className="relative p-2 rounded-full text-[#7A8794] hover:text-[#E8ECEF] bg-[#0D1116] border border-white/[0.06]"
            >
              <Bell className="w-4 h-4" />
              {hasAlert && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#5FC9E8]" />
              )}
            </button>

            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-[#7A8794] hover:text-[#E8ECEF] hover:bg-white/[0.04] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-b border-white/[0.06] bg-[#06080B] px-6 pt-3 pb-6 space-y-2 overflow-hidden"
          >
            <button
              id="mobile-nav-home"
              onClick={() => {
                onNavigate('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl text-[#E8ECEF] hover:bg-white/[0.04] transition-colors"
            >
              Home
            </button>
            <button
              id="mobile-nav-demo"
              onClick={() => {
                onScrollToSection('live-demo');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl text-[#5FC9E8] bg-[#5FC9E8]/10 flex items-center justify-between transition-colors"
            >
              <span>Live Demo</span>
              <span className="text-[10px] bg-[#5FC9E8]/20 text-[#5FC9E8] px-2 py-0.5 rounded font-mono">Live</span>
            </button>
            <button
              id="mobile-nav-how-it-works"
              onClick={() => {
                onScrollToSection('how-it-works');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl text-[#E8ECEF] hover:bg-white/[0.04] transition-colors"
            >
              How It Works
            </button>
            <button
              id="mobile-nav-about"
              onClick={() => {
                onScrollToSection('about');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl text-[#E8ECEF] hover:bg-white/[0.04] transition-colors"
            >
              About
            </button>
            <div className="pt-4 border-t border-white/[0.06] flex flex-col gap-2">
              <button
                id="mobile-nav-signin"
                onClick={() => {
                  onOpenModal('signin');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-medium text-[#7A8794] bg-[#0D1116] border border-white/[0.06] rounded-full transition-colors"
              >
                Sign In
              </button>
              <button
                id="mobile-nav-getstarted"
                onClick={() => {
                  onNavigate('investigate');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-semibold text-[#0A0D10] bg-[#5FC9E8] rounded-full flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(95,201,232,0.3)] transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};