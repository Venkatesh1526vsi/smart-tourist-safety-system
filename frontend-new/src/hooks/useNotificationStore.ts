import { useSyncExternalStore } from "react";

export type NotificationType = "info" | "warning" | "emergency";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

type Listener = () => void;

let notifications: Notification[] = [];
let listeners: Set<Listener> = new Set();

function emit() {
  listeners.forEach((l) => l());
}

function getSnapshot() {
  return notifications;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Generate a simple unique ID (fallback for older browsers without crypto.randomUUID)
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function addNotification(type: NotificationType, title: string, message: string) {
  const n: Notification = {
    id: generateId(),
    type,
    title,
    message,
    timestamp: new Date(),
    read: false,
  };
  notifications = [n, ...notifications];
  emit();
  return n;
}

export function markAsRead(id: string) {
  notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  emit();
}

export function markAllAsRead() {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  emit();
}

export function clearAll() {
  notifications = [];
  emit();
}

export function useNotificationStore() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const unreadCount = items.filter((n) => !n.read).length;
  return { notifications: items, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll };
}
