"use client";

import { useEffect, useRef, useState } from "react";
import { useVisitorCountry } from "@/components/use-visitor-country";

/**
 * Rupees in the server-rendered example, so the page HTML is the same for everyone. Once the visitor's country is
 * known and it is not India, the currency flips to US dollars unless they already picked one themselves.
 * `onAutoSwitch` runs once when that automatic flip happens (never after a manual pick).
 */
export function useToolCurrency(
  initial = "INR",
  onAutoSwitch?: (from: string, to: string) => void,
): [string, (c: string) => void] {
  const [currency, setCurrencyState] = useState(initial);
  const touched = useRef(false);
  const { country, ready } = useVisitorCountry();
  const onSwitch = useRef(onAutoSwitch);
  useEffect(() => {
    onSwitch.current = onAutoSwitch;
  });
  useEffect(() => {
    if (!ready || touched.current) return;
    if (country && country !== "IN") {
      setCurrencyState("USD");
      // Lets the tool swap its rupee example amount for a dollar-sized one, so "$60,000" never shows for a website job.
      onSwitch.current?.(initial, "USD");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, ready]);
  return [
    currency,
    (c: string) => {
      touched.current = true;
      setCurrencyState(c);
    },
  ];
}
