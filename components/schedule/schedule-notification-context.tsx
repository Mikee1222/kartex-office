"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { computeScheduleAlerts } from "@/lib/schedule/compute-alerts";
import { fetchScheduleOrders } from "@/lib/schedule/fetch-schedule-orders";
import { type ScheduleAlert } from "@/lib/schedule/types";

const POLL_MS = 5 * 60 * 1000;

type ScheduleNotificationContextValue = {
  alerts: ScheduleAlert[];
  unreadCount: number;
  markAllRead: () => void;
  openAlert: (alert: ScheduleAlert) => void;
  refresh: () => Promise<void>;
};

const ScheduleNotificationContext =
  React.createContext<ScheduleNotificationContextValue | null>(null);

export function ScheduleNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [alerts, setAlerts] = React.useState<ScheduleAlert[]>([]);

  const refresh = React.useCallback(async () => {
    const orders = await fetchScheduleOrders();
    const computed = computeScheduleAlerts(orders);
    setAlerts((prev) => {
      const readIds = new Set(prev.filter((a) => a.read).map((a) => a.id));
      return computed.map((alert) => ({
        ...alert,
        read: readIds.has(alert.id),
      }));
    });
  }, []);

  React.useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const unreadCount = alerts.filter((alert) => !alert.read).length;

  const markAllRead = React.useCallback(() => {
    setAlerts((current) => current.map((alert) => ({ ...alert, read: true })));
  }, []);

  const openAlert = React.useCallback(
    (alert: ScheduleAlert) => {
      setAlerts((current) =>
        current.map((item) =>
          item.id === alert.id ? { ...item, read: true } : item,
        ),
      );
      router.push(alert.href);
    },
    [router],
  );

  const value = React.useMemo(
    () => ({
      alerts,
      unreadCount,
      markAllRead,
      openAlert,
      refresh,
    }),
    [alerts, unreadCount, markAllRead, openAlert, refresh],
  );

  return (
    <ScheduleNotificationContext.Provider value={value}>
      {children}
    </ScheduleNotificationContext.Provider>
  );
}

export function useScheduleNotifications() {
  const context = React.useContext(ScheduleNotificationContext);
  if (!context) {
    throw new Error(
      "useScheduleNotifications must be used within ScheduleNotificationProvider",
    );
  }
  return context;
}
