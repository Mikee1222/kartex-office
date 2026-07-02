"use client";

import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  DocumentTypePicker,
  documentTypeLabel,
} from "@/components/orders/document-type-picker";
import { OrderStatus } from "@/components/orders/types";
import { CategoryBadge } from "@/components/products/category-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Input } from "@/components/ui/input";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import {
  buildMasterGroups,
  type MasterGroup,
  variantLabel,
} from "@/lib/products/master-groups";
import {
  premiumFormCard,
  premiumFormGrid,
  premiumGoldButton,
  premiumCard,
} from "@/lib/ui/premium-styles";
import { masterGroupGridClass } from "@/components/products/master-group-ui";
import {
  buildOrderDeliveryPayload,
  getDeliveryFieldErrors,
  type DeliveryFieldKey,
  type DeliveryFormValues,
} from "@/lib/orders/delivery-fields";
import {
  computeOrderVatSummary,
  type OrderDocumentType,
} from "@/lib/orders/order-vat";
import { PaymentTermsSelect } from "@/components/settings/payment-terms-select";
import { usePaymentTermOptions } from "@/lib/settings/use-lookup-options";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { mapDbCustomerType, mapProductRow, type DeliveryMethod, type ProductRow } from "@/types/database";

const STEPS = [
  { id: 1, label: "Πελάτης" },
  { id: 2, label: "Προϊόντα" },
  { id: 3, label: "Λεπτομέρειες" },
  { id: 4, label: "Επισκόπηση" },
] as const;


const PRIORITIES = [
  { value: "normal", label: "Κανονική" },
  { value: "urgent", label: "Επείγον" },
] as const;

type LineItem = {
  id: string;
  name: string;
  cleanName?: string;
  quantity: number;
  price: number;
};

const DELIVERY_METHODS: { value: DeliveryMethod; label: string }[] = [
  { value: "address", label: "Διεύθυνση παράδοσης" },
  { value: "pickup", label: "Παραλαβή από πρακτορείο" },
];

type WizardCustomer = {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  payment_terms: string | null;
  vat: string | null;
};

const premiumTextarea =
  "flex min-h-[88px] w-full rounded-md border border-kartex-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kartex-gold/30";

