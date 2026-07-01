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

import type { OrderPdfData } from "@/components/orders/map-order-detail";

const NAVY = "#0A1628";
const BLUE_HIGHLIGHT = "#1e40af";
const GRAY_HEADER = "#e5e7eb";
const BORDER = "#000000";
const MUTED = "#6b7280";
const WATERMARK = "#d1d5db";

const COMPANY = {
  name: "KARTEX - Ν. ΚΑΡΑΛΗΣ & ΣΙΑ Ε.Ε.",
  activity: "ΕΙΣΑΓΩΓΕΣ - ΕΜΠΟΡΙΑ ΚΛΩΣΤ/ΚΩΝ",
  address: "ΚΟΡΙΝΘΟΥ 15 & ΔΕΡΒΕΝΙΩΝ, 144 51 ΜΕΤΑΜΟΡΦΩΣΗ",
  phone: "ΤΗΛ.: 210 2846533-4",
  fax: "FAX: 210 2846536",
  vat: "ΑΦΜ: 093781188",
  taxOffice: "Δ.Ο.Υ.: Ν. ΙΩΝΙΑΣ",
  email: "kartex@kartex.gr",
  website: "www.kartex.gr",
  loadingPlace: "Μεταμόρφωση",
  purpose: "Πώληση",
} as const;

const BANK_LINES = [
  "ΕΘΝΙΚΗ ΤΡΑΠΕΖΑ: GR 6601106140000061444004024 -",
  "ALPHA BANK: GR 1901402990299002320003624",
  "ΠΕΙΡΑΙΩΣ: GR 1401720840005084051523391 -",
  "EUROBANK: GR 1402602040000260200138329",
] as const;

