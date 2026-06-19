export type QuoteRequestStatus =
  | "pending"
  | "reviewing"
  | "quoted"
  | "accepted"
  | "rejected"
  | "cancelled";

export const QUOTE_STATUS_LABELS: Record<QuoteRequestStatus, string> = {
  pending: "Εκκρεμές",
  reviewing: "Σε Εξέταση",
  quoted: "Απαντημένο",
  accepted: "Αποδεκτό",
  rejected: "Απορριφθέν",
  cancelled: "Ακυρωμένο",
};

export type QuoteFilterTab = "all" | "pending" | "reviewing" | "answered";

export const QUOTE_FILTER_TABS: { id: QuoteFilterTab; label: string }[] = [
  { id: "all", label: "Όλα" },
  { id: "pending", label: "Εκκρεμή" },
  { id: "reviewing", label: "Σε Εξέταση" },
  { id: "answered", label: "Απαντημένα" },
];

export type QuoteListItem = {
  id: string;
  shortId: string;
  contactName: string;
  companyName: string;
  itemCount: number;
  date: string;
  status: QuoteRequestStatus;
};

export type QuoteDetailItem = {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unit: string;
  notes: string | null;
  color: string | null;
  dimensions: string | null;
  material: string | null;
  quotedPrice: number | null;
};

export type QuoteDetail = {
  id: string;
  shortId: string;
  contactName: string;
  companyName: string;
  email: string;
  phone: string | null;
  clientNotes: string | null;
  internalNotes: string | null;
  status: QuoteRequestStatus;
  createdAt: string;
  quotedAt: string | null;
  items: QuoteDetailItem[];
};

export function matchesQuoteFilterTab(
  status: QuoteRequestStatus,
  tab: QuoteFilterTab,
): boolean {
  switch (tab) {
    case "all":
      return true;
    case "pending":
      return status === "pending";
    case "reviewing":
      return status === "reviewing";
    case "answered":
      return (
        status === "quoted" ||
        status === "accepted" ||
        status === "rejected" ||
        status === "cancelled"
      );
    default:
      return true;
  }
}

export function normalizeQuoteStatus(status: string): QuoteRequestStatus {
  const values: QuoteRequestStatus[] = [
    "pending",
    "reviewing",
    "quoted",
    "accepted",
    "rejected",
    "cancelled",
  ];
  if (values.includes(status as QuoteRequestStatus)) {
    return status as QuoteRequestStatus;
  }
  return "pending";
}
