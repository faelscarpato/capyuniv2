import React from 'react';
import { useNotificationStore, NotificationType } from '../../stores/notificationStore';
import { Icon } from './Icon';

const icons: Record<NotificationType, string> = {
  info: 'Info',
  success: 'CheckCircle',
  warning: 'AlertTriangle',
  error: 'XCircle'
};

const colors: Record<NotificationType, string> = {
  info: 'border-blue-500/50',
  success: 'border-green-500/50',
  warning: 'border-yellow-500/50',
  error: 'border-red-500/50'
};

const textColors: Record<NotificationType, string> = {
  info: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400'
};

export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed bottom-10 right-4 z-[100] flex flex-col gap-3">
      {notifications.map((note) => (
        <div
          key={note.id}
          className={`bg-ide-panel/80 backdrop-blur-xl border-l-4 ${colors[note.type]} text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[320px] animate-in slide-in-from-right fade-in duration-500`}
        >
          <div className={`${textColors[note.type]} flex-shrink-0`}>
            <Icon name={icons[note.type] as any} size={22} />
          </div>
          <span className="flex-1 text-sm font-semibold tracking-wide">{note.message}</span>
          <button onClick={() => removeNotification(note.id)} className="hover:bg-white/10 rounded-lg p-1.5 transition-colors">
            <Icon name="X" size={16} className="text-ide-muted" />
          </button>
        </div>
      ))}
    </div>
  );
};