"use client";

import { useSyncExternalStore } from "react";
import { BILLING_COUNTRIES, COUNTRY_COOKIE, countrySelectValue } from "@/lib/billing-regions";

/**
 * Client-side visitor country for the static marketing pages.
 * The server HTML always uses the default (US). After hydration this store resolves the real country once
 * (ck_country cookie if set, else /api/geo, which uses the same cookie / CDN header lookup as before)
 * and every price on the page reads from it.
 */
type Snapshot = { country: string; ready: boolean };

const DEFAULT_SNAPSHOT: Snapshot = { country: "US", ready: false };
const FETCH_TIMEOUT_MS = 2500;

let snapshot: Snapshot = DEFAULT_SNAPSHOT;
let started = false;
let picked = false;
const listeners = new Set<() => void>();

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function readCookieCountry(): string | null {
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${COUNTRY_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(COUNTRY_COOKIE.length + 1)).trim().toUpperCase();
  return BILLING_COUNTRIES.some((c) => c.code === value) ? value : null;
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  const fromCookie = readCookieCountry();
  if (fromCookie) {
    emit({ country: fromCookie, ready: true });
    return;
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  fetch("/api/geo", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { country?: unknown } | null) => {
      if (picked) return;
      if (data && typeof data.country === "string") {
        emit({ country: countrySelectValue(data.country), ready: true });
      } else {
        emit({ ...snapshot, ready: true });
      }
    })
    .catch(() => {
      if (!picked) emit({ ...snapshot, ready: true });
    })
    .finally(() => window.clearTimeout(timer));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => DEFAULT_SNAPSHOT;

/** The visitor's country for price display, plus whether detection has finished. */
export function useVisitorCountry(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Called when the visitor picks a country in the dropdown, so every price on the page follows. */
export function setVisitorCountry(country: string) {
  picked = true;
  emit({ country, ready: true });
}
