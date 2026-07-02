import {
  Document,
  type DocumentProps,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";

import type { OrderPdfData } from "@/components/orders/map-order-detail";

const NAVY = "#0A1628";
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F5E6B8";
const MUTED = "#64748B";
const BORDER = "#CBD5E1";
const ROW_ALT = "#F8FAFC";

const COMPANY = {
  name: "KARTEX - Ν. ΚΑΡΑΛΗΣ & ΣΙΑ Ε.Ε.",
  activity: "ΕΙΣΑΓΩΓΕΣ - ΕΜΠΟΡΙΑ ΚΛΩΣΤ/ΚΩΝ",
  address: "ΚΟΡΙΝΘΟΥ 15 & ΔΕΡΒΕΝΙΩΝ, 144 51 ΜΕΤΑΜΟΡΦΩΣΗ",
  phone: "ΤΗΛ.: 210 2846533-4",
  email: "kartex@kartex.gr",
  vat: "ΑΦΜ: 093781188",
  taxOffice: "Δ.Ο.Υ.: Ν. ΙΩΝΙΑΣ",
  loadingPlace: "Μεταμόρφωση",
  purpose: "Πώληση",
} as const;

const DISCLAIMER_1 =
  "ΤΑ ΕΜΠΟΡΕΥΜΑΤΑ ΤΑΞΙΔΕΥΟΥΝ ΓΙΑ ΛΟΓΑΡΙΑΣΜΟ ΚΑΙ ΚΙΝΔΥΝΟ ΤΟΥ ΠΕΛΑΤΗ.";

const DISCLAIMER_2 =
  "ΕΞΟΦΛΗΣΗ ΤΟΥ ΠΑΡΟΝΤΟΣ ΓΙΝΕΤΑΙ ΜΟΝΟ ΜΕ ΕΠΙΣΗΜΗ ΑΠΟΔΕΙΞΗ ΤΗΣ ΕΤΑΙΡΕΙΑΣ.";

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
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 28,
    fontFamily: "NotoSans",
    fontSize: 8,
    color: NAVY,
    backgroundColor: "#FFFFFF",
  },
  headerBand: {
    backgroundColor: NAVY,
    marginHorizontal: -28,
    marginTop: -28,
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: { flex: 1, paddingRight: 12 },
  headerCompany: {
    fontSize: 9,
    fontWeight: 700,
    color: "#FFFFFF",
    marginBottom: 3,
  },
  headerLine: {
    fontSize: 7,
    color: "#94A3B8",
    lineHeight: 1.35,
    marginBottom: 1,
  },
  logoBlock: { alignItems: "flex-end" },
  logoMain: {
    fontSize: 18,
    fontWeight: 700,
    color: GOLD,
    letterSpacing: 3,
  },
  logoSub: {
    marginTop: 2,
    fontSize: 7,
    color: GOLD_LIGHT,
    letterSpacing: 2,
  },
  goldRule: {
    height: 2,
    backgroundColor: GOLD,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  metaCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: "hidden",
  },
  metaHeader: {
    backgroundColor: NAVY,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  metaHeaderText: {
    fontSize: 6.5,
    fontWeight: 700,
    color: GOLD,
    letterSpacing: 0.5,
  },
  metaBody: {
    padding: 6,
    minHeight: 36,
  },
  metaValue: {
    fontSize: 7.5,
    lineHeight: 1.35,
    color: NAVY,
  },
  productsTable: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  productHeaderRow: {
    flexDirection: "row",
    backgroundColor: NAVY,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
  },
  productRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    minHeight: 16,
  },
  productRowAlt: {
    backgroundColor: ROW_ALT,
  },
  cell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    justifyContent: "center",
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },
  cellCode: {
    paddingVertical: 4,
    paddingHorizontal: 5,
    justifyContent: "center",
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
    flexShrink: 0,
  },
  cellCodeText: {
    fontSize: 7,
    lineHeight: 1.2,
    color: NAVY,
  },
  cellLast: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  headerCellText: {
    fontSize: 6.5,
    fontWeight: 700,
    color: GOLD,
  },
  cellText: { fontSize: 7.5, lineHeight: 1.25, color: NAVY },
  cellTextRight: { fontSize: 7.5, textAlign: "right", color: NAVY },
  cellTextCenter: { fontSize: 7.5, textAlign: "center", color: NAVY },
  footerRow: { flexDirection: "row", gap: 10 },
  footerLeft: { flex: 1.2 },
  footerRight: { flex: 0.8 },
  notesBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 6,
    marginBottom: 8,
    minHeight: 40,
  },
  notesLabel: {
    fontSize: 6.5,
    fontWeight: 700,
    color: MUTED,
    marginBottom: 3,
  },
  totalsCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: "hidden",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  totalLabel: { fontSize: 7.5, color: MUTED },
  totalValue: { fontSize: 7.5, fontWeight: 700, color: NAVY },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: NAVY,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  payLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: GOLD,
  },
  payValue: {
    fontSize: 10,
    fontWeight: 700,
    color: "#FFFFFF",
  },
  signatureRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  signatureCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 6,
    minHeight: 40,
  },
  signatureLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 16,
  },
  disclaimer: {
    marginTop: 10,
    fontSize: 5.5,
    lineHeight: 1.35,
    color: MUTED,
  },
  banks: {
    marginTop: 4,
    fontSize: 5.5,
    lineHeight: 1.4,
    color: NAVY,
  },
  bankLine: { marginBottom: 1 },
  qrRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qrImage: {
    width: 52,
    height: 52,
  },
  qrCaption: {
    fontSize: 6.5,
    lineHeight: 1.35,
    color: MUTED,
    maxWidth: 120,
  },
});

