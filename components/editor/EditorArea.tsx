import React, { Suspense, lazy } from 'react';
import { TabsBar } from './TabsBar';

const MonacoWrapper = lazy(() => import('./MonacoWrapper').then((mod) => ({ default: mod.MonacoWrapper })));

export const EditorArea: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-ide-bg overflow-hidden">
      <TabsBar />
      <div className="flex-1 overflow-hidden relative min-h-0">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-ide-bg/70" />}>
          <MonacoWrapper />
        </Suspense>
      </div>
    </div>
  );
};
