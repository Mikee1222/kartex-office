"use client";

import * as React from "react";

import { useNotificationsStore } from "@/lib/notifications-store";
import { createClient } from "@/lib/supabase/client";

/**
 * Keeps sidebar pending-quote badge count in sync with the database.
 */
export function PendingQuotesSync() {
  const setPendingQuotesCount = useNotificationsStore(
    (state) => state.setPendingQuotesCount,
  );
  const quotesVersion = useNotificationsStore((state) => state.quotesVersion);

  const refreshCount = React.useCallback(async () => {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if (!error && count != null) {
      setPendingQuotesCount(count);
    }
  }, [setPendingQuotesCount]);

  React.useEffect(() => {
    void refreshCount();
  }, [refreshCount, quotesVersion]);

  React.useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("quote-requests-pending-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quote_requests",
        },
        () => {
          void refreshCount();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshCount]);

  return null;
}
