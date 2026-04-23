import React, { Suspense, lazy } from 'react';
import { TabsBar } from './TabsBar';

const MonacoWrapper = lazy(() => import('./MonacoWrapper').then((mod) => ({ default: mod.MonacoWrapper })));

export const EditorArea: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-ide-bg overflow-hidden">
      <TabsBar />
      {/*
        The editor container uses overflow-y-auto to ensure that on mobile
        devices the page does not scroll when the editor content grows. The
        internal scroll bar will allow navigating through the file while the
        topbar and dockbar remain sticky.
      */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-0">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-ide-bg/70" />}>
          <MonacoWrapper />
        </Suspense>
      </div>
    </div>
  );
};
