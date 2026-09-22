import { SiteFooter, SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "About",
  description:
    "Client Kit is one public page for freelancers: write a proposal, get a signature, collect payment — without a CRM.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <article className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-sm leading-7">
        <p className="text-[13px] text-stamp">About</p>
        <h1 className="mt-2 font-serif text-3xl">A job link. Not an operating system.</h1>
        <div className="mt-8 space-y-4">
          <p>
            Client Kit is for people who already send a Google Doc and a payment link. You still just need a
            proposal, a signature, and money in your account. This is that, on one URL.
          </p>
          <p>
            It is not a CRM. There is no pipeline, calendar, Zoom, tasks, time tracking, client portal, or
            white-label agency layer. The second those show up, this stops being the cheap, obvious tool.
          </p>
          <p>
            Job money never hits our merchant account. You save one UPI VPA or a hosted payment URL you created
            yourself. We charge you a monthly software fee. That is the whole business. Suites in 2026 still hold
            card payouts 2–3 days and take ~3% of the job. We do neither.
          </p>
          <p>
            Share the public link on WhatsApp. If they stall, nudge them. Duplicate a finished job instead of
            rebuilding the same scope. The client never creates an account.
          </p>
          <p>
            Signatures here are simple electronic signatures: legal name, intent checkbox, IP, time, and a hash of
            the frozen page. They are not Aadhaar eSign and not a digital signature certificate. The footer on the
            client page says so.
          </p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
