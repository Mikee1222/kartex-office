import type { SupabaseClient } from "@supabase/supabase-js";

import { OrderStatus } from "@/components/orders/types";
import { getAthensDateString, isIsoInAthensMonth, isIsoOnAthensDay } from "@/lib/datetime";
import { submitZReport } from "@/lib/mydata/mydata-service";
import { issueReport, updateMydataStatus } from "@/lib/z-report/z-report-service";
import { assignDriverToOrder } from "@/lib/orders/assign-driver-to-order";
import {
  appendStatusHistory,
  type StatusHistoryEntry,
} from "@/lib/orders/status-timeline";
import { addOrderToTrip, createDeliveryTrip } from "@/lib/trips/trip-mutations";
import type { ToolName } from "@/lib/ai/tools";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadDriversWithVehicles } from "@/lib/users/load-drivers-with-vehicles";
import type { DbCustomerType } from "@/types/database";

export type ToolExecutorContext = {
  supabase: SupabaseClient;
  userId: string;
  userEmail: string;
};

function normalizeCustomerDbType(type?: string): DbCustomerType {
  const raw = (type ?? "walk-in").toLowerCase().trim();
  if (raw === "hospital" || raw === "νοσοκομείο" || raw === "νοσοκομεια") {
    return "hospital";
  }
  if (raw === "hotel" || raw === "ξενοδοχείο" || raw === "ξενοδοχειο") {
    return "hotel";
  }
  return "walk-in";
}

function periodStart(period?: string): string | null {
  const today = getAthensDateString();
  switch (period) {
    case "today":
      return today;
    case "week": {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return getAthensDateString(d);
    }
    case "month": {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return getAthensDateString(d);
    }
    case "year": {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return getAthensDateString(d);
    }
    default:
      return null;
  }
}

function filterByPeriod<T extends { created_at?: string }>(
  rows: T[],
  period?: string,
): T[] {
  if (!period || period === "year") {
    const start = periodStart("year");
    if (!start) return rows;
    return rows.filter((row) => (row.created_at ?? "") >= `${start}T00:00:00`);
  }
  if (period === "today") {
    return rows.filter((row) => isIsoOnAthensDay(row.created_at ?? ""));
  }
  if (period === "month") {
    return rows.filter((row) => isIsoInAthensMonth(row.created_at ?? ""));
  }
  if (period === "week") {
    const start = periodStart("week");
    return rows.filter((row) => (row.created_at ?? "") >= `${start}T00:00:00`);
  }
  return rows;
}

