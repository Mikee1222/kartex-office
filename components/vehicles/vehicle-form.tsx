"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import type { VehicleFormData } from "@/lib/vehicles/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  premiumFormCard,
  premiumFormGrid,
  premiumGoldButton,
  premiumInputFocus,
  premiumLabel,
} from "@/lib/ui/premium-styles";
import { premiumTextarea } from "@/lib/ui/form-styles";

type VehicleFormProps = {
  mode: "create" | "edit";
  vehicleId?: string;
  initial?: VehicleFormData;
};

const empty: VehicleFormData = {
  plate: "",
  model: "",
  maxBoxes: 50,
  notes: "",
  isActive: true,
};

export function VehicleForm({ mode, vehicleId, initial }: VehicleFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<VehicleFormData>(initial ?? empty);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const plate = form.plate.trim().toUpperCase();
    if (!plate) {
      setError("Η πινακίδα είναι υποχρεωτική.");
      return;
    }
    if (form.maxBoxes < 1) {
      setError("Τα μέγιστα κιβώτια πρέπει να είναι ≥ 1.");
      return;
    }

    setError(null);
    setPending(true);

    const payload = {
      plate,
      model: form.model.trim(),
      maxBoxes: form.maxBoxes,
      notes: form.notes.trim(),
      isActive: form.isActive,
    };

    const url =
      mode === "create" ? "/api/vehicles" : `/api/vehicles/${vehicleId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as { error?: string };
    setPending(false);

    if (!res.ok) {
      setError(json.error ?? "Αποτυχία αποθήκευσης.");
      return;
    }

    router.push("/vehicles");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/vehicles"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-kartex-navy"
      >
        <ArrowLeft className="size-4" />
        Οχήματα
      </Link>

      <Card className={premiumFormCard}>
        <CardHeader>
          <CardTitle className="text-lg text-kartex-navy">
            {mode === "create" ? "Νέο Όχημα" : "Επεξεργασία Οχήματος"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className={premiumFormGrid}>
            {error ? (
              <p className="sm:col-span-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="plate" className={premiumLabel}>
                Πινακίδα *
              </Label>
              <Input
                id="plate"
                value={form.plate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))
                }
                className={premiumInputFocus}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="model" className={premiumLabel}>
                Μοντέλο
              </Label>
              <Input
                id="model"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                className={premiumInputFocus}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-boxes" className={premiumLabel}>
                Μέγιστα Κιβώτια *
              </Label>
              <Input
                id="max-boxes"
                type="number"
                min={1}
                value={form.maxBoxes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    maxBoxes: Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                  }))
                }
                className={premiumInputFocus}
                required
              />
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                id="is-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="size-4 rounded border-border text-kartex-gold"
              />
              <Label htmlFor="is-active">Ενεργό</Label>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes" className={premiumLabel}>
                Σημειώσεις
              </Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className={premiumTextarea}
                rows={4}
              />
            </div>

            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" className={premiumGoldButton} disabled={pending}>
                {pending ? "Αποθήκευση…" : "Αποθήκευση"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/vehicles">Ακύρωση</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
