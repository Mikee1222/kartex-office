/** Order status values used in UI, filters, and Supabase. */
export const OrderStatus = {
  Processing: "Σε Επεξεργασία",
  Scheduled: "Προγραμματισμένη",
  Confirmed: "Επιβεβαιώθηκε",
  ReadyForShipment: "Έτοιμο για Αποστολή",
  Reserved: "Δεσμευμένη",
  PartialShipment: "Μερική Αποστολή",
  Shipped: "Αποστολή",
  Completed: "Ολοκληρώθηκε",
  PendingPayment: "Αναμονή πληρωμής",
  Cancelled: "Ακυρώθηκε",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export type PaymentStatus = "pending" | "submitted" | "confirmed" | "failed";

export type Order = {
  id: string;
  orderNumber: string;
  customer: string;
  date: string;
  status: OrderStatus;
  itemCount: number;
  totalEur: number;
  paymentStatus: PaymentStatus;
  paymentProofUrl: string | null;
  paymentAmount: number | null;
  paymentSubmittedAt: string | null;
  paymentConfirmedAt: string | null;
  documentType?: string;
  vatNumber?: string | null;
  billingAddress?: string | null;
};

export type OrderFilterTab = "all" | OrderStatus;

export const ORDER_FILTER_TABS: { id: OrderFilterTab; label: string }[] = [
  { id: "all", label: "Όλες" },
  { id: OrderStatus.Processing, label: "Σε Επεξεργασία" },
  { id: OrderStatus.Scheduled, label: "Προγραμματισμένη" },
  { id: OrderStatus.Confirmed, label: "Επιβεβαιώθηκε" },
  { id: OrderStatus.ReadyForShipment, label: "Έτοιμο για Αποστολή" },
  { id: OrderStatus.Reserved, label: "Δεσμευμένη" },
  { id: OrderStatus.PartialShipment, label: "Μερική Αποστολή" },
  { id: OrderStatus.Shipped, label: "Αποστολή" },
  { id: OrderStatus.Completed, label: "Ολοκληρώθηκε" },
  { id: OrderStatus.PendingPayment, label: "Αναμονή πληρωμής" },
  { id: OrderStatus.Cancelled, label: "Ακυρώθηκε" },
];
