import { cookies, headers } from "next/headers";
import { COUNTRY_COOKIE, resolveVisitorCountry } from "@/lib/billing-regions";

/** Server-side: cookie `ck_country`, else CDN geo header, else US. */
export async function getVisitorCountry(): Promise<string> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  return resolveVisitorCountry({
    cookie: cookieStore.get(COUNTRY_COOKIE)?.value,
    getHeader: (name) => headerStore.get(name),
  });
}
