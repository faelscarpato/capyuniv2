import React, { Suspense, lazy } from 'react';
import { useUIStore } from '../../stores/uiStore';

const CapyChat = lazy(() => import('../capy/CapyChat').then((mod) => ({ default: mod.CapyChat })));
const WebPreview = lazy(() => import('../preview/WebPreview').then((mod) => ({ default: mod.WebPreview })));
const CapyUniverseView = lazy(() =>
  import('../capy/CapyUniverseView').then((mod) => ({ default: mod.CapyUniverseView }))
);

export const RightSidebar: React.FC = () => {
  const { isRightSidebarOpen, activeRightSidebarView } = useUIStore();

  if (!isRightSidebarOpen) return null;

  return (
    <div className="w-full border-l border-ide-activity h-full bg-ide-sidebar flex flex-col overflow-hidden shadow-xl z-10">
      <Suspense fallback={<div className="h-full w-full animate-pulse bg-ide-sidebar/70" />}>
        {activeRightSidebarView === 'chat' && <CapyChat />}
        {activeRightSidebarView === 'preview' && <WebPreview />}
        {activeRightSidebarView === 'capyuniverse' && <CapyUniverseView />}
      </Suspense>
    </div>
  );
};

