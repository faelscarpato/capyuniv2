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
    <div className="h-full flex flex-col bg-ide-sidebar text-ide-text select-none border-r border-ide-border/50">
      <div className="flex items-center justify-between px-5 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-ide-muted">
        <span>Search</span>
      </div>

      <div className="px-5 pb-4">
        <div className="relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find in workspace..."
            className="w-full bg-ide-input text-white text-[13px] pl-9 pr-4 py-2.5 rounded-xl border border-ide-border focus:border-ide-accent/50 focus:ring-4 focus:ring-ide-accent/10 focus:outline-none transition-all placeholder:text-ide-muted"
            autoFocus
          />
          <Icon name="Search" size={16} className="absolute left-3 top-3 text-ide-muted group-focus-within:text-ide-accent transition-colors" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-3 text-ide-muted hover:text-white transition-colors"
            >
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-2 pb-6">
        {query && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
            <div className="w-12 h-12 bg-ide-border/30 rounded-2xl flex items-center justify-center mb-4 text-ide-muted">
              <Icon name="Search" size={24} />
            </div>
            <p className="text-sm font-semibold text-white/50">No results found</p>
            <p className="text-[11px] text-ide-muted mt-1 leading-tight">Try a different keyword or check for typos.</p>
          </div>
        )}

        {!query && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center select-none opacity-40">
            <Icon name="Binary" size={40} className="mb-4 text-ide-muted" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-ide-muted">Global Search</p>
            <p className="text-[10px] mt-2 leading-relaxed">Search through all files in your current workspace instantly.</p>
          </div>
        )}

        {results.map((hit, i) => (
          <div
            key={i}
            onClick={() => handleResultClick(hit.fileId, hit.line)}
            className="group flex flex-col p-3 cursor-pointer bg-ide-bg/30 border border-transparent hover:border-ide-accent/30 hover:bg-ide-accent/5 rounded-xl transition-all animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            <div className="flex items-center gap-2 mb-2 text-[11px]">
              <div className="w-5 h-5 flex items-center justify-center rounded-md bg-white/5 text-ide-muted group-hover:text-white transition-colors">
                <Icon name="FileCode" size={12} />
              </div>
              <span className="font-bold text-ide-muted group-hover:text-white transition-colors truncate">{hit.fileName}</span>
              <div className="ml-auto px-1.5 py-0.5 rounded-md bg-white/5 text-[9px] font-black text-ide-muted border border-white/5">
                L{hit.line}
              </div>
            </div>
            <div className="pl-7 text-[12px] text-ide-muted font-mono leading-relaxed truncate group-hover:text-white/90 selection:bg-ide-accent/30">
              <span className="text-ide-accent/50 opacity-0 group-hover:opacity-100 transition-opacity">→ </span>
              {hit.preview}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};