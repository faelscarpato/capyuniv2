import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount, OnChange, OnValidate } from '@monaco-editor/react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore, MarkerData } from '../../stores/uiStore';
import { themes } from '../../lib/themes';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { useNotificationStore } from '../../stores/notificationStore';
import { useChatStore } from '../../stores/chatStore';
import { generateCodeFix, analyzeCodeHover } from '../../lib/geminiClient';

const useDebounceCallback = (callback: any, delay: number) => {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    return (...args: any[]) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    };
};

export const MonacoWrapper: React.FC = () => {
  const { activeTabId, files, updateFileContent, markSaved, pendingScroll, clearPendingScroll } = useWorkspaceStore();
  const { currentTheme, setMarkers, setCommandPalette, setRightSidebarOpen, setActivePanelTab, setPanelOpen, setPreviewFileId } = useUIStore();
  const { addNotification } = useNotificationStore();
  const { apiKey } = useChatStore();
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({
    x: 0,
    y: 0,
    isOpen: false,
  });
  
  const file = activeTabId ? files[activeTabId] : null;

  // Persist debounced
  const debouncedSave = useDebounceCallback((id: string, value: string) => {
    markSaved(id);
  }, 800);

  const handleEditorChange: OnChange = (value) => {
    if (file && value !== undefined) {
      updateFileContent(file.id, value);
      debouncedSave(file.id, value);
    }
  };

  const handleValidation: OnValidate = (markers) => {
      const mappedMarkers: MarkerData[] = markers.map(m => ({
          owner: m.owner,
          code: m.code as any,
          severity: m.severity,
          message: m.message,
          source: m.source,
          startLineNumber: m.startLineNumber,
          startColumn: m.startColumn,
          endLineNumber: m.endLineNumber,
          endColumn: m.endColumn,
          resource: file?.name || 'unknown'
      }));
      setMarkers(mappedMarkers);
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Define Capy Dark
    monaco.editor.defineTheme('capy-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#2D3748',
        }
    });

    // Define Midnight Pro
    monaco.editor.defineTheme('midnight-pro', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '86868b' }, 
            { token: 'keyword', foreground: '3b82f6' }, 
            { token: 'string', foreground: 'ef4444' }, 
        ],
        colors: {
            'editor.background': '#000000', 
            'editor.foreground': '#F5F5F7',
            'editorCursor.foreground': '#3b82f6',
            'editor.lineHighlightBackground': '#111111',
            'editorLineNumber.foreground': '#444444',
            'editorIndentGuide.background': '#1a1a1a',
            'editorIndentGuide.activeBackground': '#333333'
        }
    });
    
    updateMonacoTheme();

    // Register AI Hover Provider
    // We register for all languages. Ideally we'd register for specific ones, but '*' works in Monaco usually via separate calls or explicit list.
    // Since 'react-monaco-editor' handles language dynamically, let's try to register for javascript/typescript/python etc.
    const languages = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown'];
    
    // We use a simple in-memory cache for hovers to avoid re-fetching same lines immediately
    const hoverCache = new Map<string, string>();

    languages.forEach(lang => {
        monaco.languages.registerHoverProvider(lang, {
            provideHover: async (model, position) => {
                // Only trigger if we have an API key
                const currentApiKey = useChatStore.getState().apiKey;
                if (!currentApiKey) return null;

                // Simple heuristic: Only analyze if hovering over a substantial word/line
                const word = model.getWordAtPosition(position);
                if (!word) return null;

                const range = new monaco.Range(
                    position.lineNumber, 
                    Math.max(1, position.column - 50), 
                    position.lineNumber, 
                    Math.min(model.getLineMaxColumn(position.lineNumber), position.column + 50)
                );
                
                // Get context (current line roughly)
                const codeContext = model.getValueInRange(range);
                if (codeContext.trim().length < 5) return null;

                const cacheKey = `${lang}:${position.lineNumber}:${codeContext.trim()}`;
                
                if (hoverCache.has(cacheKey)) {
                     return {
                        range: range,
                        contents: [
                            { value: '**🔍 Análise Capy AI**' },
                            { value: hoverCache.get(cacheKey) || '' }
                        ]
                    };
                }

                // We return a "promise" hover which is tricky in Monaco synchronous return types sometimes,
                // but Monaco supports async provideHover.
                // However, we want to debounce or wait. 
                // To avoid spamming Gemini on every mouse move, let's look for "interesting" things or require a small delay?
                // Monaco handles the "mouse hover duration" (stop) internally before calling this.

                // Let's analyze!
                const analysis = await analyzeCodeHover(currentApiKey, codeContext, lang);
                hoverCache.set(cacheKey, analysis);

                return {
                    range: range,
                    contents: [
                        { value: '**🔍 Análise Capy AI**' },
                        { value: analysis }
                    ]
                };
            }
        });
    });


    // Context Menu Logic
    editor.onContextMenu((e) => {
        e.event.preventDefault();
        setContextMenu({
            x: e.event.posx,
            y: e.event.posy,
            isOpen: true
        });
    });
  };

  const updateMonacoTheme = () => {
      if (monacoRef.current) {
          const themeDef = themes[currentTheme];
          monacoRef.current.editor.setTheme(themeDef?.monacoTheme || 'vs-dark');
      }
  };

  useEffect(() => {
      updateMonacoTheme();
  }, [currentTheme]);

  useEffect(() => {
    if (pendingScroll && file && pendingScroll.fileId === file.id && editorRef.current) {
        editorRef.current.revealLineInCenter(pendingScroll.lineNumber);
        editorRef.current.setPosition({ column: 1, lineNumber: pendingScroll.lineNumber });
        clearPendingScroll();
    }
  }, [pendingScroll, file, clearPendingScroll]);

  const triggerAction = (actionId: string) => {
      if (editorRef.current) {
          editorRef.current.trigger('contextMenu', actionId, null);
          editorRef.current.focus();
      }
  };
  
  const handlePreview = () => {
      if (file) {
          setPreviewFileId(file.id);
          setActivePanelTab('PREVIEW'); 
          setPanelOpen(true);
      }
  };

  // --- AI Code Fixing Logic ---
  const handleAIFix = async () => {
      if (!editorRef.current || !file) return;
      if (!apiKey) {
          addNotification('error', "API Key missing. Go to AI Chat to set it.");
          return;
      }

      const model = editorRef.current.getModel();
      const selection = editorRef.current.getSelection();
      
      let codeToFix = "";
      let isSelection = false;

      // Check if selection is empty
      if (selection.isEmpty()) {
          codeToFix = model.getValue();
      } else {
          codeToFix = model.getValueInRange(selection);
          isSelection = true;
      }

      addNotification('info', "Capy AI is thinking...", 4000);

      try {
          const instruction = isSelection 
            ? "Analyze this code selection. Fix any errors, optimize logic, and improve readability. Return ONLY the code." 
            : "Generate code here based on the file context or fix global errors. Return the Full file content.";

          const fixedCode = await generateCodeFix({
              apiKey,
              code: codeToFix,
              instruction,
              fileName: file.name
          });

          // Apply Edits
          if (isSelection) {
              editorRef.current.executeEdits('capy-ai', [{
                  range: selection,
                  text: fixedCode,
                  forceMoveMarkers: true
              }]);
          } else {
              // Replace full file
              editorRef.current.executeEdits('capy-ai', [{
                  range: model.getFullModelRange(),
                  text: fixedCode,
                  forceMoveMarkers: true
              }]);
          }

          addNotification('success', "Code updated by Capy!");

      } catch (err: any) {
          addNotification('error', "AI Fix failed: " + err.message);
      }
  };

  const getMenuItems = (): ContextMenuItem[] => {
      const items: ContextMenuItem[] = [
          { label: 'Ir para Definição', onClick: () => triggerAction('editor.action.revealDefinition'), shortcut: 'F12' },
          { label: 'Ir para Referências', onClick: () => triggerAction('editor.action.goToReferences'), shortcut: 'Shift+F12' },
          { label: '', onClick: () => {}, separator: true },
      ];

      // Add AI Items
      items.push({ 
          label: '✨ Capy AI: Fix/Refactor Selection', 
          onClick: handleAIFix,
          shortcut: 'Ctrl+Shift+.',
      });

      items.push({ label: '', onClick: () => {}, separator: true });

      items.push(
          { label: 'Mostrar Versão Prévia', onClick: handlePreview, shortcut: 'F5' },
          { label: '', onClick: () => {}, separator: true },
          { label: 'Adicionar Arquivo ao Chat', onClick: () => addNotification('info', 'File context added to AI') },
          { label: 'Abrir Chat Embutido', onClick: () => setRightSidebarOpen(true), shortcut: 'Ctrl+I' },
          { label: '', onClick: () => {}, separator: true },
          { label: 'Renomear Símbolo', onClick: () => triggerAction('editor.action.rename'), shortcut: 'F2' },
          { label: 'Formatar Documento', onClick: () => triggerAction('editor.action.formatDocument'), shortcut: 'Shift+Alt+F' },
          { label: 'Command Palette', onClick: () => setCommandPalette(true), shortcut: 'F1' },
          { label: '', onClick: () => {}, separator: true },
          { label: 'Recortar', onClick: () => triggerAction('editor.action.clipboardCutAction'), shortcut: 'Ctrl+X' },
          { label: 'Copiar', onClick: () => triggerAction('editor.action.clipboardCopyAction'), shortcut: 'Ctrl+C' },
          { label: 'Colar', onClick: () => triggerAction('editor.action.clipboardPasteAction'), shortcut: 'Ctrl+V' },
      );
      
      return items;
  };

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-ide-bg">
        <div className="w-16 h-16 bg-ide-activity rounded-full flex items-center justify-center mb-4">
             <span className="text-4xl">⚡️</span>
        </div>
        <p>Select a file to start editing</p>
        <p className="text-xs mt-2 opacity-50">CapyUNI Codium</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-ide-bg pt-2 relative" ref={containerRef}>
      <Editor
        height="100%"
        width="100%"
        language={file.language || 'plaintext'}
        value={file.content || ''}
        path={file.id} 
        onChange={handleEditorChange}
        onMount={handleMount}
        onValidate={handleValidation}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 10, bottom: 10 },
          renderIndentGuides: true,
          contextmenu: false, // We disable native menu to show ours
          theme: themes[currentTheme]?.monacoTheme || 'vs-dark', // Force initial theme prop
          hover: {
              enabled: true,
              delay: 800 // Wait 800ms before triggering hover to avoid API spam
          }
        }}
      />
      {contextMenu.isOpen && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
          items={getMenuItems()}
        />
      )}
    </div>
  );
};