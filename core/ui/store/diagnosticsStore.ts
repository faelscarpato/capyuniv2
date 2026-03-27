import type { MarkerData } from './types';

type SetStateFn<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>)
) => void;

export interface DiagnosticsSlice {
  consoleOutput: string[];
  markers: MarkerData[];
  addConsoleLog: (log: string) => void;
  clearConsole: () => void;
  setMarkers: (markers: MarkerData[]) => void;
}

export const createDiagnosticsStore = <T extends DiagnosticsSlice>(set: SetStateFn<T>): DiagnosticsSlice => ({
  consoleOutput: [],
  markers: [],
  addConsoleLog: (log) => set((state) => ({ consoleOutput: [...state.consoleOutput, log] } as Partial<T>)),
  clearConsole: () => set({ consoleOutput: [] } as Partial<T>),
  setMarkers: (markers) => set({ markers } as Partial<T>)
});

