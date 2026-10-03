"use client";

import { useEffect, useRef, useState } from "react";
import { useVisitorCountry } from "@/components/use-visitor-country";

/**
 * Rupees in the server-rendered example, so the page HTML is the same for everyone. Once the visitor's country is
 * known and it is not India, the currency flips to US dollars unless they already picked one themselves.
 */
export function useToolCurrency(initial = "INR"): [string, (c: string) => void] {
  const [currency, setCurrencyState] = useState(initial);
  const touched = useRef(false);
  const { country, ready } = useVisitorCountry();
  useEffect(() => {
    if (!ready || touched.current) return;
    if (country && country !== "IN") setCurrencyState("USD");
  }, [country, ready]);
  return [
    currency,
    (c: string) => {
      touched.current = true;
      setCurrencyState(c);
    },
  ];
}
