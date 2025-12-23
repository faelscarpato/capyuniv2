import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  metadata?: any; // To store potential file updates
}

interface ChatState {
  apiKey: string;
  messages: ChatMessage[];
  isLoading: boolean;
  
  setApiKey: (key: string) => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  apiKey: localStorage.getItem('capy_gemini_key') || '',
  messages: [
      { id: 'welcome', role: 'model', content: "Hello! I'm Capy, your AI assistant. Set your API Key to start coding with Gemini.", timestamp: Date.now() }
  ],
  isLoading: false,

  setApiKey: (key) => {
      localStorage.setItem('capy_gemini_key', key);
      set({ apiKey: key });
  },

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: Math.random().toString(36), timestamp: Date.now() }]
  })),

  setLoading: (l) => set({ isLoading: l }),
  
  clearHistory: () => set({ messages: [] })
}));