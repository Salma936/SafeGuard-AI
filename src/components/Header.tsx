import React, { useState } from 'react';
import { ArrowRight, Menu, X, ShieldAlert } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenModal: (modal: 'about' | 'signin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onScrollToSection,
  onOpenModal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D14]/90 backdrop-blur-md border-b border-slate-800/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <button
            id="header-brand-logo"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-all">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white tracking-tight">SafeGuard</span>
              <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI
              </span>
            </div>
          </button>

          {/* Center Navigation: Home | Live Demo | How It Works | About */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <button
              id="nav-home-btn"
              onClick={() => {
                onNavigate('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors hover:text-white ${
                currentView === 'landing' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              Home
            </button>

            <button
              id="nav-live-demo-btn"
              onClick={() => onScrollToSection('live-demo')}
              className="hover:text-white transition-colors flex items-center gap-2 text-slate-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Demo</span>
            </button>

            <button
              id="nav-how-it-works-btn"
              onClick={() => onScrollToSection('how-it-works')}
              className="hover:text-white transition-colors"
            >
              How It Works
            </button>

            <button
              id="nav-about-btn"
              onClick={() => onScrollToSection('about')}
              className="hover:text-white transition-colors"
            >
              About
            </button>
          </nav>

          {/* Right Actions: Sign In & Get Started */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <button
              id="nav-signin-btn"
              onClick={() => onOpenModal('signin')}
              className="text-slate-300 hover:text-white font-medium px-3 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              id="nav-get-started-btn"
              onClick={() => onNavigate('investigate')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-[0.98] inline-flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#090D14] px-6 pt-3 pb-6 space-y-2">
          <button
            id="mobile-nav-home"
            onClick={() => {
              onNavigate('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-200 hover:bg-slate-800/50"
          >
            Home
          </button>
          <button
            id="mobile-nav-demo"
            onClick={() => {
              onScrollToSection('live-demo');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-emerald-400 bg-emerald-500/10 flex items-center justify-between"
          >
            <span>Live Demo</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">Live</span>
          </button>
          <button
            id="mobile-nav-how-it-works"
            onClick={() => {
              onScrollToSection('how-it-works');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-200 hover:bg-slate-800/50"
          >
            How It Works
          </button>
          <button
            id="mobile-nav-about"
            onClick={() => {
              onScrollToSection('about');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-200 hover:bg-slate-800/50"
          >
            About
          </button>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <button
              id="mobile-nav-signin"
              onClick={() => {
                onOpenModal('signin');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 text-center text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-full"
            >
              Sign In
            </button>
            <button
              id="mobile-nav-getstarted"
              onClick={() => {
                onNavigate('investigate');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 text-center text-sm font-bold text-slate-950 bg-emerald-500 rounded-full flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

