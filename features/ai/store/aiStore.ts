import { create } from 'zustand';
import type { AIProvider } from '../../../lib/aiProvider';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { chatHistoryService } from '../services/chatHistoryService';

const STORAGE_KEYS = {
  preferredProvider: 'capy_preferred_provider',
  geminiApiKey: 'capy_gemini_key',
  groqApiKey: 'capy_groq_key',
  llm7ApiKey: 'capy_llm7_key'
} as const;

const getInitialProvider = (): AIProvider => {
  const stored = localStorage.getItem(STORAGE_KEYS.preferredProvider);
  return stored === 'groq' || stored === 'llm7' ? stored : 'gemini';
};

export interface AIChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: unknown;
}

export interface AIStoreState {
  // Legacy compatibility keys.
  apiKey: string;
  geminiApiKey: string;
  groqApiKey: string;
  llm7ApiKey: string;
  preferredProvider: AIProvider;
  messages: AIChatMessage[];
  isLoading: boolean;
  currentWorkspaceId: string | null;
  // Legacy actions.
  setApiKey: (key: string) => void;
  setProviderApiKey: (provider: AIProvider, key: string) => void;
  setPreferredProvider: (provider: AIProvider) => void;
  addMessage: (msg: Omit<AIChatMessage, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  setLoading: (loading: boolean) => void;
  // V2 aliases.
  setProviderKey: (provider: AIProvider, key: string) => void;
  pushMessage: (msg: Omit<AIChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  // Workspace-aware history.
  loadWorkspaceHistory: (workspaceId: string) => Promise<void>;
  saveWorkspaceHistory: (workspaceId?: string) => Promise<void>;
}

const createMessage = (message: Omit<AIChatMessage, 'id' | 'timestamp'>): AIChatMessage => ({
  ...message,
  id: Math.random().toString(36).slice(2),
  timestamp: Date.now()
});

const updateProviderKey = (provider: AIProvider, key: string): Partial<AIStoreState> => {
  if (provider === 'gemini') {
    localStorage.setItem(STORAGE_KEYS.geminiApiKey, key);
    return { geminiApiKey: key, apiKey: key };
  }
  if (provider === 'groq') {
    localStorage.setItem(STORAGE_KEYS.groqApiKey, key);
    return { groqApiKey: key };
  }
  localStorage.setItem(STORAGE_KEYS.llm7ApiKey, key);
  return { llm7ApiKey: key };
};

export const useAIStore = create<AIStoreState>((set) => ({
  apiKey: localStorage.getItem(STORAGE_KEYS.geminiApiKey) || '',
  geminiApiKey: localStorage.getItem(STORAGE_KEYS.geminiApiKey) || '',
  groqApiKey: localStorage.getItem(STORAGE_KEYS.groqApiKey) || '',
  llm7ApiKey: localStorage.getItem(STORAGE_KEYS.llm7ApiKey) || '',
  preferredProvider: getInitialProvider(),
  messages: [
    createMessage({
      role: 'model',
      content: "Hello! I'm Capy, your AI assistant. Set your API Key to start coding."
    })
  ],
  isLoading: false,

  setApiKey: (key) => {
    localStorage.setItem(STORAGE_KEYS.geminiApiKey, key);
    set({ apiKey: key, geminiApiKey: key });
  },

  setProviderApiKey: (provider, key) => {
    if (key.trim()) useOnboardingStore.getState().markAIConfigured();
    set(updateProviderKey(provider, key));
  },

  setPreferredProvider: (provider) => {
    localStorage.setItem(STORAGE_KEYS.preferredProvider, provider);
    set({ preferredProvider: provider });
  },

  addMessage: (msg) => {
    set((state) => ({
      messages: [...state.messages, createMessage(msg)]
    }));
  },

  clearHistory: () => set({ messages: [] }),
  setLoading: (loading) => set({ isLoading: loading }),

  setProviderKey: (provider, key) => {
    if (key.trim()) useOnboardingStore.getState().markAIConfigured();
    set(updateProviderKey(provider, key));
  },
  pushMessage: (msg) => {
    set((state) => ({
      messages: [...state.messages, createMessage(msg)]
    }));
  },
  clearMessages: () => set({ messages: [] }),
  currentWorkspaceId: null,

  loadWorkspaceHistory: async (workspaceId) => {
    set({ currentWorkspaceId: workspaceId, isLoading: true });
    try {
      const history = await chatHistoryService.loadHistory(workspaceId);
      if (history.length > 0) {
        set({ messages: history, isLoading: false });
      } else {
        set({
          messages: [createMessage({ role: 'model', content: "Hello! I'm Capy, your AI assistant. Set your API Key to start coding." })],
          isLoading: false
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  saveWorkspaceHistory: async (workspaceId) => {
    const wsId = workspaceId || useAIStore.getState().currentWorkspaceId;
    if (!wsId) return;
    const messages = useAIStore.getState().messages;
    await chatHistoryService.saveHistory(wsId, messages);
  }
}));

