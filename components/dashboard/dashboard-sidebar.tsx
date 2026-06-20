"use client";

import * as React from "react";
import { PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { KartexLogo } from "@/components/dashboard/kartex-logo";
import { navSections, type NavItem } from "@/components/dashboard/nav-items";
import { usePermissionsOptional } from "@/lib/auth/permissions-context";
import { useNotificationsStore } from "@/lib/notifications-store";
import { Button } from "@/components/ui/button";
import { USER_ROLE_LABELS, type UserRoleKey } from "@/lib/users/roles";
import {
  premiumNavActive,
  premiumNavInactive,
  premiumSectionDivider,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "KX";
}

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

type DashboardSidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  showCollapseControl?: boolean;
  className?: string;
  userEmail?: string;
  userRole?: UserRoleKey;
};

function filterVisibleItems(
  items: NavItem[],
  permissions: ReturnType<typeof usePermissionsOptional>,
) {
  return items.filter((item) => {
    if (!item.permission) return true;
    if (!permissions) return true;
    return permissions.can(item.permission);
  });
}

export function DashboardSidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  showCollapseControl = true,
  className,
  userEmail,
  userRole,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const permissions = usePermissionsOptional();
  const pendingQuotesCount = useNotificationsStore(
    (state) => state.pendingQuotesCount,
  );

  const displayName = userEmail ? displayNameFromEmail(userEmail) : "Χρήστης";
  const roleLabel = userRole ? (USER_ROLE_LABELS[userRole] ?? userRole) : "";
  const initials = userEmail ? initialsFromEmail(userEmail) : "KX";

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-navy-950 text-white transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16" : "w-60",
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-white/10 px-4 py-5",
          collapsed && "flex justify-center px-2",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn("flex items-center gap-3", collapsed && "justify-center")}
          title="Kartex Office"
        >
          <KartexLogo compact={collapsed} />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {navSections.map((section, sectionIndex) => {
          const visibleItems = filterVisibleItems(section.items, permissions);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label ?? `section-${sectionIndex}`}>
              {section.label && !collapsed ? (
                <p className={premiumSectionDivider}>{section.label}</p>
              ) : section.label && collapsed ? (
                <div className="my-2 border-t border-white/10" aria-hidden />
              ) : null}

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "relative flex items-center gap-3 py-2.5 pl-3 pr-3 text-sm transition-all duration-150",
                        isActive ? premiumNavActive : premiumNavInactive,
                        collapsed && "justify-center px-2",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5 shrink-0",
                          item.goldAccent && !isActive && "text-gold-400",
                        )}
                        aria-hidden
                      />
                      {!collapsed ? (
                        <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <span className="truncate">{item.label}</span>
                          {item.pendingQuotesBadge && pendingQuotesCount > 0 ? (
                            <span className="flex size-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                              {pendingQuotesCount > 9 ? "9+" : pendingQuotesCount}
                            </span>
                          ) : null}
                        </span>
                      ) : item.pendingQuotesBadge && pendingQuotesCount > 0 ? (
                        <span className="absolute -right-0.5 -top-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-0.5 text-[10px] font-bold text-white">
                          {pendingQuotesCount > 9 ? "9+" : pendingQuotesCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {userEmail ? (
        <div
          className={cn(
            "border-t border-white/10 px-3 py-3",
            collapsed && "flex justify-center px-2",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center",
            )}
            title={collapsed ? `${displayName} — ${roleLabel}` : undefined}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-400 text-xs font-bold text-navy-900">
              {initials}
            </span>
            {!collapsed ? (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">
                    {displayName}
                  </span>
                  <span className="block truncate text-xs text-white/40">
                    {roleLabel}
                  </span>
                </span>
                <Link
                  href="/dashboard"
                  className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                  aria-label="Ρυθμίσεις"
                >
                  <Settings className="size-4" />
                </Link>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {showCollapseControl ? (
        <div className="hidden border-t border-white/10 p-2 lg:block">
          <Button
            type="button"
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={onToggleCollapse}
            className={cn(
              "w-full text-white/40 hover:bg-white/10 hover:text-white/80",
              !collapsed && "justify-start",
            )}
            aria-label={
              collapsed
                ? "Επέκταση πλευρικής μπάρας"
                : "Σύμπτυξη πλευρικής μπάρας"
            }
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" />
                <span>Σύμπτυξη</span>
              </>
            )}
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
