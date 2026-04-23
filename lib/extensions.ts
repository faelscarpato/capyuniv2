export type ExtensionId = string;

// Import React lazy to avoid ReferenceError when lazily loading components. Without this import,
// `React` would be undefined in this module, causing runtime errors when `React.lazy` is invoked.
import { lazy } from 'react';

export interface ChatContext {
  runTerminalCommand?: (command: string) => void;
  getActiveFilePath?: () => string | null;
}

interface BaseExtension {
  id: ExtensionId;
  name: string;
  description?: string;
  enabled: boolean;
}

export interface EditorExtension extends BaseExtension {
  snippets?: Record<string, string>;
  templates?: Record<string, string>;
  refactors?: Record<string, (code: string) => string>;
  fileTypes?: string[];
  onFileOpen?: (filePath: string) => void;
}

export interface ChatSkill extends BaseExtension {
  triggerPhrases: string[];
  onTrigger: (message: string, ctx: ChatContext) => Promise<string | void>;
}

type Extension = EditorExtension | ChatSkill;

const EXTENSIONS_STORAGE_KEY = 'capy_extensions_enabled';
const registry: Record<ExtensionId, Extension> = {};

const isChatSkill = (ext: Extension): ext is ChatSkill => {
  return 'triggerPhrases' in ext;
};

const normalizeFileType = (fileType: string): string => {
  return fileType.toLowerCase().replace(/^\./, '');
};

const parsePersistedEnabledMap = (): Record<ExtensionId, boolean> => {
  const raw = localStorage.getItem(EXTENSIONS_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const enabledMap: Record<ExtensionId, boolean> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([id, value]) => {
      if (typeof value === 'boolean') {
        enabledMap[id] = value;
      }
    });
    return enabledMap;
  } catch {
    return {};
  }
};

const getPersistedState = (id: ExtensionId): boolean | undefined => {
  const map = parsePersistedEnabledMap();
  return map[id];
};

const persistEnabledState = (): void => {
  const state: Record<ExtensionId, boolean> = {};
  Object.values(registry).forEach((ext) => {
    state[ext.id] = ext.enabled;
  });
  localStorage.setItem(EXTENSIONS_STORAGE_KEY, JSON.stringify(state));
};

export function registerExtension(ext: EditorExtension | ChatSkill): void {
  const persisted = getPersistedState(ext.id);
  registry[ext.id] = {
    ...ext,
    enabled: typeof persisted === 'boolean' ? persisted : ext.enabled
  };
  persistEnabledState();
}

export function listEditorExtensions(): EditorExtension[] {
  return Object.values(registry).filter((ext): ext is EditorExtension => !isChatSkill(ext));
}

export function listChatSkills(): ChatSkill[] {
  return Object.values(registry).filter((ext): ext is ChatSkill => isChatSkill(ext));
}

export function enableExtension(id: ExtensionId): void {
  const ext = registry[id];
  if (ext) {
    ext.enabled = true;
    persistEnabledState();
  }
}

export function disableExtension(id: ExtensionId): void {
  const ext = registry[id];
  if (ext) {
    ext.enabled = false;
    persistEnabledState();
  }
}

export function triggerEditorHook(hook: keyof EditorExtension, ...args: unknown[]): void {
  const exts = listEditorExtensions();

  for (const ext of exts) {
    if (!ext.enabled) continue;

    const handler = ext[hook];
    if (typeof handler === 'function') {
      (handler as (...params: unknown[]) => void)(...args);
    }
  }
}

export function triggerChatSkill(message: string, ctx: ChatContext): ChatSkill | null {
  const normalizedMessage = message.toLowerCase();

  for (const skill of listChatSkills()) {
    if (!skill.enabled) continue;
    if (skill.triggerPhrases.some((phrase) => normalizedMessage.includes(phrase.toLowerCase()))) {
      return skill;
    }
  }

  return null;
}

const supportsFileType = (ext: EditorExtension, fileType: string): boolean => {
  if (!ext.fileTypes || ext.fileTypes.length === 0) return true;
  const normalized = normalizeFileType(fileType);
  return ext.fileTypes.some((type) => normalizeFileType(type) === normalized);
};

export type SnippetEntry = {
  extensionId: ExtensionId;
  extensionName: string;
  snippetId: string;
  content: string;
};

export type RefactorEntry = {
  extensionId: ExtensionId;
  extensionName: string;
  refactorId: string;
  apply: (code: string) => string;
};

export function listAvailableSnippets(fileType: string): SnippetEntry[] {
  const items: SnippetEntry[] = [];

  for (const ext of listEditorExtensions()) {
    if (!ext.enabled || !supportsFileType(ext, fileType) || !ext.snippets) continue;

    Object.entries(ext.snippets).forEach(([snippetId, content]) => {
      items.push({
        extensionId: ext.id,
        extensionName: ext.name,
        snippetId,
        content
      });
    });
  }

  return items;
}

export function listAvailableTemplates(fileType: string): SnippetEntry[] {
  const items: SnippetEntry[] = [];

  for (const ext of listEditorExtensions()) {
    if (!ext.enabled || !supportsFileType(ext, fileType) || !ext.templates) continue;

    Object.entries(ext.templates).forEach(([snippetId, content]) => {
      items.push({
        extensionId: ext.id,
        extensionName: ext.name,
        snippetId,
        content
      });
    });
  }

  return items;
}

export function listAvailableRefactors(fileType: string): RefactorEntry[] {
  const items: RefactorEntry[] = [];

  for (const ext of listEditorExtensions()) {
    if (!ext.enabled || !supportsFileType(ext, fileType) || !ext.refactors) continue;

    Object.entries(ext.refactors).forEach(([refactorId, apply]) => {
      items.push({
        extensionId: ext.id,
        extensionName: ext.name,
        refactorId,
        apply
      });
    });
  }

  return items;
}

// Ensure the path is relative to the current file and includes the correct extension/directory
const MainLayout = lazy(() => import('../components/layout/MainLayout'));