import { Suspense } from "react";

import { ScheduleView } from "@/components/schedule/schedule-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function SchedulePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
      <ScheduleView />
    </Suspense>
  );
}
