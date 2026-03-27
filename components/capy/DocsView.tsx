import React from 'react';
import { Icon } from '../ui/Icon';
import { executeAppCommand } from '../../core/commands/handlers/registerDefaultCommands';

export const DocsView: React.FC = () => {
  const handleGenerateDocs = () => {
    executeAppCommand('templates.scaffoldDocs');
  };

  return (
    <div className="p-4 flex flex-col h-full bg-ide-sidebar text-ide-text">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="BookOpen" className="text-ide-secondary" />
        Project Docs
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Automatically generate documentation based on your current project structure.
      </p>

      <button
        onClick={handleGenerateDocs}
        className="bg-ide-accent hover:bg-opacity-90 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-all"
      >
        <Icon name="Wand2" size={16} />
        Generate Docs
      </button>

      <div className="mt-8 border-t border-ide-activity pt-4">
        <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Structure Preview</h3>
        <pre className="text-xs font-mono text-gray-400 bg-ide-bg p-2 rounded">
          /docs
          {'\n'}├── README.md
          {'\n'}├── ARCHITECTURE.md
          {'\n'}└── DECISIONS.md
        </pre>
      </div>
    </div>
  );
};

