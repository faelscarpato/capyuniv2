import React, { useEffect, useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { WelcomeScreen } from './components/layout/WelcomeScreen';
import { useWorkspaceStore } from './stores/workspaceStore';
import { useUIStore } from './stores/uiStore';
import registerServiceWorker from './registerServiceWorker';

// Após renderizar o React:




const App: React.FC = () => {
  const { initialize } = useWorkspaceStore();
  const { currentTheme } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
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

  if (showWelcome) {
      return <WelcomeScreen onLaunch={() => setShowWelcome(false)} />;
  }

  return <MainLayout />;
};

registerServiceWorker();

export default App;