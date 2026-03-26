import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount, OnChange, OnValidate } from '@monaco-editor/react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore, MarkerData } from '../../stores/uiStore';
import { themes } from '../../lib/themes';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { useNotificationStore } from '../../stores/notificationStore';
import { useChatStore } from '../../stores/chatStore';
import { analyzeHover, generateCodeFix } from '../../lib/aiProvider';
import { listAvailableRefactors, listAvailableSnippets, listAvailableTemplates } from '../../lib/extensions';

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
    const { preferredProvider, geminiApiKey, groqApiKey, llm7ApiKey } = useChatStore();

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
            rules: [
                { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
                { token: 'keyword', foreground: '8B5CF6', fontStyle: 'bold' },
                { token: 'string', foreground: '10B981' },
                { token: 'number', foreground: 'F43F5E' },
                { token: 'type', foreground: '3B82F6' },
            ],
            colors: {
                'editor.background': '#0F172A',
                'editor.foreground': '#F8FAFC',
                'editorLineNumber.foreground': '#334155',
                'editor.lineHighlightBackground': '#1E293B',
                'editorCursor.foreground': '#8B5CF6',
                'editorIndentGuide.background': '#1E293B',
                'editorIndentGuide.activeBackground': '#334155',
                'editor.selectionBackground': '#8B5CF633',
            }
        });

        // Define Midnight Pro (Premium / Apple Style)
        monaco.editor.defineTheme('midnight-pro', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '555555', fontStyle: 'italic' },
                { token: 'keyword', foreground: '3b82f6', fontStyle: 'bold' },
                { token: 'string', foreground: 'ef4444' },
                { token: 'variable', foreground: 'F5F5F7' },
                { token: 'type', foreground: '06b6d4' },
                { token: 'function', foreground: '8b5cf6' },
            ],
            colors: {
                'editor.background': '#000000',
                'editor.foreground': '#F5F5F7',
                'editorCursor.foreground': '#3b82f6',
                'editor.lineHighlightBackground': '#111111',
                'editorLineNumber.foreground': '#333333',
                'editorLineNumber.activeForeground': '#3b82f6',
                'editorIndentGuide.background': '#111111',
                'editorIndentGuide.activeBackground': '#333333',
                'sidebar.background': '#000000',
                'editor.selectionBackground': '#3b82f644',
                'editorBracketMatch.background': '#3b82f633',
                'editorBracketMatch.border': '#3b82f6'
            }
        });

        // Define a "Glass" theme for future uses
        monaco.editor.defineTheme('capy-glass', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#00000000', // Transparent background to show the IDE gradient
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
                    const chatState = useChatStore.getState();
                    const provider = chatState.preferredProvider;
                    const apiKeys = {
                        geminiApiKey: chatState.geminiApiKey,
                        groqApiKey: chatState.groqApiKey,
                        llm7ApiKey: chatState.llm7ApiKey
                    };
                    const hasActiveKey = provider === 'gemini'
                        ? apiKeys.geminiApiKey
                        : provider === 'groq'
                            ? apiKeys.groqApiKey
                            : apiKeys.llm7ApiKey;
                    if (!hasActiveKey) return null;

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
                    const analysis = await analyzeHover(provider, apiKeys, codeContext, lang);
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
        const activeKey = preferredProvider === 'gemini'
            ? geminiApiKey
            : preferredProvider === 'groq'
                ? groqApiKey
                : llm7ApiKey;

        if (!activeKey) {
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
                provider: preferredProvider,
                apiKeys: {
                    geminiApiKey,
                    groqApiKey,
                    llm7ApiKey
                },
                params: {
                    code: codeToFix,
                    instruction,
                    fileName: file.name
                }
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

    const getCurrentFileType = (): string => {
        if (!file) return '';
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ext || (file.language || '').toLowerCase();
    };

    const insertExtensionContent = (content: string, kind: 'snippet' | 'template', id: string) => {
        if (!editorRef.current) return;
        const selection = editorRef.current.getSelection();
        if (!selection) return;

        editorRef.current.executeEdits('capy-extension', [{
            range: selection,
            text: content,
            forceMoveMarkers: true
        }]);
        addNotification('success', `${kind === 'snippet' ? 'Snippet' : 'Template'} "${id}" inserido.`);
    };

    const applyExtensionRefactor = (refactorId: string, transform: (code: string) => string) => {
        if (!editorRef.current) return;
        const model = editorRef.current.getModel();
        const selection = editorRef.current.getSelection();
        if (!model || !selection) return;

        const isSelection = !selection.isEmpty();
        const currentCode = isSelection ? model.getValueInRange(selection) : model.getValue();
        const updatedCode = transform(currentCode);

        const targetRange = isSelection ? selection : model.getFullModelRange();
        editorRef.current.executeEdits('capy-extension-refactor', [{
            range: targetRange,
            text: updatedCode,
            forceMoveMarkers: true
        }]);
        addNotification('success', `Refactor "${refactorId}" aplicado.`);
    };

    const getMenuItems = (): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [
            { label: 'Ir para Definição', onClick: () => triggerAction('editor.action.revealDefinition'), shortcut: 'F12' },
            { label: 'Ir para Referências', onClick: () => triggerAction('editor.action.goToReferences'), shortcut: 'Shift+F12' },
            { label: '', onClick: () => { }, separator: true },
        ];

        // Add AI Items
        items.push({
            label: '✨ Capy AI: Fix/Refactor Selection',
            onClick: handleAIFix,
            shortcut: 'Ctrl+Shift+.',
        });

        const fileType = getCurrentFileType();
        const snippetEntries = listAvailableSnippets(fileType);
        const templateEntries = listAvailableTemplates(fileType);
        const refactorEntries = listAvailableRefactors(fileType);

        if (snippetEntries.length > 0) {
            items.push({ label: '', onClick: () => { }, separator: true });
            snippetEntries.slice(0, 4).forEach((entry) => {
                items.push({
                    label: `Snippet: ${entry.snippetId}`,
                    onClick: () => insertExtensionContent(entry.content, 'snippet', entry.snippetId),
                });
            });
        }

        if (templateEntries.length > 0) {
            items.push({ label: '', onClick: () => { }, separator: true });
            templateEntries.slice(0, 3).forEach((entry) => {
                items.push({
                    label: `Template: ${entry.snippetId}`,
                    onClick: () => insertExtensionContent(entry.content, 'template', entry.snippetId),
                });
            });
        }

        if (refactorEntries.length > 0) {
            items.push({ label: '', onClick: () => { }, separator: true });
            refactorEntries.slice(0, 4).forEach((entry) => {
                items.push({
                    label: `Refactor: ${entry.refactorId}`,
                    onClick: () => applyExtensionRefactor(entry.refactorId, entry.apply),
                });
            });
        }

        items.push({ label: '', onClick: () => { }, separator: true });

        items.push(
            { label: 'Mostrar Versão Prévia', onClick: handlePreview, shortcut: 'F5' },
            { label: '', onClick: () => { }, separator: true },
            { label: 'Adicionar Arquivo ao Chat', onClick: () => addNotification('info', 'File context added to AI') },
            { label: 'Abrir Chat Embutido', onClick: () => setRightSidebarOpen(true), shortcut: 'Ctrl+I' },
            { label: '', onClick: () => { }, separator: true },
            { label: 'Renomear Símbolo', onClick: () => triggerAction('editor.action.rename'), shortcut: 'F2' },
            { label: 'Formatar Documento', onClick: () => triggerAction('editor.action.formatDocument'), shortcut: 'Shift+Alt+F' },
            { label: 'Command Palette', onClick: () => setCommandPalette(true), shortcut: 'F1' },
            { label: '', onClick: () => { }, separator: true },
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
