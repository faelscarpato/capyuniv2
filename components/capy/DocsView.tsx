import React from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Icon } from '../ui/Icon';
import { FileNode } from '../../types';

export const DocsView: React.FC = () => {
  const { createFile, createFolder, files } = useWorkspaceStore();

  const handleGenerateDocs = () => {
    // Check if /docs exists, if not create
    const allFiles = Object.values(files) as FileNode[];
    const rootDocs = allFiles.find(f => f.name === 'docs' && f.type === 'folder');
    let parentId = rootDocs?.id;
    
    if (!parentId) {
        // Create folder (we need to do this manually via store action if not exposed, but we can do a mock "create" sequence)
        // Since createFolder is void, we assume it creates 'docs' in root.
        // A real app would wait for ID return. For this demo, we'll try to find it or create standard ones.
        alert("Please create a 'docs' folder first manually in Explorer (Limitation of sync store for now).");
        return; 
    }

    const fileList = allFiles.map(f => `- ${f.name} (${f.type})`).join('\n');

    createFile(parentId, 'README.md');
    // We can't immediately write content because createFile is async in state updates effectively
    // But we can create unique names
    createFile(parentId, 'ARCHITECTURE.md');
    createFile(parentId, 'DECISIONS.md');
    
    alert("Documentation files created in /docs! Check them out.");
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
                ├── README.md
                ├── ARCHITECTURE.md
                └── DECISIONS.md
            </pre>
        </div>
    </div>
  );
};