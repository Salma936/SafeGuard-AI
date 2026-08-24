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
    <header className="sticky top-0 z-40 w-full bg-[#090D14]/90 backdrop-blur-md border-b border-slate-800/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <motion.button
            id="header-brand-logo"
            onClick={() => onNavigate('landing')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white group focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-all duration-300">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white tracking-tight">SafeGuard</span>
              <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI
              </span>
            </div>
          </motion.button>

          {/* Center Navigation: Home | Live Demo | How It Works | About */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <motion.button
              id="nav-home-btn"
              whileHover={{ scale: 1.05, color: '#f8fafc' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onNavigate('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors cursor-pointer ${
                currentView === 'landing' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              Home
            </motion.button>

            <motion.button
              id="nav-live-demo-btn"
              whileHover={{ scale: 1.05, color: '#f8fafc' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onScrollToSection('live-demo')}
              className="hover:text-white transition-colors flex items-center gap-2 text-slate-300 cursor-pointer"
            >
              <LiveStatusIndicator size="sm" status="active" />
              <span>Live Demo</span>
            </motion.button>

            <motion.button
              id="nav-how-it-works-btn"
              whileHover={{ scale: 1.05, color: '#f8fafc' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onScrollToSection('how-it-works')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </motion.button>

            <motion.button
              id="nav-about-btn"
              whileHover={{ scale: 1.05, color: '#f8fafc' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onScrollToSection('about')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </motion.button>
          </nav>

          {/* Right Actions: Notification Bell, Sign In & Get Started */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            {/* Animated Alert Notification Bell */}
            <motion.button
              id="header-notification-bell"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setHasAlert(false);
                onNavigate('investigate');
              }}
              className="relative p-2 rounded-full text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              title="Recent Threat Alerts"
            >
              <motion.div
                animate={
                  hasAlert
                    ? {
                        rotate: [0, -12, 12, -8, 8, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 1.2,
                  repeat: hasAlert ? Infinity : 0,
                  repeatDelay: 3.5,
                }}
              >
                <Bell className="w-4 h-4" />
              </motion.div>
              {hasAlert && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              )}
            </motion.button>

            <motion.button
              id="nav-signin-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpenModal('signin')}
              className="text-slate-300 hover:text-white font-medium px-4 py-2 rounded-full hover:bg-slate-900/80 transition-all cursor-pointer"
            >
              Sign In
            </motion.button>

            <motion.button
              id="nav-get-started-btn"
              whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(16,185,129,0.45)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('investigate')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.25)] inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setHasAlert(false);
                onNavigate('investigate');
              }}
              className="relative p-2 rounded-full text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800"
            >
              <Bell className="w-4 h-4" />
              {hasAlert && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              )}
            </motion.button>

            <motion.button
              id="mobile-menu-toggle-btn"
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer with Spring animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="md:hidden border-b border-slate-800 bg-[#090D14] px-6 pt-3 pb-6 space-y-2 overflow-hidden"
          >
            <motion.button
              id="mobile-nav-home"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onNavigate('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium rounded-2xl text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              Home
            </motion.button>
            <motion.button
              id="mobile-nav-demo"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onScrollToSection('live-demo');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium rounded-2xl text-emerald-400 bg-emerald-500/10 flex items-center justify-between transition-colors"
            >
              <span>Live Demo</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">Live</span>
            </motion.button>
            <motion.button
              id="mobile-nav-how-it-works"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onScrollToSection('how-it-works');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium rounded-2xl text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              How It Works
            </motion.button>
            <motion.button
              id="mobile-nav-about"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onScrollToSection('about');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium rounded-2xl text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              About
            </motion.button>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              <motion.button
                id="mobile-nav-signin"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onOpenModal('signin');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-full transition-colors"
              >
                Sign In
              </motion.button>
              <motion.button
                id="mobile-nav-getstarted"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNavigate('investigate');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-bold text-slate-950 bg-emerald-500 rounded-full flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};