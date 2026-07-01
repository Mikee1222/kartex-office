"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { el } from "date-fns/locale";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  selectUnreadCount,
  useNotificationsStore,
  type Notification,
  type NotificationType,
} from "@/lib/notifications-store";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 20;

type NotificationsBellProps = {
  variant?: "dark" | "light";
  className?: string;
};

function iconForType(type: NotificationType) {
  switch (type) {
    case "success":
      return CheckCircle2;
    case "warning":
      return AlertTriangle;
    case "error":
      return XCircle;
    default:
      return Info;
  }
}

function iconClassForType(type: NotificationType) {
  switch (type) {
    case "success":
      return "text-emerald-600";
    case "warning":
      return "text-amber-600";
    case "error":
      return "text-destructive";
    default:
      return "text-blue-600";
  }
}

export function NotificationsBell({
  variant = "light",
  className,
}: NotificationsBellProps) {
  const router = useRouter();
  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore(selectUnreadCount);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  const markRead = useNotificationsStore((state) => state.markRead);

  const visible = notifications.slice(0, MAX_VISIBLE);

  function openNotification(notification: Notification) {
    markRead(notification.id);
    router.push(notification.href);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            variant === "light"
              ? "text-gray-400 hover:bg-gray-50 hover:text-navy-900"
              : "text-white/80 hover:bg-white/10 hover:text-white",
            className,
          )}
          aria-label={
            unreadCount > 0
              ? `Ειδοποιήσεις: ${unreadCount} αδιάβαστες`
              : "Ειδοποιήσεις"
          }
        >
          <Bell className="size-5" aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-0.5 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <p className="text-sm font-semibold text-kartex-navy">Ειδοποιήσεις</p>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-kartex-gold hover:underline"
            >
              Σήμανση όλων ως αναγνωσμένα
            </button>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Δεν υπάρχουν ειδοποιήσεις
          </p>
        ) : (
          visible.map((notification, index) => {
            const Icon = iconForType(notification.type);

            return (
              <React.Fragment key={notification.id}>
                {index > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem
                  className="cursor-pointer items-start gap-3 py-2.5"
                  onClick={() => openNotification(notification)}
                >
                  <Icon
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      iconClassForType(notification.type),
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm",
                        notification.read
                          ? "text-muted-foreground"
                          : "font-semibold text-kartex-navy",
                      )}
                    >
                      {notification.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {notification.message}
                    </span>
                    <span className="mt-1 block text-[10px] text-muted-foreground/80">
                      {formatDistanceToNow(notification.createdAt, {
                        addSuffix: true,
                        locale: el,
                      })}
                    </span>
                  </span>
                  {!notification.read ? (
                    <span
                      className="mt-2 size-2 shrink-0 rounded-full bg-blue-500"
                      aria-hidden
                    />
                  ) : null}
                </DropdownMenuItem>
              </React.Fragment>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
