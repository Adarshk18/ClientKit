import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** lastModified is the date each page's content last changed. Update it when you edit the page. */
const PAGES: {
  path: string;
  lastModified: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
}[] = [
  { path: "/", lastModified: "2026-09-27", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", lastModified: "2026-09-27", changeFrequency: "monthly", priority: 0.9 },
  { path: "/faq", lastModified: "2026-09-27", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", lastModified: "2026-09-27", changeFrequency: "yearly", priority: 0.6 },
  { path: "/s/demo-acme", lastModified: "2026-09-27", changeFrequency: "yearly", priority: 0.5 },
  { path: "/terms", lastModified: "2026-09-22", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", lastModified: "2026-09-22", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: page.lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
