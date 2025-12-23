import React, { useState, useMemo } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Icon } from '../ui/Icon';
import { FileNode } from '../../types';

export const SearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const { files, openFile, requestScrollToLine } = useWorkspaceStore();

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];

    const hits: { fileId: string; fileName: string; line: number; preview: string }[] = [];
    const lowerQuery = query.toLowerCase();

    (Object.values(files) as FileNode[]).forEach(file => {
      if (file.type === 'file' && file.content) {
        const lines = file.content.split('\n');
        lines.forEach((lineContent, index) => {
          if (lineContent.toLowerCase().includes(lowerQuery)) {
            hits.push({
              fileId: file.id,
              fileName: file.name,
              line: index + 1,
              preview: lineContent.trim().substring(0, 60)
            });
          }
        });
      }
    });
    return hits;
  }, [query, files]);

  const handleResultClick = (fileId: string, line: number) => {
    openFile(fileId);
    requestScrollToLine(fileId, line);
  };

  return (
    <div className="h-full flex flex-col bg-ide-sidebar text-ide-text select-none">
      <div className="flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
        <span>Search</span>
      </div>

      <div className="px-4 pb-2">
        <div className="relative">
            <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full bg-ide-input text-white text-sm px-2 py-1 rounded border border-ide-border focus:border-ide-accent focus:outline-none"
                autoFocus
            />
            <Icon name="Search" size={14} className="absolute right-2 top-1.5 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {query && results.length === 0 && (
            <div className="text-center text-gray-500 mt-4 text-xs">No results found</div>
        )}
        
        {results.map((hit, i) => (
            <div 
                key={i} 
                onClick={() => handleResultClick(hit.fileId, hit.line)}
                className="group flex flex-col py-1 px-2 cursor-pointer hover:bg-ide-bg rounded mb-1"
            >
                <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Icon name="FileCode" size={12} />
                    <span>{hit.fileName}</span>
                    <span className="text-gray-500 font-normal ml-auto text-[10px]">{hit.line}</span>
                </div>
                <div className="pl-5 text-xs text-gray-400 truncate font-mono mt-0.5 group-hover:text-white">
                    {hit.preview}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};