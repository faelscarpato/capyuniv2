import { create } from 'zustand';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useUIStore } from '../../../stores/uiStore';
import { useLocalRuntimeStore, type LocalRuntimeDisconnectCleanup } from './localRuntimeStore';

export type RuntimeMode = 'online' | 'local-runtime';
export type RuntimeAvailability = 'unknown' | 'available' | 'unavailable';
export type ConsentDecision = 'idle' | 'accepted' | 'rejected';

interface LocalRuntimeActivationRequest {
  requestedBy: string;
  actionLabel?: string;
  onActivated?: (() => void) | null;
}

interface RuntimeModeState {
  mode: RuntimeMode;
  availability: RuntimeAvailability;
  consentDecision: ConsentDecision;
  isActivationModalOpen: boolean;
  activationRequest: LocalRuntimeActivationRequest | null;
  isDisconnectModalOpen: boolean;
  bridgeLogs: string[];
  requestActivation: (request: LocalRuntimeActivationRequest) => void;
  ensureLocalRuntime: (request: LocalRuntimeActivationRequest) => boolean;
  acceptActivation: () => void;
  rejectActivation: () => void;
  setAvailability: (availability: RuntimeAvailability) => void;
  appendBridgeLog: (message: string) => void;
  clearBridgeLogs: () => void;
  requestDisconnect: () => void;
  cancelDisconnect: () => void;
  confirmDisconnect: (cleanup: LocalRuntimeDisconnectCleanup) => void;
}

const MAX_BRIDGE_LOGS = 120;
const txt = (pt: string, en: string): string => (useUIStore.getState().language === 'pt' ? pt : en);

export const useRuntimeModeStore = create<RuntimeModeState>((set, get) => ({
  mode: 'online',
  availability: 'unknown',
  consentDecision: 'idle',
  isActivationModalOpen: false,
  activationRequest: null,
  isDisconnectModalOpen: false,
  bridgeLogs: [],

  requestActivation: (request) => {
    set({
      isActivationModalOpen: true,
      activationRequest: request
    });
  },

  ensureLocalRuntime: (request) => {
    if (get().mode === 'local-runtime') {
      request.onActivated?.();
      return true;
    }
    get().requestActivation(request);
    return false;
  },

  acceptActivation: () => {
    const request = get().activationRequest;
    set({
      mode: 'local-runtime',
      availability: 'unknown',
      consentDecision: 'accepted',
      isActivationModalOpen: false,
      activationRequest: null
    });

    useLocalRuntimeStore.getState().activateLocalRuntime();
    useNotificationStore
      .getState()
      .addNotification(
        'info',
        txt(
          'Modo Runtime Local ativado. Agora você tem acesso real ao terminal e sistema de arquivos local.',
          'Local Runtime Mode activated. You now have real local terminal/file system access.'
        )
      );
    request?.onActivated?.();
  },

  rejectActivation: () => {
    set({
      consentDecision: 'rejected',
      isActivationModalOpen: false,
      activationRequest: null
    });
    useNotificationStore
      .getState()
      .addNotification(
        'warning',
        txt('Ativação do Runtime Local cancelada.', 'Local Runtime activation canceled.')
      );
  },

  setAvailability: (availability) => {
    set({ availability });
  },

  appendBridgeLog: (message) => {
    const normalized = (message || '').trim();
    if (!normalized) return;
    set((state) => {
      const next = [...state.bridgeLogs, `[${new Date().toISOString()}] ${normalized}`];
      return {
        bridgeLogs: next.slice(-MAX_BRIDGE_LOGS)
      };
    });
  },

  clearBridgeLogs: () => {
    set({ bridgeLogs: [] });
  },

  requestDisconnect: () => {
    if (get().mode !== 'local-runtime') return;
    set({ isDisconnectModalOpen: true });
  },

  cancelDisconnect: () => {
    set({ isDisconnectModalOpen: false });
  },

  confirmDisconnect: (cleanup) => {
    useLocalRuntimeStore.getState().disconnect(cleanup);
    set({
      mode: 'online',
      availability: 'unknown',
      isDisconnectModalOpen: false
    });
    useNotificationStore
      .getState()
      .addNotification(
        'info',
        txt('Desconectado do Modo Runtime Local.', 'Disconnected from Local Runtime Mode.')
      );
  }
}));
