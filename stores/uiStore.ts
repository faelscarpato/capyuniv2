import { create } from 'zustand';
import { applyTheme } from '../lib/themes';

export type SidebarViewType = 'explorer' | 'search' | 'settings' | 'docs' | 'community' | 'blog' | 'pricing' | 'extensions' | 'run' | 'grounding' | 'nano-banana';
export type RightSidebarViewType = 'chat' | 'preview' | 'capyuniverse' | 'none';
export type Language = 'pt' | 'en';

export interface MarkerData {
  owner: string;
  code?: string | { value: string; target: any };
  severity: number; // 8 = error, 4 = warning, 2 = info, 1 = hint
  message: string;
  source?: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  resource: string; // File URI/ID
}

interface UIState {
  // Device State
  isMobile: boolean;
  language: Language;

  // Left Sidebar
  isSidebarOpen: boolean;
  activeSidebarView: SidebarViewType;
  sidebarWidth: number; 
  
  // Right Sidebar (AI & Preview)
  isRightSidebarOpen: boolean;
  activeRightSidebarView: RightSidebarViewType;
  rightSidebarWidth: number;

  // Bottom Panel
  isPanelOpen: boolean;
  activePanelTab: string;
  panelHeight: number;
  
  // Mobile Specific
  isMobileDockCollapsed: boolean;

  // Preview State
  previewFileId: string | null;

  // Modals
  isQuickOpenOpen: boolean;
  isCommandPaletteOpen: boolean;
  isAboutOpen: boolean; 
  isDocsOpen: boolean;
  isTutorialOpen: boolean;
  isApiKeyModalOpen: boolean;

  // Theme & Console & Problems
  currentTheme: string;
  consoleOutput: string[];
  markers: MarkerData[];

  // Actions
  setIsMobile: (isMobile: boolean) => void;
  setLanguage: (lang: Language) => void;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveSidebarView: (view: SidebarViewType) => void;
  setSidebarWidth: (width: number) => void;

  toggleRightSidebar: () => void;
  setRightSidebarOpen: (open: boolean) => void;
  setActiveRightSidebarView: (view: RightSidebarViewType) => void;
  setRightSidebarWidth: (width: number) => void;
  
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  setPanelHeight: (height: number) => void;
  setActivePanelTab: (tab: string) => void;
  
  setMobileDockCollapsed: (collapsed: boolean) => void;
  toggleMobileDock: () => void;

  setPreviewFileId: (id: string | null) => void;
  
  toggleQuickOpen: () => void;
  setQuickOpen: (open: boolean) => void;
  
  toggleCommandPalette: () => void;
  setCommandPalette: (open: boolean) => void;

  setAboutOpen: (open: boolean) => void; 
  setDocsOpen: (open: boolean) => void;
  setTutorialOpen: (open: boolean) => void;
  setApiKeyModalOpen: (open: boolean) => void;

  setTheme: (themeId: string) => void;
  addConsoleLog: (log: string) => void;
  clearConsole: () => void;
  
  setMarkers: (markers: MarkerData[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobile: window.innerWidth < 768,
  language: 'pt', // Default Portuguese

  isSidebarOpen: true,
  activeSidebarView: 'explorer',
  sidebarWidth: 300, 
  
  isRightSidebarOpen: false,
  activeRightSidebarView: 'chat',
  rightSidebarWidth: 350,

  isPanelOpen: false, 
  activePanelTab: 'TERMINAL',
  panelHeight: 250,
  
  isMobileDockCollapsed: false,

  previewFileId: null,

  isQuickOpenOpen: false,
  isCommandPaletteOpen: false,
  isAboutOpen: false,
  isDocsOpen: false,
  isTutorialOpen: false,
  isApiKeyModalOpen: false,

  currentTheme: 'vscode-dark',
  consoleOutput: [],
  markers: [],

  setIsMobile: (isMobile) => set({ isMobile }),
  setLanguage: (lang) => set({ language: lang }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setActiveSidebarView: (view) => set({ activeSidebarView: view }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  setRightSidebarOpen: (open) => set({ isRightSidebarOpen: open }),
  setActiveRightSidebarView: (view) => set({ activeRightSidebarView: view }),
  setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
  
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setPanelOpen: (open) => set({ isPanelOpen: open }),
  setPanelHeight: (height) => set({ panelHeight: height }),
  setActivePanelTab: (tab) => set({ activePanelTab: tab }),

  setMobileDockCollapsed: (collapsed) => set({ isMobileDockCollapsed: collapsed }),
  toggleMobileDock: () => set((state) => ({ isMobileDockCollapsed: !state.isMobileDockCollapsed })),

  setPreviewFileId: (id) => set({ previewFileId: id }),

  toggleQuickOpen: () => set((state) => ({ isQuickOpenOpen: !state.isQuickOpenOpen })),
  setQuickOpen: (open) => set({ isQuickOpenOpen: open }),

  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setCommandPalette: (open) => set({ isCommandPaletteOpen: open }),

  setAboutOpen: (open) => set({ isAboutOpen: open }),
  setDocsOpen: (open) => set({ isDocsOpen: open }),
  setTutorialOpen: (open) => set({ isTutorialOpen: open }),
  setApiKeyModalOpen: (open) => set({ isApiKeyModalOpen: open }),

  setTheme: (themeId) => {
      applyTheme(themeId);
      set({ currentTheme: themeId });
  },

  addConsoleLog: (log) => set(state => ({ consoleOutput: [...state.consoleOutput, log] })),
  clearConsole: () => set({ consoleOutput: [] }),
  
  setMarkers: (markers) => set({ markers })
}));