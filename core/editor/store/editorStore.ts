import { create } from 'zustand';

interface EditorState {
  activeFileId: string | null;
  cursor: { line: number; column: number } | null;
  markers: Array<{ message: string; line: number; severity: 'error' | 'warning' | 'info' }>;
  setActiveFileId: (id: string | null) => void;
  setCursor: (line: number, column: number) => void;
  setMarkers: (markers: EditorState['markers']) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeFileId: null,
  cursor: null,
  markers: [],
  setActiveFileId: (id) => set({ activeFileId: id }),
  setCursor: (line, column) => set({ cursor: { line, column } }),
  setMarkers: (markers) => set({ markers })
}));

