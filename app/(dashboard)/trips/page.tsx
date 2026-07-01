"use client";

import { Suspense } from "react";

import { TripsPage } from "@/components/trips/trips-page";
import { Skeleton } from "@/components/ui/skeleton";

export default function TripsRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <TripsPage />
    </Suspense>
  );
}
