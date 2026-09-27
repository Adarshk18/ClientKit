import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/s/demo-acme"],
        // /s/ and /login, /signup stay crawlable on purpose so crawlers can see their noindex tags.
        disallow: ["/jobs", "/settings", "/admin", "/api/", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
