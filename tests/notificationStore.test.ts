import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNotificationStore } from '../core/ui/store/notificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [] });
  });

  it('should add notification with default duration', () => {
    const { addNotification } = useNotificationStore.getState();
    
    const id = addNotification('info', 'Test message');
    
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].id).toBe(id);
    expect(state.notifications[0].message).toBe('Test message');
    expect(state.notifications[0].type).toBe('info');
  });

  it('should add notification with custom duration', () => {
    const { addNotification } = useNotificationStore.getState();
    
    addNotification('error', 'Error message', 5000);
    
    const state = useNotificationStore.getState();
    expect(state.notifications[0].duration).toBe(5000);
  });

  it('should add notification with different types', () => {
    const { addNotification } = useNotificationStore.getState();
    
    addNotification('success', 'Success');
    addNotification('warning', 'Warning');
    addNotification('error', 'Error');
    
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(3);
    expect(state.notifications[0].type).toBe('success');
    expect(state.notifications[1].type).toBe('warning');
    expect(state.notifications[2].type).toBe('error');
  });

  it('should remove notification by id', () => {
    const { addNotification, removeNotification } = useNotificationStore.getState();
    
    const id = addNotification('info', 'To be removed');
    removeNotification(id);
    
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
  });

  it('should clear all notifications', () => {
    const { addNotification, clearNotifications } = useNotificationStore.getState();
    
    addNotification('info', 'Message 1');
    addNotification('success', 'Message 2');
    clearNotifications();
    
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
  });

  it('should set timestamp on notification', () => {
    const { addNotification } = useNotificationStore.getState();
    const before = Date.now();
    
    addNotification('info', 'Timed message');
    
    const after = Date.now();
    const state = useNotificationStore.getState();
    
    expect(state.notifications[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(state.notifications[0].timestamp).toBeLessThanOrEqual(after);
  });

  it('should auto-remove notification after duration', async () => {
    vi.useFakeTimers();
    
    const { addNotification } = useNotificationStore.getState();
    addNotification('info', 'Auto-remove', 1000);
    
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    
    vi.advanceTimersByTime(1001);
    
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
    
    vi.useRealTimers();
  });

  it('should return notification id from addNotification', () => {
    const { addNotification } = useNotificationStore.getState();
    
    const id1 = addNotification('info', 'Message 1');
    const id2 = addNotification('info', 'Message 2');
    
    expect(id1).not.toBe(id2);
  });
});