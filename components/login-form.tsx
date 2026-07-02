"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  premiumGoldButton,
  premiumLabel,
  premiumUnderlineInput,
} from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const forbidden = searchParams.get("error") === "forbidden";

  const [error, setError] = React.useState<string | null>(
    forbidden ? "Δεν έχετε πρόσβαση στο Kartex Office" : null,
  );
  const [pending, setPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Συμπληρώστε email και κωδικό.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError("Λάθος στοιχεία σύνδεσης ή πρόβλημα δικτύου. Δοκιμάστε ξανά.");
      setPending(false);
      return;
    }

    router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard");
    router.refresh();
  }

  return (
    <form
      action={(fd) => void handleSubmit(fd)}
      className="login-animate-stagger space-y-6"
    >
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email" className={premiumLabel}>
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            placeholder="name@company.gr"
            className={premiumUnderlineInput}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password" className={premiumLabel}>
            Κωδικός
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={pending}
              className={cn(premiumUnderlineInput, "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-navy-900"
              aria-label={showPassword ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className={cn("h-12 w-full rounded-lg", premiumGoldButton)}
        disabled={pending}
      >
        {pending ? "Σύνδεση…" : "Σύνδεση"}
      </Button>

      {error ? (
        <p
          className="rounded-full border border-danger/20 bg-danger/10 px-4 py-2 text-center text-sm font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
