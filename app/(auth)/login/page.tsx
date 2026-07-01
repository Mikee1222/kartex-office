import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";

import { LoginForm } from "@/components/login-form";

function LoginFallback() {
  return (
    <div
      className="mx-auto w-full max-w-sm text-center text-sm text-gray-400"
      aria-busy="true"
    >
      Φόρτωση φόρμας σύνδεσης…
    </div>
  );
}

const featurePills = [
  { label: "Παραγγελίες" },
  { label: "Αποθήκη" },
  { label: "Παραδόσεις" },
] as const;

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <aside className="login-animate-brand relative flex min-h-[42vh] w-full flex-col justify-between overflow-hidden px-8 py-10 text-white lg:min-h-screen lg:w-[45%] lg:py-14">
        <div className="login-panel-gradient pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="premium-grid-pattern pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-gold-500/5 via-transparent to-transparent"
          aria-hidden
        />

        <div className="relative z-10 flex flex-1 flex-col justify-center gap-10">
          <div>
            <p className="text-[48px] font-semibold tracking-[0.25em] text-gold-500">
              KARTEX
            </p>
            <p className="mt-2 text-xs font-medium tracking-[0.35em] text-gold-500/40">
              EST. 1982
            </p>
            <div className="my-6 h-px w-16 bg-gold-500/20" aria-hidden />
            <p className="max-w-sm text-lg italic leading-relaxed text-white/70">
              Διαχείριση επιχείρησης με κομψότητα
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {featurePills.map((pill) => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm"
              >
                <CheckCircle2 className="size-4 shrink-0 text-gold-400" aria-hidden />
                {pill.label}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[10px] text-white/20">
          Kartex Office v1.0
        </p>
      </aside>

      <main className="login-animate-form flex flex-1 flex-col justify-center bg-white px-6 py-12 sm:px-12 lg:w-[55%] lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-[32px] font-semibold tracking-tight text-navy-900">
              Καλώς ήρθατε
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Συνδεθείτε στο Kartex Office
            </p>
            <div className="mt-6 h-px bg-gray-100" />
          </div>
          <Suspense fallback={<LoginFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
