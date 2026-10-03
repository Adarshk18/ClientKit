import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { TrackPageView, TrackedLink } from "@/components/track";
import { SITE_URL } from "@/lib/seo";
import {
  CTA,
  FOUNDER_LINE,
  NOT_LEGAL_ADVICE,
  NOTHING_STORED,
  TOOLS,
  TOOL_DISCLOSURE,
  type ToolInfo,
} from "@/lib/tools/content";
import { btnPrimary, btnSecondary } from "@/lib/ui";

export function toolStructuredData(tool: ToolInfo) {
  const url = `${SITE_URL}${tool.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: tool.name,
        url,
        description: tool.schemaDescription,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        isAccessibleForFree: true,
        inLanguage: "en",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Free tools", item: `${SITE_URL}/tools` },
          { "@type": "ListItem", position: 3, name: tool.name },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: tool.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

export function Breadcrumb({ current }: { current?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
      <ol className="flex flex-wrap items-center gap-x-1.5">
        <li>
          <Link href="/" className="inline-flex min-h-8 items-center hover:text-ink">
            Home
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          {current ? (
            <Link href="/tools" className="inline-flex min-h-8 items-center hover:text-ink">
              Free tools
            </Link>
          ) : (
            <span aria-current="page">Free tools</span>
          )}
        </li>
        {current ? (
          <>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {current}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}

export function ToolShell({ tool, children }: { tool: ToolInfo; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={toolStructuredData(tool)} />
      <TrackPageView />
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 pb-12 pt-4 sm:pt-8">
        <Breadcrumb current={tool.name} />
        <h1 className="mt-3 font-serif text-[1.85rem] font-medium leading-[1.15] tracking-tight sm:text-[2.4rem]">
          {tool.h1}
        </h1>
        <p className="mt-3 max-w-[60ch] text-[16px] leading-7 text-ink">{tool.intro}</p>
        <p className="mt-2 max-w-[62ch] text-[13px] leading-5 text-muted">
          {TOOL_DISCLOSURE} Free, no login, no email needed. {NOTHING_STORED}
        </p>
        {children}
        <ToolFaq tool={tool} />
        <ToolCta tool={tool} />
        <RelatedTools current={tool.slug} />
        <p className="mt-8 text-[13px] leading-5 text-muted">{NOT_LEGAL_ADVICE}</p>
      </main>
      <SiteFooter />
    </div>
  );
}

export function ToolFaq({ tool }: { tool: ToolInfo }) {
  return (
    <section className="mt-12" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="font-serif text-[1.5rem] font-medium">
        Frequently asked questions
      </h2>
      <div className="mt-3 divide-y divide-line border-y border-line">
        {tool.faqs.map((f) => (
          <details key={f.q} className="group py-3">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-[15px] font-medium">
              <h3 className="text-[15px] font-medium">{f.q}</h3>
              <span className="text-muted group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="pb-2 pr-6 text-[15px] leading-6 text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ToolCta({ tool }: { tool: ToolInfo }) {
  const cta = CTA[tool.slug];
  return (
    <section className="mt-12 border border-line bg-cream p-4 sm:p-6" aria-labelledby="cta-heading">
      <h2 id="cta-heading" className="font-serif text-[1.5rem] font-medium leading-tight">
        {cta.heading}
      </h2>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-6">{cta.body}</p>
      <p className="mt-1 max-w-[60ch] text-[15px] leading-6">{FOUNDER_LINE}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <TrackedLink
          href="/signup"
          className={btnPrimary}
          meta={{ cta: `tool_${tool.slug}`, source: "tool" }}
        >
          Send this as a proposal in Client Kit
        </TrackedLink>
        <TrackedLink
          href={cta.secondaryHref}
          className={btnSecondary}
          meta={{ cta: `tool_${tool.slug}_secondary`, source: "tool" }}
        >
          {cta.secondaryLabel}
        </TrackedLink>
      </div>
      <p className="mt-3 text-[13px] leading-5 text-muted">
        {cta.small} See <Link href="/pricing" className="underline underline-offset-2">pricing</Link> or the{" "}
        <Link href="/faq" className="underline underline-offset-2">FAQ</Link>.
      </p>
    </section>
  );
}

export function RelatedTools({ current }: { current?: string }) {
  const list = TOOLS.filter((t) => t.slug !== current);
  return (
    <section className="mt-12" aria-labelledby="related-heading">
      <h2 id="related-heading" className="font-serif text-[1.5rem] font-medium">
        Related free tools
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {list.map((t) => (
          <li key={t.slug}>
            <Link href={t.path} className="block h-full border border-line p-3 hover:bg-cream">
              <span className="font-serif text-[1.05rem]">{t.name}</span>
              <span className="mt-1 block text-[14px] leading-5 text-muted">{t.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
