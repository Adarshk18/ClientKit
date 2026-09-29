import { describe, expect, it } from "vitest";
import { isProtectedPath } from "@/lib/supabase/middleware";
import { isLikelyBot } from "@/lib/bots";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("isProtectedPath", () => {
  it("protects app routes and private APIs", () => {
    for (const path of ["/jobs", "/jobs/new", "/jobs/abc/edit", "/settings", "/settings/billing", "/api/admin/export"]) {
      expect(isProtectedPath(path), path).toBe(true);
    }
  });

  it("leaves public pages, SEO files, and unknown paths to Next.js", () => {
    for (const path of [
      "/",
      "/pricing",
      "/faq",
      "/about",
      "/terms",
      "/privacy",
      "/login",
      "/signup",
      "/s/demo-acme",
      "/s/abc123/pdf",
      "/auth/callback",
      "/admin",
      "/robots.txt",
      "/sitemap.xml",
      "/opengraph-image",
      "/twitter-image",
      "/opengraph-image-abc123",
      "/llms.txt",
      "/some-typo",
      "/jobsearch",
      "/api/webhooks/dodo",
      "/api/cron/expire",
      "/api/analytics",
      "/api/geo",
    ]) {
      expect(isProtectedPath(path), path).toBe(false);
    }
  });
});

describe("isLikelyBot", () => {
  it("flags crawlers and link preview fetchers", () => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "WhatsApp/2.23.20.0 A",
      "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
      "facebookexternalhit/1.1 Facebot Twitterbot/1.0",
      "TelegramBot (like TwitterBot)",
      "Mozilla/5.0 (Windows NT 6.1; WOW64) SkypeUriPreview Preview/0.5",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    ]) {
      expect(isLikelyBot(ua), ua).toBe(true);
    }
  });

  it("does not flag real browsers or empty user agents", () => {
    for (const ua of [
      "",
      null,
      undefined,
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
      "Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    ]) {
      expect(isLikelyBot(ua), String(ua)).toBe(false);
    }
  });
});

describe("robots and sitemap", () => {
  it("points crawlers at the sitemap and does not block /s/", () => {
    const r = robots();
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/);
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    const disallow = rules.flatMap((rule) => rule.disallow ?? []);
    expect(disallow).toContain("/jobs");
    expect(disallow.some((path) => path === "/s" || path.startsWith("/s/"))).toBe(false);
  });

  it("gives every sitemap entry a real lastModified date", () => {
    for (const entry of sitemap()) {
      expect(String(entry.lastModified), entry.url).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });

  it("lists public pages only", () => {
    const urls = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(urls).toEqual(expect.arrayContaining(["/", "/pricing", "/faq", "/about", "/s/demo-acme"]));
    expect(urls.some((path) => path.startsWith("/jobs") || path.startsWith("/settings"))).toBe(false);
  });
});
