import React, { useState } from 'react';
import { useUIStore, SidebarViewType } from '../../stores/uiStore';
import { Icon } from '../ui/Icon';

export const ActivityBar: React.FC = () => {
  const { 
      activeSidebarView, setActiveSidebarView, 
      isSidebarOpen, setSidebarOpen, 
      togglePanel, setActivePanelTab, setPanelOpen,
      isRightSidebarOpen, toggleRightSidebar,
      setActiveRightSidebarView, activeRightSidebarView, setRightSidebarOpen,
      isMobile, setCommandPalette
  } = useUIStore();

  const [showMobileMore, setShowMobileMore] = useState(false);

  const handleItemClick = (view: SidebarViewType) => {
    if (activeSidebarView === view && isSidebarOpen) {
      setSidebarOpen(false);
    } else {
      setActiveSidebarView(view);
      setSidebarOpen(true);
    }
  };

  const handleRightSidebarView = (view: 'chat' | 'preview' | 'capyuniverse') => {
      if (activeRightSidebarView === view && isRightSidebarOpen) {
          setRightSidebarOpen(false);
      } else {
          setActiveRightSidebarView(view);
          setRightSidebarOpen(true);
      }
  };

  const handleRunClick = () => {
    setPanelOpen(true);
    setActivePanelTab('PREVIEW');
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
                <Item view="explorer" icon="Files" label="Files" />
                <Item view="search" icon="Search" label="Search" />
                
                {/* Center Action Button */}
                <button 
                    onClick={() => setCommandPalette(true)}
                    className="flex items-center justify-center w-12 h-12 -mt-6 bg-ide-accent rounded-full shadow-lg shadow-ide-accent/40 text-white border-4 border-ide-bg"
                >
                    <Icon name="TerminalSquare" size={24} />
                </button>

                <Item 
                    icon="Bot" 
                    label="AI" 
                    color="text-pink-500"
                    activeCondition={activeRightSidebarView === 'chat' && isRightSidebarOpen} 
                    onClick={() => handleRightSidebarView('chat')} 
                />
                
                <button
                    onClick={() => setShowMobileMore(!showMobileMore)}
                    className={`flex-1 flex flex-col items-center justify-center h-full gap-1 ${showMobileMore ? 'text-ide-text' : 'text-[#858585]'}`}
                >
                    <Icon name="Menu" size={24} />
                    <span className="text-[9px] font-medium">More</span>
                </button>
            </div>

            {/* Mobile "More" Menu Popover */}
            {showMobileMore && (
                <div 
                    className="fixed bottom-[80px] right-2 w-48 bg-ide-activity/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[100] p-2 animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col gap-1 pb-[env(safe-area-inset-bottom)]"
                >
                    <button onClick={() => { handleRightSidebarView('preview'); setShowMobileMore(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-ide-text">
                        <Icon name="Globe" size={18} className="text-green-500" /> Web Preview
                    </button>
                    <button onClick={() => { handleRightSidebarView('capyuniverse'); setShowMobileMore(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-ide-text">
                        <Icon name="Rocket" size={18} className="text-purple-500" /> CapyUniverse
                    </button>
                    <button onClick={() => { handleItemClick('nano-banana'); setShowMobileMore(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-ide-text">
                        <Icon name="Banana" size={18} className="text-yellow-500" /> Nano Banana
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    <button onClick={() => { togglePanel(); setShowMobileMore(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-ide-text">
                        <Icon name="Terminal" size={18} /> Terminal
                    </button>
                    <button onClick={() => { handleItemClick('grounding'); setShowMobileMore(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-ide-text">
                        <Icon name="Chrome" size={18} /> Google Grounding
                    </button>
                </div>
            )}
            
            {/* Overlay to close menu */}
            {showMobileMore && <div className="fixed inset-0 z-[80]" onClick={() => setShowMobileMore(false)} />}
        </>
      );
  }

  // Desktop Vertical Layout
  return (
    <div className="w-12 h-full bg-ide-activity/98 backdrop-blur-xl flex flex-col items-center py-2 z-50 border-r border-ide-border">
      <Item view="explorer" icon="Files" label="Arquivos" />
      <Item view="search" icon="Search" label="Busca" />
      <Item view="grounding" icon="Chrome" label="Google Grounding" />
      <Item view="nano-banana" icon="Banana" label="Nano Banana" color="text-yellow-400" />
      
      <div className="h-px w-6 bg-white/10 my-2" />
      
      <Item 
        icon="Rocket" 
        label="Universe" 
        color="text-purple-500" 
        activeCondition={activeRightSidebarView === 'capyuniverse' && isRightSidebarOpen}
        onClick={() => handleRightSidebarView('capyuniverse')}
      />
      <Item 
        icon="Globe" 
        label="Preview" 
        color="text-green-500"
        activeCondition={activeRightSidebarView === 'preview' && isRightSidebarOpen}
        onClick={() => handleRightSidebarView('preview')}
      />
      <Item 
        icon="Bot" 
        label="IA Capy" 
        color="text-pink-500"
        activeCondition={activeRightSidebarView === 'chat' && isRightSidebarOpen}
        onClick={() => handleRightSidebarView('chat')}
      />

      <div className="h-px w-6 bg-white/10 my-2" />

      <button 
        onClick={togglePanel}
        className="w-full h-12 flex items-center justify-center text-[#858585] hover:text-ide-text"
        title="Terminal / Console"
      >
        <Icon name="TerminalSquare" size={22} strokeWidth={1.5} />
      </button>
      
      <div className="flex-1" />
      
      <button className="w-full h-12 flex items-center justify-center text-[#858585] hover:text-ide-text mb-2">
         <Icon name="Settings" size={24} strokeWidth={1.5} />
      </button>
    </div>
  );
};