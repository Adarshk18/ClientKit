"use client";

import { useEffect, useState } from "react";
import { fromMinorUnits } from "@/lib/money";

export function UpiQr({
  vpa,
  payeeName,
  amountMinor,
  currency,
  note,
}: {
  vpa: string;
  payeeName: string;
  amountMinor: number;
  currency: string;
  note: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      pa: vpa,
      pn: payeeName,
    });
    if (currency.toUpperCase() === "INR") {
      params.set("am", fromMinorUnits(amountMinor, "INR").toFixed(2));
      params.set("cu", "INR");
    }
    if (note) params.set("tn", note.slice(0, 50));
    const payload = `upi://pay?${params.toString()}`;
    void import("qrcode").then((qr) =>
      qr.toDataURL(payload, { margin: 1, width: 240, color: { dark: "#15202B", light: "#FFFFFF" } }).then(setSrc),
    );
  }, [vpa, payeeName, amountMinor, currency, note]);

  if (!src) {
    return <div className="h-40 w-40 animate-pulse bg-line" aria-hidden />;
  }
  return (
    // QR is a generated data URL; next/image is the wrong tool here.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="UPI payment QR code" className="h-40 w-40 border border-line bg-white" />
  );
}
