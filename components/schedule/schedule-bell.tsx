"use client";

import { Bell, CalendarClock } from "lucide-react";
import * as React from "react";

import { useScheduleNotifications } from "@/components/schedule/schedule-notification-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 10;

type ScheduleBellProps = {
  variant?: "dark" | "light";
};

export function ScheduleBell({ variant = "light" }: ScheduleBellProps) {
  const { alerts, unreadCount, markAllRead, openAlert } = useScheduleNotifications();
  const visible = alerts.slice(0, MAX_VISIBLE);

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
              ? "text-[#64748B] hover:bg-[#F8F9FC] hover:text-kartex-navy"
              : "text-white/80 hover:bg-white/10 hover:text-white",
          )}
          aria-label={
            unreadCount > 0
              ? `Υπενθυμίσεις προγράμματος: ${unreadCount}`
              : "Υπενθυμίσεις προγράμματος"
          }
        >
          <Bell className="size-5" aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-kartex-gold text-[10px] font-bold text-kartex-navy">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-sm font-semibold text-kartex-navy">Πρόγραμμα</p>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-kartex-gold hover:underline"
            >
              Σημείωση όλων ως αναγνωσμένες
            </button>
          ) : null}
        </div>
        {visible.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Δεν υπάρχουν ενεργές υπενθυμίσεις.
          </p>
        ) : (
          visible.map((alert, index) => (
            <React.Fragment key={alert.id}>
              {index > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                className="cursor-pointer items-start gap-2 py-2"
                onClick={() => openAlert(alert)}
              >
                <CalendarClock
                  className="mt-0.5 size-4 shrink-0 text-kartex-gold"
                  aria-hidden
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm",
                    alert.read
                      ? "text-muted-foreground"
                      : "font-medium text-kartex-navy",
                  )}
                >
                  {alert.message}
                </span>
              </DropdownMenuItem>
            </React.Fragment>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
