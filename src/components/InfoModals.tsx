import React from 'react';
import { X, ShieldAlert, Lock, Zap, Globe, Mail, ArrowRight } from 'lucide-react';
import { ViewMode } from '../types';

type ModalType = 'about' | 'signin' | 'services' | 'pricing' | 'company' | 'blog' | null;

interface InfoModalsProps {
  activeModal: ModalType;
  onClose: () => void;
  onNavigate: (view: ViewMode) => void;
}

const Backdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    role="dialog"
    aria-modal="true"
  >
    {children}
  </div>
);

const ModalPanel: React.FC<{ onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ onClose, children, wide }) => (
  <div
    className={`relative bg-[#0D1117] border border-slate-800 rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
    onClick={(e) => e.stopPropagation()}
  >
    <button
      id="modal-close-btn"
      onClick={onClose}
      className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors z-10"
      aria-label="Close modal"
    >
      <X className="w-4 h-4" />
    </button>
    {children}
  </div>
);

const AboutModal: React.FC<{ onClose: () => void; onNavigate: (v: ViewMode) => void }> = ({ onClose, onNavigate }) => (
  <ModalPanel onClose={onClose} wide>
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.15)]">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">About SafeGuard AI</h2>
          <p className="text-xs text-slate-500 font-mono">Digital Safety Intelligence Platform</p>
        </div>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed mb-5">
        SafeGuard AI is an advanced cybersecurity investigation platform built to help individuals and organizations
        detect, document, and respond to cyber-abuse threats including phishing, social engineering, financial fraud,
        extortion, and account takeover attempts.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: Zap, title: 'Instant Analysis', desc: 'AI-powered threat detection in seconds' },
          { icon: Lock, title: 'Privacy First', desc: 'Evidence processed securely and confidentially' },
          { icon: Globe, title: 'Comprehensive', desc: 'Text, URL, image, and audio analysis' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <Icon className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-sm font-bold text-white mb-1">{title}</p>
            <p className="text-xs text-slate-400">{desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-6">
        <p className="text-xs text-emerald-300 font-mono font-bold uppercase tracking-wider mb-1">Engine Version</p>
        <p className="text-sm text-slate-300">SafeGuard AI Engine v2.4.0 · Powered by Gemini</p>
      </div>
      <button
        id="about-modal-get-started-btn"
        onClick={() => { onClose(); onNavigate('investigate'); }}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-full transition-all inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
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
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_16px_rgba(16,185,129,0.15)]">
          <ShieldAlert className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Sign In to SafeGuard AI</h2>
        <p className="text-sm text-slate-400">Access your investigation workspace</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onClose(); onNavigate('investigate'); }} className="space-y-4">
        <div>
          <label htmlFor="signin-email" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>
        </div>
        <div>
          <label htmlFor="signin-password" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="signin-password"
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>
        </div>
        <button
          id="signin-submit-btn"
          type="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] mt-2"
        >
          Sign In
        </button>
      </form>
      <p className="text-center text-xs text-slate-500 mt-4">
        No account?{' '}
        <button
          id="signin-continue-guest-btn"
          onClick={() => { onClose(); onNavigate('investigate'); }}
          className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
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
      <h2 className="text-xl font-bold text-white mb-6">{title}</h2>
      <div className="text-sm text-slate-300 leading-relaxed space-y-4">{content}</div>
    </div>
  </ModalPanel>
);

export const InfoModals: React.FC<InfoModalsProps> = ({ activeModal, onClose, onNavigate }) => {
  if (!activeModal) return null;

  return (
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
              <ul className="space-y-2 list-disc list-inside text-slate-400">
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
                <ul className="space-y-2 list-disc list-inside text-slate-400">
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
  );
};
