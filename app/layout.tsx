import type { Metadata, Viewport } from "next";
import { Literata, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SENT_LIMITS } from "@/lib/plans";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import "./globals.css";

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const serif = Literata({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const titleDefault = "Client Kit - Proposal. Sign. Get paid.";
const description = `One page for a freelancer job: write the proposal, get a signature, collect the deposit. Free plan: ${SENT_LIMITS.free} sends a month. No CRM.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: titleDefault,
    template: "%s · Client Kit",
  },
  description,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Client Kit",
    title: titleDefault,
    description,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: titleDefault,
    description,
    images: [OG_IMAGE.url],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F3F5F8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="flex min-h-dvh flex-col bg-paper text-ink ck-safe-bottom">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
