"use client";

import { ExternalLink, Layers, Palette, Truck } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { CustomerTypeListSection } from "@/components/settings/customer-type-list-section";
import { MydataSettingsSection } from "@/components/settings/mydata-settings-section";
import { LookupListSection } from "@/components/settings/lookup-list-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import type { CustomerTypeOptionRow, LookupRow } from "@/lib/settings/lookups";
import {
  fetchCustomerTypeOptions,
  fetchPaymentTermOptions,
  fetchProductCategories,
  fetchQualityGrades,
} from "@/lib/settings/lookups";
import { premiumCard, premiumGoldButton } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";

export function SettingsHubPage() {
  const [categories, setCategories] = React.useState<LookupRow[]>([]);
  const [qualityGrades, setQualityGrades] = React.useState<LookupRow[]>([]);
  const [paymentTerms, setPaymentTerms] = React.useState<LookupRow[]>([]);
  const [customerTypes, setCustomerTypes] = React.useState<CustomerTypeOptionRow[]>([]);

  const [categoriesLoading, setCategoriesLoading] = React.useState(true);
  const [qualityLoading, setQualityLoading] = React.useState(true);
  const [paymentLoading, setPaymentLoading] = React.useState(true);
  const [customerTypesLoading, setCustomerTypesLoading] = React.useState(true);

  const [categoriesError, setCategoriesError] = React.useState<string | null>(null);
  const [qualityError, setQualityError] = React.useState<string | null>(null);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [customerTypesError, setCustomerTypesError] = React.useState<string | null>(null);

  const [refreshKey, setRefreshKey] = React.useState(0);

  const loadCategories = React.useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    const supabase = createClient();
    const result = await fetchProductCategories(supabase, false);
    setCategories(result.items);
    setCategoriesError(result.error);
    setCategoriesLoading(false);
  }, []);

  const loadQualityGrades = React.useCallback(async () => {
    setQualityLoading(true);
    setQualityError(null);
    const supabase = createClient();
    const result = await fetchQualityGrades(supabase, false);
    setQualityGrades(result.items);
    setQualityError(result.error);
    setQualityLoading(false);
  }, []);

  const loadPaymentTerms = React.useCallback(async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    const supabase = createClient();
    const result = await fetchPaymentTermOptions(supabase, false);
    setPaymentTerms(result.items);
    setPaymentError(result.error);
    setPaymentLoading(false);
  }, []);

  const loadCustomerTypes = React.useCallback(async () => {
    setCustomerTypesLoading(true);
    setCustomerTypesError(null);
    const supabase = createClient();
    const result = await fetchCustomerTypeOptions(supabase, false);
    setCustomerTypes(result.items);
    setCustomerTypesError(result.error);
    setCustomerTypesLoading(false);
  }, []);

  React.useEffect(() => {
    void loadCategories();
    void loadQualityGrades();
    void loadPaymentTerms();
    void loadCustomerTypes();
  }, [
    loadCategories,
    loadQualityGrades,
    loadPaymentTerms,
    loadCustomerTypes,
    refreshKey,
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Ρυθμίσεις"
        subtitle="Κατηγορίες, υλικά, ποιότητες, προμηθευτές, χρώματα και τρόποι πληρωμής."
      />

      <LookupListSection
        title="Κατηγορίες Προϊόντων"
        description="Χρησιμοποιούνται στη φόρμα προϊόντος και στα φίλτρα καταλόγου."
        table="product_categories"
        items={categories}
        loading={categoriesLoading}
        error={categoriesError}
        onRefresh={() => void loadCategories()}
      />

      <Card className={premiumCard}>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-navy-900">
              <Layers className="size-5 text-gold-500" aria-hidden />
              Υλικά
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Κατάλογος υλικών (βαμβάκι, πολυεστέρας, μίγματα) για product masters.
            </p>
          </div>
          <Button asChild className={premiumGoldButton}>
            <Link href="/settings/materials">
              Διαχείριση υλικών
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <LookupListSection
        title="Ποιότητες"
        description="Βαθμοί ποιότητας προϊόντος."
        table="quality_grades"
        items={qualityGrades}
        loading={qualityLoading}
        error={qualityError}
        onRefresh={() => void loadQualityGrades()}
      />

      <Card className={premiumCard}>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-navy-900">
              <Truck className="size-5 text-gold-500" aria-hidden />
              Προμηθευτές
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Πλήρη στοιχεία επικοινωνίας και διαχείριση λίστας.
            </p>
          </div>
          <Button asChild className={premiumGoldButton}>
            <Link href="/settings/suppliers">
              Διαχείριση προμηθευτών
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <Card className={premiumCard}>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-navy-900">
              <Palette className="size-5 text-gold-500" aria-hidden />
              Χρώματα
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Διαχείριση χρωμάτων προϊόντος (hex, ενεργά/ανενεργά).
            </p>
          </div>
          <Button asChild className={premiumGoldButton}>
            <Link href="/settings/colors">
              Διαχείριση χρωμάτων
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Η πλήρης διαχείριση χρωμάτων βρίσκεται στη εξειδικευμένη σελίδα.
          </p>
        </CardContent>
      </Card>

      <LookupListSection
        title="Τρόποι Πληρωμής"
        description="Επιλογές για πελάτες και παραγγελίες."
        table="payment_term_options"
        items={paymentTerms}
        loading={paymentLoading}
        error={paymentError}
        onRefresh={() => void loadPaymentTerms()}
      />

      <CustomerTypeListSection
        items={customerTypes}
        loading={customerTypesLoading}
        error={customerTypesError}
        onRefresh={() => void loadCustomerTypes()}
      />

      <MydataSettingsSection />
    </div>
  );
}
