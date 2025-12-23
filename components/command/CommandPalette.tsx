import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../ui/Icon';
import { exportWorkspaceToZip, importWorkspaceFromZip } from '../../lib/zip.ts';
import { themes } from '../../lib/themes';

export const CommandPalette: React.FC = () => {
  const { 
    isCommandPaletteOpen, setCommandPalette, 
    toggleSidebar, togglePanel, setActiveSidebarView, setSidebarOpen, setTheme,
    setRightSidebarOpen 
  } = useUIStore();
  
  const { createFile, createFolder, files, importWorkspaceData } = useWorkspaceStore();
  
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setActiveIndex(0);
    }
  }, [isCommandPaletteOpen]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const newFiles = await importWorkspaceFromZip(e.target.files[0]);
          if (newFiles) {
              importWorkspaceData(newFiles);
              alert("Workspace imported successfully!");
          }
      }
      setCommandPalette(false);
  };

  const commands = [
    { label: 'View: Toggle Sidebar', action: toggleSidebar, icon: 'Layout' },
    { label: 'View: Toggle Panel', action: togglePanel, icon: 'PanelBottom' },
    
    // Theme Commands
    ...Object.values(themes).map(theme => ({
        label: `Preferences: Color Theme - ${theme.label}`,
        action: () => setTheme(theme.id),
        icon: 'Palette'
    })),

    { label: 'Capy: Open Chat', action: () => { setRightSidebarOpen(true); }, icon: 'Bot' },
    { label: 'Workspace: New File', action: () => createFile('root', prompt('Filename:') || 'untitled'), icon: 'FilePlus' },
    { label: 'Workspace: New Folder', action: () => createFolder('root', prompt('Folder name:') || 'new_folder'), icon: 'FolderPlus' },
    { label: 'Workspace: Export Zip', action: () => exportWorkspaceToZip(files), icon: 'Download' },
    { label: 'Workspace: Import Zip', action: () => fileInputRef.current?.click(), icon: 'Upload' },
  ];

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  const execute = (cmd: typeof commands[0]) => {
      cmd.action();
      setCommandPalette(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (filtered[activeIndex]) {
        execute(filtered[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setCommandPalette(false);
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <>
    <input 
      type="file" 
      ref={fileInputRef} 
      className="hidden" 
      accept=".zip,application/zip,application/x-zip-compressed,multipart/x-zip" 
      onChange={handleImport} 
    />
    <div className="fixed inset-0 z-[60] flex justify-center pt-2 md:pt-4 px-2" onClick={() => setCommandPalette(false)}>
      <div 
        className="w-full max-w-[600px] bg-ide-activity shadow-2xl rounded-md border border-ide-border flex flex-col max-h-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-2 border-b border-ide-border flex items-center gap-2">
            <span className="text-ide-accent font-bold pl-2">{'>'}</span>
            <input
                ref={inputRef}
                className="flex-1 bg-transparent text-white px-1 py-2 focus:outline-none placeholder-gray-500"
                placeholder="Type a command..."
                value={query}
                onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
                onKeyDown={handleKeyDown}
            />
        </div>
        <div className="flex-1 overflow-y-auto">
            {filtered.map((cmd, i) => (
                <div
                    key={i}
                    className={`px-4 py-2 flex items-center cursor-pointer ${i === activeIndex ? 'bg-ide-accent text-white' : 'text-gray-300 hover:bg-ide-bg'}`}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setActiveIndex(i)}
                >
                    <Icon name={cmd.icon as any} size={14} className="mr-3 opacity-70" />
                    <span>{cmd.label}</span>
                </div>
            ))}
            {filtered.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">No matching commands</div>
            )}
        </div>
      </div>
    </div>
    </>
  );
};