"use client";

import { ChevronDown, ChevronRight, Search, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import {
  GlobalSearch,
  useGlobalSearchShortcut,
} from "@/components/dashboard/global-search";
import { LowStockNotifications } from "@/components/dashboard/low-stock-notifications";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import { ScheduleBell } from "@/components/schedule/schedule-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { USER_ROLE_LABELS, type UserRoleKey } from "@/lib/users/roles";
import { premiumSearchPill } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Πίνακας Ελέγχου",
  orders: "Παραγγελίες",
  schedule: "Πρόγραμμα",
  customers: "Πελάτες",
  products: "Προϊόντα",
  inventory: "Αποθήκη",
  quotes: "Αιτήματα Προσφοράς",
  reports: "Αναφορές",
  "z-report": "Ημερήσιο Ζ",
  users: "Χρήστες",
  settings: "Ρυθμίσεις",
  colors: "Χρώματα",
  vehicles: "Οχήματα",
  drivers: "Οδηγοί",
  trips: "Δρομολόγια",
  assistant: "Dolphin",
  website: "Website",
  content: "Περιεχόμενο",
  new: "Νέο",
  edit: "Επεξεργασία",
};

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

function useBreadcrumbs() {
  const pathname = usePathname();
  return React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return [{ label: "Πίνακας Ελέγχου", href: "/dashboard" }];
    }

    const crumbs: { label: string; href: string }[] = [];
    let path = "";
    for (const segment of segments) {
      path += `/${segment}`;
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment,
        );
      const label = isUuid
        ? "Λεπτομέρειες"
        : (BREADCRUMB_LABELS[segment] ?? segment);
      crumbs.push({ label, href: path });
    }
    return crumbs;
  }, [pathname]);
}

type DashboardTopBarProps = {
  userEmail: string;
  userRole: UserRoleKey;
};

export function DashboardTopBar({ userEmail, userRole }: DashboardTopBarProps) {
  const router = useRouter();
  const breadcrumbs = useBreadcrumbs();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [logoutPending, setLogoutPending] = React.useState(false);

  const openSearch = React.useCallback(() => setSearchOpen(true), []);
  useGlobalSearchShortcut(openSearch);

  async function handleLogout() {
    setLogoutPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const initials = initialsFromEmail(userEmail);
  const displayName = displayNameFromEmail(userEmail);
  const roleLabel = USER_ROLE_LABELS[userRole] ?? userRole;

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-4 lg:px-6">
        <nav
          aria-label="Διαδρομή"
          className="hidden min-w-0 shrink-0 items-center gap-1 text-sm md:flex"
        >
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 ? (
                <ChevronRight className="size-4 shrink-0 text-gray-400" aria-hidden />
              ) : null}
              {index === breadcrumbs.length - 1 ? (
                <span className="truncate font-semibold text-navy-900">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate text-gray-400 transition-colors duration-150 hover:text-navy-900"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={cn(
            "mx-auto hidden h-10 max-w-xl flex-1 items-center gap-2 md:flex",
            premiumSearchPill,
          )}
          aria-label="Αναζήτηση"
        >
          <Search className="size-4 shrink-0 text-gray-400" aria-hidden />
          <span className="flex-1 truncate text-left">Αναζήτηση…</span>
          <kbd className="hidden shrink-0 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 sm:inline">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <ScheduleBell variant="light" />
          <NotificationsBell variant="light" />
          <LowStockNotifications variant="light" />

          <span className="mx-1 hidden h-6 w-px bg-gray-100 sm:block" aria-hidden />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors duration-150 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-400 text-sm font-bold text-navy-900"
                  aria-hidden
                >
                  {initials}
                </span>
                <span className="hidden text-left lg:block">
                  <span className="block text-sm font-semibold text-navy-900">
                    {displayName}
                  </span>
                  <span className="block text-xs text-gray-400">{roleLabel}</span>
                </span>
                <ChevronDown className="hidden size-4 text-gray-400 lg:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-card-hover">
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold text-navy-900">{displayName}</p>
                <p className="truncate text-xs text-gray-400">{userEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/users" className="cursor-pointer">
                  <User className="mr-2 size-4" />
                  Προφίλ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 size-4" />
                  Ρυθμίσεις
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-danger focus:text-danger"
                disabled={logoutPending}
                onClick={() => void handleLogout()}
              >
                {logoutPending ? "Αποσύνδεση…" : "Αποσύνδεση"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
