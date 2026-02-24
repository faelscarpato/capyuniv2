import React, { useState } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../ui/Icon';
import { getFileIconInfo } from '../../lib/fileUtils';

export const TabsBar: React.FC = () => {
  const { openTabs, activeTabId, files, closeTab, setActiveTab, unsavedChanges } = useWorkspaceStore();
  const { isMobile } = useUIStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (openTabs.length === 0) return null;

  // --- Mobile Single Tab View ---
  if (isMobile) {
    const activeFile = activeTabId ? files[activeTabId] : null;
    if (!activeFile) return null;

    const iconInfo = getFileIconInfo(activeFile.name);
    const isDirty = unsavedChanges.has(activeFile.id);

    return (
      <div className="h-10 bg-ide-activity border-b border-ide-border flex items-center justify-between px-3 relative z-20">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 text-sm font-medium text-white overflow-hidden"
        >
          <Icon name={iconInfo.name as any} size={16} className={iconInfo.color} />
          <span className="truncate max-w-[200px]">{activeFile.name}</span>
          {isDirty && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
          <Icon name={isDropdownOpen ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-gray-500" />
        </button>

        <button onClick={() => closeTab(activeFile.id)} className="p-1.5 text-gray-400 hover:text-white">
          <Icon name="X" size={16} />
        </button>

        {/* Mobile Dropdown List */}
        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setIsDropdownOpen(false)} />
            <div className="absolute top-full left-0 w-64 mt-1 bg-ide-panel border border-ide-border rounded-lg shadow-xl z-40 max-h-[300px] overflow-y-auto">
              {openTabs.map(tabId => {
                const f = files[tabId];
                const active = activeTabId === tabId;
                if (!f) return null;
                return (
                  <div
                    key={tabId}
                    onClick={() => { setActiveTab(tabId); setIsDropdownOpen(false); }}
                    className={`flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 ${active ? 'bg-ide-accent/10 text-ide-accent' : 'text-gray-300'}`}
                  >
                    <span className="truncate">{f.name}</span>
                    {active && <Icon name="Check" size={14} />}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // --- Desktop Standard View ---
  return (
    <div className="h-10 flex bg-ide-activity border-b border-ide-border overflow-x-auto no-scrollbar scroll-smooth">
      {openTabs.map(tabId => {
        const file = files[tabId];
        if (!file) return null;

        const isActive = activeTabId === tabId;
        const isDirty = unsavedChanges.has(tabId);
        const iconInfo = getFileIconInfo(file.name);

        return (
          <div
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`
              group relative flex items-center min-w-[130px] md:min-w-[110px] max-w-[180px] px-4 h-full text-[13px] md:text-xs cursor-pointer select-none transition-all duration-300
              ${isActive
                ? 'bg-ide-bg text-ide-text'
                : 'text-ide-muted hover:text-white hover:bg-ide-hover'
              }
            `}
          >
            {/* Active Indicator Bar */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-ide-accent shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-in fade-in slide-in-from-top-1" />
            )}

            <span className="mr-2 flex-shrink-0">
              <Icon name={iconInfo.name as any} size={14} className={isActive ? iconInfo.color : 'text-ide-muted group-hover:text-white/70'} />
            </span>

            <span className={`flex-1 truncate pr-2 ${isActive ? 'font-medium' : 'font-normal'}`}>
              {file.name}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tabId);
              }}
              className={`p-1 rounded-lg hover:bg-white/10 transition-all active:scale-90 ${isDirty ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              {isDirty ? (
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              ) : (
                <Icon name="X" size={14} className="text-ide-muted hover:text-white" />
              )}
            </button>

            {/* Separator */}
            {!isActive && (
              <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-ide-border opacity-50" />
            )}
          </div>
        );
      })}
    </div>
  );
};