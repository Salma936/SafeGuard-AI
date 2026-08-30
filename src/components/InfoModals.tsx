import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Lock, Zap, Globe, Mail, ArrowRight } from 'lucide-react';
import { ViewMode } from '../types';

type ModalType = 'about' | 'signin' | 'services' | 'pricing' | 'company' | 'blog' | null;

interface InfoModalsProps {
  activeModal: ModalType;
  onClose: () => void;
  onNavigate: (view: ViewMode) => void;
}

const Backdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    role="dialog"
    aria-modal="true"
  >
    {children}
  </motion.div>
);

const ModalPanel: React.FC<{ onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ onClose, children, wide }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 12 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 8 }}
    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    className={`relative rounded-[24px] shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
    style={{
      background: 'rgba(13, 17, 22, 0.95)',
      backdropFilter: 'blur(20px) saturate(140%)',
      WebkitBackdropFilter: 'blur(20px) saturate(140%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(95, 201, 232, 0.08)',
    }}
    onClick={(e) => e.stopPropagation()}
  >
    <button
      id="modal-close-btn"
      onClick={onClose}
      className="absolute top-4 right-4 p-2 rounded-full text-[#7A8794] hover:text-[#E8ECEF] hover:bg-white/[0.06] transition-all z-10 cursor-pointer"
      aria-label="Close modal"
    >
      <X className="w-4 h-4" />
    </button>
    {children}
  </motion.div>
);

const AboutModal: React.FC<{ onClose: () => void; onNavigate: (v: ViewMode) => void }> = ({ onClose, onNavigate }) => (
  <ModalPanel onClose={onClose} wide>
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#0D1116] border border-[#5FC9E8]/30 flex items-center justify-center text-[#5FC9E8] shadow-[0_0_16px_rgba(95,201,232,0.15)]">
          <ShieldAlert className="w-5 h-5 text-[#5FC9E8]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#E8ECEF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            About SafeGuard AI
          </h2>
          <p className="text-xs text-[#7A8794] font-mono">Digital Safety Intelligence Platform</p>
        </div>
      </div>
      <p className="text-[#7A8794] text-sm leading-relaxed mb-5">
        SafeGuard AI is an advanced cybersecurity investigation platform built to help individuals and organizations
        detect, document, and respond to cyber-abuse threats including phishing, social engineering, financial fraud,
        extortion, and account takeover attempts.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: Zap, title: 'Instant Analysis', desc: 'AI-powered threat detection in seconds' },
          { icon: Lock, title: 'Privacy First', desc: 'Evidence processed securely and confidentially' },
          { icon: Globe, title: 'Comprehensive', desc: 'Text, URL, image, audio, and video analysis' },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="bg-[#06080B]/80 border border-white/[0.06] rounded-2xl p-4 hover:border-[#5FC9E8]/30 transition-colors"
          >
            <Icon className="w-5 h-5 text-[#5FC9E8] mb-2" />
            <p className="text-sm font-semibold text-[#E8ECEF] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</p>
            <p className="text-xs text-[#7A8794]">{desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#5FC9E8]/5 border border-[#5FC9E8]/20 rounded-2xl p-4 mb-6">
        <p className="text-xs text-[#5FC9E8] font-mono font-bold uppercase tracking-wider mb-1">Engine Version</p>
        <p className="text-sm text-[#E8ECEF]">SafeGuard AI Engine v2.4.0 &bull; Powered by Gemini</p>
      </div>
      <button
        id="about-modal-get-started-btn"
        onClick={() => { onClose(); onNavigate('investigate'); }}
        className="w-full bg-[#5FC9E8] hover:bg-[#7be2fe] text-[#0A0D10] font-semibold py-3 px-6 rounded-full transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
        style={{
          boxShadow: '0 8px 24px -6px rgba(95, 201, 232, 0.4)',
        }}
      >
        <span>Start Investigating</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </ModalPanel>
);

const SignInModal: React.FC<{ onClose: () => void; onNavigate: (v: ViewMode) => void }> = ({ onClose, onNavigate }) => (
  <ModalPanel onClose={onClose}>
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#0D1116] border border-[#5FC9E8]/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_16px_rgba(95,201,232,0.15)] text-[#5FC9E8]">
          <ShieldAlert className="w-6 h-6 text-[#5FC9E8]" />
        </div>
        <h2 className="text-xl font-semibold text-[#E8ECEF] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Sign In to SafeGuard AI
        </h2>
        <p className="text-sm text-[#7A8794]">Access your investigation workspace</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onClose(); onNavigate('investigate'); }} className="space-y-4">
        <div>
          <label htmlFor="signin-email" className="block text-xs font-semibold text-[#7A8794] mb-1.5 uppercase tracking-wider font-mono">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5560]" />
            <input
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              className="w-full bg-[#06080B] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3 text-sm text-[#E8ECEF] placeholder-[#4A5560] focus:outline-none focus:border-[#5FC9E8]/60 focus:ring-1 focus:ring-[#5FC9E8]/30 transition-all font-mono"
            />
          </div>
        </div>
        <div>
          <label htmlFor="signin-password" className="block text-xs font-semibold text-[#7A8794] mb-1.5 uppercase tracking-wider font-mono">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5560]" />
            <input
              id="signin-password"
              type="password"
              placeholder="••••••••"
              className="w-full bg-[#06080B] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3 text-sm text-[#E8ECEF] placeholder-[#4A5560] focus:outline-none focus:border-[#5FC9E8]/60 focus:ring-1 focus:ring-[#5FC9E8]/30 transition-all"
            />
          </div>
        </div>
        <button
          id="signin-submit-btn"
          type="submit"
          className="w-full bg-[#5FC9E8] hover:bg-[#7be2fe] text-[#0A0D10] font-semibold py-3 px-6 rounded-full transition-all mt-2 cursor-pointer"
          style={{
            boxShadow: '0 8px 24px -6px rgba(95, 201, 232, 0.4)',
          }}
        >
          Sign In
        </button>
      </form>
      <p className="text-center text-xs text-[#7A8794] mt-4">
        No account?{' '}
        <button
          id="signin-continue-guest-btn"
          onClick={() => { onClose(); onNavigate('investigate'); }}
          className="text-[#5FC9E8] hover:text-[#8ee1f9] underline underline-offset-2 transition-colors cursor-pointer"
        >
          Continue as guest
        </button>
      </p>
    </div>
  </ModalPanel>
);

const GenericModal: React.FC<{ onClose: () => void; title: string; content: React.ReactNode }> = ({ onClose, title, content }) => (
  <ModalPanel onClose={onClose} wide>
    <div className="p-8">
      <h2 className="text-xl font-semibold text-[#E8ECEF] mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
      <div className="text-sm text-[#7A8794] leading-relaxed space-y-4">{content}</div>
    </div>
  </ModalPanel>
);

export const InfoModals: React.FC<InfoModalsProps> = ({ activeModal, onClose, onNavigate }) => {
  return (
    <AnimatePresence>
      {activeModal && (
        <Backdrop onClose={onClose}>
          {activeModal === 'about' && <AboutModal onClose={onClose} onNavigate={onNavigate} />}
          {activeModal === 'signin' && <SignInModal onClose={onClose} onNavigate={onNavigate} />}
          {activeModal === 'services' && (
            <GenericModal
              onClose={onClose}
              title="Security Architecture"
              content={
                <>
                  <p>SafeGuard AI employs a multi-layered security architecture designed to protect sensitive evidence data while delivering accurate threat analysis.</p>
                  <ul className="space-y-2 list-disc list-inside text-[#7A8794]">
                    <li>Client-side evidence isolation before API transmission</li>
                    <li>End-to-end encryption for all evidence payloads</li>
                    <li>Zero data retention policy for analyzed content</li>
                    <li>Gemini AI models running in secure sandboxed environments</li>
                    <li>SHA-256 evidence hashing for integrity verification</li>
                  </ul>
                </>
              }
            />
          )}
          {activeModal === 'pricing' && (
            <GenericModal
              onClose={onClose}
              title="Pricing"
              content={<p>SafeGuard AI is currently in open beta and free to use for all individuals needing digital safety assistance. Enterprise and institutional plans coming soon.</p>}
            />
          )}
          {(activeModal === 'company' || activeModal === 'blog') && (
            <GenericModal
              onClose={onClose}
              title={activeModal === 'company' ? 'Privacy Policy' : 'Blog'}
              content={
                activeModal === 'company' ? (
                  <>
                    <p>SafeGuard AI is committed to protecting user privacy. We do not store, share, or sell any evidence submitted for analysis.</p>
                    <ul className="space-y-2 list-disc list-inside text-[#7A8794]">
                      <li>No evidence content is retained after analysis</li>
                      <li>No personally identifiable information is collected without consent</li>
                      <li>Analysis results are session-scoped and not persisted</li>
                      <li>All transmissions use TLS 1.3 encryption</li>
                    </ul>
                  </>
                ) : (
                  <p>Blog and news articles coming soon. Stay tuned for cybersecurity insights, threat intelligence reports, and digital safety guides.</p>
                )
              }
            />
          )}
        </Backdrop>
      )}
    </AnimatePresence>
  );
};