import { create } from "zustand";

export type NotificationType = "info" | "success" | "warning" | "error";

export type Notification = {
  id: string;
  title: string;
  message: string;
  href: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
};

export type NewNotification = {
  id?: string;
  title: string;
  message: string;
  href: string;
  type: NotificationType;
};

type NotificationsState = {
  notifications: Notification[];
  ordersVersion: number;
  lastUpdatedOrderId: string | null;
  pendingQuotesCount: number;
  quotesVersion: number;
  addNotification: (notification: NewNotification) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  bumpOrders: (orderId?: string) => void;
  setPendingQuotesCount: (count: number) => void;
  bumpQuotes: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  ordersVersion: 0,
  lastUpdatedOrderId: null,
  pendingQuotesCount: 0,
  quotesVersion: 0,

  addNotification: (notification) => {
    const entry: Notification = {
      id: notification.id ?? crypto.randomUUID(),
      title: notification.title,
      message: notification.message,
      href: notification.href,
      type: notification.type,
      read: false,
      createdAt: new Date(),
    };

    set({
      notifications: [
        entry,
        ...get().notifications.filter((item) => item.id !== entry.id),
      ].slice(0, 50),
    });
  },

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, read: true })),
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    })),

  bumpOrders: (orderId) =>
    set((state) => ({
      ordersVersion: state.ordersVersion + 1,
      lastUpdatedOrderId: orderId ?? state.lastUpdatedOrderId,
    })),

  setPendingQuotesCount: (count) => set({ pendingQuotesCount: count }),

  bumpQuotes: () =>
    set((state) => ({
      quotesVersion: state.quotesVersion + 1,
    })),
}));

export function selectUnreadCount(state: NotificationsState) {
  return state.notifications.filter((item) => !item.read).length;
}
