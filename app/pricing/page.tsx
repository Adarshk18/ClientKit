import { SiteFooter, SiteHeader } from "@/components/site-header";
import { PricingTable } from "@/components/pricing-table";

export const metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <p className="text-[13px] text-stamp">Pricing</p>
        <h1 className="mt-2 max-w-xl font-serif text-3xl">You pay for the software. Clients pay you.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          No cut of job payments. Free accounts can send a few jobs to try it. Paid plans raise the monthly send
          limit.
        </p>
        <div className="mt-10">
          <PricingTable />
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
