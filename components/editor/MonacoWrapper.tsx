import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnChange, OnMount, OnValidate } from '@monaco-editor/react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { MarkerData, useUIStore } from '../../stores/uiStore';
import { themes } from '../../lib/themes';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAIStore } from '../../features/ai/store/aiStore';
import { defineCapyMonacoThemes, applyMonacoTheme } from '../../core/editor/services/monacoThemeService';
import {
  buildExtensionContextMenuItems,
  getCurrentFileType
} from '../../core/editor/services/editorExtensionContextMenu';
import { registerAIHoverProviders } from '../../features/ai/services/editorHoverService';
import { runEditorAIFix } from '../../features/ai/services/editorCodeFixService';
import { executeAppCommand } from '../../core/commands/handlers/registerDefaultCommands';

const useDebounceCallback = (callback: (...args: any[]) => void, delay: number) => {
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
  const {
    currentTheme,
    setMarkers,
    setActivePanelTab,
    setPanelOpen,
    setPreviewFileId
  } = useUIStore();
  const { addNotification } = useNotificationStore();
  const {
    preferredProvider,
    geminiApiKey,
    groqApiKey,
    llm7ApiKey,
    suggestionsEnabled
  } = useAIStore();

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverDisposeRef = useRef<(() => void) | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({
    x: 0,
    y: 0,
    isOpen: false
  });

  const file = activeTabId ? files[activeTabId] : null;

  const debouncedSave = useDebounceCallback((id: string) => {
    markSaved(id);
  }, 800);

  const handleEditorChange: OnChange = (value) => {
    if (file && value !== undefined) {
      updateFileContent(file.id, value);
      debouncedSave(file.id);
    }
  };

  const handleValidation: OnValidate = (markers) => {
    const mappedMarkers: MarkerData[] = markers.map((marker) => ({
      owner: marker.owner,
      code: marker.code as any,
      severity: marker.severity,
      message: marker.message,
      source: marker.source,
      startLineNumber: marker.startLineNumber,
      startColumn: marker.startColumn,
      endLineNumber: marker.endLineNumber,
      endColumn: marker.endColumn,
      resource: file?.name || 'unknown'
    }));
    setMarkers(mappedMarkers);
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    defineCapyMonacoThemes(monaco);
    applyMonacoTheme(monaco, currentTheme);

    // Apply inline suggestions option based on store flag. Without a
    // provider registered, Monaco will provide word-based suggestions. A
    // future iteration can register an inline completion provider to use AI.
    editor.updateOptions({ inlineSuggest: { enabled: suggestionsEnabled } });

    hoverDisposeRef.current?.();
    hoverDisposeRef.current = registerAIHoverProviders(monaco);

    editor.onContextMenu((event) => {
      event.event.preventDefault();
      setContextMenu({
        x: event.event.posx,
        y: event.event.posy,
        isOpen: true
      });
    });
  };

  // Update editor options when the suggestionsEnabled flag changes.
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ inlineSuggest: { enabled: suggestionsEnabled } });
    }
  }, [suggestionsEnabled]);

  useEffect(() => {
    if (monacoRef.current) {
      applyMonacoTheme(monacoRef.current, currentTheme);
    }
  }, [currentTheme]);

  useEffect(() => {
    return () => {
      hoverDisposeRef.current?.();
      hoverDisposeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (pendingScroll && file && pendingScroll.fileId === file.id && editorRef.current) {
      editorRef.current.revealLineInCenter(pendingScroll.lineNumber);
      editorRef.current.setPosition({ column: 1, lineNumber: pendingScroll.lineNumber });
      clearPendingScroll();
    }
  }, [pendingScroll, file, clearPendingScroll]);

  const triggerAction = (actionId: string) => {
    if (!editorRef.current) return;
    editorRef.current.trigger('contextMenu', actionId, null);
    editorRef.current.focus();
  };

  const handlePreview = () => {
    if (!file) return;
    setPreviewFileId(file.id);
    setActivePanelTab('PREVIEW');
    setPanelOpen(true);
  };

  const handleAIFix = async () => {
    await runEditorAIFix({
      editor: editorRef.current,
      file: file ? { id: file.id, name: file.name } : null,
      chatState: { preferredProvider, geminiApiKey, groqApiKey, llm7ApiKey },
      notifications: { addNotification }
    });
  };

  const insertExtensionContent = (content: string, kind: 'snippet' | 'template', id: string) => {
    if (!editorRef.current) return;
    const selection = editorRef.current.getSelection();
    if (!selection) return;

    editorRef.current.executeEdits('capy-extension', [
      {
        range: selection,
        text: content,
        forceMoveMarkers: true
      }
    ]);
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

    editorRef.current.executeEdits('capy-extension-refactor', [
      {
        range: targetRange,
        text: updatedCode,
        forceMoveMarkers: true
      }
    ]);

    addNotification('success', `Refactor "${refactorId}" aplicado.`);
  };

  const getMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      { label: 'Ir para Definição', onClick: () => triggerAction('editor.action.revealDefinition'), shortcut: 'F12' },
      { label: 'Ir para Referências', onClick: () => triggerAction('editor.action.goToReferences'), shortcut: 'Shift+F12' },
      { label: '', onClick: () => {}, separator: true },
      { label: '✨ Capy AI: Fix/Refactor Selection', onClick: handleAIFix, shortcut: 'Ctrl+Shift+.' }
    ];

    const extensionItems = buildExtensionContextMenuItems({
      fileType: getCurrentFileType(file?.name, file?.language),
      onInsertSnippet: (content, id) => insertExtensionContent(content, 'snippet', id),
      onInsertTemplate: (content, id) => insertExtensionContent(content, 'template', id),
      onApplyRefactor: applyExtensionRefactor
    });
    items.push(...extensionItems);

    items.push({ label: '', onClick: () => {}, separator: true });
    items.push(
      { label: 'Mostrar Versão Prévia', onClick: handlePreview, shortcut: 'F5' },
      { label: '', onClick: () => {}, separator: true },
      { label: 'Adicionar Arquivo ao Chat', onClick: () => addNotification('info', 'File context added to AI') },
      {
        label: 'Abrir Chat Embutido',
        onClick: () => {
          executeAppCommand('ui.openChat');
        },
        shortcut: 'Ctrl+I'
      },
      { label: '', onClick: () => {}, separator: true },
      { label: 'Renomear Símbolo', onClick: () => triggerAction('editor.action.rename'), shortcut: 'F2' },
      { label: 'Formatar Documento', onClick: () => triggerAction('editor.action.formatDocument'), shortcut: 'Shift+Alt+F' },
      { label: 'Command Palette', onClick: () => executeAppCommand('ui.openCommandPalette'), shortcut: 'F1' },
      { label: '', onClick: () => {}, separator: true },
      { label: 'Recortar', onClick: () => triggerAction('editor.action.clipboardCutAction'), shortcut: 'Ctrl+X' },
      { label: 'Copiar', onClick: () => triggerAction('editor.action.clipboardCopyAction'), shortcut: 'Ctrl+C' },
      { label: 'Colar', onClick: () => triggerAction('editor.action.clipboardPasteAction'), shortcut: 'Ctrl+V' }
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
          contextmenu: false,
          theme: themes[currentTheme]?.monacoTheme || 'vs-dark',
          hover: {
            enabled: true,
            delay: 800
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
