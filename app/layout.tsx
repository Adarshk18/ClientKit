import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const serif = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Client Kit — Proposal. Sign. Get paid.",
    template: "%s · Client Kit",
  },
  description:
    "One page for a freelancer job: write the proposal, get a signature, collect the deposit. $12 a month. No CRM.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
