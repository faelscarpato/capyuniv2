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
  info: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600'
};

export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed bottom-10 right-4 z-[100] flex flex-col gap-2">
      {notifications.map((note) => (
        <div 
          key={note.id}
          className={`${colors[note.type]} text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 min-w-[300px] animate-in slide-in-from-right fade-in duration-300`}
        >
          <Icon name={icons[note.type] as any} size={20} />
          <span className="flex-1 text-sm font-medium">{note.message}</span>
          <button onClick={() => removeNotification(note.id)} className="hover:bg-white/20 rounded p-1">
            <Icon name="X" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};