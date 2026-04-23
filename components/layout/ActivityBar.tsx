import React, { useState } from 'react';
import { useUIStore, SidebarViewType } from '../../stores/uiStore';
import { Icon } from '../ui/Icon';
import { executeAppCommand } from '../../core/commands/handlers/registerDefaultCommands';
import { useRuntimeModeStore } from '../../features/local-runtime/store/runtimeModeStore';
import { MobileMoreSheet } from './MobileMoreSheet';

export const ActivityBar: React.FC = () => {
  const {
    activeSidebarView, setActiveSidebarView,
    isSidebarOpen, setSidebarOpen,
    isPanelOpen, activePanelTab,
    isRightSidebarOpen,
    activeRightSidebarView, setRightSidebarOpen,
    isMobile,
    language
  } = useUIStore();
  const { mode } = useRuntimeModeStore();
  const tt = (pt: string, en: string) => (language === 'pt' ? pt : en);

  const [showMobileMore, setShowMobileMore] = useState(false);

  const handleItemClick = (view: SidebarViewType) => {
    if (activeSidebarView === view && isSidebarOpen) {
      setSidebarOpen(false);
    } else {
      if (view === 'explorer') executeAppCommand('ui.openExplorer');
      else if (view === 'search') executeAppCommand('ui.openSearch');
      else if (view === 'grounding') executeAppCommand('ui.openGrounding');
      else if (view === 'source_control') executeAppCommand('ui.openSourceControl');
      else {
        setActiveSidebarView(view);
        setSidebarOpen(true);
      }
    }
  };

  const handleRightSidebarView = (view: 'chat' | 'preview' | 'capyuniverse') => {
    if (activeRightSidebarView === view && isRightSidebarOpen) {
      setRightSidebarOpen(false);
    } else {
      if (view === 'chat') executeAppCommand('ui.openChat');
      else if (view === 'preview') executeAppCommand('ui.openPreviewRight');
      else executeAppCommand('ui.openCapyUniverse');
    }
  };

  const Item = ({ view, icon, label, color, activeCondition, onClick }: { view?: SidebarViewType, icon: any, label: string, color?: string, activeCondition?: boolean, onClick?: () => void }) => {

    let isActive = false;
    if (activeCondition !== undefined) {
      isActive = activeCondition;
    } else if (view) {
      isActive = activeSidebarView === view && isSidebarOpen;
    }

    const handleClick = () => {
      if (onClick) onClick();
      else if (view) handleItemClick(view);
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`
            relative flex items-center justify-center transition-all group
            ${isMobile
            ? 'flex-1 flex-col h-full gap-1 active:scale-90'
            : 'w-full h-12 md:flex-row hover:text-ide-text'
          }
            ${isActive ? (color || 'text-ide-accent') : 'text-[#858585]'}
          `}
        title={label}
      >
        <Icon name={icon} size={isMobile ? 24 : 22} strokeWidth={isActive ? 2 : 1.5} />
        {isMobile && <span className="text-[9px] font-medium">{label}</span>}

        {isActive && !isMobile && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-current rounded-full" />
        )}
      </button>
    );
  };

  // Mobile Bottom Dock Layout
  if (isMobile) {
    return (
      <>
        {/* Main Dock */}
        <div className="fixed bottom-0 left-0 right-0 h-[64px] bg-ide-bg/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-2 z-[90] pb-[env(safe-area-inset-bottom)]">
          {/* Files */}
          <Item view="explorer" icon="Files" label="Files" />
          {/* Search */}
          <Item view="search" icon="Search" label="Search" />

          {/* Center Run Action */}
          <button
            type="button"
            onClick={() => executeAppCommand('project.runDev')}
            className="flex items-center justify-center w-12 h-12 -mt-6 bg-ide-accent rounded-full shadow-lg shadow-ide-accent/40 text-white border-4 border-ide-bg active:scale-95"
            title="Run Project"
          >
            <Icon name="Zap" size={24} />
          </button>

          {/* AI Chat */}
          <Item
            icon="Bot"
            label="AI"
            color="text-pink-500"
            activeCondition={activeRightSidebarView === 'chat' && isRightSidebarOpen}
            onClick={() => handleRightSidebarView('chat')}
          />

          {/* More */}
          <button
            type="button"
            onClick={() => setShowMobileMore(!showMobileMore)}
            className={`flex-1 flex flex-col items-center justify-center h-full gap-1 ${showMobileMore ? 'text-ide-text' : 'text-[#858585]'}`}
            aria-label="More options"
          >
            <Icon name="Menu" size={24} />
            <span className="text-[9px] font-medium">Mais</span>
          </button>
        </div>
        {/* More Sheet */}
        <MobileMoreSheet isOpen={showMobileMore} onClose={() => setShowMobileMore(false)} />
      </>
    );
  }

  // Desktop Vertical Layout
  return (
    <div className="w-14 h-full bg-ide-activity/80 backdrop-blur-2xl flex flex-col items-center py-4 z-50 border-r border-ide-border transition-all duration-300">
<div className="flex flex-col  w-full px-1">
      <Item view="explorer" icon="Files" label="Arquivos" />
      <Item view="search" icon="Search" label="Busca" />
      <Item view="source_control" icon="GitBranch" label="Git" />
      <Item view="grounding" icon="Globe2" label="Web Search" />

      

      
        <Item
          icon="Rocket"
          label="Universe"
          color="text-ide-secondary"
          activeCondition={activeRightSidebarView === 'capyuniverse' && isRightSidebarOpen}
          onClick={() => handleRightSidebarView('capyuniverse')}
        />
        <Item
          icon="Globe"
          label="Preview"
          color="text-green-400"
          activeCondition={activeRightSidebarView === 'preview' && isRightSidebarOpen}
          onClick={() => handleRightSidebarView('preview')}
        />
        <Item
          icon="Bot"
          label="IA Capy"
          color="text-pink-400"
          activeCondition={activeRightSidebarView === 'chat' && isRightSidebarOpen}
          onClick={() => handleRightSidebarView('chat')}
        />
      
</div>

      <button
        type="button"
        onClick={() => executeAppCommand('panel.toggleTerminal')}
        className="w-full h-12 flex items-center justify-center text-ide-muted hover:text-ide-text transition-all active:scale-90"
        title="Terminal / Console"
      >
        <div className={`p-2 rounded-xl transition-colors ${isPanelOpen && activePanelTab === 'TERMINAL' ? 'bg-ide-accent/10 text-ide-accent' : 'hover:bg-ide-hover'}`}>
          <Icon name="TerminalSquare" size={22} strokeWidth={isPanelOpen && activePanelTab === 'TERMINAL' ? 2 : 1.5} />
        </div>
      </button>

      <button
        type="button"
        onClick={() => executeAppCommand(mode === 'local-runtime' ? 'runtime.disconnect' : 'runtime.activateLocal')}
        className={`w-full h-12 flex items-center justify-center transition-all active:scale-90 ${
          mode === 'local-runtime' ? 'text-green-300 hover:text-green-200' : 'text-ide-muted hover:text-ide-text'
        }`}
        title={mode === 'local-runtime' ? tt('Desconectar Runtime Local', 'Disconnect Local Runtime') : tt('Ativar Runtime Local', 'Activate Local Runtime')}
      >
        <div className={`p-2 rounded-xl ${mode === 'local-runtime' ? 'bg-green-500/15' : 'hover:bg-ide-hover'}`}>
          <Icon name="Cpu" size={22} strokeWidth={1.8} />
        </div>
      </button>

      <button
        type="button"
        onClick={() => executeAppCommand('ui.openSnapshots')}
        className="w-full h-12 flex items-center justify-center text-ide-muted hover:text-ide-text transition-all active:scale-90"
        title={tt('Snapshots', 'Snapshots')}
      >
        <div className="p-2 rounded-xl hover:bg-ide-hover">
          <Icon name="History" size={22} strokeWidth={1.8} />
        </div>
      </button>

      

      <div className="flex-1" />

      <button 
        type="button" 
        onClick={() => executeAppCommand('ui.openSettings')}
        className="w-full h-12 flex items-center justify-center text-ide-muted hover:text-ide-text mb-2 transition-all active:scale-95"
        title={tt('Configuracoes', 'Settings')}
      >
        <div className="p-2 rounded-xl hover:bg-ide-hover">
          <Icon name="Settings" size={24} strokeWidth={1.5} />
        </div>
      </button>
    </div>
  );
};
