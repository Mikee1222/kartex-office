"use client";

import { ArrowLeft, ArrowRight, Calendar, Check, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { OrderStatus } from "@/components/orders/types";
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
  premiumFormCard,
  premiumFormGrid,
  premiumGoldButton,
  premiumInputFocus,
} from "@/lib/ui/premium-styles";
import { PaymentTermsSelect } from "@/components/settings/payment-terms-select";
import { usePaymentTermOptions } from "@/lib/settings/use-lookup-options";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { mapDbCustomerType, mapProductRow, type ProductRow } from "@/types/database";

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
  quantity: number;
  price: number;
};

type WizardProduct = {
  id: string;
  name: string;
  price: number;
};


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
};

function buildDeliveryAddress(customer: WizardCustomer): string {
  const line2 = [customer.city, customer.postal_code]
    .filter((part) => part?.trim())
    .join(" ");
  const parts = [customer.address?.trim(), line2].filter(Boolean);
  return parts.join(", ");
}

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
  const [productsCatalog, setProductsCatalog] = React.useState<WizardProduct[]>(
    [],
  );
  const [productsLoading, setProductsLoading] = React.useState(true);

  const [customers, setCustomers] = React.useState<WizardCustomer[]>([]);
  const [customerQuery, setCustomerQuery] = React.useState("");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(
    null,
  );
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
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
  const [isReservedOrder, setIsReservedOrder] = React.useState(false);
  const [reservedUntil, setReservedUntil] = React.useState("");

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

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
          "id, name, type, phone, email, address, city, postal_code, payment_terms",
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
        .select("*")
        .order("name");

      if (fetchError) {
        console.error(fetchError);
        setProductsCatalog([]);
        setProductsLoading(false);
        return;
      }

      setProductsCatalog(
        (data as ProductRow[]).map((row) => {
          const mapped = mapProductRow(row);
          return {
            id: mapped.id,
            name: mapped.name,
            price: mapped.salePrice,
          };
        }),
      );
      setProductsLoading(false);
    };

    void fetchProducts();
  }, []);

  const filteredProducts = React.useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return productsCatalog.slice(0, 8);
    return productsCatalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }, [productQuery, productsCatalog]);

  const orderTotal = lineItems.reduce((sum, item) => sum + lineTotal(item), 0);

  function addProduct(product: WizardProduct) {
    setLineItems((items) => {
      const existing = items.find((i) => i.id === product.id);
      if (existing) {
        return items.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...items,
        {
          id: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
        },
      ];
    });
    setProductQuery("");
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

  function validateStep(current: number): boolean {
    if (current === 1 && !selectedCustomerId) {
      setError("Επιλέξτε πελάτη για να συνεχίσετε.");
      return false;
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
      total: orderTotal,
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
              ? `Ανεπαρκές διαθέσιμο απόθεμα για «${item.name}».`
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
    const formatted = buildDeliveryAddress(customer);
    if (formatted) {
      setDeliveryAddress(formatted);
    }
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
        <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0">
          {STEPS.map((s, index) => {
            const isActive = step === s.id;
            const isComplete = step > s.id;
            return (
              <li key={s.id} className="flex flex-1 items-center">
                <div className="flex w-full items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      isComplete
                        ? "bg-kartex-gold text-kartex-navy"
                        : isActive
                          ? "bg-kartex-navy text-white"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isComplete ? <Check className="size-4" /> : s.id}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-kartex-navy" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {index < STEPS.length - 1 ? (
                  <div
                    className="mx-2 hidden h-0.5 flex-1 bg-border sm:block"
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-kartex-gold transition-all duration-300"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
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
                  <Card className="border-kartex-gold/30 bg-kartex-gold/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-kartex-navy">
                        Επιλεγμένος πελάτης
                      </CardTitle>
                      <CardDescription>{selectedCustomer.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                      <p>
                        <span className="text-muted-foreground">Όνομα: </span>
                        <span className="font-medium">{selectedCustomer.name}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Τηλέφωνο: </span>
                        {selectedCustomer.phone?.trim() || "—"}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="text-muted-foreground">Email: </span>
                        {selectedCustomer.email?.trim() || "—"}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="text-muted-foreground">Διεύθυνση: </span>
                        {buildDeliveryAddress(selectedCustomer) || "—"}
                      </p>
                      {selectedCustomer.payment_terms ? (
                        <p className="sm:col-span-2">
                          <span className="text-muted-foreground">
                            Όροι πληρωμής:{" "}
                          </span>
                          {selectedCustomer.payment_terms}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}

                <div className="space-y-2">
                  <FormFieldLabel htmlFor="delivery-address" tooltip={FIELD_TOOLTIPS.deliveryAddress}>
                    Διεύθυνση παράδοσης
                  </FormFieldLabel>
                  <textarea
                    id="delivery-address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className={premiumTextarea}
                    rows={3}
                  />
                </div>
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Αναζήτηση προϊόντος…"
                    className="pl-9"
                  />
                </div>
                {productsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Φόρτωση προϊόντων…
                  </p>
                ) : null}
                {!productsLoading && filteredProducts.length > 0 ? (
                  <ul className="rounded-md border border-border">
                    {filteredProducts.map((product) => (
                      <li
                        key={product.id}
                        className="flex items-center justify-between border-b border-border/60 px-3 py-2 last:border-0"
                      >
                        <span className="text-sm">{product.name}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => addProduct(product)}
                        >
                          <Plus className="size-4" />
                          Προσθήκη
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {lineItems.length > 0 ? (
                  <div className="space-y-2">
                    {lineItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_5rem_5rem_auto]"
                      >
                        <span className="text-sm font-medium">{item.name}</span>
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
                  <p className="text-muted-foreground">{deliveryAddress || "—"}</p>
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
                          {item.name} × {item.quantity}
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
                    ·{" "}
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
          <Card className="premiumFormCard lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="text-lg text-kartex-navy">Σύνολο</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums text-kartex-navy">
                {formatEur(orderTotal)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lineItems.length} γραμμές · ΦΠΑ υπολογίζεται στην τιμολόγηση
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
