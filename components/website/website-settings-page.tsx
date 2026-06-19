"use client";

import { ExternalLink } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { ActiveToggle } from "@/components/website/active-toggle";
import { DataError } from "@/components/dashboard/data-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { SiteSettingsState } from "@/lib/website/types";
import { getWebsiteUrl } from "@/lib/website/site-url";
import { premiumGoldButton } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_SETTINGS: SiteSettingsState = {
  showPrices: false,
  maintenanceMode: false,
  contactEmail: "kartex@kartex.gr",
  contactPhone: "+30 210 2846533",
  contactAddress: "Κορίνθου 15, Μεταμόρφωση 144 51",
  facebook: "",
  instagram: "",
};

function settingsFromRows(
  rows: { key: string; value: unknown }[],
): SiteSettingsState {
  const next = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    switch (row.key) {
      case "show_prices":
        next.showPrices = Boolean(row.value);
        break;
      case "maintenance_mode":
        next.maintenanceMode = Boolean(row.value);
        break;
      case "contact_email":
        next.contactEmail = String(row.value ?? "");
        break;
      case "contact_phone":
        next.contactPhone = String(row.value ?? "");
        break;
      case "contact_address":
        next.contactAddress = String(row.value ?? "");
        break;
      case "social_links": {
        const links =
          row.value && typeof row.value === "object"
            ? (row.value as Record<string, string>)
            : {};
        next.facebook = links.facebook ?? "";
        next.instagram = links.instagram ?? "";
        break;
      }
      default:
        break;
    }
  }
  return next;
}

export function WebsiteSettingsPage() {
  const [settings, setSettings] = React.useState<SiteSettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [fetchKey, setFetchKey] = React.useState(0);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "show_prices",
        "maintenance_mode",
        "contact_email",
        "contact_phone",
        "contact_address",
        "social_links",
      ]);

    if (fetchError) {
      setError(fetchError.message);
      setSettings(DEFAULT_SETTINGS);
    } else {
      setSettings(settingsFromRows((data as { key: string; value: unknown }[]) ?? []));
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, fetchKey]);

  function updateSetting<K extends keyof SiteSettingsState>(
    key: K,
    value: SiteSettingsState[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function saveAll() {
    setSaving(true);
    const supabase = createClient();
    const { error: saveError } = await supabase.from("settings").upsert(
      [
        { key: "show_prices", value: settings.showPrices },
        { key: "maintenance_mode", value: settings.maintenanceMode },
        { key: "contact_email", value: settings.contactEmail },
        { key: "contact_phone", value: settings.contactPhone },
        { key: "contact_address", value: settings.contactAddress },
        {
          key: "social_links",
          value: {
            facebook: settings.facebook,
            instagram: settings.instagram,
          },
        },
      ],
      { onConflict: "key" },
    );
    setSaving(false);

    if (saveError) {
      toast.error(saveError.message);
      return;
    }

    toast.success("Οι ρυθμίσεις αποθηκεύτηκαν.");
  }

  const websiteUrl = getWebsiteUrl();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Ρυθμίσεις Site"
        subtitle="Εμφάνιση τιμών, λειτουργία συντήρησης και στοιχεία επικοινωνίας στο kartex.gr."
        action={
          <Button asChild variant="outline">
            <a href={websiteUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Προεπισκόπηση
            </a>
          </Button>
        }
      />

      {error ? <DataError message={error} onRetry={() => setFetchKey((k) => k + 1)} /> : null}

      {loading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <>
          <Card className="border-gray-200/80 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg text-navy-900">Γενικά</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-navy-900">Εμφάνιση τιμών</p>
                  <p className="text-sm text-gray-400">
                    Εμφάνιση τιμών στον κατάλογο προϊόντων του website.
                  </p>
                </div>
                <ActiveToggle
                  active={settings.showPrices}
                  onClick={() => updateSetting("showPrices", !settings.showPrices)}
                  label="Εμφάνιση τιμών"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-navy-900">Λειτουργία συντήρησης</p>
                  <p className="text-sm text-gray-400">
                    Απόκρυψη του website και εμφάνιση σελίδας συντήρησης.
                  </p>
                </div>
                <ActiveToggle
                  active={settings.maintenanceMode}
                  onClick={() =>
                    updateSetting("maintenanceMode", !settings.maintenanceMode)
                  }
                  label="Λειτουργία συντήρησης"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg text-navy-900">Επικοινωνία</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(event) =>
                    updateSetting("contactEmail", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Τηλέφωνο</Label>
                <Input
                  id="contact-phone"
                  value={settings.contactPhone}
                  onChange={(event) =>
                    updateSetting("contactPhone", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-address">Διεύθυνση</Label>
                <Input
                  id="contact-address"
                  value={settings.contactAddress}
                  onChange={(event) =>
                    updateSetting("contactAddress", event.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg text-navy-900">Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={settings.facebook}
                  onChange={(event) => updateSetting("facebook", event.target.value)}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={settings.instagram}
                  onChange={(event) => updateSetting("instagram", event.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="button"
            className={premiumGoldButton}
            disabled={saving}
            onClick={() => void saveAll()}
          >
            Αποθήκευση όλων
          </Button>
        </>
      )}
    </div>
  );
}
