import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/money";
import { htmlToPlainText } from "@/lib/sanitize";
import type { FrozenPayload } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Times-Roman",
    color: "#1a1916",
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#8b3a2a",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontFamily: "Times-Bold", marginBottom: 6 },
  meta: { fontSize: 10, color: "#5c574e", marginBottom: 18 },
  section: { marginTop: 16, marginBottom: 8, fontFamily: "Times-Bold", fontSize: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e7e0d4",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#5c574e",
  },
  box: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1a1916",
  },
});

function SignedPdf({
  payload,
  signerName,
  signerEmail,
  signedAt,
  hash,
}: {
  payload: FrozenPayload;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  hash: string;
}) {
  const scope = htmlToPlainText(payload.scope_html) || "No additional scope.";
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>Client Kit</Text>
        <Text style={styles.title}>{payload.title}</Text>
        <Text style={styles.meta}>
          {payload.workspace_name} → {payload.client_name} ({payload.client_email})
        </Text>

        <Text style={styles.section}>Scope</Text>
        <Text>{scope}</Text>

        <Text style={styles.section}>Line items</Text>
        {payload.line_items.length === 0 ? (
          <Text>No line items.</Text>
        ) : (
          payload.line_items.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.row}>
              <Text>
                {item.label} × {item.qty}
              </Text>
              <Text>{formatMoney(Math.round(item.qty * item.unit_amount), payload.currency)}</Text>
            </View>
          ))
        )}

        <View style={{ marginTop: 12 }}>
          <View style={styles.row}>
            <Text>Subtotal</Text>
            <Text>{formatMoney(payload.subtotal, payload.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Due now ({payload.deposit_percent}%)</Text>
            <Text>{formatMoney(payload.amount_due, payload.currency)}</Text>
          </View>
          {payload.remainder_amount > 0 ? (
            <View style={styles.row}>
              <Text>Due later</Text>
              <Text>{formatMoney(payload.remainder_amount, payload.currency)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.box}>
          <Text style={{ fontFamily: "Times-Bold" }}>Signed</Text>
          <Text>
            {signerName} · {signerEmail}
          </Text>
          <Text>Signed at (UTC): {signedAt}</Text>
          <Text>Document hash: {hash}</Text>
        </View>

        <Text style={styles.footer}>
          Simple electronic signature. Not a digital signature certificate. Hash {hash}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderSignedPdf(input: {
  payload: FrozenPayload;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  hash: string;
}): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <SignedPdf
      payload={input.payload}
      signerName={input.signerName}
      signerEmail={input.signerEmail}
      signedAt={input.signedAt}
      hash={input.hash}
    />,
  );
  return Buffer.from(buffer);
}
