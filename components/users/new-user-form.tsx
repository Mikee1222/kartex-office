"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { USER_ROLE_KEYS, USER_ROLE_LABELS } from "@/lib/users/roles";
import { cn } from "@/lib/utils";
import {
  premiumFormCard,
  premiumFormGrid,
  premiumFormShell,
  premiumGoldButton,
  premiumInputFocus,
  premiumLabel,
} from "@/lib/ui/premium-styles";
import { premiumSelect, premiumTextarea } from "@/lib/ui/form-styles";

export function NewUserForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<string>(USER_ROLE_KEYS[1]);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      setError(body.error || "Αποτυχία δημιουργίας χρήστη.");
      setPending(false);
      return;
    }

    router.push("/users");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-kartex-navy"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Χρήστες
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight text-kartex-navy">
        Νέος Χρήστης
      </h1>

      <Card className="premiumFormCard">
        <CardHeader>
          <CardTitle className="text-lg text-kartex-navy">Στοιχεία σύνδεσης</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error ? (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <fieldset disabled={pending} className="space-y-4">
              <div className="space-y-2">
                <Label className={premiumLabel} htmlFor="user-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label className={premiumLabel} htmlFor="user-password">
                  Κωδικός <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label className={premiumLabel} htmlFor="user-role">Ρόλος</Label>
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={premiumSelect}
                >
                  {USER_ROLE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {USER_ROLE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" disabled={pending} asChild>
                <Link href="/users">Ακύρωση</Link>
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className={cn(premiumGoldButton, "min-w-[120px]")}
              >
                {pending ? "Δημιουργία…" : "Δημιουργία"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
