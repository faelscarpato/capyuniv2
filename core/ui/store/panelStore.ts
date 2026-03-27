import type { PanelTabType } from './types';

type SetStateFn<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>)
) => void;

export interface PanelSlice {
  isPanelOpen: boolean;
  activePanelTab: PanelTabType;
  panelHeight: number;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  setPanelHeight: (height: number) => void;
  setActivePanelTab: (tab: PanelTabType) => void;
}

export const createPanelStore = <T extends PanelSlice>(set: SetStateFn<T>): PanelSlice => ({
  isPanelOpen: false,
  activePanelTab: 'TERMINAL',
  panelHeight: 250,
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen } as Partial<T>)),
  setPanelOpen: (open) => set({ isPanelOpen: open } as Partial<T>),
  setPanelHeight: (height) => set({ panelHeight: height } as Partial<T>),
  setActivePanelTab: (tab) => set({ activePanelTab: tab } as Partial<T>)
});

