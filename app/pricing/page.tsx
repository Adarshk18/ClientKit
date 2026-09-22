import { SiteFooter, SiteHeader } from "@/components/site-header";
import { PricingTable } from "@/components/pricing-table";
import { TrackPageView } from "@/components/track";
import { getVisitorCountry } from "@/lib/visitor-country";

export const metadata = {
  title: "Pricing",
  description:
    "Free to try. Founder, Solo, and Busy plans for freelancers. No cut of job payments — clients pay you directly.",
};

export default async function PricingPage() {
  const initialCountry = await getVisitorCountry();

  return (
    <div className="flex min-h-dvh flex-col">
      <TrackPageView meta={{ page: "pricing" }} />
      <SiteHeader />
      <main className="ck-page-pad mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
        <p className="text-[13px] text-stamp">Pricing</p>
        <h1 className="mt-2 max-w-xl font-serif text-3xl">You pay for the software. Clients pay you.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          No cut of job payments. Free accounts can send a few jobs to try it. Paid plans raise the monthly send
          limit.
        </p>
        <div className="mt-10">
          <PricingTable initialCountry={initialCountry} />
        </div>
        <p className="mt-8 max-w-xl text-[13px] leading-5 text-muted">
          Failed SaaS payments get a 3-day grace, then the workspace is read-only until billing is fixed. You can
          still open old jobs.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
