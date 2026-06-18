"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Input } from "@/components/ui/input";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  premiumFormCard,
  premiumFormGrid,
  premiumFormShell,
  premiumGoldButton,
  premiumInputFocus,
} from "@/lib/ui/premium-styles";
import { premiumSelect, premiumTextarea } from "@/lib/ui/form-styles";
import { CustomerTypeSelect } from "@/components/settings/customer-type-select";
import { PaymentTermsSelect } from "@/components/settings/payment-terms-select";
import { useCustomerTypeOptions } from "@/lib/settings/use-lookup-options";
import {
  mapUiCustomerTypeToDb,
  type CustomerEditInitial,
} from "@/types/database";

type CustomerEditFormProps = {
  customerId: string;
  initial: CustomerEditInitial;
};

export function CustomerEditForm({ customerId, initial }: CustomerEditFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const [companyName, setCompanyName] = React.useState(initial.name);
  const [type, setType] = React.useState(initial.typeLabel);
  const { dbKeyForLabel } = useCustomerTypeOptions();
  const [vatNumber, setVatNumber] = React.useState(initial.vat);
  const [phone, setPhone] = React.useState(initial.phone);
  const [email, setEmail] = React.useState(initial.email);
  const [address, setAddress] = React.useState(initial.address);
  const [city, setCity] = React.useState(initial.city);
  const [postalCode, setPostalCode] = React.useState(initial.postalCode);
  const [paymentTerms, setPaymentTerms] = React.useState(initial.paymentTerms);
  const [creditLimit, setCreditLimit] = React.useState(initial.creditLimit);
  const [notes, setNotes] = React.useState(initial.notes);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!companyName.trim()) {
      setError("Η επωνυμία είναι υποχρεωτική.");
      return;
    }

    const dbType = dbKeyForLabel(type) ?? mapUiCustomerTypeToDb(type);
    if (!dbType) {
      setError("Μη έγκυρος τύπος πελάτη.");
      return;
    }

    setError(null);
    setPending(true);

    const parsedCredit = creditLimit.trim()
      ? Number.parseFloat(creditLimit)
      : 0;
    const creditLimitValue = Number.isFinite(parsedCredit) ? parsedCredit : 0;

    const payload = {
      name: companyName.trim(),
      type: dbType,
      vat: vatNumber.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      postal_code: postalCode.trim() || null,
      payment_terms: paymentTerms || null,
      credit_limit: creditLimitValue,
      notes: notes.trim() || null,
    };

    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", customerId)
      .select()
      .single();

    if (updateError) {
      console.error("Customer update error:", updateError);
      setError(updateError.message || "Αποτυχία αποθήκευσης.");
      setPending(false);
      return;
    }

    router.push("/customers");
    router.refresh();
  }

  return (
    <div className={premiumFormShell}>
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-kartex-navy"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Πελάτες
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight text-kartex-navy">
        Επεξεργασία πελάτη
      </h1>

      <Card className="premiumFormCard">
        <CardHeader>
          <CardTitle className="text-lg text-kartex-navy">{initial.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            {error ? (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <fieldset disabled={pending} className={premiumFormGrid}>
              <div className="space-y-2 sm:col-span-2">
                <FormFieldLabel htmlFor="company-name" required tooltip={FIELD_TOOLTIPS.companyName}>
                  Επωνυμία
                </FormFieldLabel>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <CustomerTypeSelect
                value={type}
                onChange={setType}
                disabled={pending}
                required
                extraOption={initial.typeLabel}
              />
              <div className="space-y-2">
                <FormFieldLabel htmlFor="vat" tooltip={FIELD_TOOLTIPS.vat}>ΑΦΜ</FormFieldLabel>
                <Input
                  id="vat"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FormFieldLabel htmlFor="phone" tooltip={FIELD_TOOLTIPS.phone}>Τηλέφωνο</FormFieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FormFieldLabel htmlFor="email" tooltip={FIELD_TOOLTIPS.email}>Email</FormFieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <FormFieldLabel htmlFor="address" tooltip={FIELD_TOOLTIPS.address}>Διεύθυνση</FormFieldLabel>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FormFieldLabel htmlFor="city" tooltip={FIELD_TOOLTIPS.city}>Πόλη</FormFieldLabel>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FormFieldLabel htmlFor="postal-code" tooltip={FIELD_TOOLTIPS.postalCode}>ΤΚ</FormFieldLabel>
                <Input
                  id="postal-code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
              <PaymentTermsSelect
                value={paymentTerms}
                onChange={setPaymentTerms}
                disabled={pending}
                extraOption={initial.paymentTerms}
              />
              <div className="space-y-2">
                <FormFieldLabel htmlFor="credit-limit" tooltip={FIELD_TOOLTIPS.creditLimit}>
                  Πιστωτικό Όριο €
                </FormFieldLabel>
                <Input
                  id="credit-limit"
                  type="number"
                  min={0}
                  step={0.01}
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <FormFieldLabel htmlFor="notes" tooltip={FIELD_TOOLTIPS.notes}>Σημειώσεις</FormFieldLabel>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={premiumTextarea}
                />
              </div>
            </fieldset>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => router.push("/customers")}
              >
                Ακύρωση
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className={cn(premiumGoldButton, "sm:min-w-[140px]")}
              >
                {pending ? "Αποθήκευση…" : "Αποθήκευση"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