export async function executeTool(
  toolName: ToolName,
  input: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<string> {
  const admin = createAdminClient();

  switch (toolName) {
    case "get_orders": {
      const limit = Math.min(Number(input.limit) || 10, 50);
      let query = ctx.supabase
        .from("orders")
        .select(
          `
          *,
          customers ( name, phone, type, city ),
          order_items ( quantity, unit_price, products ( name, sku ) )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (input.status) {
        query = query.eq("status", String(input.status));
      }
      if (input.order_number) {
        query = query.ilike("order_number", `%${String(input.order_number)}%`);
      }

      const { data, error } = await query;
      if (error) return `Σφάλμα: ${error.message}`;

      let rows = data ?? [];
      if (input.customer_name) {
        const needle = String(input.customer_name).toLowerCase();
        rows = rows.filter((row) => {
          const customer = row.customers;
          const name = Array.isArray(customer)
            ? customer[0]?.name
            : customer?.name;
          return name?.toLowerCase().includes(needle);
        });
      }

      return JSON.stringify(rows);
    }

    case "update_order_status": {
      const orderId = String(input.order_id);
      const newStatus = String(input.status);

      const { data: order, error: fetchError } = await admin
        .from("orders")
        .select("id, status_history")
        .eq("id", orderId)
        .maybeSingle();

      if (fetchError || !order) {
        return `Σφάλμα: ${fetchError?.message ?? "Δεν βρέθηκε η παραγγελία."}`;
      }

      const history = (order.status_history as StatusHistoryEntry[] | null) ?? [];
      const nextHistory = appendStatusHistory(
        history,
        newStatus as (typeof OrderStatus)[keyof typeof OrderStatus],
        ctx.userEmail,
      );

      const { error } = await admin
        .from("orders")
        .update({
          status: newStatus,
          status_history: nextHistory,
          internal_notes: input.notes ? String(input.notes) : undefined,
        })
        .eq("id", orderId);

      if (error) return `Σφάλμα: ${error.message}`;
      return `Η κατάσταση άλλαξε σε «${newStatus}» επιτυχώς.`;
    }

    case "assign_driver_to_order": {
      const orderId = String(input.order_id);
      const driverId = String(input.driver_id);

      const { data: order, error: orderError } = await admin
        .from("orders")
        .select(
          "id, status_history, boxes_count, delivery_date, assigned_driver_name",
        )
        .eq("id", orderId)
        .maybeSingle();

      if (orderError || !order) {
        return `Σφάλμα: ${orderError?.message ?? "Δεν βρέθηκε η παραγγελία."}`;
      }

      const { drivers, error: driversError } = await loadDriversWithVehicles();
      if (driversError) {
        return `Σφάλμα: ${driversError}`;
      }

      const driver = drivers.find((d) => d.id === driverId);
      if (!driver) {
        return "Σφάλμα: Δεν βρέθηκε ο οδηγός.";
      }

      const vehicleId =
        input.vehicle_id != null
          ? String(input.vehicle_id)
          : driver.vehicleId;

      const result = await assignDriverToOrder({
        orderId,
        driverId,
        driverName: driver.name,
        vehicleId,
        deliveryDate: input.delivery_date
          ? String(input.delivery_date)
          : order.delivery_date,
        orderBoxes: order.boxes_count ?? 0,
        statusHistory: (order.status_history as StatusHistoryEntry[] | null) ?? [],
        changedByEmail: ctx.userEmail,
      });

      if (result.error) return `Σφάλμα: ${result.error}`;
      const tripNote =
        result.tripNumber != null ? ` (δρομολόγιο #${result.tripNumber}` : "";
      const stopNote =
        result.deliverySequence != null
          ? `, στάση #${result.deliverySequence})`
          : tripNote
            ? ")"
            : "";
      const warningNote = result.warning ? ` Προειδοποίηση: ${result.warning}` : "";
      return `Ο οδηγός «${driver.name}» ανατέθηκε επιτυχώς${tripNote}${stopNote}.${warningNote}`;
    }

    case "create_delivery_trip": {
      const driverId = String(input.driver_id);
      const vehicleId = String(input.vehicle_id);
      const tripDate = String(input.trip_date);

      const { drivers, error: driversError } = await loadDriversWithVehicles();
      if (driversError) {
        return `Σφάλμα: ${driversError}`;
      }

      const driver = drivers.find((d) => d.id === driverId);
      if (!driver) {
        return "Σφάλμα: Δεν βρέθηκε ο οδηγός.";
      }

      const { id, tripNumber, error } = await createDeliveryTrip({
        driverId,
        driverName: driver.name,
        vehicleId,
        tripDate,
      });

      if (error || !id) {
        return `Σφάλμα: ${error ?? "Αποτυχία δημιουργίας δρομολογίου."}`;
      }

      const orderIds = Array.isArray(input.order_ids)
        ? (input.order_ids as string[])
        : [];

      const errors: string[] = [];
      for (const orderId of orderIds) {
        const { error: addError } = await addOrderToTrip({
          tripId: id,
          orderId,
          changedByEmail: ctx.userEmail,
        });
        if (addError) errors.push(`${orderId}: ${addError}`);
      }

      if (errors.length > 0) {
        return `Δρομολόγιο #${tripNumber} δημιουργήθηκε, αλλά: ${errors.join("; ")}`;
      }

      return `Δρομολόγιο #${tripNumber} δημιουργήθηκε επιτυχώς (id: ${id}).`;
    }

    case "create_customer": {
      const { error } = await ctx.supabase.from("customers").insert({
        name: String(input.name),
        type: normalizeCustomerDbType(
          input.type != null ? String(input.type) : undefined,
        ),
        phone: input.phone ? String(input.phone) : null,
        email: input.email ? String(input.email) : null,
        address: input.address ? String(input.address) : null,
        city: input.city ? String(input.city) : null,
        payment_terms: input.payment_terms ? String(input.payment_terms) : null,
      });

      if (error) return `Σφάλμα: ${error.message}`;
      return `Ο πελάτης «${String(input.name)}» δημιουργήθηκε επιτυχώς.`;
    }

    case "update_stock": {
      const productId = String(input.product_id);
      const delta = Number(input.quantity);
      if (!Number.isFinite(delta) || delta === 0) {
        return "Σφάλμα: Η ποσότητα πρέπει να είναι μη μηδενική.";
      }

      const { data: product, error: fetchError } = await admin
        .from("products")
        .select("stock, name")
        .eq("id", productId)
        .maybeSingle();

      if (fetchError || !product) {
        return `Σφάλμα: ${fetchError?.message ?? "Δεν βρέθηκε το προϊόν."}`;
      }

      const previous = Number(product.stock ?? 0);
      const newStock = previous + delta;

      const { error: updateError } = await admin
        .from("products")
        .update({ stock: newStock })
        .eq("id", productId);

      if (updateError) return `Σφάλμα: ${updateError.message}`;

      await admin.from("inventory_movements").insert({
        product_id: productId,
        type: delta > 0 ? "in" : "out",
        quantity: Math.abs(delta),
        reason: input.reason
          ? String(input.reason)
          : "Ενημέρωση από Dolphin AI",
        created_by: ctx.userId,
      });

      return `Απόθεμα «${product.name}»: ${previous} → ${newStock} τεμ.`;
    }

    case "get_report": {
      const reportType = String(input.type ?? "orders");
      const period = input.period != null ? String(input.period) : "month";

      if (reportType === "inventory") {
        const { data, error } = await ctx.supabase
          .from("products")
          .select("id, name, sku, stock, min_stock")
          .order("stock", { ascending: true })
          .limit(200);

        if (error) return `Σφάλμα: ${error.message}`;

        const low = (data ?? []).filter((row) => {
          const stock = Number(row.stock ?? 0);
          const minStock = Number(row.min_stock ?? 0);
          return stock < 10 || stock <= minStock;
        });

        return JSON.stringify({ type: reportType, items: low });
      }

      const { data: orders, error: ordersError } = await ctx.supabase
        .from("orders")
        .select("id, order_number, status, total, created_at, customer_id");

      if (ordersError) return `Σφάλμα: ${ordersError.message}`;

      const filtered = filterByPeriod(orders ?? [], period);

      if (reportType === "revenue") {
        const completed = filtered.filter(
          (o) => o.status === OrderStatus.Completed,
        );
        const total = completed.reduce(
          (sum, o) => sum + Number(o.total ?? 0),
          0,
        );
        return JSON.stringify({
          type: reportType,
          period,
          orderCount: completed.length,
          totalRevenue: total,
        });
      }

      if (reportType === "orders") {
        const byStatus: Record<string, number> = {};
        for (const row of filtered) {
          byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
        }
        return JSON.stringify({
          type: reportType,
          period,
          total: filtered.length,
          byStatus,
        });
      }

      if (reportType === "customers") {
        const { data: customers, error } = await ctx.supabase
          .from("customers")
          .select("id, name, type, city");

        if (error) return `Σφάλμα: ${error.message}`;

        const counts: Record<string, number> = {};
        for (const order of filtered) {
          counts[order.customer_id] = (counts[order.customer_id] ?? 0) + 1;
        }

        const top = (customers ?? [])
          .map((c) => ({
            ...c,
            orderCount: counts[c.id] ?? 0,
          }))
          .sort((a, b) => b.orderCount - a.orderCount)
          .slice(0, 10);

        return JSON.stringify({ type: reportType, period, topCustomers: top });
      }

      if (reportType === "margins") {
        const { data: items, error } = await ctx.supabase
          .from("order_items")
          .select(
            "quantity, unit_price, products ( purchase_price, sale_price, name )",
          )
          .limit(500);

        if (error) return `Σφάλμα: ${error.message}`;

        let revenue = 0;
        let cost = 0;
        for (const item of items ?? []) {
          const qty = Number(item.quantity ?? 0);
          const unit = Number(item.unit_price ?? 0);
          const product = Array.isArray(item.products)
            ? item.products[0]
            : item.products;
          const purchase = Number(product?.purchase_price ?? 0);
          revenue += qty * unit;
          cost += qty * purchase;
        }

        return JSON.stringify({
          type: reportType,
          revenue,
          cost,
          margin: revenue - cost,
          marginPct: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
        });
      }

      return JSON.stringify({ type: reportType, period, note: "Άγνωστος τύπος αναφοράς" });
    }

    case "generate_invoice_pdf": {
      const orderId = String(input.order_id);
      const path = `/api/orders/${orderId}/pdf`;
      if (input.send_email) {
        return JSON.stringify({
          pdfUrl: path,
          note: "Η αποστολή email δεν είναι ρυθμισμένη — μόνο σύνδεσμος PDF.",
        });
      }
      return `PDF τιμολόγιο: ${path}`;
    }

    case "search_customer": {
      const query = String(input.query);
      const { data, error } = await ctx.supabase
        .from("customers")
        .select("*")
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      if (error) return `Σφάλμα: ${error.message}`;
      return JSON.stringify(data ?? []);
    }

    case "get_weather": {
      try {
        const res = await fetch(
          `https://wttr.in/${encodeURIComponent(String(input.city))}?format=3`,
        );
        const text = await res.text();
        return text.trim() || "Δεν βρέθηκαν δεδομένα καιρού.";
      } catch {
        return "Σφάλμα: Αποτυχία λήψης καιρού.";
      }
    }

    case "send_email": {
      if (!process.env.SMTP_HOST && !process.env.RESEND_API_KEY) {
        return JSON.stringify({
          success: false,
          message:
            "Η αποστολή email δεν έχει ρυθμιστεί ακόμα στο σύστημα. Το κείμενο ετοιμάστηκε αλλά δεν στάλθηκε.",
          draft: {
            to: input.to,
            subject: input.subject,
            body: input.body,
          },
        });
      }
      return JSON.stringify({
        success: true,
        message: `Email προς ${String(input.to)} (stub — ρύθμισε SMTP/Resend).`,
      });
    }

    case "create_order": {
      const customerId = String(input.customer_id);
      const items = Array.isArray(input.items)
        ? (input.items as { product_id?: string; quantity?: number; unit_price?: number }[])
        : [];

      let total = 0;
      for (const item of items) {
        total += Number(item.quantity ?? 0) * Number(item.unit_price ?? 0);
      }

      const { data: order, error: orderError } = await ctx.supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          status: OrderStatus.Processing,
          total,
          delivery_date: input.delivery_date ? String(input.delivery_date) : null,
          notes: input.notes ? String(input.notes) : null,
          payment_terms: input.payment_terms ? String(input.payment_terms) : null,
          created_by: ctx.userId,
        })
        .select("id, order_number")
        .single();

      if (orderError || !order) {
        return `Σφάλμα: ${orderError?.message ?? "Αποτυχία δημιουργίας παραγγελίας."}`;
      }

      if (items.length > 0) {
        const { error: itemsError } = await ctx.supabase.from("order_items").insert(
          items.map((item) => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity ?? 1,
            unit_price: item.unit_price ?? 0,
            total: Number(item.quantity ?? 0) * Number(item.unit_price ?? 0),
          })),
        );

        if (itemsError) {
          return `Παραγγελία ${order.order_number} δημιουργήθηκε, αλλά γραμμές: ${itemsError.message}`;
        }
      }

      return `Παραγγελία δημιουργήθηκε: ${order.order_number}`;
    }

    case "generate_z_report": {
      const reportDate =
        input.report_date != null
          ? String(input.report_date)
          : getAthensDateString();

      try {
        const report = await issueReport(ctx.supabase, {
          reportDate,
          userId: ctx.userId,
        });
        return JSON.stringify({
          success: true,
          reportDate: report.reportDate,
          totalOrders: report.totalOrders,
          totalRevenue: report.totalRevenue,
          totalVat: report.totalVat,
          netAmount: report.netAmount,
          pdfUrl: `/api/z-report/${reportDate}/pdf`,
          issuedAt: report.issuedAt,
        });
      } catch (err) {
        return `Σφάλμα έκδοσης Ζ: ${err instanceof Error ? err.message : "άγνωστο"}`;
      }
    }

    case "submit_to_mydata": {
      const reportDate =
        input.report_date != null
          ? String(input.report_date)
          : getAthensDateString();

      try {
        let report = await issueReport(ctx.supabase, {
          reportDate,
          userId: ctx.userId,
        });

        const result = await submitZReport(report);

        if (!result.success) {
          await updateMydataStatus(ctx.supabase, reportDate, {
            mydata_status: "error",
            mydata_error: result.error,
            mydata_submitted_at: new Date().toISOString(),
          });
          return `Σφάλμα myDATA: ${result.error}`;
        }

        report = await updateMydataStatus(ctx.supabase, reportDate, {
          mydata_status: "submitted",
          mydata_mark: result.mark,
          mydata_submitted_at: new Date().toISOString(),
          mydata_error: null,
        });

        return JSON.stringify({
          success: true,
          reportDate,
          mark: result.mark,
          mydataStatus: report.mydataStatus,
        });
      } catch (err) {
        return `Σφάλμα υποβολής myDATA: ${err instanceof Error ? err.message : "άγνωστο"}`;
      }
    }

    default:
      return "Άγνωστο εργαλείο.";
  }
}
