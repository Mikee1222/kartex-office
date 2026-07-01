export const CustomerType = {
  Hospital: "Νοσοκομεία",
  Hotel: "Ξενοδοχεία",
  WalkIn: "Walk-in",
} as const;

export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export type Customer = {
  id: string;
  company: string;
  type: CustomerType;
  phone: string;
  city: string;
  lastOrderDate: string;
  totalPurchasesEur: number;
};

export type CustomerFilterTab = "all" | CustomerType;

export const CUSTOMER_FILTER_TABS: { id: CustomerFilterTab; label: string }[] =
  [
    { id: "all", label: "Όλοι" },
    { id: CustomerType.Hospital, label: "Νοσοκομεία" },
    { id: CustomerType.Hotel, label: "Ξενοδοχεία" },
    { id: CustomerType.WalkIn, label: "Walk-in" },
  ];
