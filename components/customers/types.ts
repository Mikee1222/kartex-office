export const CustomerType = {
  Hospital: "Νοσοκομεία",
  Hotel: "Ξενοδοχεία",
  WalkIn: "Walk-in",
} as const;

export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const CustomerSource = {
  Manual: "Χειροκίνητα",
  Phone: "Τηλέφωνο",
  Store: "Κατάστημα",
  Website: "Website",
} as const;

export type CustomerSource = (typeof CustomerSource)[keyof typeof CustomerSource];

export type DbCustomerSource = "manual" | "phone" | "store" | "website";

export const CUSTOMER_SOURCE_OPTIONS: {
  value: DbCustomerSource;
  label: CustomerSource;
}[] = [
  { value: "manual", label: CustomerSource.Manual },
  { value: "phone", label: CustomerSource.Phone },
  { value: "store", label: CustomerSource.Store },
  { value: "website", label: CustomerSource.Website },
];

export type CustomerSourceFilterTab = "all" | CustomerSource;

export const CUSTOMER_SOURCE_FILTER_TABS: {
  id: CustomerSourceFilterTab;
  label: string;
}[] = [
  { id: "all", label: "Όλες οι πηγές" },
  { id: CustomerSource.Manual, label: CustomerSource.Manual },
  { id: CustomerSource.Phone, label: CustomerSource.Phone },
  { id: CustomerSource.Store, label: CustomerSource.Store },
  { id: CustomerSource.Website, label: CustomerSource.Website },
];

export type Customer = {
  id: string;
  company: string;
  type: CustomerType;
  source: CustomerSource;
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
