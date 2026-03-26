import { create } from 'zustand';
import type { AIProvider } from '../lib/aiProvider';

const storedProvider = localStorage.getItem('capy_preferred_provider');
const initialProvider: AIProvider =
  storedProvider === 'groq' || storedProvider === 'llm7' ? storedProvider : 'gemini';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  metadata?: any; // To store potential file updates
}

interface ChatState {
  // Legacy field kept for backward compatibility with existing Gemini-only components.
  apiKey: string;
  geminiApiKey: string;
  groqApiKey: string;
  llm7ApiKey: string;
  preferredProvider: AIProvider;
  messages: ChatMessage[];
  isLoading: boolean;
  
  setApiKey: (key: string) => void;
  setProviderApiKey: (provider: AIProvider, key: string) => void;
  setPreferredProvider: (provider: AIProvider) => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  apiKey: localStorage.getItem('capy_gemini_key') || '',
  geminiApiKey: localStorage.getItem('capy_gemini_key') || '',
  groqApiKey: localStorage.getItem('capy_groq_key') || '',
  llm7ApiKey: localStorage.getItem('capy_llm7_key') || '',
  preferredProvider: initialProvider,
  messages: [
      { id: 'welcome', role: 'model', content: "Hello! I'm Capy, your AI assistant. Set your API Key to start coding.", timestamp: Date.now() }
  ],
  isLoading: false,

  setApiKey: (key) => {
      localStorage.setItem('capy_gemini_key', key);
      set({ apiKey: key, geminiApiKey: key });
  },

  setProviderApiKey: (provider, key) => {
      if (provider === 'gemini') {
          localStorage.setItem('capy_gemini_key', key);
          set({ geminiApiKey: key, apiKey: key });
          return;
      }

      if (provider === 'groq') {
          localStorage.setItem('capy_groq_key', key);
          set({ groqApiKey: key });
          return;
      }

      localStorage.setItem('capy_llm7_key', key);
      set({ llm7ApiKey: key });
  },

  setPreferredProvider: (provider) => {
      localStorage.setItem('capy_preferred_provider', provider);
      set({ preferredProvider: provider });
  },

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: Math.random().toString(36), timestamp: Date.now() }]
  })),

  setLoading: (l) => set({ isLoading: l }),
  
  clearHistory: () => set({ messages: [] })
}));
