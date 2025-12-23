import React from 'react';
import { TabsBar } from './TabsBar';
import { MonacoWrapper } from './MonacoWrapper';

export const EditorArea: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-ide-bg">
      <TabsBar />
      <div className="flex-1 overflow-hidden relative">
        <MonacoWrapper />
      </div>
    </div>
  );
};