const DISCLAIMER_1 =
  "ΤΑ ΕΜΠΟΡΕΥΜΑΤΑ ΤΑΞΙΔΕΥΟΥΝ ΓΙΑ ΛΟΓΑΡΙΑΣΜΟ ΚΑΙ ΚΙΝΔΥΝΟ ΤΟΥ ΠΕΛΑΤΗ. Η ΕΤΑΙΡΙΑ ΔΕΝ ΕΥΘΥΝΕΤΑΙ ΓΙΑ ΚΑΘΥΣΤΕΡΗΣΗ, ΑΠΩΛΕΙΑ Ή ΖΗΜΙΑ ΚΑΤΑ ΤΗ ΜΕΤΑΦΟΡΑ.";

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
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 24,
    fontFamily: "NotoSans",
    fontSize: 7,
    color: "#000000",
    position: "relative",
  },
  watermark: {
    position: "absolute",
    top: 280,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 52,
    fontWeight: 700,
    color: WATERMARK,
    opacity: 0.35,
    letterSpacing: 6,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  companyBlock: {
    width: "62%",
    paddingRight: 8,
  },
  companyName: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 2,
  },
  companyLine: {
    fontSize: 7,
    lineHeight: 1.35,
    marginBottom: 1,
  },
  logoBlock: {
    width: "36%",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  logoMain: {
    fontSize: 14,
    fontWeight: 700,
    color: NAVY,
    letterSpacing: 2,
  },
  logoSub: {
    marginTop: 2,
    fontSize: 8,
    color: MUTED,
    letterSpacing: 1,
  },
  table: {
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowLast: {
    flexDirection: "row",
  },
  cell: {
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  cellLast: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  headerCell: {
    backgroundColor: GRAY_HEADER,
    fontWeight: 700,
    fontSize: 6.5,
  },
  cellText: {
    fontSize: 7,
    lineHeight: 1.25,
  },
  cellTextRight: {
    fontSize: 7,
    textAlign: "right",
  },
  cellTextCenter: {
    fontSize: 7,
    textAlign: "center",
  },
  twoColRow: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 6,
  },
  halfTable: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  productsTable: {
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 8,
    minHeight: 120,
  },
  productHeaderRow: {
    flexDirection: "row",
    backgroundColor: GRAY_HEADER,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  productRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    minHeight: 14,
  },
  footerRow: {
    flexDirection: "row",
    marginTop: 4,
    gap: 6,
  },
  footerLeft: {
    flex: 1.15,
  },
  footerRight: {
    flex: 0.85,
  },
  miniTable: {
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 4,
  },
  totalsTable: {
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  payRow: {
    flexDirection: "row",
    backgroundColor: BLUE_HIGHLIGHT,
  },
  payLabel: {
    flex: 1,
    padding: 4,
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 8,
  },
  payValue: {
    width: 72,
    padding: 4,
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 8,
    textAlign: "right",
  },
  signatureRow: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginTop: 4,
  },
  signatureCell: {
    flex: 1,
    padding: 4,
    minHeight: 36,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },
  signatureCellLast: {
    flex: 1,
    padding: 4,
    minHeight: 36,
  },
  disclaimer: {
    marginTop: 6,
    fontSize: 5.5,
    lineHeight: 1.35,
    textAlign: "justify",
  },
  banks: {
    marginTop: 4,
    fontSize: 5.5,
    lineHeight: 1.35,
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
};

function Cell({ width, children, header, right, center, last }: CellProps) {
  return (
    <View
      style={[
        last ? styles.cellLast : styles.cell,
        { width },
        header ? styles.headerCell : {},
      ]}
    >
      <Text
        style={
          right
            ? styles.cellTextRight
            : center
              ? styles.cellTextCenter
              : styles.cellText
        }
      >
        {children}
      </Text>
    </View>
  );
}

function HeaderRow({
  cols,
}: {
  cols: { label: string; width: string; right?: boolean }[];
}) {
  return (
    <View style={styles.tableRow}>
      {cols.map((col, index) => (
        <Cell
          key={col.label}
          width={col.width}
          header
          right={col.right}
          last={index === cols.length - 1}
        >
          {col.label}
        </Cell>
      ))}
    </View>
  );
}

function DataRow({
  cols,
  last,
}: {
  cols: { value: string; width: string; right?: boolean; center?: boolean }[];
  last?: boolean;
}) {
  return (
    <View style={last ? styles.tableRowLast : styles.tableRow}>
      {cols.map((col, index) => (
        <Cell
          key={`${col.value}-${index}`}
          width={col.width}
          right={col.right}
          center={col.center}
          last={index === cols.length - 1}
        >
          {col.value}
        </Cell>
      ))}
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

  const productCols = {
    code: "8%",
    desc: "26%",
    unit: "6%",
    qty: "8%",
    price: "12%",
    disc: "7%",
    net: "16%",
    vat: "17%",
  };

  return (
    <Document title={`${data.documentType} ${data.orderNumber}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark}>KARTEX</Text>

        <View style={styles.topRow}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{COMPANY.name}</Text>
            <Text style={styles.companyLine}>{COMPANY.activity}</Text>
            <Text style={styles.companyLine}>{COMPANY.address}</Text>
            <Text style={styles.companyLine}>{COMPANY.phone}</Text>
            <Text style={styles.companyLine}>{COMPANY.fax}</Text>
            <Text style={styles.companyLine}>{COMPANY.vat}</Text>
            <Text style={styles.companyLine}>{COMPANY.taxOffice}</Text>
            <Text style={styles.companyLine}>{COMPANY.email}</Text>
            <Text style={styles.companyLine}>{COMPANY.website}</Text>
          </View>
          <View style={styles.logoBlock}>
            <Text style={styles.logoMain}>KARTEX</Text>
            <Text style={styles.logoSub}>EST.1982</Text>
          </View>
        </View>

        <View style={styles.table}>
          <HeaderRow
            cols={[
              { label: "ΕΙΔΟΣ ΠΑΡΑΣΤΑΤΙΚΟΥ", width: "34%" },
              { label: "Νο ΠΑΡΑΣΤΑΤΙΚΟΥ", width: "33%" },
              { label: "ΗΜΕΡΟΜΗΝΙΑ", width: "33%" },
            ]}
          />
          <DataRow
            last
            cols={[
              { value: data.documentType, width: "34%" },
              { value: data.orderNumber, width: "33%", center: true },
              { value: data.date, width: "33%", center: true },
            ]}
          />
        </View>

        <View style={styles.twoColRow}>
          <View style={styles.halfTable}>
            <HeaderRow cols={[{ label: "ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ", width: "100%" }]} />
            <View style={[styles.tableRowLast, { minHeight: 52 }]}>
              <View style={[styles.cellLast, { width: "100%", padding: 4 }]}>
                <Text style={styles.cellText}>{customerBlock || "—"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.halfTable}>
            <HeaderRow
              cols={[
                { label: "ΤΟΠΟΣ ΦΟΡΤΩΣΗΣ", width: "50%" },
                { label: "ΩΡΑ ΑΠΟΣΤΟΛΗΣ/ΠΑΡΑΔΟΣΗΣ", width: "50%" },
              ]}
            />
            <DataRow
              cols={[
                { value: COMPANY.loadingPlace, width: "50%", center: true },
                { value: data.deliveryDate, width: "50%", center: true },
              ]}
            />
            <HeaderRow
              cols={[
                { label: "ΤΡΟΠΟΣ ΠΛΗΡΩΜΗΣ", width: "50%" },
                { label: "ΣΚΟΠΟΣ ΔΙΑΚΙΝΗΣΗΣ", width: "50%" },
              ]}
            />
            <DataRow
              cols={[
                { value: data.paymentTerms, width: "50%", center: true },
                { value: COMPANY.purpose, width: "50%", center: true },
              ]}
            />
            <View style={styles.tableRow}>
              <View style={[styles.cell, styles.headerCell, { width: "100%" }]}>
                <Text style={[styles.cellText, { fontWeight: 700 }]}>
                  ΤΟΠΟΣ ΠΡΟΟΡΙΣΜΟΥ: {data.customer.city}
                </Text>
              </View>
            </View>
            <View style={styles.tableRowLast}>
              <View style={[styles.cellLast, styles.headerCell, { width: "100%" }]}>
                <Text style={[styles.cellText, { fontWeight: 700 }]}>
                  ΣΧΕΤΙΚΑ ΠΑΡΑΣΤΑΤΙΚΑ: -
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.productsTable}>
          <View style={styles.productHeaderRow}>
            <Cell width={productCols.code} header center>
              ΚΩΔΙΚΟΣ
            </Cell>
            <Cell width={productCols.desc} header>
              ΠΕΡΙΓΡΑΦΗ ΕΙΔΟΥΣ
            </Cell>
            <Cell width={productCols.unit} header center>
              Μ.Μ
            </Cell>
            <Cell width={productCols.qty} header center>
              ΠΟΣΟΤΗΤΑ
            </Cell>
            <Cell width={productCols.price} header right>
              ΤΙΜΗ ΜΟΝΑΔΑΣ
            </Cell>
            <Cell width={productCols.disc} header center>
              ΕΚΠΤ.
            </Cell>
            <Cell width={productCols.net} header right>
              ΚΑΘΑΡΗ ΑΞΙΑ
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
                index === data.items.length - 1 ? { borderBottomWidth: 0 } : {},
              ]}
            >
              <Cell width={productCols.code} center>
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
              <Cell width={productCols.disc} center>
                {item.discountPercent}%
              </Cell>
              <Cell width={productCols.net} right>
                {formatAmount(item.lineTotal)}
              </Cell>
              <Cell width={productCols.vat} center last>
                {vatPercent}%
              </Cell>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            <View style={styles.miniTable}>
              <HeaderRow
                cols={[
                  {
                    label: "ΕΝΙΑΙΟ ΜΗΧΑΝΟΓΡ. ΕΝΤΥΠΟ ΠΟΛΛΑΠΛΗΣ ΧΡΗΣΗΣ",
                    width: "100%",
                  },
                ]}
              />
              <HeaderRow
                cols={[
                  { label: "ΠΡΟΗΓ. ΥΠΟΛ.", width: "25%" },
                  { label: "% ΦΠΑ", width: "25%" },
                  { label: "ΥΠΟΚΑΞΙΑ", width: "25%" },
                  { label: "ΑΞΙΑ ΦΠΑ", width: "25%" },
                ]}
              />
              <DataRow
                cols={[
                  { value: "", width: "25%" },
                  { value: String(vatPercent), width: "25%", center: true },
                  { value: formatAmount(data.subtotal), width: "25%", right: true },
                  { value: formatAmount(data.vatAmount), width: "25%", right: true },
                ]}
              />
              <DataRow
                last
                cols={[
                  { value: "ΝΕΟ ΥΠΟΛ.", width: "25%" },
                  { value: "", width: "25%" },
                  { value: "", width: "25%" },
                  { value: "", width: "25%" },
                ]}
              />
            </View>

            <View style={styles.miniTable}>
              <HeaderRow
                cols={[
                  { label: "ΣΥΝΟΛΟ ΠΟΣΟΤ.", width: "33%" },
                  { label: "ΣΥΣΚ./ΔΕΜΑΤΑ", width: "34%" },
                  { label: "ΑΡ. ΑΥΤ/ΤΟΥ", width: "33%" },
                ]}
              />
              <DataRow
                last
                cols={[
                  { value: String(data.totalQuantity), width: "33%", center: true },
                  { value: "0", width: "34%", center: true },
                  { value: "0", width: "33%", center: true },
                ]}
              />
            </View>

            <View style={[styles.miniTable, { marginTop: 4 }]}>
              <View style={styles.tableRowLast}>
                <View style={[styles.cellLast, styles.headerCell, { width: "100%" }]}>
                  <Text style={styles.cellText}>
                    ΠΑΡΑΤΗΡΗΣΕΙΣ: {data.notes !== "—" ? data.notes : "-"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footerRight}>
            <View style={styles.totalsTable}>
              <DataRow
                cols={[
                  { value: "ΣΥΝΟΛΟ ΑΞΙΑΣ", width: "55%" },
                  { value: formatEur(data.subtotal), width: "45%", right: true },
                ]}
              />
              <DataRow
                cols={[
                  { value: "ΕΚΠΤΩΣΗ", width: "55%" },
                  { value: formatEur(0), width: "45%", right: true },
                ]}
              />
              <DataRow
                cols={[
                  { value: "ΚΑΘΑΡΗ ΑΞΙΑ", width: "55%" },
                  { value: formatEur(data.subtotal), width: "45%", right: true },
                ]}
              />
              <DataRow
                cols={[
                  { value: "ΑΞΙΑ ΦΠΑ", width: "55%" },
                  { value: formatEur(data.vatAmount), width: "45%", right: true },
                ]}
              />
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>ΠΛΗΡΩΤΕΟ ΠΟΣΟ</Text>
                <Text style={styles.payValue}>{formatEur(data.total)}</Text>
              </View>
            </View>

            <View style={styles.signatureRow}>
              <View style={styles.signatureCell}>
                <Text style={[styles.cellText, { fontWeight: 700 }]}>Ο ΕΚΔΟΣΑΣ</Text>
              </View>
              <View style={styles.signatureCellLast}>
                <Text style={[styles.cellText, { fontWeight: 700 }]}>Ο ΠΑΡΑΛΑΒΩΝ</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.disclaimer}>{DISCLAIMER_1}</Text>
        <Text style={styles.disclaimer}>{DISCLAIMER_2}</Text>
        <Text style={styles.banks}>{BANK_LINES.join("\n")}</Text>
      </Page>
    </Document>
  );
}
