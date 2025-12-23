import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { Explorer } from '../explorer/Explorer';
import { SearchView } from '../search/SearchView';
import { DocsView } from '../capy/DocsView';
import { CommunityView } from '../capy/CommunityView';
import { BlogView } from '../capy/BlogView';
import { PricingView } from '../capy/PricingView';
import { ExtensionsView } from '../extensions/ExtensionsView';
import { GroundingView } from '../grounding/GroundingView';
import { NanoBananaView } from '../nano/NanoBananaView';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, activeSidebarView } = useUIStore();

  if (!isSidebarOpen) return null;

  return (
    <div className="w-full border-r border-ide-activity h-full bg-ide-sidebar flex flex-col overflow-hidden">
      {activeSidebarView === 'explorer' && <Explorer />}
      {activeSidebarView === 'search' && <SearchView />}
      {activeSidebarView === 'extensions' && <ExtensionsView />}
      {activeSidebarView === 'docs' && <DocsView />}
      {activeSidebarView === 'community' && <CommunityView />}
      {activeSidebarView === 'blog' && <BlogView />}
      {activeSidebarView === 'pricing' && <PricingView />}
      {activeSidebarView === 'grounding' && <GroundingView />}
      {activeSidebarView === 'nano-banana' && <NanoBananaView />}
      
      {['settings', 'run'].includes(activeSidebarView) && (
        <div className="p-4 text-gray-400 text-sm flex items-center justify-center h-full text-center">
            {`View "${activeSidebarView}" is currently active in the main panel or settings dialog.`}
        </div>
      )}
    </div>
  );
};