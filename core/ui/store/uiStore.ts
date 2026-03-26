import { create } from 'zustand';

type SidebarView = 'explorer' | 'search' | 'extensions' | 'git' | 'settings';
type RightSidebarView = 'chat' | 'preview' | 'none';

interface UIState {
  sidebar: { open: boolean; view: SidebarView; width: number };
  rightSidebar: { open: boolean; view: RightSidebarView; width: number };
  panel: { open: boolean; tab: 'TERMINAL' | 'PREVIEW' | 'OUTPUT' | 'PROBLEMS'; height: number };
  setSidebar: (partial: Partial<UIState['sidebar']>) => void;
  setRightSidebar: (partial: Partial<UIState['rightSidebar']>) => void;
  setPanel: (partial: Partial<UIState['panel']>) => void;
}

export const useUICoreStore = create<UIState>((set) => ({
  sidebar: { open: true, view: 'explorer', width: 300 },
  rightSidebar: { open: false, view: 'chat', width: 350 },
  panel: { open: false, tab: 'TERMINAL', height: 260 },
  setSidebar: (partial) => set((state) => ({ sidebar: { ...state.sidebar, ...partial } })),
  setRightSidebar: (partial) => set((state) => ({ rightSidebar: { ...state.rightSidebar, ...partial } })),
  setPanel: (partial) => set((state) => ({ panel: { ...state.panel, ...partial } }))
}));