function formatEur(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function lineTotal(item: LineItem) {
  return Math.round(item.quantity * item.price * 100) / 100;
}

export function NewOrderWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [productRows, setProductRows] = React.useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(true);
  const [expandedMasterKey, setExpandedMasterKey] = React.useState<string | null>(
    null,
  );
  const [productCategory, setProductCategory] = React.useState("all");

  const [customers, setCustomers] = React.useState<WizardCustomer[]>([]);
  const [customerQuery, setCustomerQuery] = React.useState("");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(
    null,
  );
  const [deliveryMethod, setDeliveryMethod] = React.useState<DeliveryMethod | "">(
    "",
  );
  const [deliveryRecipientName, setDeliveryRecipientName] = React.useState("");
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [deliveryCity, setDeliveryCity] = React.useState("");
  const [deliveryPostalCode, setDeliveryPostalCode] = React.useState("");
  const [pickupAgency, setPickupAgency] = React.useState("");
  const [step1Attempted, setStep1Attempted] = React.useState(false);
  const [specialInstructions, setSpecialInstructions] = React.useState("");

  const [productQuery, setProductQuery] = React.useState("");
  const [lineItems, setLineItems] = React.useState<LineItem[]>([]);

  const [deliveryDate, setDeliveryDate] = React.useState("");
  const [pickingDate, setPickingDate] = React.useState("");
  const [reminderDays, setReminderDays] = React.useState(2);
  const [paymentTerms, setPaymentTerms] = React.useState("");
  const { names: paymentTermNames } = usePaymentTermOptions();
  const [priority, setPriority] = React.useState("normal");
  const [notes, setNotes] = React.useState("");
  const [documentType, setDocumentType] = React.useState<OrderDocumentType>("receipt");
  const [isReservedOrder, setIsReservedOrder] = React.useState(false);
  const [reservedUntil, setReservedUntil] = React.useState("");

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const deliveryValues = React.useMemo<DeliveryFormValues>(
    () => ({
      deliveryMethod,
      deliveryRecipientName,
      deliveryAddress,
      deliveryCity,
      deliveryPostalCode,
      pickupAgency,
    }),
    [
      deliveryMethod,
      deliveryRecipientName,
      deliveryAddress,
      deliveryCity,
      deliveryPostalCode,
      pickupAgency,
    ],
  );

  const deliveryErrors = React.useMemo(
    () => getDeliveryFieldErrors(deliveryValues),
    [deliveryValues],
  );

  React.useEffect(() => {
    if (selectedCustomer?.payment_terms) {
      setPaymentTerms(selectedCustomer.payment_terms);
    }
  }, [selectedCustomer?.id, selectedCustomer?.payment_terms]);

  const filteredCustomers = React.useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers.slice(0, 5);
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.city?.toLowerCase().includes(q) ?? false) ||
        c.type.toLowerCase().includes(q),
    );
  }, [customerQuery, customers]);

  React.useEffect(() => {
    const fetchCustomers = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("customers")
        .select(
          "id, name, type, phone, email, address, city, postal_code, payment_terms, vat",
        )
        .order("name");

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setCustomers(
          data.map((row) => ({
            id: row.id,
            name: row.name,
            type: mapDbCustomerType(row.type),
            phone: row.phone,
            email: row.email,
            address: row.address,
            city: row.city,
            postal_code: row.postal_code,
            payment_terms: row.payment_terms,
            vat: row.vat,
          })),
        );
      }
    };

    void fetchCustomers();
  }, []);

  React.useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("products")
        .select(
          "id, name, clean_name, sku, gsm, width_cm, height_cm, sale_price, category, subcategory, master_id, product_masters(clean_name, category, subcategory, quality_grade, material)",
        )
        .eq("is_active", true)
        .order("clean_name");

      if (fetchError) {
        console.error(fetchError);
        setProductRows([]);
        setProductsLoading(false);
        return;
      }

      setProductRows((data ?? []) as unknown as ProductRow[]);
      setProductsLoading(false);
    };

    void fetchProducts();
  }, []);

  const masterGroups = React.useMemo(() => {
    const mapped = productRows.map((row) => mapProductRow(row));
    return buildMasterGroups(mapped);
  }, [productRows]);

  const productCategories = React.useMemo(
    () =>
      [...new Set(masterGroups.map((group) => group.category))].sort((a, b) =>
        a.localeCompare(b, "el"),
      ),
    [masterGroups],
  );

  const filteredMasterGroups = React.useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return masterGroups.filter((group) => {
      if (productCategory !== "all" && group.category !== productCategory) {
        return false;
      }
      if (!q) return true;
      return (
        group.cleanName.toLowerCase().includes(q) ||
        group.category.toLowerCase().includes(q) ||
        group.variants.some(
          (variant) =>
            variant.sku.toLowerCase().includes(q) ||
            variant.name.toLowerCase().includes(q),
        )
      );
    });
  }, [masterGroups, productQuery, productCategory]);

  const orderTotal = lineItems.reduce((sum, item) => sum + lineTotal(item), 0);

  const orderVat = React.useMemo(
    () =>
      computeOrderVatSummary({
        subtotal: orderTotal,
        documentType,
      }),
    [orderTotal, documentType],
  );

  function masterGroupKey(group: MasterGroup) {
    return group.masterId ? `master:${group.masterId}` : `${group.cleanName}__${group.category}`;
  }

  function addVariant(group: MasterGroup, variantId: string) {
    const variant = group.variants.find((item) => item.id === variantId);
    if (!variant) return;

    setLineItems((items) => {
      const existing = items.find((i) => i.id === variant.id);
      if (existing) {
        return items.map((i) =>
          i.id === variant.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...items,
        {
          id: variant.id,
          name: variant.name,
          cleanName: group.cleanName,
          quantity: 1,
          price: variant.salePrice,
        },
      ];
    });
  }

  function updateLineItem(
    id: string,
    field: "quantity" | "price",
    value: number,
  ) {
    setLineItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: Math.max(0, value) } : item,
      ),
    );
  }

  function removeLineItem(id: string) {
    setLineItems((items) => items.filter((item) => item.id !== id));
  }

  function validateDeliveryFields(): boolean {
    const errors = getDeliveryFieldErrors(deliveryValues);
    if (Object.keys(errors).length > 0) {
      setStep1Attempted(true);
      setStep(1);
      setError("Συμπληρώστε όλα τα υποχρεωτικά πεδία παράδοσης.");
      return false;
    }
    return true;
  }

  function validateStep(current: number): boolean {
    if (current === 1) {
      setStep1Attempted(true);
      if (!selectedCustomerId) {
        setError("Επιλέξτε πελάτη για να συνεχίσετε.");
        return false;
      }
      if (Object.keys(deliveryErrors).length > 0) {
        setError("Συμπληρώστε όλα τα υποχρεωτικά πεδία παράδοσης.");
        return false;
      }
    }
    if (current === 2 && lineItems.length === 0) {
      setError("Προσθέστε τουλάχιστον ένα προϊόν.");
      return false;
    }
    if (current === 3 && isReservedOrder && !reservedUntil) {
      setError("Ορίστε ημερομηνία «Δέσμευση έως».");
      return false;
    }
    setError(null);
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit(isDraft: boolean) {
    if (!selectedCustomerId || lineItems.length === 0) {
      setError("Απαιτείται πελάτης και τουλάχιστον ένα προϊόν.");
      setStep(!selectedCustomerId ? 1 : 2);
      return;
    }

    if (!validateDeliveryFields()) {
      return;
    }

    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const message = "Πρέπει να είστε συνδεδεμένοι για να αποθηκεύσετε παραγγελία.";
      console.error("Order error: no session");
      toast.error(`Σφάλμα: ${message}`);
      setError(message);
      setSubmitting(false);
      return;
    }

    const paymentLabel =
      paymentTerms.trim() ||
      paymentTermNames[0] ||
      "30 μέρες";
    const priorityLabel = priority === "urgent" ? "Επείγον" : "Κανονική";
    const orderNotes = isDraft
      ? `[Πρόχειρο]${notes ? ` ${notes}` : ""}`
      : notes || null;

    const reserveActive = isReservedOrder && !isDraft;
    const trimmedPickingDate = pickingDate.trim();

    let orderStatus: (typeof OrderStatus)[keyof typeof OrderStatus] =
      OrderStatus.Processing;
    if (reserveActive) {
      orderStatus = OrderStatus.Reserved;
    } else if (!isDraft && trimmedPickingDate) {
      orderStatus = OrderStatus.Scheduled;
    }

    const orderPayload = {
      customer_id: selectedCustomerId,
      status: orderStatus,
      total: orderVat.grandTotal,
      delivery_date: deliveryDate || null,
      picking_date: trimmedPickingDate || null,
      reminder_days: reminderDays,
      payment_terms: paymentLabel,
      priority: priorityLabel,
      notes: orderNotes,
      internal_notes: specialInstructions || null,
      created_by: session.user.id,
      is_reserved: reserveActive,
      reserved_until: reserveActive ? reservedUntil : null,
      ...buildOrderDeliveryPayload(deliveryValues),
      document_type: documentType === "invoice" ? "invoice" : "receipt",
      vat_number:
        documentType === "invoice"
          ? selectedCustomer?.vat?.trim() || null
          : null,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order error:", orderError);
      const message =
        orderError?.message || "Η παραγγελία δεν δημιουργήθηκε (κενή απάντηση).";
      toast.error(`Σφάλμα: ${message}`);
      setError(message);
      setSubmitting(false);
      return;
    }

    const items = lineItems.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.cleanName || item.name,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .insert(items)
      .select();

    if (itemsError) {
      console.error("Items error:", itemsError);
      toast.error(`Σφάλμα items: ${itemsError.message}`);
      setError(itemsError.message);
      setSubmitting(false);
      return;
    }

    if (reserveActive) {
      for (const item of lineItems) {
        const { error: reserveError } = await supabase.rpc("reserve_stock", {
          p_product_id: item.id,
          p_quantity: item.quantity,
        });
        if (reserveError) {
          const message =
            reserveError.message.includes("insufficient")
              ? `Ανεπαρκές διαθέσιμο απόθεμα για «${item.cleanName || item.name}».`
              : reserveError.message;
          toast.error(`Σφάλμα δέσμευσης: ${message}`);
          setError(message);
          setSubmitting(false);
          return;
        }
      }
    }

    setSubmitting(false);
    router.push("/orders");
    router.refresh();
  }

  function handleSelectCustomer(customer: WizardCustomer) {
    setSelectedCustomerId(customer.id);
    if (!deliveryMethod) {
      setDeliveryMethod("address");
    }
    setDeliveryRecipientName(customer.name);
    setDeliveryAddress(customer.address?.trim() || "");
    setDeliveryCity(customer.city?.trim() || "");
    setDeliveryPostalCode(customer.postal_code?.trim() || "");
    setDocumentType(customer.vat?.trim() ? "invoice" : "receipt");
  }

  function showDeliveryFieldError(field: DeliveryFieldKey) {
    return step1Attempted ? deliveryErrors[field] : undefined;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/orders"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-kartex-navy"
          >
            <ArrowLeft className="size-4" />
            Παραγγελίες
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Νέα Παραγγελία
          </h1>
        </div>
      </div>

      <nav aria-label="Πρόοδος οδηγού">
        <div className="flex items-center gap-0">
          {STEPS.map((s, index) => {
            const isActive = step === s.id;
            const isComplete = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all",
                      isComplete
                        ? "bg-kartex-gold text-white"
                        : isActive
                          ? "bg-kartex-navy text-white ring-4 ring-kartex-navy/20"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isComplete ? <Check className="size-4" /> : s.id}
                  </div>
                  <span
                    className={cn(
                      "hidden text-sm font-semibold sm:block",
                      isActive
                        ? "text-kartex-navy"
                        : isComplete
                          ? "text-kartex-gold"
                          : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {index < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "mx-3 h-0.5 flex-1 transition-all",
                      isComplete ? "bg-kartex-gold" : "bg-border",
                    )}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-kartex-gold transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </nav>

      {error ? (
        <p
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === 1 ? (
            <Card className="premiumFormCard">
              <CardHeader>
                <CardTitle className="text-lg text-kartex-navy">Πελάτης</CardTitle>
                <CardDescription>
                  Επιλέξτε πελάτη και συμπληρώστε στοιχεία παράδοσης
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <FormFieldLabel htmlFor="customer-search" tooltip={FIELD_TOOLTIPS.customerSearch}>
                    Αναζήτηση πελάτη
                  </FormFieldLabel>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="customer-search"
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                      placeholder="Όνομα πελάτη…"
                      className="pl-9"
                    />
                  </div>
                  <ul className="max-h-48 overflow-y-auto rounded-md border border-border">
                    {filteredCustomers.map((customer) => (
                      <li key={customer.id}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted",
                            selectedCustomerId === customer.id && "bg-kartex-gold/10",
                          )}
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <span className="font-medium text-kartex-navy">
                            {customer.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {[customer.city, customer.type].filter(Boolean).join(" · ")}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedCustomer ? (
                  <div className="rounded-2xl border border-kartex-gold/20 bg-gradient-to-br from-kartex-gold/5 to-kartex-navy/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-kartex-gold/25 bg-kartex-gold/15 text-base font-bold text-kartex-gold">
                        {selectedCustomer.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-kartex-navy">
                          {selectedCustomer.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedCustomer.type}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          {selectedCustomer.phone ? (
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Τηλ.
                              </span>
                              <div className="font-medium">
                                {selectedCustomer.phone}
                              </div>
                            </div>
                          ) : null}
                          {selectedCustomer.email ? (
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Email
                              </span>
                              <div className="truncate font-medium">
                                {selectedCustomer.email}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerId(null)}
                        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-kartex-navy"
                        aria-label="Αποεπιλογή πελάτη"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <FormFieldLabel tooltip={FIELD_TOOLTIPS.deliveryAddress}>
                    Τρόπος παράδοσης
                  </FormFieldLabel>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DELIVERY_METHODS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setDeliveryMethod(option.value);
                          if (!deliveryRecipientName.trim() && selectedCustomer?.name) {
                            setDeliveryRecipientName(selectedCustomer.name);
                          }
                        }}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                          deliveryMethod === option.value
                            ? "border-kartex-gold bg-kartex-gold/10 text-kartex-navy"
                            : "border-border bg-white text-muted-foreground hover:border-kartex-gold/40",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {showDeliveryFieldError("delivery_method") ? (
                    <p className="text-xs text-red-500">
                      {showDeliveryFieldError("delivery_method")}
                    </p>
                  ) : null}
                </div>

                {deliveryMethod ? (
                  <div className="space-y-2">
                    <FormFieldLabel htmlFor="delivery-recipient-name">
                      Όνομα παραλήπτη
                    </FormFieldLabel>
                    <Input
                      id="delivery-recipient-name"
                      value={deliveryRecipientName}
                      onChange={(e) => setDeliveryRecipientName(e.target.value)}
                      aria-invalid={!!showDeliveryFieldError("delivery_recipient_name")}
                    />
                    {showDeliveryFieldError("delivery_recipient_name") ? (
                      <p className="text-xs text-red-500">
                        {showDeliveryFieldError("delivery_recipient_name")}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {deliveryMethod === "address" ? (
                  <div className="space-y-3 rounded-xl border border-kartex-gold/20 bg-[#F8F9FC]/80 p-4">
                    <div className="space-y-2">
                      <FormFieldLabel htmlFor="delivery-address" tooltip={FIELD_TOOLTIPS.deliveryAddress}>
                        Διεύθυνση
                      </FormFieldLabel>
                      <textarea
                        id="delivery-address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className={premiumTextarea}
                        rows={2}
                        aria-invalid={!!showDeliveryFieldError("delivery_address")}
                      />
                      {showDeliveryFieldError("delivery_address") ? (
                        <p className="text-xs text-red-500">
                          {showDeliveryFieldError("delivery_address")}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <FormFieldLabel htmlFor="delivery-city">Πόλη</FormFieldLabel>
                        <Input
                          id="delivery-city"
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          aria-invalid={!!showDeliveryFieldError("delivery_city")}
                        />
                        {showDeliveryFieldError("delivery_city") ? (
                          <p className="text-xs text-red-500">
                            {showDeliveryFieldError("delivery_city")}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <FormFieldLabel htmlFor="delivery-postal">Τ.Κ.</FormFieldLabel>
                        <Input
                          id="delivery-postal"
                          value={deliveryPostalCode}
                          onChange={(e) => setDeliveryPostalCode(e.target.value)}
                          aria-invalid={!!showDeliveryFieldError("delivery_postal_code")}
                        />
                        {showDeliveryFieldError("delivery_postal_code") ? (
                          <p className="text-xs text-red-500">
                            {showDeliveryFieldError("delivery_postal_code")}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {deliveryMethod === "pickup" ? (
                  <div className="space-y-2 rounded-xl border border-kartex-gold/20 bg-[#F8F9FC]/80 p-4">
                    <FormFieldLabel htmlFor="pickup-agency">Πρακτορείο</FormFieldLabel>
                    <Input
                      id="pickup-agency"
                      value={pickupAgency}
                      onChange={(e) => setPickupAgency(e.target.value)}
                      placeholder="π.χ. ACS Μεταμόρφωσης"
                      aria-invalid={!!showDeliveryFieldError("pickup_agency")}
                    />
                    {showDeliveryFieldError("pickup_agency") ? (
                      <p className="text-xs text-red-500">
                        {showDeliveryFieldError("pickup_agency")}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <FormFieldLabel htmlFor="special-instructions" tooltip={FIELD_TOOLTIPS.specialInstructions}>
                    Ειδικές οδηγίες
                  </FormFieldLabel>
                  <textarea
                    id="special-instructions"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className={premiumTextarea}
                    rows={2}
                    placeholder="Προαιρετικά…"
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card className="premiumFormCard">
              <CardHeader>
                <CardTitle className="text-lg text-kartex-navy">Προϊόντα</CardTitle>
                <CardDescription>Προσθέστε γραμμές παραγγελίας</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="Αναζήτηση master / SKU…"
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setProductCategory("all")}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold",
                        productCategory === "all"
                          ? "bg-kartex-navy text-white"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      Όλα
                    </button>
                    {productCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setProductCategory(category)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold",
                          productCategory === category
                            ? "bg-kartex-navy text-white"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                {productsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Φόρτωση προϊόντων…
                  </p>
                ) : null}
                {!productsLoading && filteredMasterGroups.length > 0 ? (
                  <div className={masterGroupGridClass}>
                    {filteredMasterGroups.map((group) => {
                      const groupKey = `${group.cleanName}__${group.category}`;
                      const isExpanded = expandedMasterKey === groupKey;
                      return (
                        <div
                          key={groupKey}
                          className={cn(
                            premiumCard,
                            "border-l-[3px] border-l-kartex-gold/40 p-4",
                          )}
                        >
                          <button
                            type="button"
                            className="flex w-full items-start justify-between gap-2 text-left"
                            onClick={() =>
                              setExpandedMasterKey(isExpanded ? null : groupKey)
                            }
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-kartex-navy">
                                {group.cleanName}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <CategoryBadge category={group.category} />
                                <span className="text-xs text-muted-foreground">
                                  {group.variants.length} παραλλαγές
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-kartex-gold">
                              {isExpanded ? "Κλείσιμο" : "Επιλογή"}
                            </span>
                          </button>
                          {isExpanded ? (
                            <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
                              {group.variants.map((variant) => (
                                <li
                                  key={variant.id}
                                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-kartex-navy">
                                      {variantLabel(variant)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {variant.sku} · {formatEur(variant.salePrice)}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0 border-kartex-gold/30 text-kartex-gold hover:bg-kartex-gold/10"
                                    onClick={() => addVariant(group, variant.id)}
                                  >
                                    <Plus className="size-3.5" />
                                    Προσθήκη
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : !productsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Δεν βρέθηκαν προϊόντα.
                  </p>
                ) : null}
                {lineItems.length > 0 ? (
                  <div className="space-y-2">
                    {lineItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_5rem_5rem_auto]"
                      >
                        <span className="text-sm font-medium">
                          {item.cleanName || item.name}
                        </span>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          aria-label="Ποσότητα"
                        />
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.price}
                          onChange={(e) =>
                            updateLineItem(item.id, "price", Number(e.target.value))
                          }
                          aria-label="Τιμή"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          aria-label="Αφαίρεση"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Δεν έχουν προστεθεί προϊόντα.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {step === 3 ? (
            <Card className="premiumFormCard">
              <CardHeader>
                <CardTitle className="text-lg text-kartex-navy">Λεπτομέρειες</CardTitle>
              </CardHeader>
              <CardContent className={premiumFormGrid}>
                <div className="space-y-4 rounded-lg border border-border bg-[#F8F9FC]/80 p-4 sm:col-span-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-kartex-navy">
                    <Calendar className="size-4 shrink-0 text-kartex-gold" aria-hidden />
                    Προγραμματισμός (προαιρετικό)
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FormFieldLabel htmlFor="picking-date" tooltip={FIELD_TOOLTIPS.pickingDate}>
                        Ημερομηνία Picking
                      </FormFieldLabel>
                      <Input
                        id="picking-date"
                        type="date"
                        value={pickingDate}
                        onChange={(e) => setPickingDate(e.target.value)}
                        aria-describedby="picking-date-hint"
                      />
                      <p id="picking-date-hint" className="text-xs text-muted-foreground">
                        Αφήστε κενό για άμεση εκτέλεση
                      </p>
                    </div>
                    <div className="space-y-2">
                      <FormFieldLabel htmlFor="delivery-date" tooltip={FIELD_TOOLTIPS.deliveryDate}>
                        Ημερομηνία Παράδοσης
                      </FormFieldLabel>
                      <Input
                        id="delivery-date"
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <FormFieldLabel htmlFor="reminder-days" tooltip={FIELD_TOOLTIPS.reminderDays}>
                        Ειδοποίηση
                      </FormFieldLabel>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          id="reminder-days"
                          type="number"
                          min={0}
                          max={90}
                          value={reminderDays}
                          onChange={(e) =>
                            setReminderDays(
                              Math.max(0, Number.parseInt(e.target.value, 10) || 0),
                            )
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          μέρες πριν
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <DocumentTypePicker
                  className="sm:col-span-2"
                  value={documentType}
                  onChange={setDocumentType}
                />
                <PaymentTermsSelect
                  value={paymentTerms}
                  onChange={setPaymentTerms}
                  label="Όροι πληρωμής"
                />
                <div className="space-y-2">
                  <FormFieldLabel htmlFor="priority" tooltip={FIELD_TOOLTIPS.orderPriority}>
                    Προτεραιότητα
                  </FormFieldLabel>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {PRIORITIES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3 rounded-lg border border-border bg-[#F8F9FC]/80 p-4 sm:col-span-2">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isReservedOrder}
                      onChange={(event) => setIsReservedOrder(event.target.checked)}
                      className="mt-1 size-4 rounded border-border text-kartex-gold focus:ring-kartex-gold/40"
                    />
                    <span>
                      <span className="text-sm font-semibold text-kartex-navy">
                        Δεσμευμένη Παραγγελία
                      </span>
                      <span className="mt-0.5 block text-xs text-[#64748B]">
                        Το απόθεμα θα δεσμευτεί μέχρι την ημερομηνία παράδοσης.
                      </span>
                    </span>
                  </label>
                  {isReservedOrder ? (
                    <div className="space-y-2 pl-7">
                      <FormFieldLabel htmlFor="reserved-until" tooltip={FIELD_TOOLTIPS.reservedUntil}>
                        Δέσμευση έως
                      </FormFieldLabel>
                      <Input
                        id="reserved-until"
                        type="date"
                        value={reservedUntil}
                        onChange={(event) => setReservedUntil(event.target.value)}
                        required={isReservedOrder}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <FormFieldLabel htmlFor="order-notes" tooltip={FIELD_TOOLTIPS.orderNotes}>
                    Σημειώσεις
                  </FormFieldLabel>
                  <textarea
                    id="order-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={premiumTextarea}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 4 ? (
            <Card className="premiumFormCard">
              <CardHeader>
                <CardTitle className="text-lg text-kartex-navy">Επισκόπηση</CardTitle>
                <CardDescription>Ελέγξτε τα στοιχεία πριν την αποθήκευση</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <section>
                  <h3 className="font-medium text-kartex-navy">Πελάτης</h3>
                  <p>{selectedCustomer?.name ?? "—"}</p>
                  <p className="text-muted-foreground">
                    {deliveryRecipientName ? `${deliveryRecipientName} · ` : ""}
                    {deliveryMethod === "pickup"
                      ? `Παραλαβή: ${pickupAgency || "—"}`
                      : [
                          deliveryAddress,
                          [deliveryCity, deliveryPostalCode].filter(Boolean).join(" "),
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                  </p>
                  {specialInstructions ? (
                    <p className="text-muted-foreground">{specialInstructions}</p>
                  ) : null}
                </section>
                <section>
                  <h3 className="font-medium text-kartex-navy">Προϊόντα</h3>
                  <ul className="mt-1 space-y-1">
                    {lineItems.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>
                          {item.cleanName || item.name} × {item.quantity}
                        </span>
                        <span className="tabular-nums">{formatEur(lineTotal(item))}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="font-medium text-kartex-navy">Λεπτομέρειες</h3>
                  <p className="text-muted-foreground">
                    Προγραμματισμός:{" "}
                    {pickingDate.trim()
                      ? `Picking ${pickingDate}, παράδοση ${deliveryDate || "—"}, ειδοποίηση ${reminderDays} ημ. πριν`
                      : "Άμεση εκτέλεση"}{" "}
                    · {documentTypeLabel(documentType)} ·{" "}
                    {paymentTerms || "—"} ·{" "}
                    {PRIORITIES.find((p) => p.value === priority)?.label}
                  </p>
                  {notes ? <p className="text-muted-foreground">{notes}</p> : null}
                </section>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    type="button"
                    className={premiumGoldButton}
                    disabled={submitting}
                    onClick={() => void handleSubmit(false)}
                  >
                    {submitting ? "Αποθήκευση…" : "Αποθήκευση Παραγγελίας"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    onClick={() => void handleSubmit(true)}
                  >
                    Αποθήκευση ως Πρόχειρο
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step < 4 ? (
            <div className="mt-4 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={step === 1}
              >
                <ArrowLeft className="size-4" />
                Πίσω
              </Button>
              <Button type="button" className={premiumGoldButton} onClick={goNext}>
                Επόμενο
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <Button type="button" variant="outline" onClick={goBack}>
                <ArrowLeft className="size-4" />
                Πίσω
              </Button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="border-kartex-gold/20 bg-gradient-to-br from-kartex-navy via-kartex-navy/95 to-navy-900 text-white lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-white/60">
                Σύνολο Παραγγελίας
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-black tabular-nums text-kartex-gold">
                {formatEur(orderVat.grandTotal)}
              </div>
              <div className="space-y-1 text-xs text-white/50">
                <div className="flex justify-between">
                  <span>Υποσύνολο</span>
                  <span className="tabular-nums">{formatEur(orderVat.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{orderVat.vatApplies ? "ΦΠΑ 24%" : "ΦΠΑ"}</span>
                  <span className="tabular-nums">{formatEur(orderVat.vatAmount)}</span>
                </div>
              </div>
              <div className="text-sm text-white/50">
                {lineItems.length}{" "}
                {lineItems.length === 1 ? "προϊόν" : "προϊόντα"}
              </div>
              {lineItems.length > 0 ? (
                <div className="space-y-2 border-t border-white/10 pt-4">
                  {lineItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="mr-2 truncate text-white/70">
                        {item.cleanName || item.name} ×{item.quantity}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-white">
                        {formatEur(lineTotal(item))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="border-t border-white/10 pt-2 text-xs text-white/30">
                {orderVat.vatApplies
                  ? "Απόδειξη — με ΦΠΑ 24%"
                  : "Τιμολόγιο — χωρίς ΦΠΑ"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