function formatAmount(value: number) {
  return new Intl.NumberFormat("el-GR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatEur(value: number) {
  return `${formatAmount(value)} €`;
}

type CellProps = {
  width: string;
  children: React.ReactNode;
  header?: boolean;
  right?: boolean;
  center?: boolean;
  last?: boolean;
  code?: boolean;
};

function Cell({ width, children, header, right, center, last, code }: CellProps) {
  const cellStyle = last ? styles.cellLast : code ? styles.cellCode : styles.cell;
  const textStyle = code
    ? styles.cellCodeText
    : header
      ? styles.headerCellText
      : right
        ? styles.cellTextRight
        : center
          ? styles.cellTextCenter
          : styles.cellText;

  return (
    <View style={[cellStyle, { width }]}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
}

export function createOrderPdfDocument(
  data: OrderPdfData,
): ReactElement<DocumentProps> {
  const vatPercent = Math.round(data.vatRate * 100);
  const customerBlock = [data.customer.name, data.customer.address, data.customer.city]
    .filter((line) => line && line !== "—")
    .join("\n");

  // Code column sized for longest SKUs (e.g. IMP26-SS4-001, 0402-00001).
  const productCols = {
    code: "15%",
    desc: "22%",
    unit: "7%",
    qty: "8%",
    price: "13%",
    net: "17%",
    vat: "18%",
  };

  const bankLines =
    data.bankLines.length > 0
      ? data.bankLines
      : ["Επικοινωνήστε μαζί μας για τραπεζικά στοιχεία."];

  return (
    <Document title={`${data.documentType} ${data.orderNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerCompany}>{COMPANY.name}</Text>
            <Text style={styles.headerLine}>{COMPANY.activity}</Text>
            <Text style={styles.headerLine}>{COMPANY.address}</Text>
            <Text style={styles.headerLine}>{COMPANY.phone}</Text>
            <Text style={styles.headerLine}>{COMPANY.vat}</Text>
            <Text style={styles.headerLine}>{COMPANY.taxOffice}</Text>
            <Text style={styles.headerLine}>{COMPANY.email}</Text>
          </View>
          <View style={styles.logoBlock}>
            <Text style={styles.logoMain}>KARTEX</Text>
            <Text style={styles.logoSub}>EST. 1982</Text>
          </View>
        </View>

        <View style={styles.goldRule} />

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <View style={styles.metaHeader}>
              <Text style={styles.metaHeaderText}>ΠΑΡΑΣΤΑΤΙΚΟ</Text>
            </View>
            <View style={styles.metaBody}>
              <Text style={styles.metaValue}>{data.documentType}</Text>
              <Text style={[styles.metaValue, { fontWeight: 700, marginTop: 2 }]}>
                {data.orderNumber}
              </Text>
              <Text style={[styles.metaValue, { color: MUTED, marginTop: 2 }]}>
                {data.date}
              </Text>
            </View>
          </View>

          <View style={styles.metaCard}>
            <View style={styles.metaHeader}>
              <Text style={styles.metaHeaderText}>ΠΕΛΑΤΗΣ</Text>
            </View>
            <View style={styles.metaBody}>
              <Text style={styles.metaValue}>{customerBlock || "—"}</Text>
              {data.customer.vat !== "—" ? (
                <Text style={[styles.metaValue, { marginTop: 2 }]}>
                  ΑΦΜ: {data.customer.vat}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.metaCard}>
            <View style={styles.metaHeader}>
              <Text style={styles.metaHeaderText}>ΠΑΡΑΔΟΣΗ</Text>
            </View>
            <View style={styles.metaBody}>
              <Text style={[styles.metaValue, { fontWeight: 700 }]}>
                {data.deliveryLabel}
              </Text>
              <Text style={[styles.metaValue, { marginTop: 2 }]}>
                {data.deliveryDestination}
              </Text>
              <Text style={[styles.metaValue, { color: MUTED, marginTop: 3 }]}>
                Ημ. παράδοσης: {data.deliveryDate}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.productsTable}>
          <View style={styles.productHeaderRow}>
            <Cell width={productCols.code} header center code>
              ΚΩΔΙΚΟΣ
            </Cell>
            <Cell width={productCols.desc} header>
              ΠΕΡΙΓΡΑΦΗ
            </Cell>
            <Cell width={productCols.unit} header center>
              Μ.Μ.
            </Cell>
            <Cell width={productCols.qty} header center>
              ΠΟΣ.
            </Cell>
            <Cell width={productCols.price} header right>
              ΤΙΜΗ
            </Cell>
            <Cell width={productCols.net} header right>
              ΚΑΘΑΡΗ
            </Cell>
            <Cell width={productCols.vat} header center last>
              ΦΠΑ
            </Cell>
          </View>

          {data.items.map((item, index) => (
            <View
              key={`${item.sku}-${index}`}
              style={[
                styles.productRow,
                index % 2 === 1 ? styles.productRowAlt : {},
                index === data.items.length - 1 ? { borderBottomWidth: 0 } : {},
              ]}
            >
              <Cell width={productCols.code} center code>
                {item.sku}
              </Cell>
              <Cell width={productCols.desc}>{item.product}</Cell>
              <Cell width={productCols.unit} center>
                ΤΕΜ
              </Cell>
              <Cell width={productCols.qty} center>
                {String(item.quantity)}
              </Cell>
              <Cell width={productCols.price} right>
                {formatAmount(item.unitPrice)}
              </Cell>
              <Cell width={productCols.net} right>
                {formatAmount(item.lineTotal)}
              </Cell>
              <Cell width={productCols.vat} center last>
                {data.vatApplies ? `${vatPercent}%` : "—"}
              </Cell>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>ΠΑΡΑΤΗΡΗΣΕΙΣ</Text>
              <Text style={styles.cellText}>
                {data.notes !== "—" ? data.notes : "—"}
              </Text>
            </View>
            <Text style={styles.cellText}>
              Τρόπος πληρωμής: {data.paymentTerms}
            </Text>
            <Text style={[styles.cellText, { marginTop: 2 }]}>
              Τόπος φόρτωσης: {COMPANY.loadingPlace} · Σκοπός: {COMPANY.purpose}
            </Text>
          </View>

          <View style={styles.footerRight}>
            <View style={styles.totalsCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {data.vatApplies ? "Υποσύνολο" : "Καθαρή αξία"}
                </Text>
                <Text style={styles.totalValue}>{formatEur(data.subtotal)}</Text>
              </View>
              {data.vatApplies ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>ΦΠΑ {vatPercent}%</Text>
                  <Text style={styles.totalValue}>{formatEur(data.vatAmount)}</Text>
                </View>
              ) : (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>ΦΠΑ</Text>
                  <Text style={styles.totalValue}>Απαλλαγή B2B</Text>
                </View>
              )}
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>ΠΛΗΡΩΤΕΟ</Text>
                <Text style={styles.payValue}>{formatEur(data.total)}</Text>
              </View>
            </View>

            <View style={styles.signatureRow}>
              <View style={styles.signatureCell}>
                <Text style={styles.signatureLabel}>Ο ΕΚΔΟΣΑΣ</Text>
              </View>
              <View style={styles.signatureCell}>
                <Text style={styles.signatureLabel}>Ο ΠΑΡΑΛΑΒΩΝ</Text>
              </View>
            </View>

            {data.qrDataUrl ? (
              <View style={styles.qrRow}>
                <Image src={data.qrDataUrl} style={styles.qrImage} />
                <Text style={styles.qrCaption}>
                  Σκανάρετε για online παρακολούθηση παραγγελίας
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.disclaimer}>{DISCLAIMER_1}</Text>
        <Text style={styles.disclaimer}>{DISCLAIMER_2}</Text>
        <View style={styles.banks}>
          {bankLines.map((line, index) => (
            <Text key={`bank-${index}`} style={styles.bankLine}>
              {line}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
