import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  timestamp: number;
}

interface NotificationSlice {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, duration?: number) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

function createNotificationStore<T extends NotificationSlice>(set: any) {
  return {
    notifications: [] as Notification[],

    addNotification: (type: NotificationType, message: string, duration = 3000): string => {
      const id = Math.random().toString(36).substring(2, 9);
      const newNotification: Notification = {
        id,
        type,
        message,
        duration,
        timestamp: Date.now()
      };

      set((state: NotificationSlice) => ({
        notifications: [...state.notifications, newNotification]
      }));

      if (duration > 0) {
        setTimeout(() => {
          set((state: NotificationSlice) => ({
            notifications: state.notifications.filter((n) => n.id !== id)
          }));
        }, duration);
      }

      return id;
    },

    removeNotification: (id: string) => {
      set((state: NotificationSlice) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      }));
    },

    clearNotifications: () => {
      set({ notifications: [] });
    }
  };
}

export const useNotificationStore = create<NotificationSlice>()(
  subscribeWithSelector((set) => createNotificationStore(set))
);

export type { NotificationSlice };