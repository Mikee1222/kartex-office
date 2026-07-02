import {
  BarChart3,
  Bot,
  FileQuestion,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  MapPin,
  Package,
  Palette,
  Receipt,
  Route,
  Settings,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  Truck,
  UserRound,
  Users,
  Users2,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import type { PermissionKey } from "@/lib/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If set, user must have this permission to see the item. */
  permission?: PermissionKey;
  /** Gold icon accent when inactive (e.g. Dolphin). */
  goldAccent?: boolean;
  /** Show red badge with pending quote_requests count. */
  pendingQuotesBadge?: boolean;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    items: [
      {
        label: "Πίνακας Ελέγχου",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Dolphin",
        href: "/assistant",
        icon: Bot,
        goldAccent: true,
      },
      {
        label: "Παραγγελίες",
        href: "/orders",
        icon: ShoppingCart,
        permission: "canViewOrders",
      },
      {
        label: "Αιτήματα Προσφοράς",
        href: "/quotes",
        icon: FileQuestion,
        permission: "canViewOrders",
        pendingQuotesBadge: true,
      },
      {
        label: "Οχήματα",
        href: "/vehicles",
        icon: Truck,
        permission: "canViewOrders",
      },
      {
        label: "Οδηγοί",
        href: "/drivers",
        icon: UserRound,
        permission: "canViewOrders",
      },
      {
        label: "Live Οδηγοί",
        href: "/drivers/live",
        icon: MapPin,
        permission: "canViewOrders",
      },
      {
        label: "Δρομολόγια",
        href: "/trips?view=month",
        icon: Route,
        permission: "canViewOrders",
      },
    ],
  },
  {
    label: "ΔΙΑΧΕΙΡΙΣΗ",
    items: [
      {
        label: "Πελάτες",
        href: "/customers",
        icon: Users,
        permission: "canViewCustomers",
      },
      {
        label: "Προϊόντα",
        href: "/products",
        icon: Package,
        permission: "canViewProducts",
      },
      {
        label: "Αποθήκη",
        href: "/inventory",
        icon: Warehouse,
        permission: "canViewInventory",
      },
    ],
  },
  {
    label: "WEBSITE",
    items: [
      {
        label: "Κατηγορίες",
        href: "/website/content",
        icon: LayoutGrid,
        permission: "canManageUsers",
      },
      {
        label: "Ρυθμίσεις Site",
        href: "/website/settings",
        icon: Settings2,
        permission: "canManageUsers",
      },
      {
        label: "Προϊόντα Website",
        href: "/website/products",
        icon: ShoppingBag,
        permission: "canManageUsers",
      },
      {
        label: "Website Analytics",
        href: "/analytics",
        icon: LineChart,
        permission: "canManageUsers",
      },
    ],
  },
  {
    label: "ΡΥΘΜΙΣΕΙΣ",
    items: [
      {
        label: "Ρυθμίσεις",
        href: "/settings",
        icon: Settings,
        permission: "canManageUsers",
      },
      {
        label: "Χρώματα",
        href: "/settings/colors",
        icon: Palette,
        permission: "canManageUsers",
      },
      {
        label: "Υλικά",
        href: "/settings/materials",
        icon: Layers,
        permission: "canManageUsers",
      },
      {
        label: "Προμηθευτές",
        href: "/settings/suppliers",
        icon: Truck,
        permission: "canManageUsers",
      },
    ],
  },
  {
    label: "ΑΝΑΦΟΡΕΣ",
    items: [
      {
        label: "Αναφορές",
        href: "/reports",
        icon: BarChart3,
        permission: "canViewReports",
      },
      {
        label: "Ημερήσιο Ζ",
        href: "/z-report",
        icon: Receipt,
        permission: "canViewReports",
      },
      {
        label: "Χρήστες",
        href: "/users",
        icon: Users2,
        permission: "canManageUsers",
      },
    ],
  },
];

/** Flat list for search / legacy use. */
export const navItems: NavItem[] = navSections.flatMap((section) => section.items);
