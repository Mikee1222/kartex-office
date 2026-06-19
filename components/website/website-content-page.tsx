"use client";

import { ExternalLink } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { DataError } from "@/components/dashboard/data-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { premiumTextarea } from "@/lib/ui/form-styles";
import {
  CONTENT_KEY_LABELS,
  CONTENT_KEYS,
  CONTENT_LOCALES,
  type ContentKey,
  type ContentLocale,
  type WebContentRow,
} from "@/lib/website/types";
import { getWebsiteUrl } from "@/lib/website/site-url";
import { premiumGoldButton } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";

type ContentDraft = Record<
  ContentKey,
  Record<ContentLocale, { title: string; body: string }>
>;

function emptyDraft(): ContentDraft {
  return CONTENT_KEYS.reduce((acc, key) => {
    acc[key] = {
      el: { title: "", body: "" },
      en: { title: "", body: "" },
    };
    return acc;
  }, {} as ContentDraft);
}

function draftFromRows(rows: WebContentRow[]): ContentDraft {
  const draft = emptyDraft();
  for (const row of rows) {
    const key = row.key as ContentKey;
    const locale = row.locale as ContentLocale;
    if (!CONTENT_KEYS.includes(key) || !CONTENT_LOCALES.includes(locale)) {
      continue;
    }
    draft[key][locale] = {
      title: row.title ?? "",
      body: row.body ?? "",
    };
  }
  return draft;
}

export function WebsiteContentPage() {
  const [draft, setDraft] = React.useState<ContentDraft>(emptyDraft);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingKey, setSavingKey] = React.useState<ContentKey | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("web_content")
      .select("id, key, locale, title, body, metadata")
      .in("key", [...CONTENT_KEYS]);

    if (fetchError) {
      setError(fetchError.message);
      setDraft(emptyDraft());
    } else {
      setDraft(draftFromRows((data as WebContentRow[]) ?? []));
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, fetchKey]);

  function updateField(
    key: ContentKey,
    locale: ContentLocale,
    field: "title" | "body",
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [locale]: {
          ...current[key][locale],
          [field]: value,
        },
      },
    }));
  }

  async function saveSection(key: ContentKey) {
    setSavingKey(key);
    const supabase = createClient();
    const rows = CONTENT_LOCALES.map((locale) => ({
      key,
      locale,
      title: draft[key][locale].title,
      body: draft[key][locale].body,
    }));

    const { error: saveError } = await supabase.from("web_content").upsert(rows);
    setSavingKey(null);

    if (saveError) {
      toast.error(saveError.message);
      return;
    }

    toast.success(`Αποθηκεύτηκε: ${CONTENT_KEY_LABELS[key]}`);
  }

  const websiteUrl = getWebsiteUrl();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Περιεχόμενο Website"
        subtitle="Επεξεργασία κειμένων hero, σχετικά και επικοινωνίας για ελληνικά και αγγλικά."
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
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        CONTENT_KEYS.map((key) => (
          <Card key={key} className="border-gray-200/80 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg text-navy-900">
                {CONTENT_KEY_LABELS[key]}
              </CardTitle>
              <Button
                type="button"
                className={premiumGoldButton}
                disabled={savingKey === key}
                onClick={() => void saveSection(key)}
              >
                Αποθήκευση
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {CONTENT_LOCALES.map((locale) => (
                <div
                  key={`${key}-${locale}`}
                  className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {locale === "el" ? "Ελληνικά" : "English"}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor={`${key}-${locale}-title`}>Τίτλος</Label>
                    <Input
                      id={`${key}-${locale}-title`}
                      value={draft[key][locale].title}
                      onChange={(event) =>
                        updateField(key, locale, "title", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${key}-${locale}-body`}>Κείμενο</Label>
                    <textarea
                      id={`${key}-${locale}-body`}
                      value={draft[key][locale].body}
                      onChange={(event) =>
                        updateField(key, locale, "body", event.target.value)
                      }
                      rows={key === "about_body" || key === "contact_info" ? 6 : 3}
                      className={premiumTextarea}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
