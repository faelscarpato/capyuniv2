import React, { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { Topbar } from './Topbar';
import { ActivityBar } from './ActivityBar';
import { StatusBar } from './StatusBar';
import { useUIStore } from '../../stores/uiStore';
import { ToastContainer } from '../ui/Toast';
import { applyTheme } from '../../lib/themes';

const Sidebar = lazy(() => import('./Sidebar').then((mod) => ({ default: mod.Sidebar })));
const RightSidebar = lazy(() => import('./RightSidebar').then((mod) => ({ default: mod.RightSidebar })));
const EditorArea = lazy(() => import('../editor/EditorArea').then((mod) => ({ default: mod.EditorArea })));
const Panel = lazy(() => import('./Panel').then((mod) => ({ default: mod.Panel })));
const QuickOpen = lazy(() => import('../command/QuickOpen').then((mod) => ({ default: mod.QuickOpen })));
const CommandPalette = lazy(() =>
  import('../command/CommandPalette').then((mod) => ({ default: mod.CommandPalette }))
);
const AboutModal = lazy(() => import('../modals/AboutModal').then((mod) => ({ default: mod.AboutModal })));
const DocsModal = lazy(() => import('../modals/DocsModal').then((mod) => ({ default: mod.DocsModal })));
const TutorialModal = lazy(() =>
  import('../modals/TutorialModal').then((mod) => ({ default: mod.TutorialModal }))
);
const ApiKeyModal = lazy(() => import('../modals/ApiKeyModal').then((mod) => ({ default: mod.ApiKeyModal })));
const WorkspaceActionDialogModal = lazy(() =>
  import('../modals/WorkspaceActionDialogModal').then((mod) => ({ default: mod.WorkspaceActionDialogModal }))
);
const ConfirmDialogModal = lazy(() =>
  import('../modals/ConfirmDialogModal').then((mod) => ({ default: mod.ConfirmDialogModal }))
);
const RuntimeModeModal = lazy(() =>
  import('../modals/RuntimeModeModal').then((mod) => ({ default: mod.RuntimeModeModal }))
);
const SnapshotsModal = lazy(() =>
  import('../modals/SnapshotsModal').then((mod) => ({ default: mod.SnapshotsModal }))
);
const AuthModal = lazy(() =>
  import('../modals/AuthModal').then((mod) => ({ default: mod.AuthModal }))
);
const SettingsModal = lazy(() =>
  import('../modals/SettingsModal').then((mod) => ({ default: mod.SettingsModal }))
);

export const MainLayout: React.FC = () => {
    const {
        currentTheme,
        isSidebarOpen, sidebarWidth, setSidebarWidth, setSidebarOpen,
        isRightSidebarOpen, rightSidebarWidth, setRightSidebarWidth, setRightSidebarOpen,
        isMobile, setIsMobile, setTutorialOpen
    } = useUIStore();

    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

    const resizeStartRef = useRef<{ x: number, width: number }>({ x: 0, width: 0 });

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
                            : `relative flex-shrink-0 ${isSidebarOpen ? 'border-r border-ide-border' : 'w-0 overflow-hidden'}`
                        }
            `}
                >
                    <Suspense fallback={<div className="h-full w-full animate-pulse bg-ide-sidebar/70" />}>
                        <Sidebar />
                    </Suspense>
                </aside>

                {/* Left Resizer (Desktop) */}
                {!isMobile && isSidebarOpen && (
                    <div
                        className="w-px hover:w-1 hover:bg-ide-accent/50 cursor-col-resize z-40 transition-all flex-shrink-0 bg-ide-border"
                        onMouseDown={startResizingLeft}
                    />
                )}

                {/* --- MAIN EDITOR AREA --- */}
                <main className={`flex-1 flex flex-col min-w-0 min-h-0 relative bg-ide-bg transition-all duration-300 overflow-hidden ${isMobile ? 'pb-[calc(76px+env(safe-area-inset-bottom))]' : ''}`}>
                    <Suspense fallback={<div className="flex-1 animate-pulse bg-ide-bg/70" />}>
                        <EditorArea />
                    </Suspense>

                    {/* Mobile Backdrop Overlay */}
                    {isMobile && (isSidebarOpen || isRightSidebarOpen) && (
                        <div
                            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-md animate-in fade-in duration-300"
                            onClick={handleBackdropClick}
                        />
                    )}

                    {/* Desktop Resizing Overlay (Protects iframe events) */}
                    {isResizing && <div className="absolute inset-0 z-[100] cursor-col-resize" />}

                    <Suspense fallback={<div className="h-0" />}>
                        <Panel />
                    </Suspense>
                </main>

                {/* Right Resizer (Desktop) */}
                {!isMobile && isRightSidebarOpen && (
                    <div
                        className="w-px hover:w-1 hover:bg-ide-accent/50 cursor-col-resize z-40 transition-all flex-shrink-0 bg-ide-border"
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
                            : `relative flex-shrink-0 ${isRightSidebarOpen ? 'border-l border-ide-border' : 'w-0 overflow-hidden'}`
                        }
            `}
                >
                    <Suspense fallback={<div className="h-full w-full animate-pulse bg-ide-sidebar/70" />}>
                        <RightSidebar />
                    </Suspense>
                </aside>
            </div>

            {/* Mobile Bottom Dock */}
            {isMobile && <ActivityBar />}

            {/* Status Bar (Desktop Only) */}
            {!isMobile && <StatusBar />}

            {/* Global Modals */}
            <Suspense fallback={null}>
                <QuickOpen />
                <CommandPalette />
                <AboutModal />
                <DocsModal />
                <TutorialModal />
                <ApiKeyModal />
                <WorkspaceActionDialogModal />
                <ConfirmDialogModal />
                <RuntimeModeModal />
                <SnapshotsModal />
                <AuthModal />
                <SettingsModal />
            </Suspense>
            <ToastContainer />
        </div>
    );
};
