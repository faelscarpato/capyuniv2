import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { useConfirmDialogStore } from '../../features/productivity/workspace-actions/store/confirmDialogStore';

export const ConfirmDialogModal: React.FC = () => {
  const { isOpen, title, description, confirmLabel, danger, onConfirm, close } = useConfirmDialogStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!onConfirm) {
      close();
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm();
      close();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[175] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={close}
    >
      <div
        className="w-full max-w-[420px] bg-ide-activity border border-ide-border rounded-2xl p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={close} className="text-ide-muted hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <p className="text-sm text-ide-muted mb-5">{description}</p>

        <div className="flex justify-end gap-2">
          <button
            onClick={close}
            className="px-3 py-2 text-sm rounded-lg border border-ide-border text-ide-muted hover:text-white hover:border-white/20 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-3 py-2 text-sm rounded-lg font-semibold transition-colors disabled:opacity-60 ${
              danger ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-ide-accent hover:bg-opacity-90 text-white'
            }`}
          >
            {isSubmitting ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

