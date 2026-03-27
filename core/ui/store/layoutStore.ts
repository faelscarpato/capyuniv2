import { applyTheme } from '../../../lib/themes';
import type { Language, RightSidebarViewType, SidebarViewType } from './types';

type SetStateFn<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>)
) => void;

export interface LayoutSlice {
  isMobile: boolean;
  language: Language;
  isSidebarOpen: boolean;
  activeSidebarView: SidebarViewType;
  sidebarWidth: number;
  isRightSidebarOpen: boolean;
  activeRightSidebarView: RightSidebarViewType;
  rightSidebarWidth: number;
  isMobileDockCollapsed: boolean;
  previewFileId: string | null;
  currentTheme: string;
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
  setMobileDockCollapsed: (collapsed: boolean) => void;
  toggleMobileDock: () => void;
  setPreviewFileId: (id: string | null) => void;
  setTheme: (themeId: string) => void;
}

export const createLayoutStore = <T extends LayoutSlice>(set: SetStateFn<T>): LayoutSlice => ({
  isMobile: window.innerWidth < 768,
  language: 'pt',
  isSidebarOpen: true,
  activeSidebarView: 'explorer',
  sidebarWidth: 300,
  isRightSidebarOpen: false,
  activeRightSidebarView: 'chat',
  rightSidebarWidth: 350,
  isMobileDockCollapsed: false,
  previewFileId: null,
  currentTheme: 'vscode-dark',

  setIsMobile: (isMobile) => set({ isMobile } as Partial<T>),
  setLanguage: (lang) => set({ language: lang } as Partial<T>),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen } as Partial<T>)),
  setSidebarOpen: (open) => set({ isSidebarOpen: open } as Partial<T>),
  setActiveSidebarView: (view) => set({ activeSidebarView: view } as Partial<T>),
  setSidebarWidth: (width) => set({ sidebarWidth: width } as Partial<T>),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen } as Partial<T>)),
  setRightSidebarOpen: (open) => set({ isRightSidebarOpen: open } as Partial<T>),
  setActiveRightSidebarView: (view) => set({ activeRightSidebarView: view } as Partial<T>),
  setRightSidebarWidth: (width) => set({ rightSidebarWidth: width } as Partial<T>),
  setMobileDockCollapsed: (collapsed) => set({ isMobileDockCollapsed: collapsed } as Partial<T>),
  toggleMobileDock: () => set((state) => ({ isMobileDockCollapsed: !state.isMobileDockCollapsed } as Partial<T>)),
  setPreviewFileId: (id) => set({ previewFileId: id } as Partial<T>),
  setTheme: (themeId) => {
    applyTheme(themeId);
    set({ currentTheme: themeId } as Partial<T>);
  }
});

