import {
  Document,
  type DocumentProps,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";

import type { ZReport } from "@/lib/z-report/types";

const NAVY = "#0A1628";
const GOLD = "#C9A227";

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Bold.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "NotoSans",
    fontSize: 9,
    color: NAVY,
  },
  header: {
    backgroundColor: NAVY,
    color: "#ffffff",
    padding: 16,
    marginBottom: 20,
    borderRadius: 4,
  },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, opacity: 0.9 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  label: { color: "#6b7280" },
  value: { fontWeight: 700 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 14,
    marginBottom: 8,
    color: GOLD,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 6,
    fontWeight: 700,
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  col1: { width: "40%" },
  col2: { width: "15%", textAlign: "right" },
  col3: { width: "15%", textAlign: "right" },
  col4: { width: "15%", textAlign: "right" },
  col5: { width: "15%", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
  },
});

function formatEur(n: number) {
  return `${n.toFixed(2)} €`;
}

function formatDateEl(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function createZReportPdfDocument(report: ZReport): ReactElement<DocumentProps> {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ΗΜΕΡΗΣΙΟ Ζ — KARTEX</Text>
          <Text style={styles.subtitle}>
            Ημερομηνία: {formatDateEl(report.reportDate)} · ΑΦΜ 093781188
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Συναλλαγές (μη ακυρωμένες)</Text>
          <Text style={styles.value}>{report.totalOrders}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ακυρώσεις</Text>
          <Text style={styles.value}>{report.cancelledOrders}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Καθαρή αξία</Text>
          <Text style={styles.value}>{formatEur(report.netAmount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>ΦΠΑ 24%</Text>
          <Text style={styles.value}>{formatEur(report.totalVat)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Σύνολο</Text>
          <Text style={styles.value}>{formatEur(report.totalRevenue)}</Text>
        </View>

        {report.mydataMark ? (
          <View style={styles.row}>
            <Text style={styles.label}>MARK myDATA</Text>
            <Text style={styles.value}>{report.mydataMark}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Ανά κατηγορία</Text>
        <View style={styles.tableHead}>
          <Text style={styles.col1}>Κατηγορία</Text>
          <Text style={styles.col2}>Γραμμές</Text>
          <Text style={styles.col3}>Καθαρά</Text>
          <Text style={styles.col4}>ΦΠΑ</Text>
          <Text style={styles.col5}>Σύνολο</Text>
        </View>
        {report.categoryBreakdown.map((row) => (
          <View key={row.category} style={styles.tableRow}>
            <Text style={styles.col1}>{row.category}</Text>
            <Text style={styles.col2}>{row.orderCount}</Text>
            <Text style={styles.col3}>{formatEur(row.net)}</Text>
            <Text style={styles.col4}>{formatEur(row.vat)}</Text>
            <Text style={styles.col5}>{formatEur(row.revenue)}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Ανά τύπο πελάτη</Text>
        <View style={styles.tableHead}>
          <Text style={styles.col1}>Τύπος</Text>
          <Text style={styles.col2}>Παραγγ.</Text>
          <Text style={styles.col3}>Καθαρά</Text>
          <Text style={styles.col4}>ΦΠΑ</Text>
          <Text style={styles.col5}>Σύνολο</Text>
        </View>
        {report.customerTypeBreakdown.map((row) => (
          <View key={row.type} style={styles.tableRow}>
            <Text style={styles.col1}>{row.typeLabel}</Text>
            <Text style={styles.col2}>{row.orderCount}</Text>
            <Text style={styles.col3}>{formatEur(row.net)}</Text>
            <Text style={styles.col4}>{formatEur(row.vat)}</Text>
            <Text style={styles.col5}>{formatEur(row.revenue)}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Εκδόθηκε {report.issuedAt ? new Date(report.issuedAt).toLocaleString("el-GR") : "—"} ·
          Kartex Office
        </Text>
      </Page>
    </Document>
  );
}
