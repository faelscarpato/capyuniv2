import { create } from 'zustand';
import { createLayoutStore, type LayoutSlice } from './layoutStore';
import { createPanelStore, type PanelSlice } from './panelStore';
import { createModalStore, type ModalSlice } from './modalStore';
import { createDiagnosticsStore, type DiagnosticsSlice } from './diagnosticsStore';

export type {
  SidebarViewType,
  RightSidebarViewType,
  Language,
  MarkerData,
  PanelTabType
} from './types';

export interface UICoreState extends LayoutSlice, PanelSlice, ModalSlice, DiagnosticsSlice {}

export const useUICoreStore = create<UICoreState>((set) => ({
  ...createLayoutStore<UICoreState>(set),
  ...createPanelStore<UICoreState>(set),
  ...createModalStore<UICoreState>(set),
  ...createDiagnosticsStore<UICoreState>(set)
}));
