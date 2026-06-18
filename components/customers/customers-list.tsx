"use client";

import { Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { CustomerRowActions } from "@/components/customers/customer-row-actions";
import { CustomerTypeBadge } from "@/components/customers/customer-type-badge";
import {
  CUSTOMER_FILTER_TABS,
  type Customer,
  type CustomerFilterTab,
} from "@/components/customers/types";
import { DataError } from "@/components/dashboard/data-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  premiumFilterTabActive,
  premiumFilterTabInactive,
  premiumGoldButton,
  premiumInputFocus,
  premiumTableHead,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  aggregateCustomerOrderStats,
  formatCurrencyEl,
  type CustomerOrderAggregateRow,
  type CustomerRow,
  mapCustomerRow,
} from "@/types/database";
import { cn } from "@/lib/utils";

function getInitials(company: string) {
  return company
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function matchesSearch(customer: Customer, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    customer.company.toLowerCase().includes(normalized) ||
    customer.city.toLowerCase().includes(normalized) ||
    customer.phone.toLowerCase().includes(normalized)
  );
}

function CustomersTableSkeleton() {
  return (
    <div className={cn(premiumTableWrap, "space-y-3 p-4 sm:p-6")}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function CustomersList() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<CustomerFilterTab>("all");
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const [
        { data: customerRows, error: fetchError },
        { data: orderRows, error: ordersError },
      ] = await Promise.all([
        supabase.from("customers").select("*").order("name", { ascending: true }),
        supabase.from("orders").select("customer_id, total, created_at"),
      ]);

      if (cancelled) return;

      if (fetchError || ordersError) {
        setError(
          fetchError?.message ||
            ordersError?.message ||
            "Αποτυχία φόρτωσης πελατών. Ελέγξτε τη σύνδεση και τα δικαιώματα πρόσβασης.",
        );
        setCustomers([]);
        setLoading(false);
        return;
      }

      const statsByCustomer = aggregateCustomerOrderStats(
        (orderRows ?? []) as CustomerOrderAggregateRow[],
      );

      setCustomers(
        (customerRows as CustomerRow[]).map((row) =>
          mapCustomerRow(row, statsByCustomer.get(row.id)),
        ),
      );
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  const filtered = React.useMemo(() => {
    return customers.filter((customer) => {
      const tabMatch = activeTab === "all" || customer.type === activeTab;
      return tabMatch && matchesSearch(customer, search);
    });
  }, [customers, search, activeTab]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Πελάτες"
        subtitle="Κατάλογος πελατών και στοιχεία επικοινωνίας."
        action={
          <Button
            type="button"
            className={premiumGoldButton}
            onClick={() => router.push("/customers/new")}
          >
            Νέος Πελάτης
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Αναζήτηση ονόματος, πόλης, τηλεφώνου…"
            className={cn("pl-9", premiumInputFocus)}
            aria-label="Αναζήτηση πελατών"
            disabled={loading}
          />
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Φίλτρο τύπου πελάτη"
        >
          {CUSTOMER_FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  isActive ? premiumFilterTabActive : premiumFilterTabInactive,
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((k) => k + 1)} />
      ) : null}

      {loading ? <CustomersTableSkeleton /> : null}

      {!loading && !error ? (
        <Card className={premiumTableWrap}>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className={premiumTableHead}>
                  <th className="px-4 py-3 sm:px-6">Εταιρεία</th>
                  <th className="px-4 py-3">Τύπος</th>
                  <th className="px-4 py-3">Τηλέφωνο</th>
                  <th className="px-4 py-3">Πόλη</th>
                  <th className="px-4 py-3">Τελευταία Παραγγελία</th>
                  <th className="px-4 py-3">Σύνολο Αγορών (€)</th>
                  <th className="px-4 py-3 text-right sm:pr-6">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <EmptyState
                        icon={Users}
                        title={
                          customers.length === 0
                            ? "Δεν υπάρχουν πελάτες"
                            : "Δεν βρέθηκαν αποτελέσματα"
                        }
                        description={
                          customers.length === 0
                            ? "Προσθέστε τον πρώτο πελάτη σας."
                            : "Δοκιμάστε άλλο φίλτρο ή όρο αναζήτησης."
                        }
                        actionLabel={customers.length === 0 ? "Νέος Πελάτης" : undefined}
                        actionHref="/customers/new"
                        className="py-8"
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer) => (
                    <tr
                      key={customer.id}
                      className={cn(premiumTableRow, "cursor-pointer")}
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <td className="px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kartex-navy text-xs font-semibold text-kartex-gold">
                            {getInitials(customer.company)}
                          </span>
                          <span className="font-medium text-kartex-navy">
                            {customer.company}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <CustomerTypeBadge type={customer.type} />
                      </td>
                      <td className="px-4 py-3 text-foreground">{customer.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {customer.city}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {customer.lastOrderDate}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {customer.totalPurchasesEur > 0
                          ? formatCurrencyEl(customer.totalPurchasesEur)
                          : "—"}
                      </td>
                      <td
                        className="px-4 py-3 sm:pr-6"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <CustomerRowActions
                          customer={customer}
                          onDeleted={() => setFetchKey((k) => k + 1)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
