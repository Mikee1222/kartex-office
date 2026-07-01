"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Printer,
  Receipt,
  Send,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAthensDateString } from "@/lib/datetime";
import { buildZReportXML } from "@/lib/mydata/mydata-service";
import type { DailyZComputation, ZReport } from "@/lib/z-report/types";
import {
  premiumCard,
  premiumFilterTabActive,
  premiumFilterTabInactive,
  premiumGoldButton,
  premiumStatCard,
  premiumTableHead,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type TabId = "issue" | "history" | "mydata";

function formatEur(n: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function formatDateEl(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function MydataBadge({ status }: { status: ZReport["mydataStatus"] }) {
  if (status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
        <CheckCircle2 className="size-3" />
        Υποβλήθηκε
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        <AlertCircle className="size-3" />
        Σφάλμα
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
      <Clock className="size-3" />
      Εκκρεμεί
    </span>
  );
}

export function ZReportPage() {
  const [tab, setTab] = React.useState<TabId>("issue");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<ZReport | null>(null);
  const [computation, setComputation] = React.useState<DailyZComputation | null>(
    null,
  );
  const [issued, setIssued] = React.useState(false);
  const [history, setHistory] = React.useState<ZReport[]>([]);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [mydataModalOpen, setMydataModalOpen] = React.useState(false);
  const [mydataMessage, setMydataMessage] = React.useState<string | null>(null);
  const [manualDate, setManualDate] = React.useState(getAthensDateString());
  const [xmlPreview, setXmlPreview] = React.useState("");
  const [testResult, setTestResult] = React.useState<string | null>(null);

  const today = getAthensDateString();
  const summary = computation ?? (report ? reportToComputation(report) : null);

  const loadToday = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/z-report/today");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Σφάλμα φόρτωσης");
      setReport(data.report ?? null);
      setComputation(data.computation ?? null);
      setIssued(Boolean(data.issued));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Σφάλμα");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/z-report/history");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Σφάλμα");
      setHistory(data.reports ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Σφάλμα");
    }
  }, []);

  React.useEffect(() => {
    void loadToday();
  }, [loadToday]);

  React.useEffect(() => {
    if (tab === "history") void loadHistory();
  }, [tab, loadHistory]);

  const handleIssueAndPrint = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/z-report/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportDate: today }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Αποτυχία έκδοσης");
      setReport(data.report);
      setIssued(true);
      window.open(`/api/z-report/${today}/pdf`, "_blank");
      void loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Σφάλμα");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitMydata = async (date: string) => {
    setActionLoading(true);
    setMydataMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/z-report/submit-mydata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportDate: date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Αποτυχία υποβολής");
      setReport(data.report ?? report);
      setMydataMessage(
        data.mark
          ? `Υποβλήθηκε επιτυχώς. MARK: ${data.mark}`
          : (data.message ?? "Ολοκληρώθηκε."),
      );
      setMydataModalOpen(false);
      void loadToday();
      void loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Σφάλμα");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    setActionLoading(true);
    try {
      const res = await fetch("/api/mydata/test-connection", { method: "POST" });
      const data = await res.json();
      setTestResult(data.message ?? (data.ok ? "OK" : "Αποτυχία"));
    } catch {
      setTestResult("Αποτυχία δικτύου");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingMydata = history.filter(
    (r) => r.issuedAt && r.mydataStatus !== "submitted",
  );

  React.useEffect(() => {
    const source = report ?? (summary ? computationToZReport(summary) : null);
    if (source) setXmlPreview(buildZReportXML(source));
  }, [report, summary]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-semibold tracking-tight text-navy-900">
            <Receipt className="size-7 text-gold-500" aria-hidden />
            Ημερήσιο Ζ
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Ημερήσια κλείσιμο ταμειακής · myDATA ΑΑΔΕ
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "issue" as const, label: "Έκδοση Ζ" },
              { id: "history" as const, label: "Ιστορικό" },
              { id: "mydata" as const, label: "myDATA" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? premiumFilterTabActive : premiumFilterTabInactive}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {mydataMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {mydataMessage}
        </div>
      ) : null}

      {tab === "issue" ? (
        <IssueTab
          loading={loading}
          today={today}
          issued={issued}
          summary={summary}
          actionLoading={actionLoading}
          onIssuePrint={handleIssueAndPrint}
          onOpenMydataModal={() => setMydataModalOpen(true)}
        />
      ) : null}

      {tab === "history" ? (
        <HistoryTab
          history={history}
          actionLoading={actionLoading}
          onRefresh={() => void loadHistory()}
          onPrint={(date) => window.open(`/api/z-report/${date}/pdf`, "_blank")}
          onSubmit={(date) => void handleSubmitMydata(date)}
        />
      ) : null}

      {tab === "mydata" ? (
        <MydataTab
          report={report}
          pending={pendingMydata}
          manualDate={manualDate}
          onManualDateChange={setManualDate}
          xmlPreview={xmlPreview}
          testResult={testResult}
          actionLoading={actionLoading}
          onTestConnection={handleTestConnection}
          onSubmitManual={() => void handleSubmitMydata(manualDate)}
          onSubmitPending={(date) => void handleSubmitMydata(date)}
        />
      ) : null}

      <Dialog
        open={mydataModalOpen}
        onOpenChange={setMydataModalOpen}
        title="Αποστολή στο myDATA"
        description={`Θα εκδοθεί (αν χρειάζεται) και θα υποβληθεί το ημερήσιο Ζ για ${formatDateEl(today)}. Συνέχεια;`}
      >
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMydataModalOpen(false)}
            disabled={actionLoading}
          >
            Ακύρωση
          </Button>
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => void handleSubmitMydata(today)}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Υποβολή
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function IssueTab({
  loading,
  today,
  issued,
  summary,
  actionLoading,
  onIssuePrint,
  onOpenMydataModal,
}: {
  loading: boolean;
  today: string;
  issued: boolean;
  summary: DailyZComputation | null;
  actionLoading: boolean;
  onIssuePrint: () => void;
  onOpenMydataModal: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 p-6 text-white shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              Ημερήσιο Ζ
            </p>
            <p className="mt-1 text-2xl font-semibold">{formatDateEl(today)}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              issued
                ? "bg-emerald-500/20 text-emerald-200"
                : "bg-amber-500/20 text-amber-200",
            )}
          >
            {issued ? "Εκδόθηκε" : "Εκκρεμεί"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Συναλλαγές" value={String(summary.totalOrders)} />
        <StatCard label="Ακυρώσεις" value={String(summary.cancelledOrders)} />
        <StatCard label="Καθαρά" value={formatEur(summary.netAmount)} />
        <StatCard label="ΦΠΑ 24%" value={formatEur(summary.totalVat)} />
        <StatCard label="Σύνολο" value={formatEur(summary.totalRevenue)} highlight />
      </div>

      <BreakdownTables summary={summary} />

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className={premiumGoldButton}
          onClick={onIssuePrint}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Printer className="size-4" />
          )}
          Εκτύπωση Ζ
        </Button>
        <Button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={onOpenMydataModal}
          disabled={actionLoading}
        >
          <Send className="size-4" />
          Αποστολή myDATA
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={premiumStatCard}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-xl font-semibold",
          highlight ? "text-gold-500" : "text-navy-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function BreakdownTables({ summary }: { summary: DailyZComputation }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={premiumCard}>
        <h3 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-navy-900">
          Ανά κατηγορία
        </h3>
        <div className={premiumTableWrap}>
          <table className="w-full text-sm">
            <thead>
              <tr className={premiumTableHead}>
                <th className="px-4 py-3">Κατηγορία</th>
                <th className="px-4 py-3 text-right">Γραμμές</th>
                <th className="px-4 py-3 text-right">Σύνολο</th>
              </tr>
            </thead>
            <tbody>
              {summary.categoryBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    Δεν υπάρχουν γραμμές
                  </td>
                </tr>
              ) : (
                summary.categoryBreakdown.map((row) => (
                  <tr key={row.category} className={premiumTableRow}>
                    <td className="px-4">{row.category}</td>
                    <td className="px-4 text-right">{row.orderCount}</td>
                    <td className="px-4 text-right font-medium">
                      {formatEur(row.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={premiumCard}>
        <h3 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-navy-900">
          Ανά τύπο πελάτη
        </h3>
        <div className={premiumTableWrap}>
          <table className="w-full text-sm">
            <thead>
              <tr className={premiumTableHead}>
                <th className="px-4 py-3">Τύπος</th>
                <th className="px-4 py-3 text-right">Παραγγ.</th>
                <th className="px-4 py-3 text-right">Σύνολο</th>
              </tr>
            </thead>
            <tbody>
              {summary.customerTypeBreakdown.map((row) => (
                <tr key={row.type} className={premiumTableRow}>
                  <td className="px-4">{row.typeLabel}</td>
                  <td className="px-4 text-right">{row.orderCount}</td>
                  <td className="px-4 text-right font-medium">
                    {formatEur(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HistoryTab({
  history,
  actionLoading,
  onRefresh,
  onPrint,
  onSubmit,
}: {
  history: ZReport[];
  actionLoading: boolean;
  onRefresh: () => void;
  onPrint: (date: string) => void;
  onSubmit: (date: string) => void;
}) {
  return (
    <div className={premiumCard}>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-navy-900">Ιστορικό Ζ</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onRefresh}>
          Ανανέωση
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={premiumTableHead}>
              <th className="px-4 py-3">Ημερομηνία</th>
              <th className="px-4 py-3 text-right">Συναλλαγές</th>
              <th className="px-4 py-3 text-right">Σύνολο</th>
              <th className="px-4 py-3 text-right">ΦΠΑ</th>
              <th className="px-4 py-3">myDATA</th>
              <th className="px-4 py-3">MARK</th>
              <th className="px-4 py-3">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Δεν υπάρχουν εκδομένα Ζ
                </td>
              </tr>
            ) : (
              history.map((row) => (
                <tr key={row.id} className={premiumTableRow}>
                  <td className="px-4 font-medium">{formatDateEl(row.reportDate)}</td>
                  <td className="px-4 text-right">{row.totalOrders}</td>
                  <td className="px-4 text-right">{formatEur(row.totalRevenue)}</td>
                  <td className="px-4 text-right">{formatEur(row.totalVat)}</td>
                  <td className="px-4">
                    <MydataBadge status={row.mydataStatus} />
                  </td>
                  <td className="px-4 font-mono text-xs text-gray-500">
                    {row.mydataMark ?? "—"}
                  </td>
                  <td className="px-4">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrint(row.reportDate)}
                      >
                        <FileText className="size-4" />
                      </Button>
                      {row.issuedAt && row.mydataStatus !== "submitted" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => onSubmit(row.reportDate)}
                        >
                          <Send className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MydataTab({
  report,
  pending,
  manualDate,
  onManualDateChange,
  xmlPreview,
  testResult,
  actionLoading,
  onTestConnection,
  onSubmitManual,
  onSubmitPending,
}: {
  report: ZReport | null;
  pending: ZReport[];
  manualDate: string;
  onManualDateChange: (v: string) => void;
  xmlPreview: string;
  testResult: string | null;
  actionLoading: boolean;
  onTestConnection: () => void;
  onSubmitManual: () => void;
  onSubmitPending: (date: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className={cn(premiumCard, "p-5")}>
        <h3 className="text-sm font-semibold text-navy-900">Κατάσταση myDATA</h3>
        <p className="mt-2 text-sm text-gray-500">
          Σήμερα:{" "}
          {report ? (
            <MydataBadge status={report.mydataStatus} />
          ) : (
            "Δεν έχει εκδοθεί Ζ"
          )}
          {report?.mydataMark ? (
            <span className="ml-2 font-mono text-xs">MARK: {report.mydataMark}</span>
          ) : null}
        </p>
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Το API key myDATA ενεργοποιείται από την ΑΑΔΕ. Μέχρι τότε, η υποβολή
          χρησιμοποιεί stub MARK για δοκιμές.
        </p>
      </div>

      {pending.length > 0 ? (
        <div className={premiumCard}>
          <h3 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-navy-900">
            Εκκρεμεί υποβολή
          </h3>
          <ul className="divide-y divide-gray-100">
            {pending.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <span>{formatDateEl(r.reportDate)}</span>
                <Button
                  type="button"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => onSubmitPending(r.reportDate)}
                >
                  Υποβολή
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={cn(premiumCard, "p-5 space-y-4")}>
        <h3 className="text-sm font-semibold text-navy-900">Χειροκίνητη υποβολή</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="mydata-date">Ημερομηνία</Label>
            <Input
              id="mydata-date"
              type="date"
              value={manualDate}
              onChange={(e) => onManualDateChange(e.target.value)}
              className="mt-1 w-48"
            />
          </div>
          <Button type="button" disabled={actionLoading} onClick={onSubmitManual}>
            Υποβολή για ημερομηνία
          </Button>
        </div>
      </div>

      <div className={cn(premiumCard, "p-5 space-y-3")}>
        <h3 className="text-sm font-semibold text-navy-900">Ρυθμίσεις API (env)</h3>
        <p className="text-xs text-gray-500">
          Ορίστε στο <code className="text-navy-800">.env.local</code>:{" "}
          <code>MYDATA_API_KEY</code>, <code>MYDATA_USER_ID</code>,{" "}
          <code>MYDATA_API_URL</code> (προαιρετικό sandbox URL).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>API Key</Label>
            <Input type="password" disabled placeholder="•••••••• (από .env.local)" />
          </div>
          <div>
            <Label>User ID</Label>
            <Input disabled placeholder="•••••••• (από .env.local)" />
          </div>
        </div>
        <Button type="button" variant="outline" disabled={actionLoading} onClick={onTestConnection}>
          Δοκιμή σύνδεσης
        </Button>
        {testResult ? (
          <p className="text-sm text-gray-600">{testResult}</p>
        ) : null}
      </div>

      <div className={cn(premiumCard, "p-5")}>
        <h3 className="mb-2 text-sm font-semibold text-navy-900">Προεπισκόπηση XML</h3>
        <textarea
          readOnly
          value={xmlPreview}
          className="min-h-[200px] w-full rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-navy-900"
        />
      </div>
    </div>
  );
}

function reportToComputation(report: ZReport): DailyZComputation {
  return {
    reportDate: report.reportDate,
    totalOrders: report.totalOrders,
    cancelledOrders: report.cancelledOrders,
    totalRevenue: report.totalRevenue,
    totalVat: report.totalVat,
    netAmount: report.netAmount,
    categoryBreakdown: report.categoryBreakdown,
    customerTypeBreakdown: report.customerTypeBreakdown,
  };
}

function computationToZReport(c: DailyZComputation): ZReport {
  return {
    id: "preview",
    reportDate: c.reportDate,
    totalOrders: c.totalOrders,
    cancelledOrders: c.cancelledOrders,
    totalRevenue: c.totalRevenue,
    totalVat: c.totalVat,
    netAmount: c.netAmount,
    categoryBreakdown: c.categoryBreakdown,
    customerTypeBreakdown: c.customerTypeBreakdown,
    mydataStatus: "pending",
    mydataMark: null,
    mydataSubmittedAt: null,
    mydataError: null,
    issuedAt: null,
    issuedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
