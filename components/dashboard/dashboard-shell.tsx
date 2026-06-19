"use client";

import { Menu } from "lucide-react";
import * as React from "react";

import { AiFloatingButton } from "@/components/ai/ai-floating-button";
import { AiChatProvider } from "@/lib/ai/ai-chat-context";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopBar } from "@/components/dashboard/dashboard-top-bar";
import { GlobalOrdersRealtime } from "@/components/dashboard/global-orders-realtime";
import { PendingQuotesSync } from "@/components/dashboard/pending-quotes-sync";
import { ScheduleNotificationProvider } from "@/components/schedule/schedule-notification-context";
import { Button } from "@/components/ui/button";
import type { UserRoleKey } from "@/lib/users/roles";

type DashboardShellProps = {
  userEmail: string;
  userRole: UserRoleKey;
  children: React.ReactNode;
};

export function DashboardShell({
  userEmail,
  userRole,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <ScheduleNotificationProvider>
    <AiChatProvider>
    <GlobalOrdersRealtime />
    <PendingQuotesSync />
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden shrink-0 lg:block">
        <DashboardSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          userEmail={userEmail}
          userRole={userRole}
        />
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Μενού πλοήγησης"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Κλείσιμο μενού"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex h-full w-64 max-w-[85vw] shadow-xl">
            <DashboardSidebar
              collapsed={false}
              onToggleCollapse={() => {}}
              showCollapseControl={false}
              onNavigate={() => setMobileOpen(false)}
              className="w-full"
              userEmail={userEmail}
              userRole={userRole}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border bg-white px-3 py-2 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Άνοιγμα μενού"
            aria-expanded={mobileOpen}
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-sm font-bold tracking-wide text-kartex-navy">
            KARTEX OFFICE
          </span>
        </div>

        <DashboardTopBar userEmail={userEmail} userRole={userRole} />

        <main className="page-transition flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <AiFloatingButton />
    </div>
    </AiChatProvider>
    </ScheduleNotificationProvider>
  );
}
