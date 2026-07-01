"use client";

import * as React from "react";

import { handleOrderRealtimeUpdate } from "@/lib/orders/handle-order-realtime-update";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to all order updates for office-wide realtime sync.
 * Mount once inside the dashboard shell.
 */
export function GlobalOrdersRealtime() {
  React.useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("all-orders-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          handleOrderRealtimeUpdate(
            payload.new as Record<string, unknown>,
            payload.old as Record<string, unknown>,
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
