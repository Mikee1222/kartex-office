import { type StatusHistoryEntry } from "@/lib/orders/status-timeline";
import { type OrderStatus, type PaymentStatus } from "@/components/orders/types";

export type OrderLineProduct = {
  id: string;
  name: string;
  clean_name?: string | null;
  unit?: string | null;
};

export type OrderLineItem = {
  id: string;
  productId: string | null;
  product: string;
  productName?: string | null;
  product_name?: string | null;
  products?: OrderLineProduct | null;
  quantity: number;
  quantityDelivered: number;
  quantityPending: number;
  unitPrice: number;
  total: number;
};

export type OrderCustomerInfo = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type DeliveryMethod = "address" | "pickup";

export type OrderQuoteRequestInfo = {
  id: string;
  contactName: string;
  companyName: string;
  email: string;
  phone: string | null;
};

export type OrderDeliveryHistoryEntry = {
  id: string;
  createdAt: string;
  notes: string | null;
  items: { productName: string; quantity: number }[];
};

export type OrderTripInfo = {
  id: string;
  tripNumber: number;
  tripDate: string;
  driverId: string;
  driverName: string;
  vehiclePlate: string | null;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  customer: OrderCustomerInfo;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  companyName: string | null;
  deliveryMethod: DeliveryMethod | null;
  deliveryRecipientName: string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryPostalCode: string | null;
  pickupAgency: string | null;
  deliveryDisplay: string | null;
  quoteRequest: OrderQuoteRequestInfo | null;
  items: OrderLineItem[];
  subtotal: number;
  vatRate: number;
  total: number;
  date: string;
  seller: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentProofUrl: string | null;
  paymentAmount: number | null;
  paymentSubmittedAt: string | null;
  paymentConfirmedAt: string | null;
  documentType?: string;
  vatNumber?: string | null;
  billingAddress?: string | null;
  deliveryDate: string;
  deliveryDateRaw: string | null;
  vehicleId: string | null;
  isReserved: boolean;
  reservedUntil: string | null;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  trip: OrderTripInfo | null;
  boxesCount: number | null;
  boxesNotes: string | null;
  notes: {
    internal: string;
    client: string;
  };
};
