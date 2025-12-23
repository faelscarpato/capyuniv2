import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { CapyChat } from '../capy/CapyChat';
import { WebPreview } from '../preview/WebPreview';
import { CapyUniverseView } from '../capy/CapyUniverseView';

export const RightSidebar: React.FC = () => {
  const { isRightSidebarOpen, activeRightSidebarView } = useUIStore();

  if (!isRightSidebarOpen) return null;

  return (
    <div className="w-full border-l border-ide-activity h-full bg-ide-sidebar flex flex-col overflow-hidden shadow-xl z-10">
      {activeRightSidebarView === 'chat' && <CapyChat />}
      {activeRightSidebarView === 'preview' && <WebPreview />}
      {activeRightSidebarView === 'capyuniverse' && <CapyUniverseView />}
    </div>
  );
};