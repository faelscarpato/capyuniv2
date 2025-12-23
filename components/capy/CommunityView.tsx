import React from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Icon } from '../ui/Icon';

export const CommunityView: React.FC = () => {
  const { createFile } = useWorkspaceStore();

  const templates = [
      { name: 'React Component', file: 'MyComponent.tsx', desc: 'Functional component with props' },
      { name: 'Express Server', file: 'server.js', desc: 'Basic Express setup' },
      { name: 'Utility Class', file: 'Helper.ts', desc: 'Static helper class' },
  ];

  const applyTemplate = (tpl: any) => {
      createFile('root', tpl.file);
      alert(`Created ${tpl.file} in root!`);
  };

  return (
    <div className="p-4 flex flex-col h-full bg-ide-sidebar text-ide-text overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon name="Users" className="text-blue-400" />
            Community
        </h2>
        <p className="text-sm text-gray-400 mb-6">
            Jumpstart your project with community templates.
        </p>

        <div className="space-y-3">
            {templates.map((t, i) => (
                <div key={i} className="bg-ide-activity p-3 rounded border border-ide-border hover:border-ide-accent transition-colors group">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm text-gray-200">{t.name}</h3>
                        <button onClick={() => applyTemplate(t)} className="text-ide-secondary hover:text-white">
                            <Icon name="Download" size={16} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                </div>
            ))}
        </div>
    </div>
  );
};