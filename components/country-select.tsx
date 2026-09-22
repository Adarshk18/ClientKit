"use client";

import { useRouter } from "next/navigation";
import {
  BILLING_COUNTRIES,
  COUNTRY_COOKIE,
  COUNTRY_COOKIE_MAX_AGE,
  countrySelectValue,
} from "@/lib/billing-regions";
import { fieldClass } from "@/lib/ui";

export function setCountryCookie(country: string) {
  const value = encodeURIComponent(countrySelectValue(country));
  document.cookie = `${COUNTRY_COOKIE}=${value}; Max-Age=${COUNTRY_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

export function CountrySelect({
  value,
  onChange,
  id = "billing-country",
  className,
  label = "Country",
  refreshOnChange = false,
}: {
  value: string;
  onChange: (country: string) => void;
  id?: string;
  className?: string;
  label?: string;
  /** Re-run server components so hero/FAQ pick up the new ck_country cookie. */
  refreshOnChange?: boolean;
}) {
  const router = useRouter();
  const selected = countrySelectValue(value);

  return (
    <label className={`block text-sm ${className ?? ""}`} htmlFor={id}>
      {label}
      <select
        id={id}
        className={fieldClass}
        value={selected}
        onChange={(event) => {
          const next = event.target.value;
          setCountryCookie(next);
          onChange(next);
          if (refreshOnChange) router.refresh();
        }}
      >
        {BILLING_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}
