import React, { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { Topbar } from './Topbar';
import { ActivityBar } from './ActivityBar';
import { StatusBar } from './StatusBar';
import { useUIStore } from '../../stores/uiStore';
import { ToastContainer } from '../ui/Toast';
import { applyTheme } from '../../lib/themes';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';




const Sidebar = lazy(() => import('./Sidebar').then((mod) => ({ default: mod.Sidebar })));
// Load the right sidebar lazily. This sidebar hosts components like Chat, WebPreview, CapyUniverse, etc.
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

    // Retrieve dynamic theme from system and time of day. This hook determines whether
    // the interface should use light or dark mode when the theme is set to `auto`.
    // See `hooks/useDynamicTheme.ts` for implementation details. Without this,
    // `dynamicTheme` would be undefined and cause a ReferenceError.
    const { theme: dynamicTheme } = useDynamicTheme();

    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

    const resizeStartRef = useRef<{ x: number, width: number }>({ x: 0, width: 0 });
    const mainRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Use dynamic theme if current theme is 'auto' or system preference, else use selected theme
        const themeToApply = currentTheme === 'auto' ? dynamicTheme : currentTheme;
        applyTheme(themeToApply);

        const tutorialSeen = localStorage.getItem('capy_tutorial_seen');
        if (!tutorialSeen) {
            const timer = setTimeout(() => {
                setTutorialOpen(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [currentTheme, dynamicTheme, setTutorialOpen]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsMobile]);

    // Keyboard navigation for accessibility
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Alt+1: Focus sidebar
            if (event.altKey && event.key === '1') {
                event.preventDefault();
                const sidebar = document.querySelector('[role="complementary"]') as HTMLElement;
                sidebar?.focus();
            }
            // Alt+2: Focus editor
            if (event.altKey && event.key === '2') {
                event.preventDefault();
                const editor = document.querySelector('[role="main"]') as HTMLElement;
                editor?.focus();
            }
            // Alt+3: Focus right sidebar
            if (event.altKey && event.key === '3') {
                event.preventDefault();
                const rightSidebar = document.querySelector('[role="complementary"][aria-label="Right sidebar"]') as HTMLElement;
                rightSidebar?.focus();
            }
            // Alt+4: Focus panel
            if (event.altKey && event.key === '4') {
                event.preventDefault();
                const panel = document.querySelector('[role="region"][aria-label*="panel"]') as HTMLElement;
                panel?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
        <div
            className="flex flex-col h-[100dvh] w-screen bg-ide-bg text-ide-text overflow-hidden relative"
            role="application"
            aria-label="CapyIDE - Desktop IDE"
        >
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
                    role="complementary"
                    aria-label="Project sidebar"
                    tabIndex={-1}
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
                <main
                    ref={mainRef}
                    className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-ide-bg transition-all duration-300 overflow-hidden"
                    role="main"
                    aria-label="Editor workspace"
                    tabIndex={-1}
                >
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
                    role="complementary"
                    aria-label="Right sidebar"
                    tabIndex={-1}
                >
                    <Suspense fallback={<div className="h-full w-full animate-pulse bg-ide-sidebar/70" />}>
                        <RightSidebar />
                    </Suspense>
                </aside>
            </div>

            {/* Mobile Bottom Dock */}
            {isMobile && <ActivityBar />}

            {/* Status Bar (Desktop Only) */}
            {!isMobile && (
                <StatusBar role="status" aria-live="polite" aria-label="Status bar" />
            )}

            {/* Render modals and overlays */}
            <Suspense fallback={null}>
                {/* Global overlays for quick commands and palettes */}
                <QuickOpen />
                <CommandPalette />

                {/* Various modal dialogs */}
                <AboutModal />
                <DocsModal />
                <TutorialModal />
                <ApiKeyModal />
                <SnapshotsModal />
                <AuthModal />
                <SettingsModal />
                <WorkspaceActionDialogModal />
                <ConfirmDialogModal />
                <RuntimeModeModal />
            </Suspense>

            {/* Toast notifications */}
            <ToastContainer />

        </div>
    );
};
