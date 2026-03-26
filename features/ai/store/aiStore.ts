import { create } from 'zustand';
import type { LegacyProvider } from '../services/AIOrchestrator';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

interface AIStoreState {
  preferredProvider: LegacyProvider;
  keys: {
    geminiApiKey: string;
    groqApiKey: string;
    llm7ApiKey: string;
  };
  messages: AIChatMessage[];
  isLoading: boolean;
  setPreferredProvider: (provider: LegacyProvider) => void;
  setProviderKey: (provider: LegacyProvider, key: string) => void;
  pushMessage: (message: Omit<AIChatMessage, 'id' | 'createdAt'>) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}

const keyForProvider = (provider: LegacyProvider): keyof AIStoreState['keys'] => {
  if (provider === 'groq') return 'groqApiKey';
  if (provider === 'llm7') return 'llm7ApiKey';
  return 'geminiApiKey';
};

export const useAIStore = create<AIStoreState>((set) => ({
  preferredProvider: 'gemini',
  keys: {
    geminiApiKey: '',
    groqApiKey: '',
    llm7ApiKey: ''
  },
  messages: [],
  isLoading: false,
  setPreferredProvider: (provider) => set({ preferredProvider: provider }),
  setProviderKey: (provider, key) =>
    set((state) => ({
      keys: {
        ...state.keys,
        [keyForProvider(provider)]: key
      }
    })),
  pushMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Math.random().toString(36).slice(2),
          createdAt: Date.now(),
          ...message
        }
      ]
    })),
  clearMessages: () => set({ messages: [] }),
  setLoading: (loading) => set({ isLoading: loading })
}));

