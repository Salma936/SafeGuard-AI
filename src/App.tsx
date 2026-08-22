/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewMode, IncidentCase } from './types';
import { DEMO_INCIDENTS } from './data/demoIncidents';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeatureSection } from './components/FeatureSection';
import { LiveDemoSection } from './components/LiveDemoSection';
import { HowItWorks } from './components/HowItWorks';
import { TrustPrivacySection } from './components/TrustPrivacySection';
import { Footer } from './components/Footer';
import { InfoModals } from './components/InfoModals';
import { InvestigationWorkspace } from './components/InvestigationWorkspace';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
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
    <div className="min-h-screen bg-[#090D14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <AnimatePresence mode="wait">
        {viewMode === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <Header
              currentView={viewMode}
              onNavigate={handleNavigate}
              onScrollToSection={handleScrollToSection}
              onOpenModal={(modal) => setActiveModal(modal)}
            />

            <main className="flex-1">
              <Hero
                onNavigate={handleNavigate}
                onScrollToSection={handleScrollToSection}
              />

              <FeatureSection
                onNavigate={handleNavigate}
              />

              <LiveDemoSection
                onNavigate={handleNavigate}
                onSelectDemoCase={handleSelectDemoCase}
              />

              <HowItWorks
                onNavigate={handleNavigate}
              />

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
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <InvestigationWorkspace
              initialMode={viewMode}
              onNavigate={handleNavigate}
              selectedDemoCase={selectedDemoCase}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popups and Nav Modals */}
      <InfoModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

