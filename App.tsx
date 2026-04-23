import React, { useEffect, useState, Suspense } from 'react';
const MainLayout = React.lazy(() => import('./components/layout/MainLayout').then(module => ({ default: module.MainLayout })));
const WelcomeScreen = React.lazy(() => import('./components/layout/WelcomeScreen').then(module => ({ default: module.WelcomeScreen })));
import { useWorkspaceStore } from './stores/workspaceStore';
import { useOnboardingStore } from './features/onboarding/store/onboardingStore';
import { registerDefaultCommands } from './core/commands/handlers/registerDefaultCommands';
import registerServiceWorker from './registerServiceWorker';

const App: React.FC = () => {
  const { initialize } = useWorkspaceStore();
  const { hasCompletedWelcome, markWelcomeCompleted } = useOnboardingStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registerDefaultCommands();
    initialize().then(() => {
      // Simulate a small delay for "checking resources" feel or just load fast
      setTimeout(() => setLoading(false), 500);
    });
  }, [initialize]);

  if (loading) {
     // Minimal pre-loader while IndexedDB connects
    return (
      <div className="h-screen w-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasCompletedWelcome) {
    return (
      <Suspense fallback={<div className="h-screen w-screen bg-[#0F172A] flex items-center justify-center"><div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>}>
        <WelcomeScreen onLaunch={markWelcomeCompleted} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#0F172A] flex items-center justify-center"><div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>}>
      <MainLayout />
    </Suspense>
  );
};

registerServiceWorker();

export default App;
