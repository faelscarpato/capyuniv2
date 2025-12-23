import React, { useEffect, useState, useRef } from 'react';
import { Topbar } from './Topbar';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { StatusBar } from './StatusBar';
import { EditorArea } from '../editor/EditorArea';
import { Panel } from './Panel';
import { useUIStore } from '../../stores/uiStore';
import { QuickOpen } from '../command/QuickOpen';
import { CommandPalette } from '../command/CommandPalette';
import { ToastContainer } from '../ui/Toast';
import { AboutModal } from '../modals/AboutModal';
import { DocsModal } from '../modals/DocsModal';
import { TutorialModal } from '../modals/TutorialModal';
import { ApiKeyModal } from '../modals/ApiKeyModal';
import { applyTheme } from '../../lib/themes';

export const MainLayout: React.FC = () => {
  const { 
    toggleSidebar, toggleQuickOpen, toggleCommandPalette, togglePanel, currentTheme,
    isSidebarOpen, sidebarWidth, setSidebarWidth, setSidebarOpen,
    isRightSidebarOpen, rightSidebarWidth, setRightSidebarWidth, setRightSidebarOpen,
    isMobile, setIsMobile, setTutorialOpen
  } = useUIStore();

  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const resizeStartRef = useRef<{x: number, width: number}>({ x: 0, width: 0 });

  useEffect(() => {
    applyTheme(currentTheme);
    
    const tutorialSeen = localStorage.getItem('capy_tutorial_seen');
    if (!tutorialSeen) {
      const timer = setTimeout(() => {
        setTutorialOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentTheme, setTutorialOpen]);

  useEffect(() => {
      const handleResize = () => {
          setIsMobile(window.innerWidth < 768);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  // Resizing Logic
  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (isResizingLeft) {
              const delta = e.clientX - resizeStartRef.current.x;
              const newWidth = Math.max(150, Math.min(600, resizeStartRef.current.width + delta));
              setSidebarWidth(newWidth);
          }
          if (isResizingRight) {
              const delta = resizeStartRef.current.x - e.clientX;
              const newWidth = Math.max(200, Math.min(800, resizeStartRef.current.width + delta));
              setRightSidebarWidth(newWidth);
          }
      };

      const handleMouseUp = () => {
          setIsResizingLeft(false);
          setIsResizingRight(false);
          document.body.style.cursor = 'default';
          document.body.style.userSelect = 'auto';
      };

      if (isResizingLeft || isResizingRight) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'col-resize';
      }

      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isResizingLeft, isResizingRight, setSidebarWidth, setRightSidebarWidth]);

  const startResizingLeft = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizingLeft(true);
      resizeStartRef.current = { x: e.clientX, width: sidebarWidth };
  };

  const startResizingRight = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizingRight(true);
      resizeStartRef.current = { x: e.clientX, width: rightSidebarWidth };
  };

  const handleBackdropClick = () => {
      setSidebarOpen(false);
      setRightSidebarOpen(false);
  };

  const isResizing = isResizingLeft || isResizingRight;

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-ide-bg text-ide-text overflow-hidden relative">
      <Topbar />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Activity Bar (Desktop Only) */}
        {!isMobile && <ActivityBar />}
        
        {/* --- LEFT SIDEBAR --- */}
        <aside 
            style={!isMobile ? { width: isSidebarOpen ? sidebarWidth : 0 } : undefined}
            className={`
                bg-ide-sidebar flex flex-col transition-all duration-300
                ${isMobile 
                    ? `fixed inset-y-0 left-0 z-[110] w-[85vw] max-w-[320px] shadow-2xl transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}` 
                    : `relative flex-shrink-0 ${isSidebarOpen ? 'border-r border-ide-activity' : 'w-0 overflow-hidden'}`
                }
            `}
        >
           <Sidebar />
        </aside>
        
        {/* Left Resizer (Desktop) */}
        {!isMobile && isSidebarOpen && (
            <div 
                className="w-1 hover:bg-ide-accent/50 cursor-col-resize z-40 transition-colors flex-shrink-0 bg-transparent"
                onMouseDown={startResizingLeft}
            />
        )}

        {/* --- MAIN EDITOR AREA --- */}
        <main className={`flex-1 flex flex-col min-w-0 relative h-full bg-ide-bg transition-all duration-300 ${isMobile ? 'pb-[64px]' : ''}`}>
          <EditorArea />
          
          {/* Mobile Backdrop Overlay */}
          {isMobile && (isSidebarOpen || isRightSidebarOpen) && (
              <div 
                  className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm animate-in fade-in" 
                  onClick={handleBackdropClick}
              />
          )}

          {/* Desktop Resizing Overlay (Protects iframe events) */}
          {isResizing && <div className="absolute inset-0 z-[100] cursor-col-resize" />}

          <Panel />
        </main>
        
        {/* Right Resizer (Desktop) */}
        {!isMobile && isRightSidebarOpen && (
            <div 
                className="w-1 hover:bg-ide-accent/50 cursor-col-resize z-40 transition-colors flex-shrink-0 bg-transparent"
                onMouseDown={startResizingRight}
            />
        )}

        {/* --- RIGHT SIDEBAR --- */}
        <aside 
            style={!isMobile ? { width: isRightSidebarOpen ? rightSidebarWidth : 0 } : undefined}
            className={`
                bg-ide-sidebar flex flex-col transition-all duration-300
                ${isMobile 
                    ? `fixed inset-y-0 right-0 z-[110] w-[85vw] max-w-[320px] shadow-2xl transform ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}` 
                    : `relative flex-shrink-0 ${isRightSidebarOpen ? 'border-l border-ide-activity' : 'w-0 overflow-hidden'}`
                }
            `}
        >
             <RightSidebar />
        </aside>
      </div>
      
      {/* Mobile Bottom Dock */}
      {isMobile && <ActivityBar />}
      
      {/* Status Bar (Desktop Only) */}
      {!isMobile && <StatusBar />}

      {/* Global Modals */}
      <QuickOpen />
      <CommandPalette />
      <AboutModal />
      <DocsModal />
      <TutorialModal />
      <ApiKeyModal />
      <ToastContainer />
    </div>
  );
};