import type { ZReport } from "@/lib/z-report/types";

const COMPANY_VAT = "093781188";
const COMPANY_NAME = "KARTEX - Ν. ΚΑΡΑΛΗΣ & ΣΙΑ Ε.Ε.";

export type MydataConfig = {
  apiKey: string;
  userId: string;
  apiUrl: string;
};

export function getMydataConfigFromEnv(): MydataConfig | null {
  const apiKey = process.env.MYDATA_API_KEY?.trim();
  const userId = process.env.MYDATA_USER_ID?.trim();
  const apiUrl =
    process.env.MYDATA_API_URL?.trim() ||
    "https://mydatapi.aade.gr/myDATA/SendInvoices";

  if (!apiKey || !userId) return null;

  return { apiKey, userId, apiUrl };
}

export function buildZReportXML(report: ZReport): string {
  const issueDate = report.reportDate;
  const categories = report.categoryBreakdown
    .map(
      (c) => `
    <IncomeClassification>
      <icls:classificationType>E3_561_001</icls:classificationType>
      <icls:classificationCategory>category1_1</icls:classificationCategory>
      <icls:amount>${c.net.toFixed(2)}</icls:amount>
      <icls:id>1</icls:id>
    </IncomeClassification>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<InvoicesDoc xmlns="http://www.aade.gr/myDATA/invoice/v1.0"
  xmlns:icls="https://www.aade.gr/myDATA/incomeClassificaton/v1.0"
  xmlns:ecls="https://www.aade.gr/myDATA/expensesClassificaton/v1.0">
  <invoice>
    <issuer>
      <vatNumber>${COMPANY_VAT}</vatNumber>
      <country>GR</country>
      <branch>0</branch>
    </issuer>
    <invoiceHeader>
      <series>Z</series>
      <aa>${issueDate.replace(/-/g, "")}</aa>
      <issueDate>${issueDate}</issueDate>
      <invoiceType>11.1</invoiceType>
      <currency>EUR</currency>
    </invoiceHeader>
    <invoiceSummary>
      <totalNetValue>${report.netAmount.toFixed(2)}</totalNetValue>
      <totalVatAmount>${report.totalVat.toFixed(2)}</totalVatAmount>
      <totalGrossValue>${report.totalRevenue.toFixed(2)}</totalGrossValue>
      ${categories}
    </invoiceSummary>
    <metadata>
      <companyName>${escapeXml(COMPANY_NAME)}</companyName>
      <reportType>DailyZ</reportType>
      <totalOrders>${report.totalOrders}</totalOrders>
      <cancelledOrders>${report.cancelledOrders}</cancelledOrders>
    </metadata>
  </invoice>
</InvoicesDoc>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Stub: parse MARK from myDATA response XML. */
export function extractMark(responseText: string): string | null {
  const match =
    responseText.match(/<mark[^>]*>([^<]+)<\/mark>/i) ??
    responseText.match(/<invoiceMark>([^<]+)<\/invoiceMark>/i) ??
    responseText.match(/"mark"\s*:\s*"([^"]+)"/i);
  return match?.[1]?.trim() ?? null;
}

export async function testConnection(config?: MydataConfig): Promise<{
  ok: boolean;
  message: string;
}> {
  const cfg = config ?? getMydataConfigFromEnv();
  if (!cfg) {
    return {
      ok: false,
      message: "Λείπουν MYDATA_API_KEY ή MYDATA_USER_ID στο .env.local",
    };
  }

  try {
    const res = await fetch(cfg.apiUrl, {
      method: "GET",
      headers: {
        "ocp-apim-subscription-key": cfg.apiKey,
        "aade-user-id": cfg.userId,
      },
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "Μη έγκυρα διαπιστευτήρια myDATA." };
    }

    return {
      ok: true,
      message: `Σύνδεση OK (HTTP ${res.status}). Η υποβολή Ζ απαιτεί ενεργό API key από ΑΑΔΕ.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Άγνωστο σφάλμα";
    return { ok: false, message: `Αποτυχία σύνδεσης: ${msg}` };
  }
}

export type SubmitZReportResult = {
  success: boolean;
  mark: string | null;
  error: string | null;
  rawResponse?: string;
};

export async function submitZReport(
  report: ZReport,
  config?: MydataConfig,
): Promise<SubmitZReportResult> {
  const cfg = config ?? getMydataConfigFromEnv();
  if (!cfg) {
    return {
      success: false,
      mark: null,
      error: "Λείπουν ρυθμίσεις myDATA (MYDATA_API_KEY, MYDATA_USER_ID).",
    };
  }

  const xml = buildZReportXML(report);

  try {
    const res = await fetch(cfg.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        "ocp-apim-subscription-key": cfg.apiKey,
        "aade-user-id": cfg.userId,
      },
      body: xml,
    });

    const rawResponse = await res.text();

    if (!res.ok) {
      return {
        success: false,
        mark: null,
        error: `myDATA HTTP ${res.status}: ${rawResponse.slice(0, 500)}`,
        rawResponse,
      };
    }

    const mark = extractMark(rawResponse) ?? `STUB-${report.reportDate}`;

    return {
      success: true,
      mark,
      error: null,
      rawResponse,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Άγνωστο σφάλμα";
    return {
      success: false,
      mark: null,
      error: msg,
    };
  }
}
