import React, { Suspense, lazy } from 'react';
import { useUIStore } from '../../stores/uiStore';

const Explorer = lazy(() => import('../explorer/Explorer').then((mod) => ({ default: mod.Explorer })));
const SearchView = lazy(() => import('../search/SearchView').then((mod) => ({ default: mod.SearchView })));
const ExtensionsView = lazy(() =>
  import('../extensions/ExtensionsView').then((mod) => ({ default: mod.ExtensionsView }))
);
const DocsView = lazy(() => import('../capy/DocsView').then((mod) => ({ default: mod.DocsView })));
const CommunityView = lazy(() =>
  import('../capy/CommunityView').then((mod) => ({ default: mod.CommunityView }))
);
const BlogView = lazy(() => import('../capy/BlogView').then((mod) => ({ default: mod.BlogView })));
const PricingView = lazy(() => import('../capy/PricingView').then((mod) => ({ default: mod.PricingView })));
const GroundingView = lazy(() =>
  import('../grounding/GroundingView').then((mod) => ({ default: mod.GroundingView }))
);
const GitView = lazy(() => import('../git/GitView').then((mod) => ({ default: mod.GitView })));

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, activeSidebarView } = useUIStore();

  if (!isSidebarOpen) return null;

  return (
    <div className="w-full border-r border-ide-activity h-full bg-ide-sidebar flex flex-col overflow-hidden">
      <Suspense fallback={<div className="h-full w-full animate-pulse bg-ide-sidebar/70" />}>
        {activeSidebarView === 'explorer' && <Explorer />}
        {activeSidebarView === 'search' && <SearchView />}
        {activeSidebarView === 'extensions' && <ExtensionsView />}
        {activeSidebarView === 'docs' && <DocsView />}
        {activeSidebarView === 'community' && <CommunityView />}
        {activeSidebarView === 'blog' && <BlogView />}
        {activeSidebarView === 'pricing' && <PricingView />}
        {activeSidebarView === 'grounding' && <GroundingView />}
        {activeSidebarView === 'source_control' && <GitView />}
      </Suspense>

      {['settings', 'run'].includes(activeSidebarView) && (
        <div className="p-4 text-gray-400 text-sm flex items-center justify-center h-full text-center">
          {`View "${activeSidebarView}" is currently active in the main panel or settings dialog.`}
        </div>
      )}
    </div>
  );
};

