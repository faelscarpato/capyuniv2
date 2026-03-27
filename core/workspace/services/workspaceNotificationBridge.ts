import { useNotificationStore } from '../../../stores/notificationStore';

export const workspaceNotificationBridge = {
  saved: () => {
    useNotificationStore.getState().addNotification('success', 'Workspace Saved');
  },
  syncUpdated: () => {
    useNotificationStore.getState().addNotification('success', 'Arquivos atualizados!');
  },
  syncError: (message: string) => {
    useNotificationStore.getState().addNotification('error', `Terminal sync: ${message}`);
  }
};

