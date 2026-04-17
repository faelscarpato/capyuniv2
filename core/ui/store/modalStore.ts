type SetStateFn<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>)
) => void;

export interface ModalSlice {
  isQuickOpenOpen: boolean;
  isCommandPaletteOpen: boolean;
  isAboutOpen: boolean;
  isDocsOpen: boolean;
  isTutorialOpen: boolean;
  isApiKeyModalOpen: boolean;
  isSnapshotsOpen: boolean;
  isAuthOpen: boolean;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  toggleQuickOpen: () => void;
  setQuickOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPalette: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  setDocsOpen: (open: boolean) => void;
  setTutorialOpen: (open: boolean) => void;
  setApiKeyModalOpen: (open: boolean) => void;
  setSnapshotsOpen: (open: boolean) => void;
  setAuthOpen: (open: boolean) => void;
}

export const createModalStore = <T extends ModalSlice>(set: SetStateFn<T>): ModalSlice => ({
  isQuickOpenOpen: false,
  isCommandPaletteOpen: false,
  isAboutOpen: false,
  isDocsOpen: false,
  isTutorialOpen: false,
  isApiKeyModalOpen: false,
  isSnapshotsOpen: false,
  isAuthOpen: false,
  isSettingsOpen: false,

  setSettingsOpen: (open) => set({ isSettingsOpen: open } as Partial<T>),
  toggleQuickOpen: () => set((state) => ({ isQuickOpenOpen: !state.isQuickOpenOpen } as Partial<T>)),
  setQuickOpen: (open) => set({ isQuickOpenOpen: open } as Partial<T>),
  toggleCommandPalette: () =>
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen } as Partial<T>)),
  setCommandPalette: (open) => set({ isCommandPaletteOpen: open } as Partial<T>),
  setAboutOpen: (open) => set({ isAboutOpen: open } as Partial<T>),
  setDocsOpen: (open) => set({ isDocsOpen: open } as Partial<T>),
  setTutorialOpen: (open) => set({ isTutorialOpen: open } as Partial<T>),
  setApiKeyModalOpen: (open) => set({ isApiKeyModalOpen: open } as Partial<T>),
  setSnapshotsOpen: (open) => set({ isSnapshotsOpen: open } as Partial<T>),
  setAuthOpen: (open) => set({ isAuthOpen: open } as Partial<T>)
});

