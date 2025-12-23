import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../ui/Icon';
import { FileNode } from '../../types';

export const QuickOpen: React.FC = () => {
  const { isQuickOpenOpen, setQuickOpen } = useUIStore();
  const { files, openFile } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isQuickOpenOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setActiveIndex(0);
    }
  }, [isQuickOpenOpen]);

  if (!isQuickOpenOpen) return null;

  const fileList = (Object.values(files) as FileNode[]).filter(f => f.type === 'file');
  const filtered = fileList.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (filtered[activeIndex]) {
        openFile(filtered[activeIndex].id);
        setQuickOpen(false);
      }
    } else if (e.key === 'Escape') {
      setQuickOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center pt-2 md:pt-4 px-2" onClick={() => setQuickOpen(false)}>
      <div 
        className="w-full max-w-[600px] bg-ide-activity shadow-2xl rounded-md border border-ide-border flex flex-col max-h-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-100" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-2 border-b border-ide-border">
            <input
                ref={inputRef}
                className="w-full bg-ide-input text-white px-3 py-2 rounded focus:outline-none placeholder-gray-500"
                placeholder="Search files by name..."
                value={query}
                onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
                onKeyDown={handleKeyDown}
            />
        </div>
        <div className="flex-1 overflow-y-auto">
            {filtered.map((file, i) => (
                <div
                    key={file.id}
                    className={`px-4 py-2 flex items-center cursor-pointer ${i === activeIndex ? 'bg-ide-accent text-white' : 'text-gray-300 hover:bg-ide-bg'}`}
                    onClick={() => {
                        openFile(file.id);
                        setQuickOpen(false);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                >
                    <Icon name="File" size={14} className="mr-3 opacity-70" />
                    <span>{file.name}</span>
                    <span className="ml-auto text-xs opacity-50">{file.language}</span>
                </div>
            ))}
            {filtered.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">No matching files found</div>
            )}
        </div>
      </div>
    </div>
  );
};