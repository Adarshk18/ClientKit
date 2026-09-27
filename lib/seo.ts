import type { Metadata } from "next";

/** Public site URL for canonicals, sitemap, robots, and JSON-LD. */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://client-kit-omega.vercel.app").replace(
  /\/$/,
  "",
);

export const SITE_NAME = "Client Kit";

export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Client Kit",
};

/**
 * Per-page metadata with a canonical URL and matching Open Graph / Twitter tags.
 * Next.js merges metadata shallowly, so a page that sets openGraph must repeat the shared fields.
 */
export function pageMetadata(input: {
  title: string | { absolute: string };
  description: string;
  path: string;
  socialTitle?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const socialTitle =
    input.socialTitle ?? (typeof input.title === "string" ? `${input.title} · ${SITE_NAME}` : input.title.absolute);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title: socialTitle,
      description: input.description,
      url: input.path,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: input.description,
      images: [OG_IMAGE.url],
    },
    ...(input.robots ? { robots: input.robots } : {}),
  };
}
