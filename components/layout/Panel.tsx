import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { TerminalView } from '../terminal/TerminalView';
import { Icon } from '../ui/Icon';
import { useTerminalStore } from '../../core/terminal/store/terminalStore';

const WebPreview = lazy(() => import('../preview/WebPreview').then((mod) => ({ default: mod.WebPreview })));

export const Panel: React.FC = () => {
    const {
        isPanelOpen, setPanelOpen, activePanelTab, setActivePanelTab,
        consoleOutput, clearConsole, markers, panelHeight, setPanelHeight
    } = useUIStore();
    const {
        sessions,
        activeSessionId,
        addSession,
        removeSession,
        setActiveSession
    } = useTerminalStore();
    const { requestScrollToLine, activeTabId } = useWorkspaceStore();

    const [isResizing, setIsResizing] = useState(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);

    const handleProblemClick = (lineNumber: number) => {
        if (activeTabId) {
            requestScrollToLine(activeTabId, lineNumber);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            // Dragging UP decreases Y, so delta is positive for increasing height
            const delta = startYRef.current - e.clientY;
            const newHeight = Math.max(100, Math.min(window.innerHeight - 100, startHeightRef.current + delta));
            setPanelHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, setPanelHeight]);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        startYRef.current = e.clientY;
        startHeightRef.current = panelHeight;
    };

    // Calculate counts
    const totalProblems = markers.length;

    return (
        <div
            className={`
                border-t border-ide-border bg-ide-panel flex flex-col transition-all duration-300 ease-in-out relative flex-shrink-0 z-40
                ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
            style={{
                height: isPanelOpen ? `${panelHeight}px` : '0px',
                overflow: 'hidden'
            }}
        >
            {/* Resizer Handle */}
            <div
                onMouseDown={startResizing}
                className="absolute top-0 left-0 right-0 h-1.5 -mt-1 cursor-row-resize hover:bg-ide-accent hover:opacity-100 opacity-0 z-20 transition-opacity"
            />

            <div className="flex items-center px-6 h-11 justify-between bg-ide-panel/50 backdrop-blur-md border-b border-ide-border/50 select-none shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex h-full gap-8">
                    {[
                        { id: 'TERMINAL', label: 'Terminal', icon: 'Terminal' },
                        { id: 'PREVIEW', label: 'Web Preview', icon: 'Globe' },
                        { id: 'OUTPUT', label: 'Output', icon: 'Activity' },
                        { id: 'PROBLEMS', label: 'Problems', icon: 'AlertCircle', count: totalProblems }
                    ].map((tab) => (
                        <button
                            type="button"
                            key={tab.id}
                            onClick={() => setActivePanelTab(tab.id)}
                            className={`
                        group relative h-full flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300
                        ${activePanelTab === tab.id ? 'text-ide-accent' : 'text-ide-muted hover:text-white'}
                    `}
                        >
                            <span>{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`
                            px-1.5 py-0.5 rounded-full text-[9px] font-black transition-colors
                            ${activePanelTab === tab.id ? 'bg-ide-accent text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-ide-border-strong text-ide-muted'}
                        `}>
                                    {tab.count}
                                </span>
                            )}
                            {activePanelTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-ide-accent shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-in fade-in slide-in-from-bottom-1" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setPanelOpen(false)}
                        className="text-ide-muted hover:text-white p-2 rounded-xl hover:bg-ide-hover transition-all active:scale-90"
                        title="Close Panel"
                    >
                        <Icon name="X" size={16} />
                    </button>
                </div>
            </div>

            <div className={`flex flex-col flex-1 overflow-hidden h-full ${activePanelTab === 'TERMINAL' ? 'flex' : 'hidden'}`}>
                {/* Terminal Sub-Bar */}
                <div className="flex items-center gap-2 px-6 h-10 border-b border-ide-border/30 bg-ide-panel/30 overflow-x-auto no-scrollbar flex-shrink-0">
                    {sessions.map((term, index) => (
                        <div
                            key={term.id}
                            className={`
                                group flex items-center gap-3 px-3 py-1 rounded-lg cursor-pointer transition-all text-[11px] font-semibold
                                ${activeSessionId === term.id ? 'bg-ide-accent/15 text-ide-accent border border-ide-accent/20' : 'text-ide-muted hover:bg-ide-hover hover:text-white'}
                            `}
                            onClick={() => setActiveSession(term.id)}
                        >
                            <Icon name="Terminal" size={12} />
                            <span className="truncate max-w-[100px]">{term.title}</span>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeSession(term.id); }}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                            >
                                <Icon name="X" size={10} />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addSession(`Terminal ${sessions.length + 1}`)}
                        className="px-2 py-1 text-ide-muted hover:text-white transition-colors"
                        title="New Terminal"
                    >
                        <Icon name="Plus" size={14} />
                    </button>
                </div>

                {/* Render Terminals */}
                <div className="flex-1 overflow-hidden relative">
                    {sessions.map((term) => (
                        <div
                            key={term.id}
                            className={`h-full w-full ${activeSessionId === term.id ? 'block' : 'hidden'}`}
                        >
                            <TerminalView key={term.id} terminalId={term.id} />
                        </div>
                    ))}
                </div>
            </div>

            {activePanelTab === 'PREVIEW' && (
                <Suspense fallback={<div className="h-full w-full animate-pulse bg-ide-panel/70" />}>
                    <WebPreview />
                </Suspense>
            )}

            {activePanelTab === 'OUTPUT' && (
                <div className="flex flex-col h-full">
                    <div className="flex-1 p-4 font-mono text-xs text-ide-text overflow-y-auto space-y-1">
                        {consoleOutput.length === 0 && <p className="opacity-50 italic">No output yet. Run your code to see logs here.</p>}
                        {consoleOutput.map((log, i) => (
                            <div key={i} className="border-b border-ide-activity pb-0.5">{log}</div>
                        ))}
                    </div>
                    <div className="p-2 border-t border-ide-activity flex justify-end">
                        <button type="button" onClick={clearConsole} className="text-xs text-ide-muted hover:text-ide-text flex items-center gap-1">
                            <Icon name="Trash2" size={12} /> Clear
                        </button>
                    </div>
                </div>
            )}

            {activePanelTab === 'PROBLEMS' && (
                <div className="flex flex-col h-full text-xs text-ide-text bg-ide-bg/20">
                    {markers.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 select-none">
                            <Icon name="CheckCircle2" size={48} className="mb-4 text-green-500/50" />
                            <p className="text-sm font-medium text-white">No problems detected</p>
                            <p className="text-[11px] mt-1 text-ide-muted">Your workspace is clean and ready.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                            {markers.map((m, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleProblemClick(m.startLineNumber)}
                                    className="flex items-start gap-4 p-4 bg-ide-panel/80 backdrop-blur-md border border-ide-border shadow-xl rounded-2xl cursor-pointer hover:border-ide-accent/50 hover:bg-ide-accent/5 transition-all group"
                                >
                                    <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${m.severity === 8 ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                        <Icon name={m.severity === 8 ? 'XCircle' : 'AlertTriangle'} size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${m.severity === 8 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>
                                                {m.severity === 8 ? 'Error' : 'Warning'}
                                            </span>
                                            <span className="text-ide-muted font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded-md">
                                                {typeof m.code === 'string' ? m.code : m.code?.value}
                                            </span>
                                        </div>
                                        <p className="text-[14px] font-bold text-white/90 leading-snug mb-3 group-hover:text-white transition-colors">{m.message}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-ide-muted font-semibold text-[11px]">
                                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                                <Icon name="FileCode" size={13} />
                                                <span className="truncate max-w-[150px]">{m.resource}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                                <Icon name="Hash" size={13} />
                                                <span>Line {m.startLineNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="self-center p-2 rounded-lg bg-white/0 group-hover:bg-ide-accent/10 transition-colors">
                                        <Icon name="ChevronRight" size={18} className="text-ide-muted group-hover:text-ide-accent transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
