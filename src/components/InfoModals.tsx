import React from 'react';
import { X, Check, ArrowRight, ShieldCheck, Mail, BookOpen, Building2, CreditCard } from 'lucide-react';
import { ViewMode } from '../types';

interface InfoModalsProps {
  activeModal: 'services' | 'pricing' | 'company' | 'blog' | 'signin' | null;
  onClose: () => void;
  onNavigate: (view: ViewMode) => void;
}

export const InfoModals: React.FC<InfoModalsProps> = ({ activeModal, onClose, onNavigate }) => {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Contents based on activeModal */}
        {activeModal === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">SafeGuard Security Architecture</h3>
                <p className="text-sm text-slate-400">Comprehensive cyber safety & incident response solutions</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-white text-sm">Personal Cyber-Abuse Response</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Rapid forensic triage for stalking, non-consensual imagery, unauthorized account access, and extortion.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-white text-sm">Enterprise Identity & Phishing Triage</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Employee-facing suspicious email and smishing analyzer with reverse proxy AiTM detection.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-white text-sm">Evidence Packet Preparation</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Standardized JSON/PDF incident packages formatted with cryptographic hashes for IC3 / FTC filing.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  onClose();
                  onNavigate('investigate');
                }}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-full transition-all shadow-xs"
              >
                Launch Investigation Studio
              </button>
            </div>
          </div>
        )}

        {activeModal === 'pricing' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Transparent Pricing</h3>
                <p className="text-sm text-slate-400">Free emergency triage for individuals, pro protection for organizations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Individual Safety
                  </span>
                  <div className="text-2xl font-extrabold text-white mt-3">$0 <span className="text-sm font-normal text-slate-400">/ always free</span></div>
                  <p className="text-xs text-slate-400 mt-2">
                    Immediate emergency incident triage, timeline reconstruction, and recovery checklist generation.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Unlimited multimodal scans</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Timeline milestone mapping</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> PDF / JSON Evidence export</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('investigate');
                  }}
                  className="mt-6 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-full transition-colors"
                >
                  Start Free Triage
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    Organizational Team
                  </span>
                  <div className="text-2xl font-extrabold text-white mt-3">$29 <span className="text-sm font-normal text-slate-400">/ analyst / mo</span></div>
                  <p className="text-xs text-slate-400 mt-2">
                    Advanced threat intelligence correlation, team case collaboration, and automated registrar escalations.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Centralized team workspace</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Automated registrar escalation</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> SIEM / Webhook integrations</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('investigate');
                  }}
                  className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-full transition-colors border border-slate-700"
                >
                  Request Team Trial
                </button>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'company' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">About SafeGuard AI</h3>
                <p className="text-sm text-slate-400">Democratizing cyber-investigation for digital safety</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              SafeGuard was founded by digital security researchers, human rights technologists, and threat analysts. We believe that when ordinary people encounter stalkerware, phishing lures, or online coercion, they deserve immediate, high-grade forensic clarity—not confusing technical jargon or dismissive responses.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <div className="text-lg font-bold text-white">100% Focused</div>
                <div className="text-xs text-slate-400">On Victim Safety & Recovery</div>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <div className="text-lg font-bold text-emerald-400 font-mono">Deterministic</div>
                <div className="text-xs text-slate-400">Verifiable Evidence Chains</div>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'signin' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Sign In to SafeGuard</h3>
                <p className="text-sm text-slate-400">Access saved incident records and workspace</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onClose();
                onNavigate('investigate');
              }}
              className="space-y-3.5 pt-2"
            >
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="analyst@organization.com"
                  defaultValue="analyst@safeguard-ai.org"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Password or Passkey
                </label>
                <input
                  type="password"
                  defaultValue="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-full transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>Continue to Investigation Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-center text-slate-500 pt-2 font-mono">
                Tip: No account is required to use the investigation tool or live demo.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

