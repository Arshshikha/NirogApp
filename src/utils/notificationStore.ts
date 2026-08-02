import { apiGet, apiPatch } from './api';
import { getSession } from './authStore';

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'BOOKING_CONFIRMATION' | 'BOOKING_REMINDER' | 'BOOKING_CANCELLATION' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILURE' | 'VERIFICATION_UPDATE' | 'NEW_MESSAGE' | 'REVIEW_RECEIVED' | 'COURSE_ENROLLED' | 'GENERAL' | 'SYSTEM_ALERT';
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  title: string;
  body: string;
  metadata?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

let memoryNotifications: NotificationItem[] = [];
let listeners: (() => void)[] = [];

export const getNotifications = () => memoryNotifications;

export const subscribeNotifications = (callback: () => void) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(fn => fn !== callback);
  };
};

const notify = () => {
  listeners.forEach(fn => fn());
};

export const fetchNotifications = async () => {
  const session = getSession();
  if (!session || !session.id) return;

  try {
    const data = await apiGet('/notifications');
    if (data && Array.isArray(data)) {
      memoryNotifications = data;
      notify();
    }
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
  }
};

export const markAsRead = async (id: string) => {
  try {
    // Optimistic update
    memoryNotifications = memoryNotifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    notify();

    await apiPatch(`/notifications/${id}/read`, {});
  } catch (err) {
    console.error(`Failed to mark notification ${id} as read:`, err);
    fetchNotifications();
  }
};

export const markAllAsRead = async () => {
  try {
    // Optimistic update
    memoryNotifications = memoryNotifications.map(n => ({ ...n, isRead: true }));
    notify();

    await apiPatch('/notifications/read-all', {});
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err);
    fetchNotifications();
  }
};
