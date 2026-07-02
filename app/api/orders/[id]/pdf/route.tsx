import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

import {
  mapSupabaseOrderToPdf,
  ORDER_DETAIL_SELECT,
  type OrderDetailQueryRow,
} from "@/components/orders/map-order-detail";
import { createOrderPdfDocument } from "@/components/orders/order-pdf";
import { buildPortalOrderTrackingUrl } from "@/lib/orders/pdf-portal-url";
import {
  formatBankAccountsForDocument,
  parseBankAccountsFromSettingsRows,
} from "@/lib/website/bank-accounts";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function safePdfFilename(orderNumber: string) {
  const base = orderNumber.trim() || "order";
  const safe = base.replace(/[^\w.-]+/g, "_");
  return `${safe}.pdf`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [orderResult, settingsResult] = await Promise.all([
    supabase.from("orders").select(ORDER_DETAIL_SELECT).eq("id", id).single(),
    supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "bank_accounts",
        "bank_iban",
        "bank_name",
        "bank_beneficiary",
      ]),
  ]);

  const order = orderResult.data;
  const error = orderResult.error;

  if (error || !order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bankAccounts = parseBankAccountsFromSettingsRows(settingsResult.data ?? []);
  const bankLines = formatBankAccountsForDocument(bankAccounts);

  const pdfData = mapSupabaseOrderToPdf(
    order as OrderDetailQueryRow,
    bankLines,
  );
  const portalTrackingUrl = buildPortalOrderTrackingUrl(id);
  pdfData.portalTrackingUrl = portalTrackingUrl;
  pdfData.qrDataUrl = await QRCode.toDataURL(portalTrackingUrl, {
    width: 200,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const buffer = await renderToBuffer(createOrderPdfDocument(pdfData));

  const filename = safePdfFilename(pdfData.orderNumber);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
