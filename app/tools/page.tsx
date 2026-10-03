import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/tools/tool-shell";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { TrackPageView } from "@/components/track";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { TOOLS, TOOL_DISCLOSURE } from "@/lib/tools/content";

export const metadata = pageMetadata({
  title: { absolute: "Free Tools for Freelancers: Messages and Proposal Terms" },
  description:
    "Free tools for freelancers. Write an advance payment request, a client follow-up and proposal terms in plain English. No login, nothing stored.",
  path: "/tools",
});

const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/tools#page`,
      name: "Free tools for freelancers",
      url: `${SITE_URL}/tools`,
      isPartOf: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Free tools" },
      ],
    },
  ],
};

export default function ToolsHub() {
  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={data} />
      <TrackPageView />
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 pb-12 pt-4 sm:pt-8">
        <Breadcrumb />
        <h1 className="mt-3 font-serif text-[1.85rem] font-medium leading-[1.15] tracking-tight sm:text-[2.4rem]">
          Free tools for freelancers
        </h1>
        <p className="mt-3 max-w-[60ch] text-[16px] leading-7">
          Three small tools that write the awkward messages and proposal terms for you. No login, no email needed, and
          nothing you type is saved.
        </p>
        <p className="mt-2 max-w-[62ch] text-[13px] leading-5 text-muted">{TOOL_DISCLOSURE}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <li key={t.slug}>
              <Link href={t.path} className="block h-full border border-line p-4 hover:bg-cream">
                <h2 className="font-serif text-[1.2rem] font-medium">{t.name}</h2>
                <p className="mt-1 text-[14px] leading-6 text-muted">{t.blurb}</p>
                <span className="mt-3 inline-block text-[13px] font-medium text-stamp">Open the tool</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[14px] leading-6">
          Want the proposal, the signature and the advance on one link? See the{" "}
          <Link href="/s/demo-acme" className="underline underline-offset-2">
            demo
          </Link>{" "}
          or <Link href="/signup" className="underline underline-offset-2">start free</Link>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
