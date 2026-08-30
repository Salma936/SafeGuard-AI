/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ViewMode, IncidentCase } from './types';
import { DEMO_INCIDENTS } from './data/demoIncidents';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { LiveDemoSection } from './components/LiveDemoSection';
import { HowItWorks } from './components/HowItWorks';
import { TrustPrivacySection } from './components/TrustPrivacySection';
import { Footer } from './components/Footer';
import { InfoModals } from './components/InfoModals';
import { InvestigationWorkspace } from './components/InvestigationWorkspace';
import ScreenshotAnalyzer from './components/ScreenshotAnalyzer';
import { AnimatedPage } from './components/AnimatedPage';
import { AmbientBackground } from './components/AmbientBackground';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view') as ViewMode;
    return v === 'investigate' || v === 'live-demo' || v === 'screenshot-analyzer' ? v : 'landing';
  });
  const [activeModal, setActiveModal] = useState<'about' | 'signin' | 'services' | 'pricing' | 'company' | 'blog' | null>(null);
  const [selectedDemoCase, setSelectedDemoCase] = useState<IncidentCase>(DEMO_INCIDENTS[0]);

  const handleNavigate = (view: ViewMode) => {
    setViewMode(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSection = (sectionId: string) => {
    if (viewMode !== 'landing') {
      setViewMode('landing');
      setTimeout(() => {
        const elem = document.getElementById(sectionId);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const elem = document.getElementById(sectionId);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSelectDemoCase = (incident: IncidentCase) => {
    setSelectedDemoCase(incident);
    setViewMode('live-demo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#06080B] text-[#E8ECEF] flex flex-col relative selection:bg-[#5FC9E8]/20 selection:text-[#5FC9E8]">
      {/* Site-wide Ambient Radiating Burst Canvas Background */}
      <AmbientBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <AnimatePresence mode="wait">
          {viewMode === 'landing' ? (
            <AnimatedPage key="landing">
              <Header
                currentView={viewMode}
                onNavigate={handleNavigate}
                onScrollToSection={handleScrollToSection}
                onOpenModal={(modal) => setActiveModal(modal)}
              />

              <main className="flex-1 w-full min-w-0">
                {/* 1. Hero Section */}
                <Hero
                  onNavigate={handleNavigate}
                  onScrollToSection={handleScrollToSection}
                />

                {/* 2. Live Demo / Proof Section (Merged Core Capabilities) */}
                <LiveDemoSection
                  onNavigate={handleNavigate}
                  onSelectDemoCase={handleSelectDemoCase}
                />

                {/* 3. How It Works (Single 4-Step Process) */}
                <HowItWorks
                  onNavigate={handleNavigate}
                />

                {/* 4. Trust & Privacy (Compact Icon Strip directly above Footer) */}
                <TrustPrivacySection
                  onNavigate={handleNavigate}
                  onOpenAboutModal={() => setActiveModal('about')}
                />
              </main>

              <Footer
                onNavigate={handleNavigate}
                onScrollToSection={handleScrollToSection}
                onOpenModal={(modal) => setActiveModal(modal)}
              />
            </AnimatedPage>
          ) : viewMode === 'screenshot-analyzer' ? (
            <AnimatedPage key="screenshot-analyzer">
              <ScreenshotAnalyzer onNavigate={handleNavigate} />
            </AnimatedPage>
          ) : (
            <AnimatedPage key="workspace">
              <InvestigationWorkspace
                initialMode={viewMode}
                onNavigate={handleNavigate}
                selectedDemoCase={selectedDemoCase}
              />
            </AnimatedPage>
          )}
        </AnimatePresence>
      </div>

      {/* Popups and Nav Modals */}
      <InfoModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
