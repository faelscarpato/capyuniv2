import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { TerminalView } from '../terminal/TerminalView';
import { WebPreview } from '../preview/WebPreview';
import { Icon } from '../ui/Icon';

export const Panel: React.FC = () => {
  const { 
    isPanelOpen, setPanelOpen, activePanelTab, setActivePanelTab, 
    consoleOutput, clearConsole, markers, panelHeight, setPanelHeight 
  } = useUIStore();
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
        className={`border-t border-ide-activity bg-ide-panel flex flex-col transition-opacity duration-200 ease-in-out relative flex-shrink-0 ${!isPanelOpen && 'pointer-events-none'}`}
        style={{ 
            height: isPanelOpen ? panelHeight : 0, 
            opacity: isPanelOpen ? 1 : 0,
            overflow: 'hidden'
        }}
    >
      {/* Resizer Handle */}
      <div 
        onMouseDown={startResizing}
        className="absolute top-0 left-0 right-0 h-1.5 -mt-1 cursor-row-resize hover:bg-ide-accent hover:opacity-100 opacity-0 z-20 transition-opacity"
      />

      <div className="flex items-center px-4 h-9 gap-6 text-xs font-semibold text-ide-muted border-b border-ide-activity select-none shrink-0 justify-between">
        <div className="flex h-full gap-6">
            <span 
                onClick={() => setActivePanelTab('TERMINAL')}
                className={`h-full flex items-center cursor-pointer ${activePanelTab === 'TERMINAL' ? 'text-ide-accent border-b border-ide-accent' : 'hover:text-ide-text'}`}
            >
                TERMINAL
            </span>
            <span 
                onClick={() => setActivePanelTab('PREVIEW')}
                className={`h-full flex items-center cursor-pointer ${activePanelTab === 'PREVIEW' ? 'text-ide-accent border-b border-ide-accent' : 'hover:text-ide-text'}`}
            >
                WEB PREVIEW
            </span>
            <span 
                onClick={() => setActivePanelTab('OUTPUT')}
                className={`h-full flex items-center cursor-pointer ${activePanelTab === 'OUTPUT' ? 'text-ide-accent border-b border-ide-accent' : 'hover:text-ide-text'}`}
            >
                OUTPUT
            </span>
            <span 
                onClick={() => setActivePanelTab('PROBLEMS')}
                className={`h-full flex items-center cursor-pointer gap-2 ${activePanelTab === 'PROBLEMS' ? 'text-ide-accent border-b border-ide-accent' : 'hover:text-ide-text'}`}
            >
                PROBLEMS
                {totalProblems > 0 && (
                    <span className="bg-ide-activity text-ide-text px-1.5 rounded-full text-[10px]">{totalProblems}</span>
                )}
            </span>
        </div>
        
        <div className="flex items-center">
            <button 
                onClick={() => setPanelOpen(false)} 
                className="hover:text-ide-text p-1 rounded hover:bg-ide-hover"
                title="Close Panel"
            >
                <Icon name="X" size={14} />
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
          <div className={`h-full w-full ${activePanelTab === 'TERMINAL' ? 'block' : 'hidden'}`}>
               <TerminalView />
          </div>

          {activePanelTab === 'PREVIEW' && <WebPreview />}
          
          {activePanelTab === 'OUTPUT' && (
             <div className="flex flex-col h-full">
                 <div className="flex-1 p-4 font-mono text-xs text-ide-text overflow-y-auto space-y-1">
                    {consoleOutput.length === 0 && <p className="opacity-50 italic">No output yet. Run your code to see logs here.</p>}
                    {consoleOutput.map((log, i) => (
                        <div key={i} className="border-b border-ide-activity pb-0.5">{log}</div>
                    ))}
                 </div>
                 <div className="p-2 border-t border-ide-activity flex justify-end">
                     <button onClick={clearConsole} className="text-xs text-ide-muted hover:text-ide-text flex items-center gap-1">
                         <Icon name="Trash2" size={12} /> Clear
                     </button>
                 </div>
             </div>
          )}

           {activePanelTab === 'PROBLEMS' && (
             <div className="flex flex-col h-full text-xs text-ide-text">
                {markers.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center opacity-50 italic">
                        No problems detected in workspace.
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-ide-panel border-b border-ide-activity text-ide-muted font-normal">
                                <tr>
                                    <th className="py-1 px-4 w-12"></th>
                                    <th className="py-1 px-2">Code</th>
                                    <th className="py-1 px-2 w-1/2">Message</th>
                                    <th className="py-1 px-2">File</th>
                                    <th className="py-1 px-2">Line</th>
                                </tr>
                            </thead>
                            <tbody>
                                {markers.map((m, i) => (
                                    <tr 
                                        key={i} 
                                        onClick={() => handleProblemClick(m.startLineNumber)}
                                        className="hover:bg-ide-activity/50 cursor-pointer border-b border-ide-activity"
                                    >
                                        <td className="py-1 px-4 text-center">
                                            {m.severity === 8 ? (
                                                <Icon name="XCircle" size={14} className="text-red-500" />
                                            ) : (
                                                <Icon name="AlertTriangle" size={14} className="text-yellow-500" />
                                            )}
                                        </td>
                                        <td className="py-1 px-2 text-ide-muted">
                                            {typeof m.code === 'string' ? m.code : m.code?.value}
                                        </td>
                                        <td className="py-1 px-2 text-ide-text truncate max-w-xs" title={m.message}>
                                            {m.message}
                                        </td>
                                        <td className="py-1 px-2 text-ide-muted">{m.resource}</td>
                                        <td className="py-1 px-2 text-ide-muted">{m.startLineNumber}:{m.startColumn}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
             </div>
          )}
      </div>
    </div>
  );
};