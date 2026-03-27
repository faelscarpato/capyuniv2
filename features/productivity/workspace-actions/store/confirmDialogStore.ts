import { create } from 'zustand';

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger: boolean;
  onConfirm: (() => void | Promise<void>) | null;
  open: (options: ConfirmDialogOptions) => void;
  close: () => void;
}

const initialState = {
  isOpen: false,
  title: '',
  description: '',
  confirmLabel: 'Confirmar',
  danger: false,
  onConfirm: null as (() => void | Promise<void>) | null
};

export const useConfirmDialogStore = create<ConfirmDialogState>((set) => ({
  ...initialState,
  open: (options) =>
    set({
      isOpen: true,
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel || 'Confirmar',
      danger: Boolean(options.danger),
      onConfirm: options.onConfirm
    }),
  close: () => set(initialState)
}));

