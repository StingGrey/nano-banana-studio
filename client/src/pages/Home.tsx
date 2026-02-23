/**
 * Home Page: Kawaii Bubble Pop Design — Nano Banana Studio
 * Main application page combining all components
 */

import { StudioProvider, useStudio } from '@/contexts/StudioContext';
import BubbleBackground from '@/components/BubbleBackground';
import Sidebar from '@/components/Sidebar';
import ParamsPanel from '@/components/ParamsPanel';
import MainCanvas from '@/components/MainCanvas';
import SettingsDialog from '@/components/SettingsDialog';
import ThemeToggle from '@/components/ThemeToggle';
import LoadingAnimation from '@/components/LoadingAnimation';
import WelcomeGuide from '@/components/WelcomeGuide';

function StudioContent() {
  const { isGenerating, progress } = useStudio();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated bubble background */}
      <BubbleBackground />

      {/* Main layout */}
      <Sidebar />
      <MainCanvas />
      <ParamsPanel />

      {/* Overlays */}
      <SettingsDialog />
      <ThemeToggle />
      <LoadingAnimation isVisible={isGenerating} progress={progress} />
      <WelcomeGuide />
    </div>
  );
}

export default function Home() {
  return (
    <StudioProvider>
      <StudioContent />
    </StudioProvider>
  );
}
