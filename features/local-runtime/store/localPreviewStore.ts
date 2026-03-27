import { create } from 'zustand';

interface LocalPreviewState {
  detectedUrls: string[];
  activeUrl: string | null;
  lastDetectedAt: number | null;
  registerDetectedUrls: (urls: string[]) => void;
  setActiveUrl: (url: string | null) => void;
  clear: () => void;
}

export const useLocalPreviewStore = create<LocalPreviewState>((set) => ({
  detectedUrls: [],
  activeUrl: null,
  lastDetectedAt: null,

  registerDetectedUrls: (urls) =>
    set((state) => {
      const merged = Array.from(
        new Set(
          [...state.detectedUrls, ...urls]
            .map((url) => url.trim())
            .filter((url) => url.length > 0)
        )
      );
      const activeUrl = state.activeUrl || merged[0] || null;
      return {
        detectedUrls: merged,
        activeUrl,
        lastDetectedAt: Date.now()
      };
    }),

  setActiveUrl: (url) => set({ activeUrl: url }),

  clear: () => set({ detectedUrls: [], activeUrl: null, lastDetectedAt: null })
}));

